import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Google Gen AI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  genAI = new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiEnabled: !!genAI,
    timestamp: new Date().toISOString()
  });
});

// Quote extraction endpoint
app.post('/api/quote/extract', async (req: Request, res: Response) => {
  try {
    const { rawText, fileBase64, mimeType, vendorNameHint } = req.body;

    if (!genAI) {
      // Deterministic fallback response when Gemini key is not configured
      return res.json({
        success: true,
        source: 'deterministic_fallback',
        warning: 'Demo mode active: Gemini API key not provided. Returning structured mock quote for demonstration.',
        data: {
          vendorName: vendorNameHint || 'Royal Rasoi Grand Catering',
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
            'Multi-course Gujarati & North Indian dinner menu',
            '4 Live Dessert counters including Jalebi-Rabdi',
            'Uniformed service staff (1 per 15 guests)',
            'Premium melamine dinnerware & copper chafing dishes'
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
              description: 'Wedding & Sangeet Royal Feast (180 pax)',
              quantity: 180,
              unitPrice: 400,
              subtotal: 72000
            }
          ]
        }
      });
    }

    const systemInstruction = `You are Bandobast AI, an expert event quotation parser.
Extract structured vendor quotation details from the provided document or text.
Always separate verified facts from missing details.
If a field like overtime rate, GST percentage, or cancellation fee is not mentioned, DO NOT make up zero; instead, add it explicitly to 'missingFields' with the note "Not mentioned — ask vendor".
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

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      source: 'gemini_extracted',
      data: parsedData
    });
  } catch (error: any) {
    console.error('Quote extraction error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract quotation'
    });
  }
});

// Vendor follow-up questions drafting endpoint
app.post('/api/quote/vendor-questions', async (req: Request, res: Response) => {
  try {
    const { vendorName, category, missingFields, language = 'English', context } = req.body;

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

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    return res.json({
      success: true,
      source: 'gemini_generated',
      draft: response.text?.trim()
    });
  } catch (error: any) {
    console.error('Follow-up draft error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to draft questions'
    });
  }
});

// Interactive AI Chat endpoint
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, budget, eventDetails } = req.body;
    const currentBudget = budget || (eventDetails?.totalBudget) || 300000;
    const location = eventDetails?.location || 'Rajasthan / Jaipur';
    const guestCount = eventDetails?.guestCount || 180;
    const occasion = eventDetails?.occasion || 'Traditional Indian Celebration';

    if (!genAI) {
      // Deterministic intelligent conversational advisor fallback
      let reply = `Based on your budget of ₹${currentBudget.toLocaleString('en-IN')} for ${guestCount} guests in ${location}, here is our operational guidance:\n\n`;
      reply += `1. **Venue Strategy:** Allocate approx 25% (₹${Math.round(currentBudget * 0.25).toLocaleString('en-IN')}). Look for boutique heritage lawns with dual indoor/outdoor space.\n`;
      reply += `2. **Catering Allocation:** Allocate approx 35-40% (₹${Math.round(currentBudget * 0.38).toLocaleString('en-IN')}), giving around ₹${Math.round((currentBudget * 0.38) / guestCount)}/plate. This comfortably supports a rich regional buffet with 3 live stations.\n`;
      reply += `3. **Photography & Memories:** Allocate 12% (₹${Math.round(currentBudget * 0.12).toLocaleString('en-IN')}) for candid photographers and digital high-res deliverables.\n`;
      reply += `4. **Floral & Decor:** Allocate 15% (₹${Math.round(currentBudget * 0.15).toLocaleString('en-IN')}) with focus on local marigolds and fairy lighting.\n`;
      reply += `5. **Contingency Buffer:** Keep 8% (₹${Math.round(currentBudget * 0.08).toLocaleString('en-IN')}) untouched for last-minute headcount surges.\n\n`;
      reply += `Would you like me to recommend specific verified vendors matching this ₹${currentBudget.toLocaleString('en-IN')} bracket?`;

      return res.json({
        success: true,
        source: 'deterministic_advisor',
        reply,
        suggestedBudget: currentBudget
      });
    }

    const systemInstruction = `You are Bandobast AI, an elite celebration and event operations advisor for Indian weddings, milestone birthdays, and gatherings.
You provide precise, budget-grounded event planning advice.
Current Event Context:
- Occasion: ${occasion}
- Total Budget: ₹${currentBudget.toLocaleString('en-IN')}
- Guest Count: ${guestCount} guests
- Location: ${location}

Rules:
1. Always ground your advice in the provided budget of ₹${currentBudget.toLocaleString('en-IN')}.
2. Provide concrete percentage allocations and estimated rupee figures.
3. Suggest practical vendor strategies (venues, catering styles, photo packages) that fit this exact financial tier.
4. Keep the tone warm, respectful, executive, and encouraging.`;

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
      parts: [{ text: `${message}\n(Current Budget: ₹${currentBudget.toLocaleString('en-IN')})` }]
    });

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction
      }
    });

    return res.json({
      success: true,
      source: 'gemini_generated',
      reply: response.text?.trim(),
      suggestedBudget: currentBudget
    });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate chat response'
    });
  }
});

// Vendor & Venue Recommendations by Budget endpoint
app.post('/api/ai/recommend-vendors', async (req: Request, res: Response) => {
  try {
    const { budget, location = 'Jaipur / Udaipur', guestCount = 180, category, occasion = 'Wedding' } = req.body;
    const targetBudget = budget || 300000;

    // Curated recommendations database scaled to budget brackets
    const curatedDatabase = [
      // VENUES
      {
        id: 'rec-ven-1',
        name: 'Heritage Haveli & Palace Courtyard',
        category: 'venue' as const,
        city: 'Jaipur',
        rating: 4.9,
        reviewsCount: 142,
        priceRange: targetBudget > 400000 ? '₹65,000 - ₹95,000 / day' : '₹35,000 - ₹50,000 / day',
        estimatedCost: Math.round(targetBudget * 0.22),
        fitDescription: 'Auspicious traditional sandstone arches with manicured lawns. Perfect for morning pheras and evening gala.',
        highlights: ['Capacity up to 250 pax', 'In-house bridal changing suites', 'Valet parking space for 80 cars'],
        contactName: 'Kunal Rathore (Banquet Director)',
        contactNumber: '+91 98290 11223',
        matchScore: 96
      },
      {
        id: 'rec-ven-2',
        name: 'The Royal Palms Resort & Lawns',
        category: 'venue' as const,
        city: 'Jaipur',
        rating: 4.8,
        reviewsCount: 98,
        priceRange: '₹40,000 - ₹60,000 / day',
        estimatedCost: Math.round(targetBudget * 0.20),
        fitDescription: 'Expansive open-air lawn surrounded by palm trees with weather-proof gazebo stage.',
        highlights: ['Capacity up to 350 pax', 'Spillover dining area', 'Generator power backup included'],
        contactName: 'Suresh Meena',
        contactNumber: '+91 98291 44556',
        matchScore: 92
      },
      // CATERING
      {
        id: 'rec-cat-1',
        name: 'Royal Rasoi Gourmet Caterers',
        category: 'catering' as const,
        city: 'Jaipur & Udaipur',
        rating: 4.9,
        reviewsCount: 215,
        priceRange: `₹${Math.round((targetBudget * 0.38) / guestCount)} - ₹${Math.round((targetBudget * 0.44) / guestCount)} / plate`,
        estimatedCost: Math.round(targetBudget * 0.38),
        unitPricingLabel: `₹${Math.round((targetBudget * 0.38) / guestCount)} / guest`,
        fitDescription: 'Authentic Rajasthani, North Indian & Gujarati royal thali with 4 live interactive counters.',
        highlights: ['Live Chaat & Jalebi Rabdi', '1 server per 15 guests', 'Copper serviceware & white glove staff'],
        contactName: 'Chef Harish Joshi',
        contactNumber: '+91 98292 77889',
        matchScore: 98
      },
      {
        id: 'rec-cat-2',
        name: 'Annapurna Satvik & Regional Banquets',
        category: 'catering' as const,
        city: 'Jaipur',
        rating: 4.7,
        reviewsCount: 160,
        priceRange: `₹${Math.round((targetBudget * 0.32) / guestCount)} / plate`,
        estimatedCost: Math.round(targetBudget * 0.32),
        unitPricingLabel: `₹${Math.round((targetBudget * 0.32) / guestCount)} / guest`,
        fitDescription: 'Specialized in pure vegetarian, Jain, and Satvik delicacies with zero onion/garlic counters upon request.',
        highlights: ['Pure ghee preparations', 'Separate Jain counter', 'Complimentary welcome mocktails'],
        contactName: 'Praveen Jain',
        contactNumber: '+91 98293 88990',
        matchScore: 91
      },
      // PHOTOGRAPHY
      {
        id: 'rec-pho-1',
        name: 'ShutterMagic Cine Studios',
        category: 'photography' as const,
        city: 'Jaipur / Delhi NCR',
        rating: 4.9,
        reviewsCount: 180,
        priceRange: '₹35,000 - ₹50,000 total package',
        estimatedCost: Math.round(targetBudget * 0.13),
        fitDescription: 'Two senior candid photographers + 4K cinematic highlight teaser film & luxury flush-mount album.',
        highlights: ['Drone aerial coverage included', 'Teaser reel delivered in 7 days', 'Full cloud gallery storage for 1 year'],
        contactName: 'Aman Saxena',
        contactNumber: '+91 98294 12345',
        matchScore: 95
      },
      {
        id: 'rec-pho-2',
        name: 'Virasat Heritage Wedding Clicks',
        category: 'photography' as const,
        city: 'Jaipur',
        rating: 4.7,
        reviewsCount: 88,
        priceRange: '₹22,000 - ₹32,000 total',
        estimatedCost: Math.round(targetBudget * 0.10),
        fitDescription: 'Timeless traditional ceremony documentation with candid family portraits.',
        highlights: ['3 days coverage', 'Hardcover 40-page photo album', 'Quick highlights on WhatsApp'],
        contactName: 'Rohit Sharma',
        contactNumber: '+91 98295 67890',
        matchScore: 89
      },
      // DECORATION
      {
        id: 'rec-dec-1',
        name: 'Utsav Mandap & Floral Artistry',
        category: 'decor' as const,
        city: 'Jaipur',
        rating: 4.8,
        reviewsCount: 130,
        priceRange: '₹40,000 - ₹65,000',
        estimatedCost: Math.round(targetBudget * 0.16),
        fitDescription: 'Handcrafted Vedic floral mandap canopy with fresh marigold strings and brass hanging temple bells.',
        highlights: ['Fresh yellow & orange marigolds', 'Entrance welcome toran gate', 'Fairy lighting curtain canopy'],
        contactName: 'Deepak Soni',
        contactNumber: '+91 98296 23456',
        matchScore: 94
      }
    ];

    let filtered = curatedDatabase;
    if (category && category !== 'all') {
      filtered = curatedDatabase.filter(r => r.category === category);
    }

    // If Gemini GenAI is enabled, also enrich with AI recommendations
    if (genAI) {
      try {
        const prompt = `Recommend 4 top celebration vendors (venues, food catering, photography, decor) suitable for a ${occasion} in ${location} with a total budget of ₹${targetBudget.toLocaleString('en-IN')} and ${guestCount} guests.
Return strictly valid JSON matching this schema:
[
  {
    "id": string,
    "name": string,
    "category": "venue" | "catering" | "photography" | "decor",
    "city": string,
    "rating": number,
    "reviewsCount": number,
    "priceRange": string,
    "estimatedCost": number,
    "unitPricingLabel": string,
    "fitDescription": string,
    "highlights": string[],
    "contactName": string,
    "contactNumber": string,
    "matchScore": number
  }
]`;

        const aiResponse = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(aiResponse.text || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({
            success: true,
            source: 'gemini_generated',
            recommendations: parsed
          });
        }
      } catch (err) {
        console.warn('Gemini recommendation parse fallback:', err);
      }
    }

    return res.json({
      success: true,
      source: 'curated_database',
      recommendations: filtered
    });
  } catch (error: any) {
    console.error('Vendor recommendations error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch recommendations'
    });
  }
});

// Start server with Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bandobast Event Operations Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
