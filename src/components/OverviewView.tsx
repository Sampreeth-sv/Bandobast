import React from 'react';
import { CelebrationEvent } from '../types';
import { calculateBudgetTotals, calculateEventReadiness, propagateRippleChanges } from '../services/rippleEngine';
import { ProvenanceBadge } from './ProvenanceBadge';
import { 
  Users, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  GitFork, 
  Sparkles, 
  ShieldCheck, 
  Building2,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface OverviewViewProps {
  event: CelebrationEvent;
  onNavigateTab: (tab: any) => void;
  onOpenSimulateModal: () => void;
  onOpenTradeoffModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  event,
  onNavigateTab,
  onOpenSimulateModal,
  onOpenTradeoffModal
}) => {
  const budget = calculateBudgetTotals(event);
  const readiness = calculateEventReadiness(event);
  const rippleResult = propagateRippleChanges(event, event.activeSimulation);

  // Prepare chart data with warm Indian palette
  const chartData = event.categories.map((c) => ({
    name: c.name,
    value: c.plannedAmount,
    color: c.color
  }));

  const upcomingTasks = event.tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Event Hero Card */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#E7A83E]/10 to-transparent rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6]">
                {event.occasion}
              </span>
              <span className="text-xs text-[#77756B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#302F28] tracking-tight">
              {event.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#77756B] mt-1.5 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#C76F50]" />
                {event.startDate} to {event.endDate} ({event.functions.length} Functions)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium text-[#302F28]">
                <Users className="w-4 h-4 text-[#405B43]" />
                {event.guestCount} Confirmed Guests
              </span>
            </p>
          </div>

          {/* Event Readiness Meter */}
          <div className="bg-[#FAF7F0] border border-[#E7E0D3] rounded-2xl p-4 sm:p-5 flex items-center gap-4 min-w-[260px]">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E7E0D3]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#405B43] transition-all duration-700 ease-out"
                  strokeDasharray={`${readiness.score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif font-bold text-base text-[#302F28] leading-none">{readiness.score}%</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-[#405B43] uppercase tracking-wider">Event Readiness</p>
              <p className="font-serif font-bold text-sm text-[#302F28] mt-0.5">{readiness.summary}</p>
              <p className="text-[11px] text-[#77756B]">
                {readiness.tasksCompleted}/{readiness.tasksTotal} tasks done • {readiness.bookingsConfirmed}/{readiness.bookingsTotal} quotes locked
              </p>
            </div>
          </div>
        </div>

        {/* Active Ripple Simulation Alert Banner */}
        {event.activeSimulation.activePreset !== 'none' && (
          <div className="mt-6 p-4 rounded-2xl bg-[#EDF3EC] border border-[#DCE6D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#405B43] text-[#FAF7F0] flex items-center justify-center shrink-0">
                <GitFork className="w-4 h-4 text-[#E7A83E]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#405B43] uppercase tracking-wider">
                  Active Simulation: {event.activeSimulation.activePreset.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-xs text-[#302F28]">
                  {rippleResult.warningMessages[0] || 'Downstream impact calculated across tasks, venue limits, and budget.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {budget.isOverBudget && (
                <button
                  type="button"
                  onClick={onOpenTradeoffModal}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rebalance Scenarios</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigateTab('ripple')}
                className="px-3.5 py-1.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Inspect Ripple Twin</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4 Financial & Operational Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-5 shadow-xs relative">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-[#77756B] uppercase tracking-wider">Target Budget</p>
            <ProvenanceBadge provenance={{ source: 'user_entered', verified: true, calculationBasis: 'Baseline budget pool agreed by family leads', lastUpdated: 'Initial' }} />
          </div>
          <p className="font-serif text-2xl font-bold text-[#302F28]">
            ₹{budget.totalBudget.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1 flex items-center justify-between">
            <span>Contingency Pool:</span>
            <span className="font-mono font-medium text-[#405B43]">₹{event.contingencyReserve.toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* Planned Spending */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-5 shadow-xs relative">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-[#77756B] uppercase tracking-wider">Planned Spending</p>
            <span className="text-[11px] font-mono text-[#77756B]">
              {Math.round((budget.totalPlanned / budget.totalBudget) * 100)}%
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-[#405B43]">
            ₹{budget.totalPlanned.toLocaleString('en-IN')}
          </p>
          <div className="w-full bg-[#FAF7F0] rounded-full h-2 mt-2 overflow-hidden border border-[#E7E0D3]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${budget.isOverBudget ? 'bg-[#C76F50]' : 'bg-[#405B43]'}`}
              style={{ width: `${Math.min(100, (budget.totalPlanned / budget.totalBudget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Remaining Balance or Overrun */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-5 shadow-xs relative">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-[#77756B] uppercase tracking-wider">
              {budget.isOverBudget ? 'Budget Overrun' : 'Remaining Balance'}
            </p>
            {budget.isOverBudget ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C76F50]/15 text-[#C76F50]">
                Over Limit
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#405B43]/10 text-[#405B43]">
                Surplus
              </span>
            )}
          </div>
          <p className={`font-serif text-2xl font-bold ${budget.isOverBudget ? 'text-[#C76F50]' : 'text-[#405B43]'}`}>
            ₹{Math.abs(budget.remainingBudget).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1">
            {budget.isOverBudget ? 'Requires priority trade-off cuts' : 'Available for contingency buffers'}
          </p>
        </div>

        {/* Cost Per Guest */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-5 shadow-xs relative">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-semibold text-[#77756B] uppercase tracking-wider">Cost Per Guest</p>
            <span className="text-[11px] font-medium text-[#E7A83E]">
              {event.guestCount} Guests
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-[#302F28]">
            ₹{budget.costPerGuest.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1 flex items-center justify-between">
            <span>Committed so far:</span>
            <span className="font-mono text-[#302F28]">₹{budget.totalCommitted.toLocaleString('en-IN')}</span>
          </p>
        </div>
      </div>

      {/* Middle Row: Budget Allocation Donut + Multi-Function Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Allocation Chart */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-[#302F28]">Budget Allocation</h3>
              <button
                onClick={() => onNavigateTab('budget')}
                className="text-xs font-medium text-[#405B43] hover:underline"
              >
                Budget Studio &rarr;
              </button>
            </div>
            
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Allocation']}
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7E0D3', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#77756B] uppercase font-semibold">Allocated</span>
                <span className="font-serif font-bold text-xs text-[#302F28]">₹{budget.totalPlanned.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-4 pt-4 border-t border-[#E7E0D3] text-xs">
            {event.categories.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-[#302F28] truncate">{c.name}</span>
                </div>
                <span className="font-mono text-[#77756B] shrink-0">₹{c.plannedAmount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 cols: Multi-Function Schedule Timeline Cards */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#302F28]">Multi-Function Schedule</h3>
              <p className="text-xs text-[#77756B]">Sequential ceremonies with dedicated venues and attendance tiers.</p>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-medium text-[#405B43] hover:underline"
            >
              Full Schedule &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {event.functions.map((func) => (
              <div 
                key={func.id} 
                className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3] hover:border-[#405B43]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#405B43]">{func.date}</span>
                    <span className="text-[11px] text-[#77756B]">{func.time}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#302F28]">{func.name}</h4>
                  <p className="text-xs text-[#77756B] mt-1 line-clamp-2">{func.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E7E0D3] flex items-center justify-between text-[11px] text-[#526354]">
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    <Building2 className="w-3 h-3 text-[#77756B]" />
                    {func.venueName}
                  </span>
                  <span className="font-medium bg-[#FFFDF9] px-2 py-0.5 rounded border border-[#E7E0D3]">
                    {func.guestCount} guests (Cap: {func.venueCapacity})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Tasks & Quick Ripple Trigger Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#302F28]">Urgent Milestones & Tasks</h3>
              <p className="text-xs text-[#77756B]">Interconnected deadlines feeding into catering and layout locks.</p>
            </div>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-medium text-[#405B43] hover:underline"
            >
              Manage Tasks &rarr;
            </button>
          </div>

          <div className="divide-y divide-[#E7E0D3]">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F0] border border-[#E7E0D3] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#77756B]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#302F28]">{t.name}</p>
                    <p className="text-[11px] text-[#77756B] mt-0.5">
                      Due: {t.dueDate} • Assigned to {t.assignedTo || 'Lead Coordinator'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    t.priority === 'critical' ? 'bg-[#C76F50]/15 text-[#C76F50]' :
                    t.priority === 'high' ? 'bg-[#E7A83E]/15 text-[#B45309]' :
                    'bg-[#DCE6D6] text-[#405B43]'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Simulator CTA Card */}
        <div className="bg-[#405B43] text-[#FAF7F0] rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F0]/15 text-[#E7A83E] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bandobast Signature Engine</span>
            </div>
            <h3 className="font-serif text-xl font-bold leading-snug">
              What if 40 more guests arrive?
            </h3>
            <p className="text-xs text-[#FAF7F0]/80 mt-2 leading-relaxed">
              Don't guess in spreadsheets. The Ripple Engine calculates plate quantities, lawn venue limits, and provides instant trade-off solutions.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={onOpenSimulateModal}
              className="w-full py-3 px-4 bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <GitFork className="w-4 h-4" />
              <span>Simulate a Change Now</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('ripple')}
              className="w-full py-2 px-3 text-[#FAF7F0]/80 hover:text-[#FAF7F0] text-xs text-center transition-colors"
            >
              Open Interactive Graph &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
