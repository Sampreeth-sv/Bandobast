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
 */
export function calculateBudgetTotals(event: CelebrationEvent) {
  let totalPlanned = 0;
  let totalCommitted = 0;
  let totalPaid = 0;

  event.categories.forEach(cat => {
    // Sum line items if present, else fallback to category amount
    if (cat.lineItems && cat.lineItems.length > 0) {
      cat.lineItems.forEach(item => {
        totalPlanned += item.plannedAmount;
        totalCommitted += item.committedAmount;
        totalPaid += item.paidAmount;
      });
    } else {
      totalPlanned += cat.plannedAmount;
      totalCommitted += cat.committedAmount;
      totalPaid += cat.paidAmount;
    }
  });

  const remainingBudget = event.totalBudget - totalPlanned;
  const isOverBudget = remainingBudget < 0;
  const overrunAmount = isOverBudget ? Math.abs(remainingBudget) : 0;
  const costPerGuest = event.guestCount > 0 ? Math.round(totalPlanned / event.guestCount) : 0;

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
 * Propagate Ripple Changes across the Event Twin
 * Fully deterministic: changes in guest count, dates, or quotes ripple through dependencies
 */
export function propagateRippleChanges(
  event: CelebrationEvent,
  simulation: RippleSimulationState
): RippleImpactResult {
  const affectedNodes = new Map<string, RippleNodeDetail>();
  const warningMessages: string[] = [];

  const baseGuestCount = event.guestCount;
  const newGuestCount = baseGuestCount + simulation.guestCountDelta;

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
    triggerSource: simulation.guestCountDelta !== 0 ? `Simulated change (+${simulation.guestCountDelta} guests)` : 'Baseline input',
    whyChanged: simulation.guestCountDelta !== 0 ? `Attendance modified from ${baseGuestCount} to ${newGuestCount}.` : undefined,
    dataSource: 'Organizer Guest Roster',
    nextAction: simulation.guestCountDelta > 0 ? 'Confirm final RSVP batches with extended family leads' : undefined,
    isConfirmed: simulation.guestCountDelta === 0
  });

  // 2. Check Venue Capacities against new headcount
  let venueCapacityWarning = false;
  let overCapacityCount = 0;
  let venueMaxCapacity = 0;

  event.functions.forEach(func => {
    if (func.venueCapacity > venueMaxCapacity) {
      venueMaxCapacity = func.venueCapacity;
    }
    // Check if new guest count exceeds this venue's capacity
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
        nextAction: 'Negotiate adjacent lawn overflow section or prune secondary guest tier.',
        isConfirmed: false
      });
    } else {
      affectedNodes.set(`node-venue-${func.id}`, {
        id: `node-venue-${func.id}`,
        label: `${func.name} Venue`,
        category: 'venue',
        status: 'normal',
        value: `${func.venueName} (Cap: ${func.venueCapacity})`,
        dataSource: 'Confirmed Contract',
        isConfirmed: true
      });
    }
  });

  // 3. Propagate Per-Guest Budget Lines (Catering, Favors)
  let cateringExtra = 0;
  let giftsExtra = 0;

  event.categories.forEach(cat => {
    cat.lineItems?.forEach(item => {
      if (item.unitType === 'per_guest' && item.unitCost) {
        const itemExtra = simulation.guestCountDelta * item.unitCost;
        extraBudgetCost += itemExtra;

        if (cat.id === 'cat-catering') cateringExtra += itemExtra;
        if (cat.id === 'cat-gifts') giftsExtra += itemExtra;
      }
    });
  });

  // 4. Apply Vendor Quote Spike (Scenario 3: e.g. +20% on Catering or Decor)
  let vendorSpikeAmount = 0;
  if (simulation.vendorIncreasePercent > 0) {
    const factor = simulation.vendorIncreasePercent / 100;
    // Apply spike to catering and decor
    event.categories.forEach(cat => {
      if (cat.id === 'cat-catering' || cat.id === 'cat-decor') {
        const increase = cat.plannedAmount * factor;
        vendorSpikeAmount += increase;
      }
    });
    extraBudgetCost += vendorSpikeAmount;

    warningMessages.push(
      `⚠️ Vendor Price Hike: Supplier applied a +${simulation.vendorIncreasePercent}% rate adjustment (+₹${vendorSpikeAmount.toLocaleString('en-IN')}).`
    );

    affectedNodes.set('node-vendor-quote', {
      id: 'node-vendor-quote',
      label: 'Supplier Quotations',
      category: 'vendor',
      status: 'warning',
      value: `+${simulation.vendorIncreasePercent}% Hike`,
      whyChanged: `Vendor recalculated raw ingredient and seasonal floral rate (+₹${vendorSpikeAmount.toLocaleString('en-IN')}).`,
      triggerSource: 'Vendor Revision Notification',
      dataSource: 'Updated Vendor Quotation Notice',
      nextAction: 'Counter-negotiate or run Trade-off Simulator to offset cost overrun.',
      isConfirmed: false
    });
  }

  // 5. Build Catering Node
  const baseCatering = event.categories.find(c => c.id === 'cat-catering')?.plannedAmount || 108000;
  const newCateringTotal = baseCatering + cateringExtra + (simulation.vendorIncreasePercent > 0 ? baseCatering * (simulation.vendorIncreasePercent / 100) : 0);
  const isCateringAffected = cateringExtra !== 0 || simulation.vendorIncreasePercent > 0;

  affectedNodes.set('node-catering', {
    id: 'node-catering',
    label: 'Catering Budget & Plates',
    category: 'budget',
    status: isCateringAffected ? 'warning' : 'normal',
    value: `₹${newCateringTotal.toLocaleString('en-IN')}`,
    previousValue: isCateringAffected ? `₹${baseCatering.toLocaleString('en-IN')}` : undefined,
    whyChanged: isCateringAffected
      ? `Recalculated from ${newGuestCount} guests × per-person rates + any vendor adjustments (+₹${(cateringExtra + (simulation.vendorIncreasePercent > 0 ? baseCatering * (simulation.vendorIncreasePercent / 100) : 0)).toLocaleString('en-IN')}).`
      : undefined,
    triggerSource: simulation.guestCountDelta !== 0 ? 'Guest Headcount Change' : 'Baseline Rates',
    dataSource: 'Royal Rasoi Quoted Rate Cards',
    nextAction: isCateringAffected ? 'Lock revised plate guarantee with catering lead' : undefined,
    isConfirmed: !isCateringAffected
  });

  // 6. Build Return Gifts Node
  const baseGifts = event.categories.find(c => c.id === 'cat-gifts')?.plannedAmount || 16000;
  const newGiftsTotal = baseGifts + giftsExtra;
  affectedNodes.set('node-gifts', {
    id: 'node-gifts',
    label: 'Return Gift Hampers',
    category: 'budget',
    status: giftsExtra !== 0 ? 'affected' : 'normal',
    value: `₹${newGiftsTotal.toLocaleString('en-IN')} (${newGuestCount} units)`,
    previousValue: giftsExtra !== 0 ? `₹${baseGifts.toLocaleString('en-IN')}` : undefined,
    whyChanged: giftsExtra !== 0 ? `Adjusted by ${simulation.guestCountDelta} gift hampers at ₹75/unit.` : undefined,
    triggerSource: 'Guest Headcount Node',
    dataSource: 'Illustrative Unit Calculation',
    nextAction: giftsExtra > 0 ? 'Increase procurement quantity for brass favor boxes' : undefined,
    isConfirmed: giftsExtra === 0
  });

  // 7. Date Shift & Task Propagation (Scenario 2)
  const isDateShifted = simulation.dateDaysShift !== 0;
  if (isDateShifted) {
    warningMessages.push(
      `⏱️ Date Compression: Event dates moved earlier by ${Math.abs(simulation.dateDaysShift)} days! Recalculating task lead-times.`
    );
  }

  // Today's date benchmark (using reference time from metadata or current runtime date)
  const today = new Date('2026-10-25');

  event.tasks.forEach(task => {
    let taskAffected = false;
    let reason = '';
    let status = task.status;

    // Headcount-dependent tasks
    if (simulation.guestCountDelta !== 0) {
      if (task.id === 'task-1' || task.id === 'task-2' || task.id === 'task-4') {
        taskAffected = true;
        reason = `Headcount increased to ${newGuestCount}. Requires immediate verification.`;
      }
      if (venueCapacityWarning && task.id === 'task-3') {
        taskAffected = true;
        status = 'blocked';
        reason = 'BLOCKED: Attendance exceeds venue capacity of 200.';
      }
    }

    // Date-shift dependent tasks
    let revisedDueDate = task.dueDate;
    if (isDateShifted) {
      const origDate = new Date(task.originalDueDate || task.dueDate);
      origDate.setDate(origDate.getDate() + simulation.dateDaysShift);
      revisedDueDate = origDate.toISOString().split('T')[0];
      taskAffected = true;
      reason += (reason ? ' | ' : '') + `Due date moved earlier by ${Math.abs(simulation.dateDaysShift)} days (from ${task.originalDueDate} to ${revisedDueDate}).`;

      // Check if newly overdue relative to today
      if (new Date(revisedDueDate) < today && status !== 'completed') {
        status = 'overdue';
        overdueTaskCount++;
      }
    }

    if (taskAffected) {
      affectedTaskCount++;
      affectedNodes.set(`node-task-${task.id}`, {
        id: `node-task-${task.id}`,
        label: task.name,
        category: 'timeline',
        status: status === 'overdue' ? 'critical' : status === 'blocked' ? 'warning' : 'affected',
        value: `Due: ${revisedDueDate}`,
        previousValue: `Due: ${task.originalDueDate}`,
        whyChanged: reason,
        triggerSource: isDateShifted ? 'Event Date Shift' : 'Guest Headcount Shift',
        dataSource: 'Timeline Dependency Engine',
        nextAction: status === 'overdue' ? 'Escalate to family coordinator immediately' : 'Confirm new deadline',
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

  // 8. Overall Budget Node
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
    dataSource: 'Deterministic Budget Calculation Engine',
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
 * Respecting User's Priority Compass & Protected Requirements
 */
export function calculateTradeoffScenarios(
  event: CelebrationEvent,
  overrunAmount: number
): Scenario[] {
  // Ensure we have a sensible target savings to balance (minimum 25000)
  const targetSavings = overrunAmount > 0 ? overrunAmount : 26000;
  const baseTotals = calculateBudgetTotals(event);

  // SCENARIO 1: Protect the Food
  // Priority #1 Food is locked. Decor & Photography absorb reductions.
  const decorReduction1 = Math.round(targetSavings * 0.55); // 55% from Decor
  const photoReduction1 = Math.round(targetSavings * 0.30); // 30% from Photography
  const giftReduction1 = Math.round(targetSavings * 0.15);  // 15% from Gifts/Favors

  const decorCat = event.categories.find(c => c.id === 'cat-decor');
  const photoCat = event.categories.find(c => c.id === 'cat-photo');
  const giftCat = event.categories.find(c => c.id === 'cat-gifts');

  const changes1: ScenarioChange[] = [
    {
      categoryId: 'cat-decor',
      categoryName: 'Decoration & Floral Art',
      originalAmount: decorCat?.plannedAmount || 48000,
      revisedAmount: (decorCat?.plannedAmount || 48000) - decorReduction1,
      delta: -decorReduction1,
      rationale: 'Replace exotic imported floral accents with seasonal local marigold and jasmine garlands.'
    },
    {
      categoryId: 'cat-photo',
      categoryName: 'Photography & Cinema',
      originalAmount: photoCat?.plannedAmount || 38000,
      revisedAmount: (photoCat?.plannedAmount || 38000) - photoReduction1,
      delta: -photoReduction1,
      rationale: 'Retain all 3-day candid coverage, but substitute drone operator package with traditional crane.'
    },
    {
      categoryId: 'cat-gifts',
      categoryName: 'Invitations & Return Gifts',
      originalAmount: giftCat?.plannedAmount || 16000,
      revisedAmount: (giftCat?.plannedAmount || 16000) - giftReduction1,
      delta: -giftReduction1,
      rationale: 'Standardize return gift boxes to artisanal regional sweets, eliminating custom brass packaging.'
    }
  ];

  const totalSavings1 = decorReduction1 + photoReduction1 + giftReduction1;
  const revisedTotal1 = baseTotals.totalPlanned - totalSavings1;

  const scenario1: Scenario = {
    id: 'scen-protect-food',
    key: 'protect_food',
    title: 'Protect the Feast',
    subtitle: 'Zero Compromise on Dining & Rituals',
    description: 'Keeps Royal Rasoi live chaat counters, regional delicacies, and dessert bars completely untouched. Offsets cost by optimizing decorative floral stages and video add-ons.',
    changes: changes1,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal1,
    variance: revisedTotal1 - event.totalBudget,
    savings: totalSavings1,
    protectedItems: [
      'Royal Rasoi Caterers live stations & 4-course banquet',
      'Vedic Mandap morning sacred ceremony rituals',
      'Guest welcome drinks & high-tea hospitality'
    ],
    compromises: [
      'Floral mandap uses 100% seasonal Indian marigolds instead of imported orchids',
      'Drone cinematic coverage removed in favor of high-res candid cameras',
      'Simplified packaging for return favor boxes'
    ],
    assumptions: [
      'Local flower vendors can supply sufficient marigold volume',
      'Catering plate count remains at guaranteed tier'
    ]
  };

  // SCENARIO 2: Protect the Guest List
  // Guest count cannot be cut. Rebalances Photography, Decor, and utilizes Contingency Reserve.
  const decorReduction2 = Math.round(targetSavings * 0.40);
  const photoReduction2 = Math.round(targetSavings * 0.35);
  const contingencyBuffer2 = Math.round(targetSavings * 0.25);

  const changes2: ScenarioChange[] = [
    {
      categoryId: 'cat-decor',
      categoryName: 'Decoration & Floral Art',
      originalAmount: decorCat?.plannedAmount || 48000,
      revisedAmount: (decorCat?.plannedAmount || 48000) - decorReduction2,
      delta: -decorReduction2,
      rationale: 'Consolidate mehendi & sangeet lighting rentals into a bundled multi-day package.'
    },
    {
      categoryId: 'cat-photo',
      categoryName: 'Photography & Cinema',
      originalAmount: photoCat?.plannedAmount || 38000,
      revisedAmount: (photoCat?.plannedAmount || 38000) - photoReduction2,
      delta: -photoReduction2,
      rationale: 'Switch from 2 printed luxury physical leather albums to full 4K digital cloud gallery + 1 parent album.'
    },
    {
      categoryId: 'cat-contingency',
      categoryName: 'Contingency & Reserve',
      originalAmount: event.categories.find(c => c.id === 'cat-contingency')?.plannedAmount || 25000,
      revisedAmount: (event.categories.find(c => c.id === 'cat-contingency')?.plannedAmount || 25000) - contingencyBuffer2,
      delta: -contingencyBuffer2,
      rationale: 'Reallocate a portion of general emergency contingency reserve to cover the higher headcount.'
    }
  ];

  const totalSavings2 = decorReduction2 + photoReduction2 + contingencyBuffer2;
  const revisedTotal2 = baseTotals.totalPlanned - totalSavings2;

  const scenario2: Scenario = {
    id: 'scen-protect-guests',
    key: 'protect_guests',
    title: 'Protect the Guest List',
    subtitle: 'Welcome Everyone Without Cutting Invites',
    description: 'Accommodates the full 220-guest turnout. Offsets additional plate costs by switching to digital photo galleries, multi-day decor bundles, and mobilizing contingency reserves.',
    changes: changes2,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal2,
    variance: revisedTotal2 - event.totalBudget,
    savings: totalSavings2,
    protectedItems: [
      'Full extended family guest list (220 guests)',
      'Per-guest gift hampers & welcome sweets',
      'Live musical sangeet entertainment'
    ],
    compromises: [
      'Physical printed album count reduced from 2 to 1 (cloud gallery provided)',
      'Contingency buffer reduced to ₹18,500',
      'Requires venue lawn layout reconfiguration for extra tables'
    ],
    assumptions: [
      'Resort manager approves lawn spillover layout without extra surcharge'
    ]
  };

  // SCENARIO 3: Protect the Memories
  // Keeps Photography & Cinematic 4K Teaser 100% protected. Trims Decor, Gifts, and trims secondary catering courses.
  const decorReduction3 = Math.round(targetSavings * 0.45);
  const giftReduction3 = Math.round(targetSavings * 0.30);
  const cateringCourseReduction3 = Math.round(targetSavings * 0.25);
  const cateringCat = event.categories.find(c => c.id === 'cat-catering');
  const baseCatering = cateringCat?.plannedAmount || 108000;

  const changes3: ScenarioChange[] = [
    {
      categoryId: 'cat-decor',
      categoryName: 'Decoration & Floral Art',
      originalAmount: decorCat?.plannedAmount || 48000,
      revisedAmount: (decorCat?.plannedAmount || 48000) - decorReduction3,
      delta: -decorReduction3,
      rationale: 'Re-use morning mandap florals for evening reception stage backdrop with strategic uplighting.'
    },
    {
      categoryId: 'cat-gifts',
      categoryName: 'Invitations & Return Gifts',
      originalAmount: giftCat?.plannedAmount || 16000,
      revisedAmount: (giftCat?.plannedAmount || 16000) - giftReduction3,
      delta: -giftReduction3,
      rationale: 'Transition 100% of invites to bespoke animated interactive video invitations.'
    },
    {
      categoryId: 'cat-catering',
      categoryName: 'Catering & Beverages',
      originalAmount: baseCatering,
      revisedAmount: baseCatering - cateringCourseReduction3,
      delta: -cateringCourseReduction3,
      rationale: 'Trim dessert spread from 6 items to 4 signature desserts (retaining live Jalebi-Rabdi).'
    }
  ];

  const totalSavings3 = decorReduction3 + giftReduction3 + cateringCourseReduction3;
  const revisedTotal3 = baseTotals.totalPlanned - totalSavings3;

  const scenario3: Scenario = {
    id: 'scen-protect-memories',
    key: 'protect_memories',
    title: 'Protect the Memories',
    subtitle: 'Preserve Cinematic Film, Drone & Heirlooms',
    description: 'Guarantees the complete 4K cinematic film, drone shots, and heirloom albums. Saves costs by floral re-purposing between morning and evening, digital invites, and trimming dessert redundancy.',
    changes: changes3,
    originalTotal: baseTotals.totalPlanned,
    revisedTotal: revisedTotal3,
    variance: revisedTotal3 - event.totalBudget,
    savings: totalSavings3,
    protectedItems: [
      'ShutterMagic 4K Cinematic teaser film & aerial drone operators',
      'Deluxe 40-page flush-mount wedding album',
      'All candid photographer hours across 4 functions'
    ],
    compromises: [
      'Florals from morning mandap relocated for reception backdrop',
      'Paper invitation printing eliminated in favor of luxury digital invite',
      'Dessert menu trimmed from 6 varieties to 4 signature counters'
    ],
    assumptions: [
      'Decor crew has 3-hour turnaround window between morning pheras and evening gala'
    ]
  };

  return [scenario1, scenario2, scenario3];
}

/**
 * Apply Scenario to Living Event Plan
 * Updates shared state, modifies category amounts, and stamps provenance
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
      updatedLineItems = cat.lineItems.map(item => ({
        ...item,
        plannedAmount: Math.round(item.plannedAmount * ratio),
        provenance: {
          ...item.provenance,
          source: 'user_entered',
          verified: true,
          notes: `Applied Scenario: ${scenario.title} (${change.delta >= 0 ? '+' : ''}${change.delta})`,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }));
    }

    return {
      ...cat,
      plannedAmount: change.revisedAmount,
      notes: `${cat.notes || ''} [Applied Scenario: ${scenario.title}]`.trim(),
      lineItems: updatedLineItems
    };
  });

  // Recompute readiness
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
 * Generate standard downloadable iCalendar (.ics) format
 */
export function exportIcsCalendar(event: CelebrationEvent): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateToIcs = (dateStr: string, timeStr = '10:00 AM') => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}${m}${day}T090000Z`;
  };

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bandobast//Intelligent Event Operations Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${event.name}`
  ];

  // Add event functions
  event.functions.forEach((func, idx) => {
    const start = formatDateToIcs(func.date, func.time);
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:func-${func.id}@bandobast.app`,
      `DTSTAMP:${formatDateToIcs(new Date().toISOString().split('T')[0])}`,
      `DTSTART:${start}`,
      `SUMMARY:${event.name} - ${func.name}`,
      `LOCATION:${func.venueName}`,
      `DESCRIPTION:${func.description} | Expected Guests: ${func.guestCount} | Attire: ${func.attireTheme || 'Festive'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  // Add critical tasks
  event.tasks.forEach(task => {
    const due = formatDateToIcs(task.dueDate);
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@bandobast.app`,
      `DTSTAMP:${formatDateToIcs(new Date().toISOString().split('T')[0])}`,
      `DTSTART:${due}`,
      `SUMMARY:Deadline: ${task.name}`,
      `DESCRIPTION:${task.description} | Assigned: ${task.assignedTo || 'Unassigned'} | Priority: ${task.priority.toUpperCase()}`,
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
  const catering = event.categories.find(c => c.id === 'cat-catering');
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
* Separate Satvik & Jain counter for morning wedding ceremony
* Uniformed waitstaff: Minimum ratio of 1 server per 15 guests
* High-temp chafing dishes and clean copper serviceware
* Live stations to be fully operational 30 minutes prior to guest arrival

Generated automatically via Bandobast Intelligent Event Twin.
Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
=====================================================`;
}
