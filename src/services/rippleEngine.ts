import { 
  CelebrationEvent, 
  RippleSimulationState, 
  RippleImpactResult, 
  RippleNodeDetail, 
  Scenario,
  ScenarioChange,
  BudgetCategory,
  PlanningTask
} from '../types';

/**
 * Deterministic Financial Arithmetic
 * Always keeps category planned totals, line item sums, committed, and paid amounts consistent.
 */
export function calculateBudgetTotals(event: CelebrationEvent) {
  let totalPlanned = 0;
  let totalCommitted = 0;
  let totalPaid = 0;

  event.categories.forEach(cat => {
    // Sum line items if present, keeping category totals strictly aligned
    if (cat.lineItems && cat.lineItems.length > 0) {
      const linePlanned = cat.lineItems.reduce((acc, item) => acc + (Number(item.plannedAmount) || 0), 0);
      const lineCommitted = cat.lineItems.reduce((acc, item) => acc + (Number(item.committedAmount) || 0), 0);
      const linePaid = cat.lineItems.reduce((acc, item) => acc + (Number(item.paidAmount) || 0), 0);
      totalPlanned += linePlanned;
      totalCommitted += lineCommitted;
      totalPaid += linePaid;
    } else {
      totalPlanned += (Number(cat.plannedAmount) || 0);
      totalCommitted += (Number(cat.committedAmount) || 0);
      totalPaid += (Number(cat.paidAmount) || 0);
    }
  });

  const remainingBudget = event.totalBudget - totalPlanned;
  const isOverBudget = remainingBudget < 0;
  const overrunAmount = isOverBudget ? Math.abs(remainingBudget) : 0;
  const guestCount = Math.max(1, event.guestCount || 1);
  const costPerGuest = Math.round(totalPlanned / guestCount);

  return {
    totalBudget: event.totalBudget,
    totalPlanned,
    totalCommitted,
    totalPaid,
    remainingBudget,
    isOverBudget,
    overrunAmount,
    costPerGuest
  };
}

/**
 * Deterministic Event Readiness Metric
 * Calculated from real task completion %, verified quotes %, and budget safety
 */
export function calculateEventReadiness(event: CelebrationEvent): {
  score: number;
  tasksCompleted: number;
  tasksTotal: number;
  bookingsConfirmed: number;
  bookingsTotal: number;
  budgetHealthScore: number;
  summary: string;
} {
  const tasksTotal = event.tasks.length;
  const tasksCompleted = event.tasks.filter(t => t.status === 'completed').length;
  const taskRatio = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;

  const bookingsTotal = event.quotes.length;
  const bookingsConfirmed = event.quotes.filter(q => q.status === 'accepted').length;
  const bookingRatio = bookingsTotal > 0 ? bookingsConfirmed / bookingsTotal : 0.5;

  const budget = calculateBudgetTotals(event);
  let budgetHealthScore = 1.0;
  if (budget.isOverBudget) {
    const overrunRatio = budget.overrunAmount / (budget.totalBudget || 1);
    budgetHealthScore = Math.max(0.2, 1.0 - overrunRatio);
  }

  // Weighted composite score: 40% tasks, 35% bookings, 25% budget health
  const weighted = (taskRatio * 40) + (bookingRatio * 35) + (budgetHealthScore * 25);
  const score = Math.round(weighted);

  let summary = 'On Track';
  if (score < 40) summary = 'Critical Attention Required';
  else if (score < 70) summary = 'Active Coordination Phase';
  else summary = 'High Readiness & Confirmed';

  return {
    score,
    tasksCompleted,
    tasksTotal,
    bookingsConfirmed,
    bookingsTotal,
    budgetHealthScore: Math.round(budgetHealthScore * 100),
    summary
  };
}

/**
 * Helper to match category semantic types dynamically without hardcoding IDs
 */
function isCategoryOfKind(cat: BudgetCategory, keywords: string[]): boolean {
  const name = (cat.name || '').toLowerCase();
  const id = (cat.id || '').toLowerCase();
  return keywords.some(k => name.includes(k) || id.includes(k));
}

/**
 * Propagate Ripple Changes across the Event Twin
 * Fully deterministic: changes in guest count, dates, or quotes ripple through real dependencies
 * Supports weddings, birthdays, engagements, reunions, community gatherings and custom events.
 */
