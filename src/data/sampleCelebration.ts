import { CelebrationEvent } from '../types';

export const SAMPLE_WEDDING: CelebrationEvent = {
  id: 'evt-wedding-aarav-meera',
  name: "Aarav & Meera's Wedding Celebration",
  occasion: 'Traditional Indian Wedding',
  eventType: 'wedding',
  location: 'Udaipur & Heritage Lawns, Jaipur',
  startDate: '2026-11-12',
  endDate: '2026-11-14',
  totalBudget: 300000, // ₹3,00,000 illustrative starting budget
  guestCount: 180, // starting guest count
  contingencyReserve: 15000,
  readinessScore: 68,
  activeSimulation: {
    activePreset: 'none',
    guestCountDelta: 0,
    dateDaysShift: 0,
    vendorIncreasePercent: 0
  },
  priorities: [
    {
      id: 'p-1',
      label: 'Food Quality & Dining Experience',
      rank: 1,
      locked: true,
      description: 'Authentic regional live stations and fresh artisanal sweets cannot be compromised.'
    },
    {
      id: 'p-2',
      label: 'Photography & Cinematic Memories',
      rank: 2,
      locked: false,
      description: 'Preserve candidate moments, cinematic wedding film, and family heirloom albums.'
    },
    {
      id: 'p-3',
      label: 'Guest Comfort & Hospitality',
      rank: 3,
      locked: false,
      description: 'Shaded seating, welcome drinks, accessible entry for elderly family members.'
    },
    {
      id: 'p-4',
      label: 'Floral Decoration & Mandap Aesthetics',
      rank: 4,
      locked: false,
      description: 'Fresh marigold, jasmine ropes, and royal floral mandap canopy.'
    },
    {
      id: 'p-5',
      label: 'Guest Count Scale',
      rank: 5,
      locked: false,
      description: 'Targeted core guest list; flexible on secondary extended invitations.'
    },
    {
      id: 'p-6',
      label: 'Convenience & Turnkey Management',
      rank: 6,
      locked: false,
      description: 'Willing to handle smaller family tasks internally if budget requires.'
    }
  ],
  protectedRequirements: [
    'Food quality and live chaat counters must not be degraded',
    'Main mandap pheras ceremony timing must remain auspicious (morning muhurat)',
    'Elderly guests transport and ground-floor room allocation must stay locked'
  ],
  functions: [
    {
      id: 'func-mehendi',
      name: 'Mehendi & Haldi Carnival',
      date: '2026-11-12',
      time: '03:00 PM - 07:00 PM',
      venueName: 'Courtyard Palm Grove',
      venueCapacity: 120,
      guestCount: 80,
      attireTheme: 'Sunny Yellow & Floral Pastels',
      description: 'Vibrant outdoor afternoon with folk singers, dholak, and organic mehendi artists.',
      color: '#E7A83E'
    },
    {
      id: 'func-sangeet',
      name: 'Sangeet & Cocktail Night',
      date: '2026-11-13',
      time: '07:30 PM - 11:30 PM',
      venueName: 'Crystal Ballroom',
      venueCapacity: 250,
      guestCount: 180,
      attireTheme: 'Indo-Western Glitz & Navy Gold',
      description: 'Choreographed family dance performances, DJ beats, and royal buffet dinner.',
      color: '#405B43'
    },
    {
      id: 'func-wedding',
      name: 'Vedic Wedding & Mandap Pheras',
      date: '2026-11-14',
      time: '09:00 AM - 02:00 PM',
      venueName: 'Royal Mandap Heritage Lawns',
      venueCapacity: 200, // NOTE: at 220 guests, triggers real capacity alert!
      guestCount: 180,
      attireTheme: 'Traditional Royal Crimson & Ivory',
      description: 'Traditional morning ceremony under hand-crafted floral mandap with sitar ensemble.',
      color: '#C76F50'
    },
    {
      id: 'func-reception',
      name: 'Grand Gala Dinner Reception',
      date: '2026-11-14',
      time: '07:00 PM - 11:00 PM',
      venueName: 'Crystal Ballroom & Terrace',
      venueCapacity: 250,
      guestCount: 180,
      attireTheme: 'Formal Velvet & Embroidered Silks',
      description: 'Formal reception line, stage photography, live ghazal musicians, and grand banquet.',
      color: '#302F28'
    }
  ],
  categories: [
    {
      id: 'cat-catering',
      name: 'Catering & Beverages',
      iconName: 'Utensils',
      color: '#405B43',
      plannedAmount: 108000,
      committedAmount: 95000,
      paidAmount: 40000,
      isMustPreserve: true,
      notes: 'Includes all 4 functions with live chaat, lunch, and gala dinner.',
      lineItems: [
        {
          id: 'li-cat-1',
          categoryId: 'cat-catering',
          name: 'Mehendi High-Tea Buffet',
          functionId: 'func-mehendi',
          unitCost: 350,
          unitType: 'per_guest',
          quantity: 80,
          plannedAmount: 28000,
          committedAmount: 28000,
          paidAmount: 10000,
          isProtected: false,
          provenance: {
            source: 'quoted',
            quoteId: 'q-royal-rasoi',
            quoteLineItemId: 'qli-1',
            calculationBasis: 'Quoted per-person rate ₹350 × 80 confirmed guests',
            verified: true,
            lastUpdated: '2026-10-20'
          }
        },
        {
          id: 'li-cat-2',
          categoryId: 'cat-catering',
          name: 'Sangeet Dinner Feast',
          functionId: 'func-sangeet',
          unitCost: 400,
          unitType: 'per_guest',
          quantity: 180,
          plannedAmount: 36000,
          committedAmount: 32000,
          paidAmount: 15000,
          isProtected: true,
          provenance: {
            source: 'quoted',
            quoteId: 'q-royal-rasoi',
            calculationBasis: 'Quoted per-person rate ₹400 × 180 sangeet guests',
            verified: true,
            lastUpdated: '2026-10-20'
          }
        },
        {
          id: 'li-cat-3',
          categoryId: 'cat-catering',
          name: 'Wedding Traditional Mahaprasad Lunch',
          functionId: 'func-wedding',
          unitCost: 250,
          unitType: 'per_guest',
          quantity: 180,
          plannedAmount: 44000,
          committedAmount: 35000,
          paidAmount: 15000,
          isProtected: true,
          provenance: {
            source: 'quoted',
            quoteId: 'q-royal-rasoi',
            calculationBasis: 'Traditional satvik thali + live jalebi station',
            verified: true,
            lastUpdated: '2026-10-20'
          }
        }
      ]
    },
    {
      id: 'cat-venue',
      name: 'Venues & Property Rental',
      iconName: 'Building',
      color: '#E7A83E',
      plannedAmount: 65000,
      committedAmount: 65000,
      paidAmount: 30000,
      isMustPreserve: false,
      notes: 'Courtyard Palm Grove, Crystal Ballroom, and Heritage Lawns package.',
      lineItems: [
        {
          id: 'li-ven-1',
          categoryId: 'cat-venue',
          name: 'Heritage Lawns & Mandap Grounds (Morning)',
          functionId: 'func-wedding',
          unitCost: 35000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 35000,
          committedAmount: 35000,
          paidAmount: 20000,
          isProtected: true,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Confirmed booking contract signed with resort manager',
            verified: true,
            lastUpdated: '2026-10-15'
          }
        },
        {
          id: 'li-ven-2',
          categoryId: 'cat-venue',
          name: 'Crystal Ballroom & Terrace Stage (2 Evenings)',
          functionId: 'func-sangeet',
          unitCost: 30000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 30000,
          committedAmount: 30000,
          paidAmount: 10000,
          isProtected: false,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Confirmed slot reservation',
            verified: true,
            lastUpdated: '2026-10-15'
          }
        }
      ]
    },
    {
      id: 'cat-decor',
      name: 'Decoration & Floral Art',
      iconName: 'Flower2',
      color: '#C76F50',
      plannedAmount: 48000,
      committedAmount: 40000,
      paidAmount: 15000,
      isMustPreserve: false,
      notes: 'Marigold floral mandap, entrance arch, cocktail lighting.',
      lineItems: [
        {
          id: 'li-dec-1',
          categoryId: 'cat-decor',
          name: 'Mandap Floral Canopy & Brass Bell Bells',
          functionId: 'func-wedding',
          unitCost: 26000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 26000,
          committedAmount: 24000,
          paidAmount: 10000,
          isProtected: false,
          provenance: {
            source: 'quoted',
            quoteId: 'q-utsav-decor',
            calculationBasis: 'Utsav Decorators floral package #2',
            verified: true,
            lastUpdated: '2026-10-18'
          }
        },
        {
          id: 'li-dec-2',
          categoryId: 'cat-decor',
          name: 'Mehendi & Sangeet Fairy Lights & Seating',
          functionId: 'func-sangeet',
          unitCost: 22000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 22000,
          committedAmount: 16000,
          paidAmount: 5000,
          isProtected: false,
          provenance: {
            source: 'ai_estimate',
            calculationBasis: 'Initial market estimate based on 180 pax hall staging',
            verified: false,
            lastUpdated: '2026-10-22'
          }
        }
      ]
    },
    {
      id: 'cat-photo',
      name: 'Photography & Cinema',
      iconName: 'Camera',
      color: '#405B43',
      plannedAmount: 38000,
      committedAmount: 35000,
      paidAmount: 15000,
      isMustPreserve: false,
      notes: '2 Candid photographers + 1 cinematic drone operator for 3 days.',
      lineItems: [
        {
          id: 'li-pho-1',
          categoryId: 'cat-photo',
          name: '3-Day Candid Photo & Traditional Album',
          unitCost: 22000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 22000,
          committedAmount: 20000,
          paidAmount: 10000,
          isProtected: true,
          provenance: {
            source: 'quoted',
            quoteId: 'q-shuttermagic',
            calculationBasis: 'ShutterMagic Studio Package Silver',
            verified: true,
            lastUpdated: '2026-10-19'
          }
        },
        {
          id: 'li-pho-2',
          categoryId: 'cat-photo',
          name: 'Cinematic 4K Teaser & Drone Coverage',
          unitCost: 16000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 16000,
          committedAmount: 15000,
          paidAmount: 5000,
          isProtected: false,
          provenance: {
            source: 'quoted',
            quoteId: 'q-shuttermagic',
            calculationBasis: 'Drone operator + color graded highlight reel',
            verified: true,
            lastUpdated: '2026-10-19'
          }
        }
      ]
    },
    {
      id: 'cat-gifts',
      name: 'Invitations & Return Gifts',
      iconName: 'Gift',
      color: '#E7A83E',
      plannedAmount: 16000,
      committedAmount: 12000,
      paidAmount: 6000,
      isMustPreserve: false,
      notes: 'Handcrafted mithai boxes & brass diya thalis for families.',
      lineItems: [
        {
          id: 'li-gift-1',
          categoryId: 'cat-gifts',
          name: 'Family Return Favor Hampers',
          unitCost: 75,
          unitType: 'per_guest',
          quantity: 180,
          plannedAmount: 13500,
          committedAmount: 10000,
          paidAmount: 5000,
          isProtected: false,
          provenance: {
            source: 'illustrative',
            calculationBasis: '₹75 per guest hamper × 180 confirmed guest units',
            verified: false,
            lastUpdated: '2026-10-21'
          }
        },
        {
          id: 'li-gift-2',
          categoryId: 'cat-gifts',
          name: 'E-invites & Printed Keepsake Cards',
          unitCost: 2500,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 2500,
          committedAmount: 2000,
          paidAmount: 1000,
          isProtected: false,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Digital video invite suite with QR access codes',
            verified: true,
            lastUpdated: '2026-10-16'
          }
        }
      ]
    },
    {
      id: 'cat-contingency',
      name: 'Contingency & Reserve',
      iconName: 'ShieldAlert',
      color: '#77756B',
      plannedAmount: 25000,
      committedAmount: 0,
      paidAmount: 0,
      isMustPreserve: false,
      notes: 'Unforeseen weather protection, extra guest plate buffer, last-minute transport.',
      lineItems: [
        {
          id: 'li-con-1',
          categoryId: 'cat-contingency',
          name: 'Emergency Buffer & Overrun Reserve',
          unitCost: 25000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 25000,
          committedAmount: 0,
          paidAmount: 0,
          isProtected: false,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Recommended 8% emergency pool allocated by organizer',
            verified: true,
            lastUpdated: '2026-10-14'
          }
        }
      ]
    }
  ],
  tasks: [
    {
      id: 'task-1',
      name: 'Lock RSVP & Confirmed Headcount',
      description: 'Collect definitive confirmations from both families for catering batch orders.',
      dueDate: '2026-10-28',
      originalDueDate: '2026-10-28',
      category: 'Coordination',
      status: 'in_progress',
      priority: 'critical',
      assignedTo: 'Aarav (Groom) & Meera',
      dependencies: [],
      isMilestone: true
    },
    {
      id: 'task-2',
      name: 'Catering Headcount Finalization & Menu Lock',
      description: 'Submit guaranteed plate count to Royal Rasoi Caterers.',
      functionId: 'func-wedding',
      dueDate: '2026-11-02',
      originalDueDate: '2026-11-02',
      category: 'Catering',
      status: 'not_started',
      priority: 'critical',
      assignedTo: 'Rajesh Uncle (Food Lead)',
      dependencies: ['task-1']
    },
    {
      id: 'task-3',
      name: 'Venue Seating Layout & Capacity Check',
      description: 'Inspect floor plan of Heritage Lawns for mandap staging and guest chairs.',
      functionId: 'func-wedding',
      dueDate: '2026-11-04',
      originalDueDate: '2026-11-04',
      category: 'Venue',
      status: 'not_started',
      priority: 'high',
      assignedTo: 'Resort Liaison',
      dependencies: ['task-1']
    },
    {
      id: 'task-4',
      name: 'Return Gift Hamper Order Dispatch',
      description: 'Order brass diya favor boxes based on final guest count.',
      dueDate: '2026-11-03',
      originalDueDate: '2026-11-03',
      category: 'Gifts',
      status: 'not_started',
      priority: 'medium',
      assignedTo: 'Meera (Bride)',
      dependencies: ['task-1']
    },
    {
      id: 'task-5',
      name: 'Food Tasting & Sweets Approval',
      description: 'Sample live chaat items, kheer, and main curry spice balance.',
      dueDate: '2026-10-26',
      originalDueDate: '2026-10-26',
      category: 'Catering',
      status: 'completed',
      priority: 'high',
      assignedTo: 'Family Tasting Committee',
      dependencies: []
    },
    {
      id: 'task-6',
      name: 'Mandap Floral Architecture Final Walkthrough',
      description: 'Review structural pillars and fresh marigold drop count with Utsav Decorators.',
      dueDate: '2026-11-07',
      originalDueDate: '2026-11-07',
      category: 'Decoration',
      status: 'not_started',
      priority: 'medium',
      assignedTo: 'Meera & Decor Lead',
      dependencies: ['task-3']
    },
    {
      id: 'task-7',
      name: 'Sangeet DJ Playlist & Stage Lighting Cue',
      description: 'Submit couple entry song, performance sequence, and sound check slot.',
      functionId: 'func-sangeet',
      dueDate: '2026-11-08',
      originalDueDate: '2026-11-08',
      category: 'Entertainment',
      status: 'in_progress',
      priority: 'medium',
      assignedTo: 'Cousins Dance Troupe',
      dependencies: []
    },
    {
      id: 'task-8',
      name: 'Photography Shot List & Family Group Schedule',
      description: 'Map mandatory family combinations for stage photography to avoid delays.',
      dueDate: '2026-11-09',
      originalDueDate: '2026-11-09',
      category: 'Photography',
      status: 'not_started',
      priority: 'medium',
      assignedTo: 'Aarav',
      dependencies: []
    },
    {
      id: 'task-9',
      name: 'Vendor Final Invoices & Payment Schedule',
      description: 'Verify advance slips and clear milestone payments.',
      dueDate: '2026-11-10',
      originalDueDate: '2026-11-10',
      category: 'Finance',
      status: 'not_started',
      priority: 'high',
      assignedTo: 'Father of Groom',
      dependencies: ['task-2', 'task-6']
    }
  ],
  quotes: [
    {
      id: 'q-royal-rasoi',
      vendorName: 'Royal Rasoi Grand Catering Services',
      vendorCategory: 'Catering',
      quoteDate: '2026-10-20',
      totalAmount: 108000,
      subtotal: 98000,
      gstAmount: 5000,
      serviceCharges: 5000,
      paymentTerms: '35% advance upon confirmation, 50% 2 days prior to first function, 15% settlement post-reception',
      cancellationPolicy: 'Advance retained if cancelled less than 21 days before event dates',
      validityPeriod: 'Quote valid till Nov 1, 2026',
      inclusions: [
        'Live Chaat Station (Pani Puri, Papdi Chaat, Dahi Vada)',
        'Traditional Rajasthani & Punjabi 3-course Wedding Feast',
        '4 Live Dessert Counters with Hot Jalebi & Rabdi',
        'Uniformed waitstaff with white gloves (1 server per 15 guests)',
        'Chafing dishes, copper bowls, and premium disposables/crockery'
      ],
      exclusions: [
        'Specialty mocktail bar counter (available at ₹65/head extra)',
        'Late night service beyond 11:45 PM (overtime fees apply)',
        'Packaged water bottles billed strictly on unsealed carton consumption'
      ],
      missingFields: [
        'Exact per-hour overtime charge beyond 11:45 PM not specified — ask vendor',
        'Staff tip expectation / mandatory service gratuity omitted — ask vendor',
        'Power backup generator fuel responsibility not stated — ask vendor'
      ],
      rawText: 'Quotation Ref #RR-2026-992 for Aarav-Meera Wedding Catering...',
      status: 'accepted',
      provenance: {
        source: 'quoted',
        quoteId: 'q-royal-rasoi',
        calculationBasis: 'Official vendor PDF quotation processed via Gemini Quote X-Ray',
        verified: true,
        lastUpdated: '2026-10-20'
      },
      lineItems: [
        {
          id: 'qli-1',
          description: 'Mehendi Carnival High Tea (80 pax)',
          quantity: 80,
          unitPrice: 350,
          subtotal: 28000
        },
        {
          id: 'qli-2',
          description: 'Sangeet Royal Dinner Feast (180 pax)',
          quantity: 180,
          unitPrice: 400,
          subtotal: 72000
        },
        {
          id: 'qli-3',
          description: 'Live Jalebi & Rabdi Station (Wedding morning)',
          quantity: 1,
          unitPrice: 8000,
          subtotal: 8000
        }
      ]
    },
    {
      id: 'q-utsav-decor',
      vendorName: 'Utsav Floral & Wedding Artistry',
      vendorCategory: 'Decoration',
      quoteDate: '2026-10-18',
      totalAmount: 48000,
      subtotal: 44000,
      gstAmount: 4000,
      serviceCharges: 0,
      paymentTerms: '50% advance booking deposit, 50% on setup day morning',
      cancellationPolicy: '50% of deposit refundable if cancelled 30 days prior',
      validityPeriod: 'Valid for 14 days',
      inclusions: [
        'Heritage Lawns 4-pillar wooden floral mandap with marigold & tuberose',
        'Entrance toran gate arch with fresh jasmine strings',
        'Sangeet stage backdrop with fairy light curtain and royal sofa pair',
        'Mehendi floral swing (jhula) with fresh carnations'
      ],
      exclusions: [
        'Generator set fuel for nighttime fairy illumination',
        'Cleanup of fallen flower petals post-event (venue charges separately)',
        'Bridal bouquet and corsages'
      ],
      missingFields: [
        'Weather contingency cover (rain canopy) costs not included — ask vendor',
        'Setup completion guaranteed delivery hour not written — ask vendor'
      ],
      status: 'under_review',
      provenance: {
        source: 'quoted',
        quoteId: 'q-utsav-decor',
        calculationBasis: 'Vendor quotation estimate for 3 functions',
        verified: true,
        lastUpdated: '2026-10-18'
      },
      lineItems: [
        {
          id: 'qli-u1',
          description: 'Vedic Floral Mandap & Pheras Canopy',
          quantity: 1,
          unitPrice: 26000,
          subtotal: 26000
        },
        {
          id: 'qli-u2',
          description: 'Sangeet Stage Backdrop & Ambient Fairy Lighting',
          quantity: 1,
          unitPrice: 22000,
          subtotal: 22000
        }
      ]
    },
    {
      id: 'q-shuttermagic',
      vendorName: 'ShutterMagic Cine Studios',
      vendorCategory: 'Photography',
      quoteDate: '2026-10-19',
      totalAmount: 38000,
      subtotal: 38000,
      gstAmount: 0,
      serviceCharges: 0,
      paymentTerms: '25% advance, 50% during events, 25% upon final photo album delivery',
      cancellationPolicy: 'Advance non-refundable after Nov 1st',
      validityPeriod: 'Valid for 20 days',
      inclusions: [
        '2 Senior Candid Photographers covering all 4 events',
        '1 Traditional Videographer for complete ritual documentation',
        '1 Cinematic 4K Teaser Film (3-5 minutes)',
        '1 Premium Leather-bound 40-page Wedding Album (300 selected photos)',
        'Full cloud gallery delivery within 21 days'
      ],
      exclusions: [
        'Drone permissions & airport zone clearances',
        'Raw footage unedited hard drive (₹3,000 extra)',
        'Out-of-city travel and accommodation for crew'
      ],
      missingFields: [
        'GST invoice availability not specified — ask vendor',
        'Maximum hours per day before overtime kicks in is ambiguous — ask vendor'
      ],
      status: 'under_review',
      provenance: {
        source: 'quoted',
        quoteId: 'q-shuttermagic',
        calculationBasis: 'Studio package quotation',
        verified: true,
        lastUpdated: '2026-10-19'
      },
      lineItems: [
        {
          id: 'qli-s1',
          description: '3-Day Photography & Complete Video Documentation',
          quantity: 1,
          unitPrice: 22000,
          subtotal: 22000
        },
        {
          id: 'qli-s2',
          description: '4K Cinematic Wedding Film + Drone Footage',
          quantity: 1,
          unitPrice: 16000,
          subtotal: 16000
        }
      ]
    }
  ],
  createdAt: '2026-10-10T10:00:00Z',
  updatedAt: '2026-10-25T14:30:00Z'
};

