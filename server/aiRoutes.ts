import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  extractQuoteSchema,
  vendorQuestionsSchema,
  aiChatSchema,
  recommendVendorsSchema,
  validateBody
} from './validation';
import { createRateLimiter } from './rateLimiter';

export const aiRouter = Router();

// Rate limiter for AI endpoints: 35 requests per minute per IP
const aiRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 35,
  message: 'AI request limit reached. Please wait a moment before trying again.'
});

aiRouter.use(aiRateLimiter);

// GenAI client singleton initializer
let genAIInstance: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

// Timeout helper: default 15 seconds
function withTimeout<T>(promise: Promise<T>, ms = 15000, fallbackMessage = 'Request timed out'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(fallbackMessage)), ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper for resilient Gemini API calls: attempts gemini-3.5-flash first,
// falls back to gemini-3.5-flash-lite if demand spikes (503), then safe fallback.
async function generateWithGemini(
  genAI: GoogleGenAI,
  params: { contents: any; config?: any },
  timeoutMs = 15000
): Promise<any> {
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
  let lastError: any;

  for (const model of models) {
    try {
      const call = genAI.models.generateContent({
        ...params,
        model
      });
      return await withTimeout(call, timeoutMs, `${model} call timed out`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Routes] Model ${model} encountered error:`, err?.status || err?.message || err);
    }
  }

  throw lastError;
}

// Health check endpoint
aiRouter.get('/health', (_req: Request, res: Response) => {
  const genAI = getGenAIClient();
  res.json({
    status: 'ok',
    aiEnabled: !!genAI,
    timestamp: new Date().toISOString()
  });
});

// Quote extraction endpoint
aiRouter.post('/quote/extract', validateBody(extractQuoteSchema), async (req: Request, res: Response) => {
  try {
    const { rawText, fileBase64, mimeType, vendorNameHint } = req.body;
    const genAI = getGenAIClient();

    if (!genAI) {
      // Deterministic fallback response when Gemini key is not configured
      return res.json({
        success: true,
        source: 'deterministic_fallback',
        warning: 'Demo mode active: Gemini API credentials not configured. Returning structured illustrative quotation for review.',
        data: {
          vendorName: vendorNameHint || 'Royal Rasoi Gourmet Catering (Sample)',
          vendorCategory: 'Catering',
          quoteDate: new Date().toISOString().split('T')[0],
          validityPeriod: '15 days from quote date',
          totalAmount: 110000,
          subtotal: 100000,
          gstAmount: 5000,
          serviceCharges: 5000,
          paymentTerms: '40% advance, 50% one day before event, 10% on completion',
          cancellationPolicy: 'Non-refundable advance if cancelled within 14 days of event',
          inclusions: [
            'Live Chaat Counter (Pani Puri, Sev Puri, Aloo Tikki)',
            'Multi-course regional dinner buffet',
            '4 Live Dessert counters including Jalebi-Rabdi',
            'Uniformed service staff (1 per 15 guests)',
            'Melamine dinnerware & chafing dishes'
          ],
          exclusions: [
            'Packaged mineral water bottles (billed on actual consumption)',
            'Liquor license and bar glassware',
            'Outdoor kitchen generator & fuel'
          ],
          missingFields: [
            'Per-hour overtime rate beyond 11:30 PM is not mentioned — ask vendor',
            'Staff gratuity / service tip expectation not specified — ask vendor',
            'Tasting session availability date not confirmed — ask vendor'
          ],
          lineItems: [
            {
              id: 'qli-1',
              description: 'Mehendi High-Tea Buffet (80 pax)',
              quantity: 80,
              unitPrice: 350,
              subtotal: 28000
            },
            {
              id: 'qli-2',
              description: 'Wedding Feast (180 pax)',
              quantity: 180,
              unitPrice: 400,
              subtotal: 72000
            }
          ],
          status: 'under_review',
          provenance: {
            source: 'illustrative',
            calculationBasis: 'Deterministic demo quote template',
            verified: false,
            lastUpdated: new Date().toISOString().split('T')[0],
            notes: 'Fictional illustrative sample quote for demo testing. Pending organizer verification.'
          }
        }
      });
    }

    const systemInstruction = `You are Bandobast AI, an expert event quotation parser.
Extract structured vendor quotation details from the provided document or text.
Always separate verified facts from missing details.
If a field like overtime rate, GST percentage, or cancellation fee is not mentioned, DO NOT make up zero or fabricate values; instead, add it explicitly to 'missingFields' with the note "Not mentioned — ask vendor".
Return strictly valid JSON matching this schema:
{
  "vendorName": string,
  "vendorCategory": string,
  "quoteDate": string,
  "validityPeriod": string,
  "totalAmount": number,
  "subtotal": number,
  "gstAmount": number,
  "serviceCharges": number,
  "paymentTerms": string,
  "cancellationPolicy": string,
  "inclusions": string[],
  "exclusions": string[],
  "missingFields": string[],
  "lineItems": [
    {
      "id": string,
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "subtotal": number
    }
  ]
}`;

    const prompt = `Analyze this quotation and extract structured line items and terms:\n${rawText || 'Refer to attached document'}`;

    let contents: any = prompt;
    if (fileBase64 && mimeType) {
      contents = [
        {
          inlineData: {
            data: fileBase64.replace(/^data:.*?;base64,/, ''),
            mimeType: mimeType
          }
        },
        prompt
      ];
    }

    const response = await generateWithGemini(
      genAI,
      {
        contents: contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json'
        }
      },
      18000
    );
    const parsedData = JSON.parse(response.text || '{}');

    // Ensure status and unverified provenance are enforced
    parsedData.status = 'under_review';
    parsedData.provenance = {
      source: 'ai_estimate',
      calculationBasis: 'Extracted via Quote X-Ray (AI processed)',
      verified: false,
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: 'AI-extracted quotation. Pending human review and organizer verification.'
    };

    return res.json({
      success: true,
      source: 'gemini_extracted',
      data: parsedData
    });
  } catch (error: any) {
    console.error('[AI Routes] Quote extraction error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to parse quotation at this time. Please verify document readability or use text paste mode.'
    });
  }
});

// Vendor follow-up questions drafting endpoint
aiRouter.post('/quote/vendor-questions', validateBody(vendorQuestionsSchema), async (req: Request, res: Response) => {
  try {
    const { vendorName, category, missingFields, language = 'English', context } = req.body;
    const genAI = getGenAIClient();

    if (!genAI) {
      // Deterministic templates for English, Hindi, and Gujarati
      let draft = '';
      if (language === 'Hindi') {
        draft = `नमस्ते ${vendorName},\n\nहम आपके भेजे गए कोटेशन के लिए आभारी हैं। हमारे आयोजन के लिए कुछ महत्वपूर्ण विवरणों पर स्पष्टीकरण चाहिए:\n` +
          (missingFields || []).map((f: string, i: number) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
          `\n\nकृपया इन बिंदुओं पर जल्द पुष्टि करें ताकि हम बुकिंग को अंतिम रूप दे सकें।\n\nसस्नेह,\nआयोजक परिवार (बंदोबस्त)`;
      } else if (language === 'Gujarati') {
        draft = `નમસ્તે ${vendorName},\n\nતમારા દ્વારા મોકલાવેલ કોટેશન બદલ આભાર. અમારા પ્રસંગના આયોજન માટે નીચે મુજબની બાબતો સ્પષ્ટ કરવા વિનંતી:\n` +
          (missingFields || []).map((f: string, i: number) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
          `\n\nકૃપા કરીને આ વિગતો જલ્દી પુષ્ટિ કરો જેથી અમે નિર્ણય લઈ શકીએ.\n\nઆભાર,\nઆયોજક પરિવાર (બંદોબસ્ત)`;
      } else {
        draft = `Dear ${vendorName} Team,\n\nThank you for providing the quotation for our celebration. Before we finalize the agreement, we would appreciate clarity on the following missing items:\n\n` +
          (missingFields || []).map((f: string, i: number) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
          `\n\nPlease let us know at your earliest convenience so we can proceed with securing the dates.\n\nWarm regards,\nEvent Operations Coordinator (via Bandobast)`;
      }

      return res.json({
        success: true,
        source: 'deterministic_template',
        draft
      });
    }

    const prompt = `You are a polite, firm event coordinator writing to ${vendorName} (${category}).
Draft a professional vendor clarification inquiry in ${language}.
Address these specific ambiguities/omissions:
${(missingFields || []).join('\n')}
Additional context: ${context || 'Multi-function family celebration'}
Keep the tone warm, clear, and professional. Output ONLY the ready-to-send draft message.`;

    const response = await generateWithGemini(
      genAI,
      {
        contents: prompt
      },
      15000
    );

    return res.json({
      success: true,
      source: 'gemini_generated',
      draft: response.text?.trim()
    });
  } catch (error: any) {
    console.error('[AI Routes] Follow-up draft error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to draft questions currently. Safe template can be generated in offline mode.'
    });
  }
});

// Interactive AI Chat endpoint
aiRouter.post('/ai/chat', validateBody(aiChatSchema), async (req: Request, res: Response) => {
  try {
    const { message, history, budget, eventDetails } = req.body;
    const currentBudget = budget || eventDetails?.totalBudget || 300000;
    const location = eventDetails?.location || 'Rajasthan / Jaipur';
    const guestCount = eventDetails?.guestCount || 180;
    const occasion = eventDetails?.occasion || 'Celebration Event';
    const genAI = getGenAIClient();

    if (!genAI) {
      // Deterministic intelligent conversational advisor fallback
      let reply = `Based on your budget of ₹${currentBudget.toLocaleString('en-IN')} for ${guestCount} guests in ${location}, here is our operational guidance:\n\n`;
      reply += `1. **Venue Strategy:** Allocate approx 25% (₹${Math.round(currentBudget * 0.25).toLocaleString('en-IN')}). Choose space configured for dual morning/evening transitions.\n`;
      reply += `2. **Catering Allocation:** Allocate approx 35-40% (₹${Math.round(currentBudget * 0.38).toLocaleString('en-IN')}), giving around ₹${Math.round((currentBudget * 0.38) / guestCount)}/plate. This comfortably supports a rich regional buffet with 3 live stations.\n`;
      reply += `3. **Photography & Memories:** Allocate 12% (₹${Math.round(currentBudget * 0.12).toLocaleString('en-IN')}) for candid photographers and high-res deliverables.\n`;
      reply += `4. **Floral & Decor:** Allocate 15% (₹${Math.round(currentBudget * 0.15).toLocaleString('en-IN')}) with focus on regional florals and atmospheric lighting.\n`;
      reply += `5. **Contingency Buffer:** Keep 8% (₹${Math.round(currentBudget * 0.08).toLocaleString('en-IN')}) untouched for last-minute headcount surges.\n\n`;
      reply += `(Note: All figures are illustrative planning models. Ask me anytime to adjust allocations or compare scenarios!)`;

      return res.json({
        success: true,
        source: 'deterministic_advisor',
        reply,
        suggestedBudget: currentBudget
      });
    }

    const systemInstruction = `You are Bandobast AI, an event operations and financial advisor for celebrations (weddings, birthdays, engagements, reunions, community events).
You provide grounded, realistic event planning advice.
Event Context:
- Occasion: ${occasion}
- Total Budget: ₹${currentBudget.toLocaleString('en-IN')}
- Guest Count: ${guestCount} guests
- Location: ${location}

Rules:
1. Ground advice strictly in the provided budget of ₹${currentBudget.toLocaleString('en-IN')}.
2. Provide concrete percentage allocations and realistic rupee figures.
3. Clearly state that estimates are planning baselines subject to direct supplier contract.
4. Keep the tone warm, executive, structured, and encouraging.`;

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        chatContents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: `${message}\n(Current Target Budget: ₹${currentBudget.toLocaleString('en-IN')})` }]
    });

    const response = await generateWithGemini(
      genAI,
      {
        contents: chatContents,
        config: {
          systemInstruction
        }
      },
      15000
    );

    return res.json({
      success: true,
      source: 'gemini_generated',
      reply: response.text?.trim(),
      suggestedBudget: currentBudget
    });
  } catch (error: any) {
    console.error('[AI Routes] Chat endpoint error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Advisor service momentarily unavailable. Please retry or adjust parameters.'
    });
  }
});

// Curated database with clearly labeled illustrative demo data (Section 1 compliance)
const illustrativeVendorDatabase = [
  // VENUES
  {
    id: 'rec-ven-1',
    name: 'Heritage Haveli & Courtyard (Demo)',
    category: 'venue' as const,
    city: 'Jaipur',
    priceRange: '₹35,000 - ₹50,000 / day (Estimated)',
    estimatedCost: 65000,
    fitDescription: 'Traditional sandstone arches with manicured lawns. Suitable for ceremonial morning sessions and evening banquet.',
    highlights: ['Capacity up to 250 pax', 'Bridal changing suites', 'Valet parking space'],
    contactName: 'Banquet Operations Desk (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  },
  {
    id: 'rec-ven-2',
    name: 'The Royal Palms Lawns (Demo)',
    category: 'venue' as const,
    city: 'Jaipur',
    priceRange: '₹40,000 - ₹60,000 / day (Estimated)',
    estimatedCost: 55000,
    fitDescription: 'Open-air lawn with weather-proof covered gazebo stage and generator power backup.',
    highlights: ['Capacity up to 350 pax', 'Spillover dining area', 'Full power backup'],
    contactName: 'Lawn Manager (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  },
  // CATERING
  {
    id: 'rec-cat-1',
    name: 'Royal Rasoi Gourmet Caterers (Demo)',
    category: 'catering' as const,
    city: 'Jaipur & Regional',
    priceRange: '₹550 - ₹700 / plate (Estimated)',
    estimatedCost: 110000,
    unitPricingLabel: '₹600 / guest (Estimate)',
    fitDescription: 'Regional multi-course royal thali with live interactive chaat and hot dessert counters.',
    highlights: ['Live Chaat & Jalebi Rabdi', '1 server per 15 guests ratio', 'Copper serviceware'],
    contactName: 'Executive Catering Lead (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  },
  {
    id: 'rec-cat-2',
    name: 'Annapurna Satvik Banquets (Demo)',
    category: 'catering' as const,
    city: 'Jaipur',
    priceRange: '₹450 - ₹550 / plate (Estimated)',
    estimatedCost: 95000,
    unitPricingLabel: '₹500 / guest (Estimate)',
    fitDescription: 'Pure vegetarian regional delicacies with dedicated Jain culinary counters upon request.',
    highlights: ['Pure ghee preparation', 'Separate Jain culinary station', 'Welcome beverages'],
    contactName: 'Catering Lead (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  },
  // PHOTOGRAPHY
  {
    id: 'rec-pho-1',
    name: 'ShutterMagic Cine Studios (Demo)',
    category: 'photography' as const,
    city: 'Jaipur / Regional',
    priceRange: '₹35,000 - ₹48,000 package (Estimated)',
    estimatedCost: 40000,
    fitDescription: 'Two senior candid photographers, 4K cinematic highlight teaser reel, and flush-mount digital album.',
    highlights: ['Multi-camera candid coverage', 'Highlight reel delivered in 14 days', 'Cloud gallery access'],
    contactName: 'Lead Studio Artist (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  },
  // DECORATION
  {
    id: 'rec-dec-1',
    name: 'Utsav Floral & Stage Artistry (Demo)',
    category: 'decor' as const,
    city: 'Jaipur',
    priceRange: '₹40,000 - ₹55,000 (Estimated)',
    estimatedCost: 48000,
    fitDescription: 'Handcrafted floral mandap canopy with fresh marigold strings and fairy lighting accents.',
    highlights: ['Fresh marigold & jasmine decor', 'Welcome entry arch', 'Fairy lighting curtain'],
    contactName: 'Lead Designer (Illustrative Sample)',
    contactNumber: 'Inquire via Organizer Portal (Demo)',
    isIllustrativeDemo: true,
    verificationStatus: 'unverified' as const,
    disclaimer: 'Fictional illustrative vendor profile for platform demonstration. Unverified estimate.'
  }
];

// Vendor & Venue Recommendations by Budget endpoint
aiRouter.post('/ai/recommend-vendors', validateBody(recommendVendorsSchema), async (req: Request, res: Response) => {
  try {
    const { budget, location = 'Jaipur / Regional', guestCount = 180, category, occasion = 'Celebration' } = req.body;
    const targetBudget = budget || 300000;
    const genAI = getGenAIClient();

    // Scale cost estimates to target budget dynamically
    const scaledDatabase = illustrativeVendorDatabase.map(v => {
      let scaledCost = v.estimatedCost;
      if (v.category === 'venue') scaledCost = Math.round(targetBudget * 0.22);
      if (v.category === 'catering') scaledCost = Math.round(targetBudget * 0.38);
      if (v.category === 'photography') scaledCost = Math.round(targetBudget * 0.13);
      if (v.category === 'decor') scaledCost = Math.round(targetBudget * 0.16);

      return {
        ...v,
        estimatedCost: scaledCost,
        unitPricingLabel: v.category === 'catering'
          ? `₹${Math.round(scaledCost / (guestCount || 180))} / guest (Estimate)`
          : undefined
      };
    });

    let filtered = scaledDatabase;
    if (category && category !== 'all') {
      filtered = scaledDatabase.filter(r => r.category === category);
    }

    if (genAI) {
      try {
        const prompt = `Recommend 4 celebration suppliers (venues, catering, photography, decor) suitable for a ${occasion} in ${location} with a target budget of ₹${targetBudget.toLocaleString('en-IN')} and ${guestCount} guests.
All recommendations must be clearly understood as illustrative planning estimates.
Return strictly valid JSON matching this schema:
[
  {
    "id": string,
    "name": string,
    "category": "venue" | "catering" | "photography" | "decor",
    "city": string,
    "priceRange": string,
    "estimatedCost": number,
    "unitPricingLabel": string,
    "fitDescription": string,
    "highlights": string[],
    "isIllustrativeDemo": true,
    "verificationStatus": "unverified",
    "disclaimer": "AI-suggested illustrative profile. Unverified estimate."
  }
]`;

        const aiResponse = await generateWithGemini(
          genAI,
          {
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          },
          15000
        );
        const parsed = JSON.parse(aiResponse.text || '[]');

        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.map((item: any, idx: number) => ({
            id: item.id || `rec-ai-${Date.now()}-${idx}`,
            name: `${item.name || 'Vendor Partner'} (AI Estimate)`,
            category: item.category || 'catering',
            city: item.city || location,
            priceRange: item.priceRange || `₹${Math.round(targetBudget * 0.2)} estimate`,
            estimatedCost: typeof item.estimatedCost === 'number' ? item.estimatedCost : Math.round(targetBudget * 0.2),
            unitPricingLabel: item.unitPricingLabel,
            fitDescription: item.fitDescription || 'Suggested supplier matching event capacity and budget profile.',
            highlights: Array.isArray(item.highlights) ? item.highlights : ['Capacity matched', 'Regional experience'],
            contactName: 'Inquire via Organizer Portal (Demo)',
            contactNumber: 'Demo Contact',
            isIllustrativeDemo: true,
            verificationStatus: 'unverified' as const,
            disclaimer: 'AI-generated illustrative planning suggestion. Not a verified contract or quotation.'
          }));

          return res.json({
            success: true,
            source: 'gemini_generated',
            recommendations: validated
          });
        }
      } catch (err: any) {
        console.warn('[AI Routes] Gemini recommendation fallback engaged:', err?.message || err);
      }
    }

    return res.json({
      success: true,
      source: 'curated_database',
      recommendations: filtered
    });
  } catch (error: any) {
    console.error('[AI Routes] Vendor recommendations error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve vendor recommendations at this time.'
    });
  }
});