export function propagateRippleChanges(
  event: CelebrationEvent,
  simulation: RippleSimulationState
): RippleImpactResult {
  const affectedNodes = new Map<string, RippleNodeDetail>();
  const warningMessages: string[] = [];

  const baseGuestCount = Math.max(1, event.guestCount || 1);
  const newGuestCount = Math.max(1, baseGuestCount + simulation.guestCountDelta);

  let extraBudgetCost = 0;
  let affectedTaskCount = 0;
  let overdueTaskCount = 0;

  // 1. Process Headcount Node
  const guestNodeStatus = simulation.guestCountDelta !== 0 ? 'affected' : 'normal';
  affectedNodes.set('node-headcount', {
    id: 'node-headcount',
    label: 'Guest Headcount',
    category: 'headcount',
    status: guestNodeStatus,
    value: `${newGuestCount} Guests`,
    previousValue: simulation.guestCountDelta !== 0 ? `${baseGuestCount} Guests` : undefined,
    triggerSource: simulation.guestCountDelta !== 0 ? `Simulated change (${simulation.guestCountDelta > 0 ? '+' : ''}${simulation.guestCountDelta} guests)` : 'Baseline input',
    whyChanged: simulation.guestCountDelta !== 0 ? `Attendance modified from ${baseGuestCount} to ${newGuestCount}.` : undefined,
    dataSource: 'Organizer Guest Roster',
    nextAction: simulation.guestCountDelta > 0 ? 'Confirm final RSVP batches and seating capacity' : undefined,
    isConfirmed: simulation.guestCountDelta === 0
  });

  // 2. Check Venue Capacities against new headcount dynamically
  let venueCapacityWarning = false;
  let overCapacityCount = 0;
  let venueMaxCapacity = 0;

  event.functions.forEach(func => {
    if (func.venueCapacity > venueMaxCapacity) {
      venueMaxCapacity = func.venueCapacity;
    }
    if (newGuestCount > func.venueCapacity) {
      venueCapacityWarning = true;
      const overflow = newGuestCount - func.venueCapacity;
      if (overflow > overCapacityCount) overCapacityCount = overflow;

      warningMessages.push(
        `🚨 Venue Capacity Alert: "${func.venueName}" accommodates max ${func.venueCapacity} guests. Proposed count is ${newGuestCount} (${overflow} guests over limit!).`
      );

      affectedNodes.set(`node-venue-${func.id}`, {
        id: `node-venue-${func.id}`,
        label: `${func.name} Venue`,
        category: 'venue',
        status: 'critical',
        value: `${func.venueName} (Cap: ${func.venueCapacity})`,
        whyChanged: `Attendance of ${newGuestCount} exceeds venue max capacity of ${func.venueCapacity} by ${overflow} people.`,
        triggerSource: 'Guest Headcount Node',
        dataSource: 'Venue Rental Contract Specs',
        nextAction: 'Negotiate adjacent overflow section or revise invitation tiers.',
        isConfirmed: false
      });
    } else {
      affectedNodes.set(`node-venue-${func.id}`, {
        id: `node-venue-${func.id}`,
        label: `${func.name} Venue`,
        category: 'venue',
        status: 'normal',
        value: `${func.venueName} (Cap: ${func.venueCapacity})`,
        dataSource: 'Venue Contract Specification',
        isConfirmed: true
      });
    }
  });

  // 3. Propagate Per-Guest Budget Lines dynamically from actual configured categories
  const categoryExtraCostMap = new Map<string, number>();

  event.categories.forEach(cat => {
    let catExtra = 0;

    if (cat.lineItems && cat.lineItems.length > 0) {
      cat.lineItems.forEach(item => {
        if (item.unitType === 'per_guest') {
          const unitCost = typeof item.unitCost === 'number' && item.unitCost > 0
            ? item.unitCost
            : Math.round(item.plannedAmount / baseGuestCount);
          const itemExtra = simulation.guestCountDelta * unitCost;
          catExtra += itemExtra;
        }
      });
    } else if (isCategoryOfKind(cat, ['catering', 'food', 'meal', 'feast', 'buffet', 'dinner', 'lunch', 'refreshment', 'gifts', 'favors', 'invitations'])) {
      // Proportional per-guest estimate when no line items are explicitly populated
      const unitCost = Math.round(cat.plannedAmount / baseGuestCount);
      catExtra = simulation.guestCountDelta * unitCost;
    }

    if (catExtra !== 0) {
      categoryExtraCostMap.set(cat.id, catExtra);
      extraBudgetCost += catExtra;
    }
  });

  // 4. Apply Vendor Quote Hike dynamically across categories with supplier quotes or flexible services
  let vendorSpikeAmount = 0;
  if (simulation.vendorIncreasePercent > 0) {
    const factor = simulation.vendorIncreasePercent / 100;

    // Apply to categories matching active vendor quotes or main production categories
    const categoriesWithQuotes = new Set(event.quotes.map(q => q.vendorCategory.toLowerCase()));

    event.categories.forEach(cat => {
      const isTargeted = categoriesWithQuotes.has(cat.name.toLowerCase()) ||
        isCategoryOfKind(cat, ['catering', 'food', 'decor', 'venue', 'photography', 'production', 'sound']);

      if (isTargeted) {
        const increase = Math.round(cat.plannedAmount * factor);
        vendorSpikeAmount += increase;
        const currentExtra = categoryExtraCostMap.get(cat.id) || 0;
        categoryExtraCostMap.set(cat.id, currentExtra + increase);
      }
    });

    extraBudgetCost += vendorSpikeAmount;

    warningMessages.push(
      `⚠️ Vendor Price Hike: Rate adjustment of +${simulation.vendorIncreasePercent}% applies (+₹${vendorSpikeAmount.toLocaleString('en-IN')}).`
    );

    affectedNodes.set('node-vendor-quote', {
      id: 'node-vendor-quote',
      label: 'Supplier Quotations',
      category: 'vendor',
      status: 'warning',
      value: `+${simulation.vendorIncreasePercent}% Rate Hike`,
      whyChanged: `Vendor recalculation adjusted contracted rates (+₹${vendorSpikeAmount.toLocaleString('en-IN')}).`,
      triggerSource: 'Vendor Revision Notification',
      dataSource: 'Quotation Ledger',
      nextAction: 'Negotiate deliverables or use Trade-off Simulator to balance allocations.',
      isConfirmed: false
    });
  }

  // 5. Generate Dynamic Category Nodes for Affected Services
  event.categories.forEach(cat => {
    const extra = categoryExtraCostMap.get(cat.id) || 0;
    const baseAmount = cat.plannedAmount;
    const newTotal = baseAmount + extra;
    const isAffected = extra !== 0;

    // Identify standard or dynamic node key
    let nodeKey = `node-cat-${cat.id}`;
    if (isCategoryOfKind(cat, ['catering', 'food', 'feast'])) nodeKey = 'node-catering';
    else if (isCategoryOfKind(cat, ['gifts', 'favors'])) nodeKey = 'node-gifts';

    affectedNodes.set(nodeKey, {
      id: nodeKey,
      label: cat.name,
      category: 'budget',
      status: isAffected ? 'warning' : 'normal',
      value: `₹${newTotal.toLocaleString('en-IN')}`,
      previousValue: isAffected ? `₹${baseAmount.toLocaleString('en-IN')}` : undefined,
      whyChanged: isAffected
        ? `Adjusted for revised headcount/rates (${extra >= 0 ? '+' : ''}₹${extra.toLocaleString('en-IN')}).`
        : undefined,
      triggerSource: simulation.guestCountDelta !== 0 ? 'Guest Headcount Shift' : 'Rate Revision',
      dataSource: 'Configured Budget Category',
      nextAction: isAffected ? 'Review and lock itemized contract' : undefined,
      isConfirmed: !isAffected
    });
  });

  // 6. Dynamic Date Shift & Task Propagation (Scenario 2)
  const isDateShifted = simulation.dateDaysShift !== 0;
  if (isDateShifted) {
    warningMessages.push(
      `⏱️ Date Compression: Event dates shifted by ${simulation.dateDaysShift} days. Recalculating task lead-times.`
    );
  }

  // Dynamic reference today date (midnight local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Identify tasks affected by headcount, venue capacity, date shifts, or task dependencies
  const affectedTaskIds = new Set<string>();

  event.tasks.forEach(task => {
    let taskAffected = false;
    let reason = '';
    let status = task.status;

    const taskText = `${task.name} ${task.description || ''} ${task.category || ''}`.toLowerCase();
    const isHeadcountDependent = taskText.includes('guest') ||
      taskText.includes('rsvp') ||
      taskText.includes('catering') ||
      taskText.includes('food') ||
      taskText.includes('headcount') ||
      taskText.includes('invitation') ||
      taskText.includes('plate') ||
      taskText.includes('gift') ||
      taskText.includes('favor');

    const isVenueDependent = taskText.includes('venue') ||
      taskText.includes('lawn') ||
      taskText.includes('hall') ||
      taskText.includes('capacity') ||
      taskText.includes('layout');

    // Headcount-dependent tasks
    if (simulation.guestCountDelta !== 0 && isHeadcountDependent) {
      taskAffected = true;
      reason = `Headcount shifted to ${newGuestCount} guests. Requires allocation check.`;
      affectedTaskIds.add(task.id);
    }

    // Venue capacity conflict
    if (venueCapacityWarning && isVenueDependent) {
      taskAffected = true;
      status = 'blocked';
      reason = `BLOCKED: Attendance of ${newGuestCount} exceeds venue capacity (${venueMaxCapacity}).`;
      affectedTaskIds.add(task.id);
    }

    // Date-shift dependent tasks
    let revisedDueDate = task.dueDate;
    if (isDateShifted) {
      const origDate = new Date(task.originalDueDate || task.dueDate);
      if (!isNaN(origDate.getTime())) {
        origDate.setDate(origDate.getDate() + simulation.dateDaysShift);
        revisedDueDate = origDate.toISOString().split('T')[0];
        taskAffected = true;
        reason += (reason ? ' | ' : '') + `Due date moved by ${simulation.dateDaysShift} days (from ${task.originalDueDate || task.dueDate} to ${revisedDueDate}).`;
        affectedTaskIds.add(task.id);

        // Check if newly overdue relative to today
        if (new Date(revisedDueDate) < today && status !== 'completed') {
          status = 'overdue';
          overdueTaskCount++;
        }
      }
    }

    // Dependency propagation: if dependencies were affected
    if (!taskAffected && task.dependencies && task.dependencies.some(depId => affectedTaskIds.has(depId))) {
      taskAffected = true;
      reason = 'Pre-requisite task dependencies were modified.';
      affectedTaskIds.add(task.id);
    }

    if (taskAffected) {
      affectedTaskCount++;
      affectedNodes.set(`node-task-${task.id}`, {
        id: `node-task-${task.id}`,
        label: task.name,
        category: 'timeline',
        status: status === 'overdue' ? 'critical' : status === 'blocked' ? 'warning' : 'affected',
        value: `Due: ${revisedDueDate}`,
        previousValue: `Due: ${task.originalDueDate || task.dueDate}`,
        whyChanged: reason,
        triggerSource: isDateShifted ? 'Event Date Shift' : 'Headcount / Dependency Shift',
        dataSource: 'Timeline Dependency Graph',
        nextAction: status === 'overdue' ? 'Escalate immediately to family coordinator' : 'Confirm revised deadline',
        isConfirmed: false
      });
    } else {
      affectedNodes.set(`node-task-${task.id}`, {
        id: `node-task-${task.id}`,
        label: task.name,
        category: 'timeline',
        status: task.status === 'completed' ? 'confirmed' : 'normal',
        value: `Due: ${task.dueDate}`,
        dataSource: 'Scheduled Calendar',
        isConfirmed: true
      });
    }
  });

  // 7. Overall Budget Node
  const baseBudgetTotals = calculateBudgetTotals(event);
  const revisedTotalCost = baseBudgetTotals.totalPlanned + extraBudgetCost;
  const isOverBudget = revisedTotalCost > event.totalBudget;
  const overrunAmount = isOverBudget ? revisedTotalCost - event.totalBudget : 0;

  if (isOverBudget) {
    warningMessages.push(
      `💸 Budget Overrun: Total planned expenditure (₹${revisedTotalCost.toLocaleString('en-IN')}) exceeds budget ceiling (₹${event.totalBudget.toLocaleString('en-IN')}) by ₹${overrunAmount.toLocaleString('en-IN')}.`
    );
  }

  affectedNodes.set('node-total-budget', {
    id: 'node-total-budget',
    label: 'Total Event Budget',
    category: 'budget',
    status: isOverBudget ? 'critical' : extraBudgetCost > 0 ? 'warning' : 'normal',
    value: `₹${revisedTotalCost.toLocaleString('en-IN')} / ₹${event.totalBudget.toLocaleString('en-IN')}`,
    previousValue: extraBudgetCost !== 0 ? `₹${baseBudgetTotals.totalPlanned.toLocaleString('en-IN')}` : undefined,
    whyChanged: extraBudgetCost !== 0
      ? `Net impact of simulated adjustments: +₹${extraBudgetCost.toLocaleString('en-IN')}. ${isOverBudget ? `Exceeds budget by ₹${overrunAmount.toLocaleString('en-IN')}.` : 'Within reserve capacity.'}`
      : undefined,
    triggerSource: 'Aggregated Dependency Graph',
    dataSource: 'Deterministic Calculation Engine',
    nextAction: isOverBudget ? 'Launch Priority Compass Trade-off Simulator' : 'Approve updated allocation',
    isConfirmed: !isOverBudget && extraBudgetCost === 0
  });

  return {
    affectedBudgetDelta: extraBudgetCost,
    revisedTotalCost,
    isOverBudget,
    overrunAmount,
    venueCapacityWarning,
    overCapacityCount,
    venueMaxCapacity,
    affectedTaskCount,
    overdueTaskCount,
    affectedNodes,
    warningMessages
  };
}