/**
 * Secondary Demo Celebration: Birthday / Milestone Celebration
 * Illustrates multi-event versatility without rewriting core engines.
 */
export const SAMPLE_BIRTHDAY: CelebrationEvent = {
  id: 'evt-birthday-arjun',
  name: "Arjun's 30th Milestone Rooftop Soiree",
  occasion: '30th Milestone Birthday',
  eventType: 'birthday',
  location: 'Skyline Terrace Lounge, Bengaluru',
  startDate: '2026-11-20',
  endDate: '2026-11-20',
  totalBudget: 120000,
  guestCount: 65,
  contingencyReserve: 10000,
  readinessScore: 82,
  activeSimulation: {
    activePreset: 'none',
    guestCountDelta: 0,
    dateDaysShift: 0,
    vendorIncreasePercent: 0
  },
  priorities: [
    {
      id: 'pb-1',
      label: 'Gourmet Food & Craft Cocktails',
      rank: 1,
      locked: true,
      description: 'Artisanal sliders, live pasta wheel, and custom mixology bar.'
    },
    {
      id: 'pb-2',
      label: 'Live Acoustic Music & DJ',
      rank: 2,
      locked: false,
      description: 'Acoustic sundowner set transitioning into upbeat retro funk DJ.'
    },
    {
      id: 'pb-3',
      label: 'Interactive Photo Booth & Memories',
      rank: 3,
      locked: false,
      description: 'Instant polaroid favors with custom metallic 30th backdrop.'
    }
  ],
  protectedRequirements: [
    'Rooftop sunset acoustic set must happen before 6:30 PM',
    'Custom Belgian truffle tiered cake must not be altered'
  ],
  functions: [
    {
      id: 'func-bday-main',
      name: 'Rooftop Sunset & Dancing Soiree',
      date: '2026-11-20',
      time: '05:30 PM - 11:30 PM',
      venueName: 'Skyline Terrace Lounge',
      venueCapacity: 90,
      guestCount: 65,
      attireTheme: 'Retro Chic & Smart Casuals',
      description: 'Sunset aperitifs followed by live acoustic tunes, dinner, and late-night dancing.',
      color: '#405B43'
    }
  ],
  categories: [
    {
      id: 'cat-b-food',
      name: 'Food & Gourmet Grazing',
      iconName: 'Utensils',
      color: '#405B43',
      plannedAmount: 52000,
      committedAmount: 50000,
      paidAmount: 25000,
      isMustPreserve: true,
      notes: 'Passed tapas, wood-fired pizza bar, and artisan desserts.',
      lineItems: [
        {
          id: 'li-bf-1',
          categoryId: 'cat-b-food',
          name: 'Passed Tapas & Live Pasta Station',
          unitCost: 800,
          unitType: 'per_guest',
          quantity: 65,
          plannedAmount: 52000,
          committedAmount: 50000,
          paidAmount: 25000,
          isProtected: true,
          provenance: {
            source: 'quoted',
            calculationBasis: '₹800/head catering package × 65 confirmed friends',
            verified: true,
            lastUpdated: '2026-10-22'
          }
        }
      ]
    },
    {
      id: 'cat-b-cake',
      name: 'Designer Cake & Sweet Treats',
      iconName: 'Gift',
      color: '#E7A83E',
      plannedAmount: 12000,
      committedAmount: 12000,
      paidAmount: 6000,
      isMustPreserve: true,
      notes: 'Custom 3-tier dark chocolate salted caramel drip cake.',
      lineItems: [
        {
          id: 'li-bc-1',
          categoryId: 'cat-b-cake',
          name: 'Belgian Truffle 3-Tier Milestone Cake',
          unitCost: 12000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 12000,
          committedAmount: 12000,
          paidAmount: 6000,
          isProtected: true,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Confirmed bakery invoice',
            verified: true,
            lastUpdated: '2026-10-21'
          }
        }
      ]
    },
    {
      id: 'cat-b-music',
      name: 'DJ & Acoustic Duo',
      iconName: 'Music',
      color: '#C76F50',
      plannedAmount: 25000,
      committedAmount: 25000,
      paidAmount: 10000,
      isMustPreserve: false,
      notes: '3-hour sunset set + sound gear hire.',
      lineItems: [
        {
          id: 'li-bm-1',
          categoryId: 'cat-b-music',
          name: 'Live Duo & Sound Setup',
          unitCost: 25000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 25000,
          committedAmount: 25000,
          paidAmount: 10000,
          isProtected: false,
          provenance: {
            source: 'quoted',
            calculationBasis: 'Band quote',
            verified: true,
            lastUpdated: '2026-10-20'
          }
        }
      ]
    },
    {
      id: 'cat-b-decor',
      name: 'Neon & Polaroid Decor',
      iconName: 'Sparkles',
      color: '#302F28',
      plannedAmount: 15000,
      committedAmount: 10000,
      paidAmount: 5000,
      isMustPreserve: false,
      notes: 'Custom "Arjun 30" neon sign and retro photo booth wall.',
      lineItems: [
        {
          id: 'li-bd-1',
          categoryId: 'cat-b-decor',
          name: 'Neon Sign & Balloon Garland',
          unitCost: 15000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 15000,
          committedAmount: 10000,
          paidAmount: 5000,
          isProtected: false,
          provenance: {
            source: 'ai_estimate',
            calculationBasis: 'Market benchmark for rooftop lounge styling',
            verified: false,
            lastUpdated: '2026-10-23'
          }
        }
      ]
    },
    {
      id: 'cat-b-reserve',
      name: 'Contingency',
      iconName: 'ShieldAlert',
      color: '#77756B',
      plannedAmount: 16000,
      committedAmount: 0,
      paidAmount: 0,
      isMustPreserve: false,
      notes: 'Cocktail overage buffer.',
      lineItems: [
        {
          id: 'li-br-1',
          categoryId: 'cat-b-reserve',
          name: 'Reserve Fund',
          unitCost: 16000,
          unitType: 'fixed',
          quantity: 1,
          plannedAmount: 16000,
          committedAmount: 0,
          paidAmount: 0,
          isProtected: false,
          provenance: {
            source: 'user_entered',
            calculationBasis: 'Buffer',
            verified: true,
            lastUpdated: '2026-10-20'
          }
        }
      ]
    }
  ],
  tasks: [
    {
      id: 'tb-1',
      name: 'Finalize RSVP Attendee List',
      description: 'Lock total count with venue manager 5 days prior.',
      dueDate: '2026-11-15',
      originalDueDate: '2026-11-15',
      category: 'Coordination',
      status: 'in_progress',
      priority: 'critical',
      dependencies: []
    },
    {
      id: 'tb-2',
      name: 'Cake Flavor Tasting & Delivery Slot',
      description: 'Confirm delivery van with dry ice at 4:00 PM.',
      dueDate: '2026-11-17',
      originalDueDate: '2026-11-17',
      category: 'Catering',
      status: 'completed',
      priority: 'high',
      dependencies: []
    },
    {
      id: 'tb-3',
      name: 'Curate Evening Playlist with DJ',
      description: 'Send 90s & 2000s throwback dance tracklist.',
      dueDate: '2026-11-18',
      originalDueDate: '2026-11-18',
      category: 'Entertainment',
      status: 'not_started',
      priority: 'medium',
      dependencies: ['tb-1']
    }
  ],
  quotes: [],
  createdAt: '2026-10-18T12:00:00Z',
  updatedAt: '2026-10-25T14:30:00Z'
};
