import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_WEDDING } from '../src/data/sampleCelebration';
import { 
  calculateBudgetTotals, 
  calculateEventReadiness, 
  propagateRippleChanges, 
  calculateTradeoffScenarios, 
  applyScenarioToEvent,
  exportIcsCalendar
} from '../src/services/rippleEngine';

describe('Bandobast Deterministic Financial & Ripple Tests', () => {
  test('1. Accurate budget totals and remaining balance', () => {
    const totals = calculateBudgetTotals(SAMPLE_WEDDING);
    assert.equal(totals.totalBudget, 300000);
    assert.equal(totals.totalPlanned, 300000);
    assert.equal(totals.remainingBudget, 0);
    assert.equal(totals.isOverBudget, false);
    assert.equal(totals.costPerGuest, Math.round(300000 / 180));
  });

  test('2. Event readiness calculation from tasks and confirmed bookings', () => {
    const readiness = calculateEventReadiness(SAMPLE_WEDDING);
    assert.ok(readiness.score >= 0 && readiness.score <= 100);
    assert.ok(readiness.tasksTotal > 0);
    assert.ok(readiness.bookingsTotal > 0);
  });

  test('3. Scenario 1: Guest count increase (+40 guests to 220) propagates correctly', () => {
    const sim = {
      activePreset: 'guest_increase' as const,
      guestCountDelta: 40,
      dateDaysShift: 0,
      vendorIncreasePercent: 0
    };

    const result = propagateRippleChanges(SAMPLE_WEDDING, sim);
    
    // Headcount node checks
    const headcountNode = result.affectedNodes.get('node-headcount');
    assert.ok(headcountNode);
    assert.equal(headcountNode.value, '220 Guests');

    // Venue capacity check: Heritage Lawns capacity is 200, 220 guests is over capacity!
    assert.equal(result.venueCapacityWarning, true);
    assert.ok(result.overCapacityCount >= 20, 'At least 20 guests over venue capacity');

    // Budget check: Extra per-guest catering & gift costs
    assert.ok(result.affectedBudgetDelta > 0);
    assert.ok(result.isOverBudget);
    assert.ok(result.overrunAmount > 0);
  });

  test('4. Scenario 2: Date shift (-14 days earlier) identifies compressed task deadlines', () => {
    const sim = {
      activePreset: 'early_date' as const,
      guestCountDelta: 0,
      dateDaysShift: -14,
      vendorIncreasePercent: 0
    };

    const result = propagateRippleChanges(SAMPLE_WEDDING, sim);
    assert.ok(result.affectedTaskCount > 0);
    assert.ok(result.warningMessages.some(m => m.includes('Date Compression')));
  });

  test('5. Scenario 3: Vendor quote hike (+20%) triggers budget overrun', () => {
    const sim = {
      activePreset: 'vendor_increase' as const,
      guestCountDelta: 0,
      dateDaysShift: 0,
      vendorIncreasePercent: 20
    };

    const result = propagateRippleChanges(SAMPLE_WEDDING, sim);
    assert.ok(result.affectedBudgetDelta > 0);
    assert.ok(result.isOverBudget);
    assert.ok(result.warningMessages.some(m => m.includes('Vendor Price Hike')));
  });

  test('6. Priority Compass: Generates 3 genuinely distinct trade-off scenarios', () => {
    const overrun = 26000;
    const scenarios = calculateTradeoffScenarios(SAMPLE_WEDDING, overrun);
    
    assert.equal(scenarios.length, 3);
    assert.equal(scenarios[0].key, 'protect_food');
    assert.equal(scenarios[1].key, 'protect_guests');
    assert.equal(scenarios[2].key, 'protect_memories');

    // Scenario 1 protects catering completely
    const scen1CateringChange = scenarios[0].changes.find(c => c.categoryId === 'cat-catering');
    assert.equal(scen1CateringChange, undefined, 'Catering must NOT be cut in Protect Food scenario');

    // All scenarios achieve positive savings
    scenarios.forEach(scen => {
      assert.ok(scen.savings >= 25000);
      assert.ok(scen.protectedItems.length > 0);
      assert.ok(scen.compromises.length > 0);
      assert.ok(scen.assumptions.length > 0);
    });
  });

  test('7. Applying a scenario updates living state and retains provenance', () => {
    const overrun = 26000;
    const scenarios = calculateTradeoffScenarios(SAMPLE_WEDDING, overrun);
    const updatedEvent = applyScenarioToEvent(SAMPLE_WEDDING, scenarios[0]);

    assert.equal(updatedEvent.activeScenarioId, scenarios[0].id);
    assert.equal(updatedEvent.activeSimulation.activePreset, 'none');

    // Decor category should be reduced
    const updatedDecor = updatedEvent.categories.find(c => c.id === 'cat-decor');
    const origDecor = SAMPLE_WEDDING.categories.find(c => c.id === 'cat-decor');
    assert.ok(updatedDecor!.plannedAmount < origDecor!.plannedAmount);

    // Provenance of updated items should record user confirmation via scenario
    assert.ok(updatedDecor!.lineItems[0].provenance.notes?.includes('Applied Scenario'));
  });

  test('8. Calendar .ics export generates valid format', () => {
    const ics = exportIcsCalendar(SAMPLE_WEDDING);
    assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('SUMMARY:Aarav & Meera\'s Wedding Celebration - Vedic Wedding & Mandap Pheras'));
    assert.ok(ics.endsWith('END:VCALENDAR'));
  });
});