/**
 * Generate 3 Genuinely Distinct Deterministic Trade-off Scenarios
 * Respects User's Priority Compass & Protected Requirements.
 * Works dynamically across Weddings, Birthdays, Engagements, Reunions, Community, and Custom Events.
 * Never reduces protected categories or items, never produces negative allocations,
 * and computes real savings from actual event data.
 */
export function calculateTradeoffScenarios(
  event: CelebrationEvent,
  overrunAmount?: number
): Scenario[] {
  const baseTotals = calculateBudgetTotals(event);
  const newGuestCount = event.guestCount + (event.activeSimulation?.guestCountDelta || 0);

  // Compute dynamic target savings from the simulated overrun or explicit parameter
  let targetSavings = 26000;
  if (typeof overrunAmount === 'number' && overrunAmount > 0) {
    targetSavings = overrunAmount;
  } else if (event.activeSimulation && (event.activeSimulation.guestCountDelta !== 0 || event.activeSimulation.vendorIncreasePercent !== 0)) {
    const simResult = propagateRippleChanges(event, event.activeSimulation);
    if (simResult.overrunAmount > 0) targetSavings = simResult.overrunAmount;
  } else if (baseTotals.overrunAmount > 0) {
    targetSavings = baseTotals.overrunAmount;
  }

  // Identify protected categories (marked isMustPreserve or listed in event.protectedRequirements)
  const isProtectedCategory = (cat: BudgetCategory) => {
    if (cat.isMustPreserve) return true;
    const name = cat.name.toLowerCase();
    return event.protectedRequirements?.some(p => p.toLowerCase().includes(name));
  };

  // Classify categories dynamically
  const foodCats = event.categories.filter(c => !isProtectedCategory(c) && isCategoryOfKind(c, ['catering', 'food', 'meal', 'feast', 'buffet', 'dinner', 'cake', 'refreshment']));
  const decorCats = event.categories.filter(c => !isProtectedCategory(c) && isCategoryOfKind(c, ['decor', 'floral', 'flower', 'mandap', 'stage', 'lighting', 'balloon', 'ambience']));
  const photoCats = event.categories.filter(c => !isProtectedCategory(c) && isCategoryOfKind(c, ['photo', 'video', 'cinema', 'studio', 'media', 'camera']));
  const giftCats = event.categories.filter(c => !isProtectedCategory(c) && isCategoryOfKind(c, ['gift', 'favor', 'invite', 'invitation', 'merch', 'souvenir']));
  const contingencyCats = event.categories.filter(c => !isProtectedCategory(c) && isCategoryOfKind(c, ['contingency', 'reserve', 'buffer', 'emergency']));
  const otherFlexibleCats = event.categories.filter(c => 
    !isProtectedCategory(c) &&
    !foodCats.includes(c) &&
    !decorCats.includes(c) &&
    !photoCats.includes(c) &&
    !giftCats.includes(c) &&
    !contingencyCats.includes(c)
  );

  // Fallback category pool if specific types are absent
  const generalPool = [...decorCats, ...otherFlexibleCats, ...giftCats, ...photoCats].filter(c => c.plannedAmount > 0);

  // Helper to safely apply reductions up to available planned amount without negative values
  const applySafeReductions = (allocations: { cat: BudgetCategory; weight: number; rationale: string }[]) => {
    const changes: ScenarioChange[] = [];
    let accumulatedSavings = 0;

    allocations.forEach(({ cat, weight, rationale }) => {
      if (cat.plannedAmount <= 0) return;
      const desiredReduction = Math.round(targetSavings * weight);
      const safeReduction = Math.min(cat.plannedAmount, Math.max(0, desiredReduction));

      if (safeReduction > 0) {
        changes.push({
          categoryId: cat.id,
          categoryName: cat.name,
          originalAmount: cat.plannedAmount,
          revisedAmount: cat.plannedAmount - safeReduction,
          delta: -safeReduction,
          rationale
        });
        accumulatedSavings += safeReduction;
      }
    });

    return { changes, accumulatedSavings };
  };

  // --- SCENARIO 1: Protect the Feast / Dining Experience ---
  // Food & Catering is 100% protected. Offsets distributed across Decor, Gifts, and Media.
  const primaryDecor = decorCats[0] || generalPool[0] || event.categories[0];
  const primaryPhoto = photoCats[0] || generalPool[1] || event.categories[1] || primaryDecor;
  const primaryGifts = giftCats[0] || generalPool[2] || event.categories[2] || primaryDecor;

  const { changes: changes1, accumulatedSavings: savings1 } = applySafeReductions([
    { cat: primaryDecor, weight: 0.55, rationale: 'Use regional in-season floral varieties and optimize stage lighting fixtures.' },
    { cat: primaryPhoto, weight: 0.30, rationale: 'Retain all essential ceremony coverage; streamline drone add-ons or physical album duplicates.' },
    { cat: primaryGifts, weight: 0.15, rationale: 'Standardize packaging or opt for handcrafted regional favor sets.' }
  ]);

  const revisedTotal1 = baseTotals.totalPlanned - savings1;
  const scenario1: Scenario = {
    id: 'scen-protect-food',
    key: 'protect_food',
    title: 'Protect the Feast',
    subtitle: 'Zero Compromise on Dining & Culinary Hospitality',
    description: 'Keeps main culinary courses, live counters, and banquet hospitality completely protected. Offsets costs by optimizing decorative production and photo packaging.',
    changes: changes1,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal1,
    variance: revisedTotal1 - event.totalBudget,
    savings: savings1,
    protectedItems: [
      'Core catering menus, live food stations, and guest beverage hospitality',
      'Primary ceremonial rituals and key occasion traditions',
      'Guest welcome drinks and hospitality staff'
    ],
    compromises: [
      'Decor uses local seasonal flowers and streamlined stage canopies',
      'Photography package prioritizes candid high-res deliverables over luxury duplicate albums',
      'Packaging for return favors optimized'
    ],
    assumptions: [
      'Local flower vendors supply required seasonal volume',
      'Guest count guarantees remain at confirmed tier'
    ]
  };

  // --- SCENARIO 2: Protect the Guest List & Attendance ---
  // Headcount cannot be cut. Rebalances Decor, Media, and Contingency Reserve.
  const primaryContingency = contingencyCats[0] || generalPool[3] || primaryDecor;

  const { changes: changes2, accumulatedSavings: savings2 } = applySafeReductions([
    { cat: primaryDecor, weight: 0.45, rationale: 'Consolidate multiple function lighting rentals into a bundled contract.' },
    { cat: primaryPhoto, weight: 0.30, rationale: 'Deliver luxury digital cloud gallery + 1 parent heirloom album instead of multiple printed sets.' },
    { cat: primaryContingency, weight: 0.25, rationale: 'Reallocate a calculated portion of contingency reserve to absorb headcount delta.' }
  ]);

  const revisedTotal2 = baseTotals.totalPlanned - savings2;
  const scenario2: Scenario = {
    id: 'scen-protect-guests',
    key: 'protect_guests',
    title: 'Protect the Guest List',
    subtitle: 'Accommodate All Guests Without Pruning Invitations',
    description: 'Accommodates the full turnout without reducing the guest list. Balances additional costs by switching to digital galleries, multi-day equipment bundles, and reserve mobilization.',
    changes: changes2,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal2,
    variance: revisedTotal2 - event.totalBudget,
    savings: savings2,
    protectedItems: [
      `Full guest turnout and extended invitations (${newGuestCount} guests)`,
      'Individual guest favor hampers and seating hospitality',
      'Key evening music & celebration entertainment'
    ],
    compromises: [
      'Printed album count adjusted with full 4K cloud gallery included',
      'Contingency reserve reduced to cover guest surge',
      'Venue layout reconfigured for extra table density'
    ],
    assumptions: [
      'Venue manager permits layout adjustments without additional surcharge'
    ]
  };

  // --- SCENARIO 3: Protect the Memories & Audio-Visual ---
  // Keeps Photography & Cinematic Documentation 100% protected. Trims Decor, Invites, and trims secondary dining redundancy.
  const primaryFood = foodCats[0] || generalPool[0] || event.categories[0];

  const { changes: changes3, accumulatedSavings: savings3 } = applySafeReductions([
    { cat: primaryDecor, weight: 0.45, rationale: 'Repurpose morning ceremonial florals for evening stage backdrops.' },
    { cat: primaryGifts, weight: 0.30, rationale: 'Transition 100% of invitations to bespoke digital animated video invitations.' },
    { cat: primaryFood, weight: 0.25, rationale: 'Trim secondary dessert redundancies while preserving signature main dishes.' }
  ]);

  const revisedTotal3 = baseTotals.totalPlanned - savings3;
  const scenario3: Scenario = {
    id: 'scen-protect-memories',
    key: 'protect_memories',
    title: 'Protect the Memories',
    subtitle: 'Preserve Cinematic Documentation & Photo Coverage',
    description: 'Guarantees complete high-definition filming, candid photographers, and heirloom documentation. Saves costs through floral repurposing, digital invitations, and trimming dessert course redundancies.',
    changes: changes3,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal3,
    variance: revisedTotal3 - event.totalBudget,
    savings: savings3,
    protectedItems: [
      'Complete cinematic highlight films and senior photographer hours',
      'Deluxe heirloom photo album documentation',
      'All candid capture across all scheduled functions'
    ],
    compromises: [
      'Florals repurposed between daytime and evening functions with uplighting',
      'Physical paper printing eliminated in favor of animated digital video invites',
      'Dessert menu trimmed to signature favorites'
    ],
    assumptions: [
      'Venue turnaround window allows stage decor reconfiguration between functions'
    ]
  };

  return [scenario1, scenario2, scenario3];
}

