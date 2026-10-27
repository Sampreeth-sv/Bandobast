import { VendorQuote } from '../types';

export interface ExtractQuoteParams {
  rawText?: string;
  fileBase64?: string;
  mimeType?: string;
  vendorNameHint?: string;
}

export interface VendorQuestionParams {
  vendorName: string;
  category: string;
  missingFields: string[];
  language?: 'English' | 'Hindi' | 'Gujarati';
  context?: string;
}

/**
 * Extract structured quotation using backend Gemini API or deterministic fallback
 */
export async function extractVendorQuote(params: ExtractQuoteParams): Promise<{
  success: boolean;
  source: 'gemini_extracted' | 'deterministic_fallback';
  warning?: string;
  data: Partial<VendorQuote>;
}> {
  try {
    const res = await fetch('/api/quote/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (error: any) {
    console.warn('Backend quote extraction call failed, using client-side deterministic fallback:', error);
    
    // Client-side fallback for offline/isolated demo execution
    return {
      success: true,
      source: 'deterministic_fallback',
      warning: 'Processed via client fallback mode (Gemini proxy offline or demo active).',
      data: {
        vendorName: params.vendorNameHint || 'Utsav Mandap & Grand Florals',
        vendorCategory: 'Decoration',
        quoteDate: new Date().toISOString().split('T')[0],
        totalAmount: 52000,
        subtotal: 48000,
        gstAmount: 4000,
        serviceCharges: 0,
        validityPeriod: 'Valid for 15 days',
        paymentTerms: '50% advance booking deposit, 50% on morning of setup',
        cancellationPolicy: 'Deposit non-refundable if cancelled less than 14 days prior',
        inclusions: [
          'Vedic floral mandap with fresh yellow & orange marigolds',
          'Sangeet stage backdrop with fairy light curtains and seating',
          'Entrance welcome arch with fragrant tuberose (rajnigandha)'
        ],
        exclusions: [
          'Power generator fuel during nighttime lighting',
          'Post-event petal disposal and municipal cleaning'
        ],
        missingFields: [
          'Rain protection canopy cost not mentioned — ask vendor',
          'Exact setup completion time benchmark not stated — ask vendor',
          'Breakage and damage security deposit terms omitted — ask vendor'
        ],
        lineItems: [
          {
            id: 'cli-1',
            description: '4-Pillar Heritage Floral Mandap & Carpet',
            quantity: 1,
            unitPrice: 30000,
            subtotal: 30000
          },
          {
            id: 'cli-2',
            description: 'Sangeet Stage Lighting & Ambient Fairy Curtain',
            quantity: 1,
            unitPrice: 18000,
            subtotal: 18000
          }
        ]
      }
    };
  }
}

/**
 * Generate vendor follow-up clarification questions in English, Hindi, or Gujarati
 */
export async function generateVendorQuestions(params: VendorQuestionParams): Promise<{
  success: boolean;
  source: string;
  draft: string;
}> {
  try {
    const res = await fetch('/api/quote/vendor-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn('Backend question drafting failed, using client fallback:', error);

    const lang = params.language || 'English';
    let draft = '';

    if (lang === 'Hindi') {
      draft = `नमस्ते ${params.vendorName},\n\nआपके भेजे गए कोटेशन के लिए धन्यवाद। हमारे आयोजन के लिए निम्नलिखित आवश्यक बिंदुओं पर स्पष्टता की आवश्यकता है:\n\n` +
        params.missingFields.map((f, i) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
        `\n\nकृपया इन बिंदुओं पर जल्द जानकारी दें ताकि हम अग्रिम बुकिंग तय कर सकें।\n\nसादर,\nआयोजक परिवार (बंदोबस्त)`;
    } else if (lang === 'Gujarati') {
      draft = `નમસ્તે ${params.vendorName},\n\nતમારા કોટેશન બદલ ખૂબ ખૂબ આભાર. પ્રસંગના આયોજન માટે નીચેના મુદ્દાઓ અંગે સ્પષ્ટતા કરવા વિનંતી:\n\n` +
        params.missingFields.map((f, i) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
        `\n\nકૃપા કરી આ વિગતો જણાવશો જેથી અમે નિર્ણય લઈ શકીએ.\n\nઆભાર,\nઆયોજક પરિવાર (બંદોબસ્ત)`;
    } else {
      draft = `Dear ${params.vendorName} Team,\n\nThank you for sharing your quotation for our upcoming celebration. To help us finalize our operational plan, could you please clarify the following missing details:\n\n` +
        params.missingFields.map((f, i) => `${i + 1}. ${f.replace(' — ask vendor', '')}`).join('\n') +
        `\n\nWe look forward to your confirmation so we can finalize the booking.\n\nWarm regards,\nEvent Operations Coordinator (via Bandobast)`;
    }

    return {
      success: true,
      source: 'client_fallback',
      draft
    };
  }
}

/**
 * Send interactive message to Bandobast AI Advisor with budget awareness
 */
export async function sendChatMessage(params: {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  budget: number;
  eventDetails?: any;
}): Promise<{
  success: boolean;
  source: string;
  reply: string;
  suggestedBudget?: number;
}> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('AI chat proxy failed, using intelligent client fallback:', err);
    const b = params.budget || 300000;
    return {
      success: true,
      source: 'client_fallback',
      reply: `For a budget of ₹${b.toLocaleString('en-IN')}:\n\n` +
        `• **Catering (38%):** ₹${Math.round(b * 0.38).toLocaleString('en-IN')} gives approx ₹${Math.round((b * 0.38) / (params.eventDetails?.guestCount || 180))}/guest for royal multi-course dining with live chaat.\n` +
        `• **Venue & Mandap (22%):** ₹${Math.round(b * 0.22).toLocaleString('en-IN')} secures a heritage lawn or ballroom with auspicious morning muhurat access.\n` +
        `• **Photography & Cinema (13%):** ₹${Math.round(b * 0.13).toLocaleString('en-IN')} provides candid photo coverage and high-definition video teasers.\n` +
        `• **Decor & Atmosphere (16%):** ₹${Math.round(b * 0.16).toLocaleString('en-IN')} for marigold mandap floral canopies and fairy lights.\n` +
        `• **Contingency Pool (11%):** ₹${Math.round(b * 0.11).toLocaleString('en-IN')} reserved for unexpected guest arrivals.\n\n` +
        `You can easily update the budget using the slider on the Home Page or directly inside this chat!`
    };
  }
}

/**
 * Fetch top vendor & place recommendations matching user's budget
 */
export async function fetchBudgetVendorRecommendations(params: {
  budget: number;
  location?: string;
  guestCount?: number;
  category?: string;
  occasion?: string;
}): Promise<{
  success: boolean;
  source: string;
  recommendations: any[];
}> {
  try {
    const res = await fetch('/api/ai/recommend-vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Vendor recommendations fetch failed, returning curated client tier:', err);
    const b = params.budget || 300000;
    const g = params.guestCount || 180;

    return {
      success: true,
      source: 'client_fallback_curated',
      recommendations: [
        {
          id: 'fb-ven-1',
          name: 'Heritage Haveli & Palace Courtyard',
          category: 'venue',
          city: params.location || 'Jaipur',
          rating: 4.9,
          reviewsCount: 142,
          priceRange: `₹${Math.round(b * 0.20).toLocaleString('en-IN')} package`,
          estimatedCost: Math.round(b * 0.22),
          fitDescription: 'Auspicious traditional sandstone arches with lush lawns. Perfect for Vedic ceremonies.',
          highlights: ['Capacity up to 250 pax', 'Bridal suites included', 'Valet parking space'],
          contactName: 'Kunal Rathore',
          contactNumber: '+91 98290 11223',
          matchScore: 96
        },
        {
          id: 'fb-cat-1',
          name: 'Royal Rasoi Gourmet Caterers',
          category: 'catering',
          city: params.location || 'Jaipur',
          rating: 4.9,
          reviewsCount: 215,
          priceRange: `₹${Math.round((b * 0.38) / g)} / plate`,
          estimatedCost: Math.round(b * 0.38),
          unitPricingLabel: `₹${Math.round((b * 0.38) / g)} / guest`,
          fitDescription: 'Traditional royal feasts with live Chaat, Jalebi-Rabdi, and uniformed service staff.',
          highlights: ['Live Chaat & Dessert counters', '1 server per 15 guests', 'Copper chafing dishes'],
          contactName: 'Chef Harish Joshi',
          contactNumber: '+91 98292 77889',
          matchScore: 98
        },
        {
          id: 'fb-pho-1',
          name: 'ShutterMagic Cine Studios',
          category: 'photography',
          city: params.location || 'Jaipur',
          rating: 4.9,
          reviewsCount: 180,
          priceRange: `₹${Math.round(b * 0.13).toLocaleString('en-IN')} package`,
          estimatedCost: Math.round(b * 0.13),
          fitDescription: '2 Candid photographers + 4K cinematic wedding teaser & luxury printed album.',
          highlights: ['Drone aerial coverage', 'Teaser in 7 days', 'Full cloud gallery'],
          contactName: 'Aman Saxena',
          contactNumber: '+91 98294 12345',
          matchScore: 95
        },
        {
          id: 'fb-dec-1',
          name: 'Utsav Mandap & Floral Artistry',
          category: 'decor',
          city: params.location || 'Jaipur',
          rating: 4.8,
          reviewsCount: 130,
          priceRange: `₹${Math.round(b * 0.16).toLocaleString('en-IN')} package`,
          estimatedCost: Math.round(b * 0.16),
          fitDescription: 'Handcrafted marigold floral mandap canopy and fairy light curtain backdrop.',
          highlights: ['Fresh marigolds & tuberose', 'Welcome arch', 'Stage ambient lighting'],
          contactName: 'Deepak Soni',
          contactNumber: '+91 98296 23456',
          matchScore: 94
        }
      ]
    };
  }
}
