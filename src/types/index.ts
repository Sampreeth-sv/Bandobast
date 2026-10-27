/**
 * Core Data Models & Interfaces for Bandobast Event Operations Platform
 */

export type EventType = 
  | 'wedding' 
  | 'engagement' 
  | 'birthday' 
  | 'anniversary' 
  | 'reunion' 
  | 'community' 
  | 'custom';

export type ProvenanceSource = 
  | 'quoted' 
  | 'user_entered' 
  | 'ai_estimate' 
  | 'illustrative';

export interface ProvenanceRecord {
  source: ProvenanceSource;
  quoteId?: string;
  quoteLineItemId?: string;
  calculationBasis?: string;
  verified: boolean;
  lastUpdated: string;
  notes?: string;
}

export type UnitType = 'per_guest' | 'fixed' | 'per_unit' | 'per_hour';

export interface BudgetLineItem {
  id: string;
  categoryId: string;
  name: string;
  functionId?: string;
  plannedAmount: number;
  committedAmount: number;
  paidAmount: number;
  unitCost?: number;
  unitType: UnitType;
  quantity?: number;
  isProtected?: boolean;
  provenance: ProvenanceRecord;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
  plannedAmount: number;
  committedAmount: number;
  paidAmount: number;
  isMustPreserve: boolean;
  notes?: string;
  lineItems: BudgetLineItem[];
}

export interface EventFunction {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM - 2:00 PM"
  venueName: string;
  venueCapacity: number;
  guestCount: number;
  attireTheme?: string;
  description: string;
  color?: string;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'overdue';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PlanningTask {
  id: string;
  name: string;
  description: string;
  functionId?: string;
  functionName?: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  originalDueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dependencies: string[]; // task IDs that must complete first
  isDateLocked?: boolean;
  isMilestone?: boolean;
  affectedReason?: string;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isOptional?: boolean;
}

export interface VendorQuote {
  id: string;
  vendorName: string;
  vendorCategory: string;
  quoteDate: string;
  totalAmount: number;
  subtotal: number;
  gstAmount: number;
  serviceCharges: number;
  lineItems: QuoteLineItem[];
  paymentTerms: string;
  cancellationPolicy: string;
  validityPeriod: string;
  inclusions: string[];
  exclusions: string[];
  missingFields: string[];
  rawText?: string;
  status: 'draft' | 'under_review' | 'accepted' | 'rejected';
  provenance: ProvenanceRecord;
}

export interface PriorityItem {
  id: string;
  label: string;
  rank: number; // 1 to 6
  locked: boolean;
  description: string;
}

export interface ScenarioChange {
  categoryId: string;
  categoryName: string;
  lineItemId?: string;
  lineItemName?: string;
  originalAmount: number;
  revisedAmount: number;
  delta: number;
  rationale: string;
}

export interface Scenario {
  id: string;
  key: 'protect_food' | 'protect_guests' | 'protect_memories' | 'custom';
  title: string;
  subtitle: string;
  description: string;
  changes: ScenarioChange[];
  revisedTotal: number;
  originalTotal: number;
  variance: number;
  savings: number;
  protectedItems: string[];
  compromises: string[];
  assumptions: string[];
  isApplied?: boolean;
}

export interface CelebrationEvent {
  id: string;
  name: string;
  occasion: string;
  eventType: EventType;
  location: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  guestCount: number;
  contingencyReserve: number;
  readinessScore: number;
  functions: EventFunction[];
  categories: BudgetCategory[];
  tasks: PlanningTask[];
  quotes: VendorQuote[];
  priorities: PriorityItem[];
  protectedRequirements: string[];
  activeScenarioId?: string;
  activeSimulation: RippleSimulationState;
  createdAt: string;
  updatedAt: string;
}

export interface RippleSimulationState {
  activePreset: 'none' | 'guest_increase' | 'early_date' | 'vendor_increase' | 'custom';
  guestCountDelta: number;
  dateDaysShift: number; // e.g. -14 for 2 weeks earlier
  vendorIncreasePercent: number; // e.g. 20 for +20%
}

export interface RippleImpactResult {
  affectedBudgetDelta: number;
  revisedTotalCost: number;
  isOverBudget: boolean;
  overrunAmount: number;
  venueCapacityWarning: boolean;
  overCapacityCount: number;
  venueMaxCapacity: number;
  affectedTaskCount: number;
  overdueTaskCount: number;
  affectedNodes: Map<string, RippleNodeDetail>;
  warningMessages: string[];
}

export interface RippleNodeDetail {
  id: string;
  label: string;
  category: 'core' | 'headcount' | 'budget' | 'timeline' | 'vendor' | 'venue';
  status: 'normal' | 'affected' | 'warning' | 'critical' | 'confirmed';
  value: string;
  previousValue?: string;
  triggerSource?: string;
  whyChanged?: string;
  dataSource?: string;
  nextAction?: string;
  isConfirmed: boolean;
}

export type RecommendationCategory = 'venue' | 'catering' | 'photography' | 'decor';

export interface VendorRecommendation {
  id: string;
  name: string;
  category: RecommendationCategory;
  city: string;
  rating?: number;
  reviewsCount?: number;
  priceRange: string;
  estimatedCost: number;
  unitPricingLabel?: string;
  fitDescription: string;
  highlights: string[];
  contactName?: string;
  contactNumber?: string;
  matchScore?: number;
  isAddedToBudget?: boolean;
  isIllustrativeDemo?: boolean;
  verificationStatus?: 'unverified' | 'pending_review' | 'verified';
  disclaimer?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  budgetContext?: number;
  suggestedVendors?: VendorRecommendation[];
  actionPrompt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  eventId?: string;
  budget: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
