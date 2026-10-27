import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateBudgetTotals, 
  calculateEventReadiness, 
  propagateRippleChanges, 
  calculateTradeoffScenarios, 
  applyScenarioToEvent,
  exportIcsCalendar
} from '../src/services/rippleEngine';
import { CelebrationEvent } from '../src/types';
import { 
  extractQuoteSchema, 
  vendorQuestionsSchema, 
  aiChatSchema, 
  recommendVendorsSchema 
} from '../server/validation';

describe('Bandobast Remediation Audit & Correctness Tests', () => {

  // 1. ZOD SCHEMA RUNTIME VALIDATION TESTS (Section 2)
  describe('API Schema Validation', () => {
    test('extractQuoteSchema accepts valid text or document payloads', () => {
      const validText = { rawText: 'Wedding catering quote: 150 pax at ₹500/plate' };
      assert.ok(extractQuoteSchema.safeParse(validText).success);

      const validFile = { 
        fileBase64: 'data:application/pdf;base64,JVBERi0xLjcK...', 
        mimeType: 'application/pdf' as const 
      };
      assert.ok(extractQuoteSchema.safeParse(validFile).success);

      // Rejects empty input
      assert.equal(extractQuoteSchema.safeParse({}).success, false);

      // Rejects unsupported MIME type
      assert.equal(extractQuoteSchema.safeParse({ fileBase64: 'abc', mimeType: 'application/zip' }).success, false);
    });

    test('vendorQuestionsSchema validates languages and field arrays', () => {
      const validInquiry = {
        vendorName: 'Royal Rasoi Caterers',
        category: 'Catering',
        missingFields: ['Overtime rate beyond 11 PM', 'Staff tipping policy'],
        language: 'Hindi' as const
      };
      assert.ok(vendorQuestionsSchema.safeParse(validInquiry).success);

      // Rejects unsupported language
      assert.equal(vendorQuestionsSchema.safeParse({ ...validInquiry, language: 'French' }).success, false);

      // Rejects missing vendor name
      assert.equal(vendorQuestionsSchema.safeParse({ ...validInquiry, vendorName: '' }).success, false);
    });

    test('aiChatSchema and recommendVendorsSchema enforce realistic budget and guest limits', () => {
      const validChat = {
        message: 'How should we allocate ₹3,50,000 for 200 guests in Jaipur?',
        budget: 350000,
        eventDetails: { guestCount: 200, location: 'Jaipur' }
      };
      assert.ok(aiChatSchema.safeParse(validChat).success);

      // Rejects negative budget
      assert.equal(aiChatSchema.safeParse({ ...validChat, budget: -5000 }).success, false);

      // Rejects zero or excessive guests (> 50,000)
      assert.equal(aiChatSchema.safeParse({ ...validChat, eventDetails: { guestCount: 60000 } }).success, false);

      const validRec = { budget: 250000, category: 'venue' as const, guestCount: 150 };
      assert.ok(recommendVendorsSchema.safeParse(validRec).success);
    });
  });

  // 2. CUSTOM EVENT TYPES & ARBITRARY CATEGORIES (Section 3)
  describe('Custom Event Types & Non-Wedding Events', () => {
    const customBirthdayEvent: CelebrationEvent = {
      id: 'evt-custom-bday-50',
      name: "Sanjay's 50th Milestone Jubilee",
      occasion: 'Milestone 50th Birthday Party',
      eventType: 'birthday',
      location: 'Udaipur, Rajasthan',
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      totalBudget: 150000,
      guestCount: 80,
      contingencyReserve: 12000,
      readinessScore: 50,
      functions: [
        {
          id: 'func-bday-dinner',
          name: 'Golden Jubilee Banquet & DJ Night',
          date: '2026-11-20',
          time: '07:00 PM - 11:30 PM',
          venueName: 'Lakeview Pavilion',
          venueCapacity: 100,
          guestCount: 80,
          description: 'Cocktail dinner and family celebration'
        }
      ],
      categories: [
        {
          id: 'cat-custom-dinner',
          name: 'Multi-Course Gourmet Dinner',
          iconName: 'Utensils',
          color: '#405B43',
          plannedAmount: 60000,
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: true, // MUST PRESERVE
          lineItems: [
            {
              id: 'li-bday-1',
              categoryId: 'cat-custom-dinner',
              name: 'Buffet & Live Counters',
              unitType: 'per_guest',
              unitCost: 750,
              quantity: 80,
              plannedAmount: 60000,
              committedAmount: 0,
              paidAmount: 0,
              isProtected: true,
              provenance: { source: 'user_entered', verified: true, lastUpdated: '2026-10-26' }
            }
          ]
        },
        {
          id: 'cat-custom-av',
          name: 'DJ, Sound & Stage Lighting',
          iconName: 'Music',
          color: '#E7A83E',
          plannedAmount: 40000,
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          lineItems: []
        },
        {
          id: 'cat-custom-styling',
          name: 'Theme Ambience & Cake Table Decor',
          iconName: 'Sparkles',
          color: '#C76F50',
          plannedAmount: 35000,
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          lineItems: []
        },
        {
          id: 'cat-custom-contingency',
          name: 'Emergency Buffer',
          iconName: 'Shield',
          color: '#77756B',
          plannedAmount: 15000,
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          lineItems: []
        }
      ],
      tasks: [
        {
          id: 'task-bday-1',
          name: 'Confirm Final Cake & Guest RSVP',
          description: 'Finalize headcount for live counter prep',
          category: 'Catering',
          dueDate: '2026-11-15',
          originalDueDate: '2026-11-15',
          status: 'in_progress',
          priority: 'high',
          dependencies: []
        }
      ],
      quotes: [],
      priorities: [
        { id: 'pr-1', label: 'Gourmet Dinner', rank: 1, locked: true, description: 'Best culinary food' }
      ],
      protectedRequirements: ['Multi-Course Gourmet Dinner must remain protected'],
      activeSimulation: {
        activePreset: 'none',
        guestCountDelta: 0,
        dateDaysShift: 0,
        vendorIncreasePercent: 0
      },
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z'
    };

    test('Engine propagates headcount surge on custom categories correctly', () => {
      // Add +25 guests to birthday party (80 -> 105)
      // Lakeview Pavilion capacity is 100, so 105 must trigger venue capacity alert
      const sim = {
        activePreset: 'guest_increase' as const,
        guestCountDelta: 25,
        dateDaysShift: 0,
        vendorIncreasePercent: 0
      };

      const result = propagateRippleChanges(customBirthdayEvent, sim);

      assert.equal(result.venueCapacityWarning, true, 'Capacity warning triggered when 105 > 100');
      assert.equal(result.overCapacityCount, 5, '5 guests over capacity');
      assert.ok(result.affectedBudgetDelta > 0, 'Per-guest dinner cost increased');
      assert.equal(result.isOverBudget, true);
    });

    test('Trade-off scenarios NEVER reduce protected categories and NEVER produce negative values', () => {
      const overrun = 30000;
      const scenarios = calculateTradeoffScenarios(customBirthdayEvent, overrun);

      assert.equal(scenarios.length, 3);

      scenarios.forEach(scen => {
        // Must achieve real positive savings
        assert.ok(scen.savings > 0, 'Scenario must yield real positive savings');
        assert.ok(scen.revisedTotal < customBirthdayEvent.totalBudget + overrun);

        // Protected category 'cat-custom-dinner' must NEVER be reduced
        const dinnerChange = scen.changes.find(c => c.categoryId === 'cat-custom-dinner');
        assert.equal(dinnerChange, undefined, 'Protected dinner category was not cut');

        // Every revised category amount must be non-negative
        scen.changes.forEach(ch => {
          assert.ok(ch.revisedAmount >= 0, `Category ${ch.categoryName} must not be negative`);
          assert.ok(ch.delta <= 0, 'Deltas in trade-off scenarios must be non-positive reductions');
        });
      });
    });

    test('Actual scenario savings match real sum of line-item deltas', () => {
      const overrun = 25000;
      const scenarios = calculateTradeoffScenarios(customBirthdayEvent, overrun);

      scenarios.forEach(scen => {
        const sumDeltas = scen.changes.reduce((sum, ch) => sum + Math.abs(ch.delta), 0);
        assert.equal(scen.savings, sumDeltas, 'Reported savings must exactly equal sum of category reductions');
      });
    });
  });

  // 3. BUDGET CONSISTENCY & PROVENANCE INTEGRITY (Section 1 & 4)
  describe('Budget & Line-Item Consistency and Provenance', () => {
    test('calculateBudgetTotals accurately reflects line items when present', () => {
      const testEvent: CelebrationEvent = {
        id: 'evt-test-sync',
        name: 'Sync Test Gathering',
        occasion: 'Test',
        eventType: 'custom',
        location: 'Jaipur',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        totalBudget: 100000,
        guestCount: 50,
        contingencyReserve: 5000,
        readinessScore: 60,
        functions: [],
        categories: [
          {
            id: 'cat-1',
            name: 'Production & Lights',
            iconName: 'Sparkles',
            color: '#405B43',
            plannedAmount: 50000,
            committedAmount: 20000,
            paidAmount: 10000,
            isMustPreserve: false,
            lineItems: [
              {
                id: 'li-1',
                categoryId: 'cat-1',
                name: 'LED Screen Wall',
                unitType: 'fixed',
                plannedAmount: 30000,
                committedAmount: 20000,
                paidAmount: 10000,
                provenance: { source: 'quoted', verified: true, lastUpdated: '2026-10-26' }
              },
              {
                id: 'li-2',
                categoryId: 'cat-1',
                name: 'Ambient Warm Uplighting',
                unitType: 'fixed',
                plannedAmount: 20000,
                committedAmount: 0,
                paidAmount: 0,
                provenance: { source: 'user_entered', verified: true, lastUpdated: '2026-10-26' }
              }
            ]
          }
        ],
        tasks: [],
        quotes: [],
        priorities: [],
        protectedRequirements: [],
        activeSimulation: {
          activePreset: 'none',
          guestCountDelta: 0,
          dateDaysShift: 0,
          vendorIncreasePercent: 0
        },
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z'
      };

      const totals = calculateBudgetTotals(testEvent);
      assert.equal(totals.totalPlanned, 50000);
      assert.equal(totals.totalCommitted, 20000);
      assert.equal(totals.totalPaid, 10000);
      assert.equal(totals.remainingBudget, 50000);
    });

    test('Applying a trade-off scenario sets provenance to unverified by default', () => {
      const customEvent: CelebrationEvent = {
        id: 'evt-prov-test',
        name: 'Provenance Test Event',
        occasion: 'Test',
        eventType: 'wedding',
        location: 'Jaipur',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        totalBudget: 100000,
        guestCount: 100,
        contingencyReserve: 8000,
        readinessScore: 50,
        functions: [],
        categories: [
          {
            id: 'cat-decor',
            name: 'Decoration & Ambience',
            iconName: 'Flower2',
            color: '#C76F50',
            plannedAmount: 40000,
            committedAmount: 0,
            paidAmount: 0,
            isMustPreserve: false,
            lineItems: [
              {
                id: 'li-d1',
                categoryId: 'cat-decor',
                name: 'Floral Arch & Stage',
                unitType: 'fixed',
                plannedAmount: 40000,
                committedAmount: 0,
                paidAmount: 0,
                provenance: { source: 'quoted', verified: true, lastUpdated: '2026-10-26' }
              }
            ]
          }
        ],
        tasks: [],
        quotes: [],
        priorities: [],
        protectedRequirements: [],
        activeSimulation: { activePreset: 'none', guestCountDelta: 0, dateDaysShift: 0, vendorIncreasePercent: 0 },
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z'
      };

      const scenarios = calculateTradeoffScenarios(customEvent, 15000);
      const updated = applyScenarioToEvent(customEvent, scenarios[0]);

      const updatedDecor = updated.categories.find(c => c.id === 'cat-decor');
      assert.ok(updatedDecor);
      assert.ok(updatedDecor.lineItems[0].plannedAmount < 40000);
      // Section 1: Provenance of scenario-modified items must be unverified (verified: false)
      assert.equal(updatedDecor.lineItems[0].provenance.verified, false, 'Scenario estimate must be unverified by default');
    });
  });

  // 4. RFC 5545 iCALENDAR ESCAPING & TIME FORMATTING (Section 4)
  describe('Calendar ICS Export RFC 5545 Compliance', () => {
    test('ICS export correctly escapes special characters and includes DTSTART/DTEND', () => {
      const icsEvent: CelebrationEvent = {
        id: 'evt-ics-test',
        name: 'Rohan, Meera; Engagement & Gala',
        occasion: 'Engagement',
        eventType: 'engagement',
        location: 'Palace Hall, Jaipur',
        startDate: '2026-12-10',
        endDate: '2026-12-11',
        totalBudget: 120000,
        guestCount: 100,
        contingencyReserve: 10000,
        readinessScore: 60,
        functions: [
          {
            id: 'func-1',
            name: 'Ring Ceremony; High-Tea, & Sangeet',
            date: '2026-12-10',
            time: '04:00 PM - 08:30 PM',
            venueName: 'Palace Courtyard, Sector 5',
            venueCapacity: 120,
            guestCount: 100,
            description: 'Traditional exchange of rings; sweets & music.'
          }
        ],
        categories: [],
        tasks: [
          {
            id: 'task-1',
            name: 'Collect Rings, Jewelry; & Favors',
            description: 'Ensure safety vault collection\nReturn by noon',
            category: 'Logistics',
            dueDate: '2026-12-09',
            originalDueDate: '2026-12-09',
            status: 'in_progress',
            priority: 'critical',
            dependencies: []
          }
        ],
        quotes: [],
        priorities: [],
        protectedRequirements: [],
        activeSimulation: { activePreset: 'none', guestCountDelta: 0, dateDaysShift: 0, vendorIncreasePercent: 0 },
        createdAt: '2026-10-26T00:00:00Z',
        updatedAt: '2026-10-26T00:00:00Z'
      };

      const ics = exportIcsCalendar(icsEvent);

      // Verify VCALENDAR structure
      assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
      assert.ok(ics.endsWith('END:VCALENDAR'));

      // Verify DTSTART and DTEND are parsed correctly for 4:00 PM (16:00) - 8:30 PM (20:30)
      assert.ok(ics.includes('DTSTART:20261210T160000Z'), 'Parsed start time 4:00 PM as 16:00:00Z');
      assert.ok(ics.includes('DTEND:20261210T203000Z'), 'Parsed end time 8:30 PM as 20:30:00Z');

      // Verify RFC 5545 text escaping for commas, semicolons, and newlines
      assert.ok(ics.includes('Ring Ceremony\\; High-Tea\\, & Sangeet'), 'Semicolons and commas escaped');
      assert.ok(ics.includes('Ensure safety vault collection\\nReturn by noon'), 'Newlines escaped as \\n');
    });
  });
});