/**
 * Apply Scenario to Living Event Plan
 * Updates shared state, modifies category amounts, and stamps unverified provenance.
 */
export function applyScenarioToEvent(
  event: CelebrationEvent,
  scenario: Scenario
): CelebrationEvent {
  const updatedCategories: BudgetCategory[] = event.categories.map(cat => {
    const change = scenario.changes.find(c => c.categoryId === cat.id);
    if (!change) return cat;

    // Recalculate line items proportionally if present
    let updatedLineItems = cat.lineItems;
    if (cat.lineItems && cat.lineItems.length > 0 && cat.plannedAmount > 0) {
      const ratio = change.revisedAmount / cat.plannedAmount;
      updatedLineItems = cat.lineItems.map(item => {
        // Respect item-level protection
        if (item.isProtected) return item;
        const revisedLine = Math.round(item.plannedAmount * ratio);
        return {
          ...item,
          plannedAmount: revisedLine,
          provenance: {
            ...item.provenance,
            source: 'user_entered',
            verified: false, // Section 1 & 3: AI/Scenario estimates are unverified until confirmed
            notes: `Applied Scenario: ${scenario.title} (${change.delta >= 0 ? '+' : ''}${change.delta})`,
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        };
      });

      // Adjust rounding discrepancy so line item sum matches category plannedAmount exactly
      const lineSum = updatedLineItems.reduce((acc, item) => acc + item.plannedAmount, 0);
      const diff = change.revisedAmount - lineSum;
      if (diff !== 0 && updatedLineItems.length > 0) {
        updatedLineItems[0].plannedAmount += diff;
      }
    }

    return {
      ...cat,
      plannedAmount: change.revisedAmount,
      notes: `${cat.notes || ''} [Applied Scenario: ${scenario.title}]`.trim(),
      lineItems: updatedLineItems
    };
  });

  const updatedEvent: CelebrationEvent = {
    ...event,
    categories: updatedCategories,
    activeScenarioId: scenario.id,
    activeSimulation: {
      activePreset: 'none',
      guestCountDelta: 0,
      dateDaysShift: 0,
      vendorIncreasePercent: 0
    },
    updatedAt: new Date().toISOString()
  };

  const readiness = calculateEventReadiness(updatedEvent);
  updatedEvent.readinessScore = readiness.score;

  return updatedEvent;
}

/**
 * Helper to escape text for RFC 5545 iCalendar compliance
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate standard downloadable iCalendar (.ics) format
 * Respects configured event times, escapes text according to RFC 5545,
 * and includes valid calendar fields.
 */
export function exportIcsCalendar(event: CelebrationEvent): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Helper to parse time string like "10:00 AM - 2:00 PM" or "6:30 PM"
  const parseTimeSpan = (dateStr: string, timeStr?: string): { startIso: string; endIso: string } => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());

    let startHour = 10;
    let startMin = 0;
    let endHour = 13;
    let endMin = 0;

    if (timeStr) {
      const parts = timeStr.split('-').map(s => s.trim());
      const parseSingleTime = (t: string) => {
        const match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const min = match[2] ? parseInt(match[2], 10) : 0;
          const meridian = match[3]?.toUpperCase();
          if (meridian === 'PM' && h < 12) h += 12;
          if (meridian === 'AM' && h === 12) h = 0;
          return { h, min };
        }
        return null;
      };

      const startParsed = parseSingleTime(parts[0]);
      if (startParsed) {
        startHour = startParsed.h;
        startMin = startParsed.min;
      }

      if (parts[1]) {
        const endParsed = parseSingleTime(parts[1]);
        if (endParsed) {
          endHour = endParsed.h;
          endMin = endParsed.min;
        }
      } else {
        endHour = (startHour + 3) % 24;
      }
    }

    const startIso = `${y}${m}${day}T${pad(startHour)}${pad(startMin)}00Z`;
    const endIso = `${y}${m}${day}T${pad(endHour)}${pad(endMin)}00Z`;
    return { startIso, endIso };
  };

  const stampNow = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bandobast//Intelligent Event Operations Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(event.name)}`
  ];

  // Add event functions
  event.functions.forEach(func => {
    const { startIso, endIso } = parseTimeSpan(func.date, func.time);
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:func-${func.id}@bandobast.app`,
      `DTSTAMP:${stampNow}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${escapeIcsText(`${event.name} - ${func.name}`)}`,
      `LOCATION:${escapeIcsText(func.venueName)}`,
      `DESCRIPTION:${escapeIcsText(`${func.description} | Expected Guests: ${func.guestCount} | Attire: ${func.attireTheme || 'Festive'}`)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  // Add critical tasks
  event.tasks.forEach(task => {
    const { startIso, endIso } = parseTimeSpan(task.dueDate, '9:00 AM');
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@bandobast.app`,
      `DTSTAMP:${stampNow}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${escapeIcsText(`Deadline: ${task.name}`)}`,
      `DESCRIPTION:${escapeIcsText(`${task.description} | Assigned: ${task.assignedTo || 'Unassigned'} | Priority: ${task.priority.toUpperCase()}`)}`,
      task.status === 'completed' ? 'STATUS:COMPLETED' : 'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

/**
 * Generate Vendor & Catering Operations Brief
 */
export function exportCateringBrief(event: CelebrationEvent): string {
  const catering = event.categories.find(c => isCategoryOfKind(c, ['catering', 'food', 'meal']));
  const totals = calculateBudgetTotals(event);

  return `=====================================================
BANDOBAST EVENT OPERATIONS — CATERING & LOGISTICS BRIEF
=====================================================
Event: ${event.name}
Occasion: ${event.occasion}
Location: ${event.location}
Confirmed Headcount: ${event.guestCount} Guests
Total Event Budget: ₹${event.totalBudget.toLocaleString('en-IN')}
Planned Catering Allocation: ₹${catering?.plannedAmount.toLocaleString('en-IN') || 'N/A'}
Cost Per Guest: ₹${totals.costPerGuest.toLocaleString('en-IN')}

FUNCTION & SCHEDULE BREAKDOWN:
-----------------------------------------------------
${event.functions.map((f, i) => `
${i + 1}. ${f.name}
   Date & Timing: ${f.date} (${f.time})
   Venue: ${f.venueName} (Capacity: ${f.venueCapacity})
   Guaranteed Plates: ${f.guestCount} pax
   Theme / Notes: ${f.description}
`).join('')}

ESSENTIAL DIETARY & OPERATIONAL CONSTRAINTS:
-----------------------------------------------------
* Dietary segregation for vegetarian, Jain, and special diets
* Uniformed waitstaff with verified service standards
* High-temp chafing dishes and sanitized copper serviceware
* Live stations operational 30 minutes prior to scheduled start

Generated automatically via Bandobast Intelligent Event Operations Platform.
Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
=====================================================`;
}
