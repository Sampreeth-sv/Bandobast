import React, { useState } from 'react';
import { 
  CelebrationEvent, 
  RippleSimulationState, 
  RippleNodeDetail 
} from '../types';
import { propagateRippleChanges, calculateBudgetTotals } from '../services/rippleEngine';
import { 
  GitFork, 
  Users, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Building, 
  Utensils, 
  Gift, 
  Clock, 
  IndianRupee, 
  RotateCcw,
  Sliders,
  Check,
  ListFilter,
  Network
} from 'lucide-react';

interface RippleEngineViewProps {
  event: CelebrationEvent;
  onUpdateSimulation: (simulation: RippleSimulationState) => void;
  onOpenTradeoffModal: () => void;
}

export const RippleEngineView: React.FC<RippleEngineViewProps> = ({
  event,
  onUpdateSimulation,
  onOpenTradeoffModal
}) => {
  const simulation = event.activeSimulation;
  const rippleResult = propagateRippleChanges(event, simulation);
  const budget = calculateBudgetTotals(event);

  // Accessible view mode toggle: 'network' (visual canvas) vs 'table' (accessible textual summary)
  const [viewMode, setViewMode] = useState<'network' | 'table'>('network');

  // Selected node for deep inspection drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-headcount');

  const selectedNode = rippleResult.affectedNodes.get(selectedNodeId) || {
    id: 'node-headcount',
    label: 'Guest Headcount',
    category: 'headcount' as const,
    status: 'normal' as const,
    value: `${event.guestCount} Guests`,
    dataSource: 'Organizer Roster',
    isConfirmed: true
  };

  const handleApplyPreset = (preset: 'guest_increase' | 'early_date' | 'vendor_increase' | 'none') => {
    if (preset === 'guest_increase') {
      onUpdateSimulation({
        activePreset: 'guest_increase',
        guestCountDelta: 40,
        dateDaysShift: 0,
        vendorIncreasePercent: 0
      });
      setSelectedNodeId('node-headcount');
    } else if (preset === 'early_date') {
      onUpdateSimulation({
        activePreset: 'early_date',
        guestCountDelta: 0,
        dateDaysShift: -14,
        vendorIncreasePercent: 0
      });
      const firstTask = event.tasks[0]?.id;
      setSelectedNodeId(firstTask ? `node-task-${firstTask}` : 'node-headcount');
    } else if (preset === 'vendor_increase') {
      onUpdateSimulation({
        activePreset: 'vendor_increase',
        guestCountDelta: 0,
        dateDaysShift: 0,
        vendorIncreasePercent: 20
      });
      setSelectedNodeId('node-total-budget');
    } else {
      onUpdateSimulation({
        activePreset: 'none',
        guestCountDelta: 0,
        dateDaysShift: 0,
        vendorIncreasePercent: 0
      });
      setSelectedNodeId('node-headcount');
    }
  };

  // Status badge config
  const getNodeVisualConfig = (status: RippleNodeDetail['status']) => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-[#C76F50] ring-2 ring-[#C76F50]/30',
          bg: 'bg-[#FAECE7]',
          text: 'text-[#C76F50]',
          badgeBg: 'bg-[#C76F50]',
          badgeText: 'text-[#FAF7F0]',
          label: 'Critical / Overrun'
        };
      case 'warning':
        return {
          border: 'border-[#E7A83E] ring-2 ring-[#E7A83E]/30',
          bg: 'bg-[#FFF9EE]',
          text: 'text-[#B45309]',
          badgeBg: 'bg-[#E7A83E]',
          badgeText: 'text-[#302F28]',
          label: 'Warning / Hike'
        };
      case 'affected':
        return {
          border: 'border-[#405B43] ring-2 ring-[#405B43]/30',
          bg: 'bg-[#EDF3EC]',
          text: 'text-[#405B43]',
          badgeBg: 'bg-[#405B43]',
          badgeText: 'text-[#FAF7F0]',
          label: 'Recalculated'
        };
      case 'confirmed':
        return {
          border: 'border-[#DCE6D6]',
          bg: 'bg-[#FFFDF9]',
          text: 'text-[#405B43]',
          badgeBg: 'bg-[#EDF3EC]',
          badgeText: 'text-[#405B43]',
          label: 'Locked & Normal'
        };
      default:
        return {
          border: 'border-[#E7E0D3]',
          bg: 'bg-[#FFFDF9]',
          text: 'text-[#5A584F]',
          badgeBg: 'bg-[#FAF7F0]',
          badgeText: 'text-[#5A584F]',
          label: 'Normal'
        };
    }
  };

  const allNodesList = Array.from(rippleResult.affectedNodes.values());

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Scenario Presets Bar */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF3EC] text-[#405B43] text-xs font-semibold mb-2 border border-[#DCE6D6]">
              <GitFork className="w-3.5 h-3.5" />
              <span>Living Event Twin & Causality Engine</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#302F28]">
              Ripple Engine: Dependency Network
            </h2>
            <p className="text-xs text-[#5A584F] mt-1 max-w-2xl">
              Deterministic simulation showing how shifting guest numbers, moving dates, or supplier price changes cascade through venue capacity, per-plate catering, and task deadlines.
            </p>
          </div>

          {/* Reset Action & Mode Switcher */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="flex rounded-xl bg-[#FAF7F0] p-1 border border-[#E7E0D3] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('network')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'network' ? 'bg-[#405B43] text-white shadow-xs' : 'text-[#5A584F] hover:text-[#302F28]'
                }`}
                aria-pressed={viewMode === 'network'}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Visual Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#405B43] text-white shadow-xs' : 'text-[#5A584F] hover:text-[#302F28]'
                }`}
                aria-pressed={viewMode === 'table'}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Accessible Table</span>
              </button>
            </div>

            {simulation.activePreset !== 'none' && (
              <button
                type="button"
                onClick={() => handleApplyPreset('none')}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E7E0D3] text-[#5A584F] text-xs font-bold border border-[#E7E0D3] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Interactive Quick-Change Simulation Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Preset 1: Guest increase */}
          <button
            type="button"
            onClick={() => handleApplyPreset('guest_increase')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#405B43] ${
              simulation.activePreset === 'guest_increase'
                ? 'bg-[#EDF3EC] border-[#405B43] ring-2 ring-[#405B43]/30 shadow-xs'
                : 'bg-[#FFFDF9] border-[#E7E0D3] hover:border-[#405B43]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-[#405B43]/10 text-[#405B43] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                simulation.activePreset === 'guest_increase' ? 'bg-[#405B43] text-white' : 'bg-[#FAF7F0] text-[#5A584F]'
              }`}>
                Scenario 1
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">+40 Guest Headcount ({event.guestCount} &rarr; {event.guestCount + 40})</h4>
            <p className="text-[11px] text-[#5A584F] mt-1 leading-relaxed">
              Recalculates per-person catering rates, gift count, and checks venue max capacities.
            </p>
          </button>

          {/* Preset 2: Earlier Date */}
          <button
            type="button"
            onClick={() => handleApplyPreset('early_date')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#405B43] ${
              simulation.activePreset === 'early_date'
                ? 'bg-[#EDF3EC] border-[#C76F50] ring-2 ring-[#C76F50]/30 shadow-xs'
                : 'bg-[#FFFDF9] border-[#E7E0D3] hover:border-[#C76F50]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-[#C76F50]/10 text-[#C76F50] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                simulation.activePreset === 'early_date' ? 'bg-[#C76F50] text-white' : 'bg-[#FAF7F0] text-[#5A584F]'
              }`}>
                Scenario 2
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">Move Dates 2 Weeks Earlier</h4>
            <p className="text-[11px] text-[#5A584F] mt-1 leading-relaxed">
              Compresses task lead-times by -14 days; flags newly overdue catering and decor approvals.
            </p>
          </button>

          {/* Preset 3: Vendor Quote Spike */}
          <button
            type="button"
            onClick={() => handleApplyPreset('vendor_increase')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#405B43] ${
              simulation.activePreset === 'vendor_increase'
                ? 'bg-[#EDF3EC] border-[#E7A83E] ring-2 ring-[#E7A83E]/30 shadow-xs'
                : 'bg-[#FFFDF9] border-[#E7E0D3] hover:border-[#E7A83E]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-[#E7A83E]/15 text-[#B45309] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                simulation.activePreset === 'vendor_increase' ? 'bg-[#E7A83E] text-[#302F28]' : 'bg-[#FAF7F0] text-[#5A584F]'
              }`}>
                Scenario 3
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">Vendor Price Spike (+20%)</h4>
            <p className="text-[11px] text-[#5A584F] mt-1 leading-relaxed">
              Applies a 20% quote hike on catering and production; recalculates budget ceiling overrun.
            </p>
          </button>
        </div>

        {/* Impact Warning Banner */}
        {rippleResult.warningMessages.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FAECE7] border border-[#E7E0D3] space-y-2 text-xs text-[#302F28]" role="alert">
            {rippleResult.warningMessages.map((msg, i) => (
              <p key={i} className="font-semibold flex items-center gap-2">
                <span>{msg}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Main Interactive Grid: Dependency Node Network + Details Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Canvas Network or Accessible Table */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[580px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302F28]">
                  {viewMode === 'network' ? 'Interactive Dependency Network' : 'Accessible Textual Summary'}
                </h3>
                <p className="text-xs text-[#5A584F]">
                  Select any node to inspect causality, trigger sources, and action items.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-[#405B43]">
                  <span className="w-2 h-2 rounded-full bg-[#405B43]" /> Recalculated
                </span>
                <span className="flex items-center gap-1 text-[#B45309]">
                  <span className="w-2 h-2 rounded-full bg-[#E7A83E]" /> Warning
                </span>
                <span className="flex items-center gap-1 text-[#C76F50]">
                  <span className="w-2 h-2 rounded-full bg-[#C76F50]" /> Critical
                </span>
              </div>
            </div>

            {/* Accessible Table View (Section 7) */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-[#E7E0D3]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F0] border-b border-[#E7E0D3] text-[#5A584F] font-bold">
                      <th className="py-3 px-4">Node Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Value</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D3] bg-[#FFFDF9]">
                    {allNodesList.map((node) => {
                      const visual = getNodeVisualConfig(node.status);
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <tr
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id); }}
                          tabIndex={0}
                          aria-selected={isSelected}
                          className={`cursor-pointer transition-colors focus-visible:bg-[#EDF3EC] ${
                            isSelected ? 'bg-[#EDF3EC] font-semibold' : 'hover:bg-[#FAF7F0]/80'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-[#302F28]">{node.label}</td>
                          <td className="py-3 px-4 uppercase text-[10px] tracking-wider text-[#5A584F]">{node.category}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#405B43]">{node.value}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                              {visual.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#5A584F] text-[11px] truncate max-w-[200px]">
                            {node.nextAction || 'None required'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Visual Multi-Tier Dependency Canvas */
              <div className="space-y-6 pt-2">
                {/* TIER 1: Upstream Drivers (Headcount & Dates) */}
                <div>
                  <p className="text-[10px] font-bold text-[#5A584F] uppercase tracking-wider mb-2">
                    Tier 1 &bull; Upstream Event Drivers
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Headcount Node */}
                    {(() => {
                      const node = rippleResult.affectedNodes.get('node-headcount')!;
                      const visual = getNodeVisualConfig(node.status);
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <div
                          onClick={() => setSelectedNodeId(node.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id); }}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isSelected}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#405B43] ${visual.bg} ${visual.border} ${
                            isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#5A584F] flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[#405B43]" />
                              {node.label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                              {visual.label}
                            </span>
                          </div>
                          <p className="font-serif font-bold text-base text-[#302F28]">{node.value}</p>
                          {node.previousValue && (
                            <p className="text-[11px] text-[#5A584F] font-mono mt-0.5">Base: {node.previousValue}</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Dates Node */}
                    <div
                      onClick={() => setSelectedNodeId(event.tasks[0] ? `node-task-${event.tasks[0].id}` : 'node-headcount')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(event.tasks[0] ? `node-task-${event.tasks[0].id}` : 'node-headcount'); }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedNodeId.startsWith('node-task')}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#405B43] ${
                        simulation.dateDaysShift !== 0 ? 'bg-[#FAECE7] border-[#C76F50] ring-2 ring-[#C76F50]/30' : 'bg-[#FFFDF9] border-[#E7E0D3]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#5A584F] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C76F50]" />
                          Event Timeline Anchor
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          simulation.dateDaysShift !== 0 ? 'bg-[#C76F50] text-white' : 'bg-[#FAF7F0] text-[#5A584F]'
                        }`}>
                          {simulation.dateDaysShift !== 0 ? `${Math.abs(simulation.dateDaysShift)}d Shifted` : 'Locked'}
                        </span>
                      </div>
                      <p className="font-serif font-bold text-base text-[#302F28]">
                        {event.startDate} &rarr; {event.endDate}
                      </p>
                      <p className="text-[11px] text-[#5A584F] font-mono mt-0.5">
                        {simulation.dateDaysShift !== 0 ? `Shifted by ${simulation.dateDaysShift} days` : 'Baseline Event Anchor'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connecting Flow Lines */}
                <div className="flex justify-around text-xs text-[#5A584F] py-0.5">
                  <span className="flex items-center gap-1">&darr; Drives capacity & allocations</span>
                  <span className="flex items-center gap-1">&darr; Drives task lead-times</span>
                </div>

                {/* TIER 2: Secondary Intermediary Nodes (Venue Capacity & Categories) */}
                <div>
                  <p className="text-[10px] font-bold text-[#5A584F] uppercase tracking-wider mb-2">
                    Tier 2 &bull; Direct Dependents (Venue Capacities & Services)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Dynamic Venue Nodes */}
                    {event.functions.slice(0, 3).map((func) => {
                      const nodeKey = `node-venue-${func.id}`;
                      const node = rippleResult.affectedNodes.get(nodeKey) || {
                        id: nodeKey,
                        label: `${func.name} Venue`,
                        category: 'venue' as const,
                        status: 'normal' as const,
                        value: `${func.venueName} (Cap: ${func.venueCapacity})`,
                        dataSource: 'Contract Specs',
                        isConfirmed: true
                      };
                      const visual = getNodeVisualConfig(node.status);
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <div
                          key={func.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id); }}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isSelected}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#405B43] ${visual.bg} ${visual.border} ${
                            isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Building className="w-3.5 h-3.5 text-[#E7A83E]" />
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                              {visual.label}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-[#302F28] truncate">{func.venueName}</p>
                          <p className="font-mono text-xs text-[#405B43] mt-1 font-bold">Cap: {func.venueCapacity}</p>
                        </div>
                      );
                    })}

                    {/* Top Budget Categories */}
                    {event.categories.slice(0, 2).map((cat) => {
                      const nodeKey = `node-cat-${cat.id}`;
                      const node = rippleResult.affectedNodes.get(nodeKey) || {
                        id: nodeKey,
                        label: cat.name,
                        category: 'budget' as const,
                        status: 'normal' as const,
                        value: `₹${cat.plannedAmount.toLocaleString('en-IN')}`,
                        dataSource: 'Budget Category',
                        isConfirmed: true
                      };
                      const visual = getNodeVisualConfig(node.status);
                      const isSelected = selectedNodeId === node.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id); }}
                          tabIndex={0}
                          role="button"
                          aria-pressed={isSelected}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#405B43] ${visual.bg} ${visual.border} ${
                            isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Utensils className="w-3.5 h-3.5 text-[#405B43]" />
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                              {visual.label}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-[#302F28] truncate">{cat.name}</p>
                          <p className="font-mono text-xs text-[#405B43] mt-1 font-bold">{node.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connecting Flow Lines */}
                <div className="flex justify-around text-xs text-[#5A584F] py-0.5">
                  <span className="flex items-center gap-1">&darr; Aggregates into bottom-line financials</span>
                  <span className="flex items-center gap-1">&darr; Updates task execution schedule</span>
                </div>

                {/* TIER 3: Bottom-Line Financials & Overall Budget */}
                <div>
                  <p className="text-[10px] font-bold text-[#5A584F] uppercase tracking-wider mb-2">
                    Tier 3 &bull; Consolidated Budget Health Node
                  </p>
                  {(() => {
                    const node = rippleResult.affectedNodes.get('node-total-budget')!;
                    const visual = getNodeVisualConfig(node.status);
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id); }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#405B43] ${visual.bg} ${visual.border} ${
                          isSelected ? 'shadow-lg scale-[1.01]' : 'hover:scale-[1.005]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#302F28] flex items-center gap-1.5">
                            <IndianRupee className="w-4 h-4 text-[#405B43]" />
                            {node.label}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1">
                          <p className="font-serif font-bold text-xl text-[#302F28]">{node.value}</p>
                          <p className="text-xs font-semibold text-[#5A584F]">
                            {rippleResult.isOverBudget 
                              ? `Over budget by ₹${rippleResult.overrunAmount.toLocaleString('en-IN')}` 
                              : 'Within authorized budget ceiling'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Action Trigger to Simulator */}
          <div className="pt-4 border-t border-[#E7E0D3] mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#5A584F]">
              <span>Active simulation delta: </span>
              <strong className="text-[#302F28]">
                {rippleResult.affectedBudgetDelta >= 0 ? '+' : ''}₹{rippleResult.affectedBudgetDelta.toLocaleString('en-IN')}
              </strong>
            </div>

            {rippleResult.isOverBudget && (
              <button
                type="button"
                onClick={onOpenTradeoffModal}
                className="px-4 py-2.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:scale-[1.01] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#E7A83E]" />
                <span>Launch Priority Compass Trade-Offs (₹{rippleResult.overrunAmount.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Deep Causality Inspector Drawer */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="pb-3 border-b border-[#E7E0D3]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#405B43] uppercase tracking-wider">
                  Causality Inspector
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getNodeVisualConfig(selectedNode.status).badgeBg} ${getNodeVisualConfig(selectedNode.status).badgeText}`}>
                  {getNodeVisualConfig(selectedNode.status).label}
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#302F28] mt-1">{selectedNode.label}</h3>
              <p className="font-mono text-sm text-[#405B43] font-bold mt-0.5">{selectedNode.value}</p>
            </div>

            {/* Causality Breakdown */}
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="font-semibold text-[#5A584F] uppercase text-[10px]">What Changed & Why?</p>
                <p className="text-[#302F28] mt-1 leading-relaxed bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D3]">
                  {selectedNode.whyChanged || 'Operating within normal planning baselines; no ripple divergence detected.'}
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#5A584F] uppercase text-[10px]">Causality Trigger Source</p>
                <p className="text-[#302F28] font-medium mt-0.5 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-[#E7A83E]" />
                  <span>{selectedNode.triggerSource || 'Organizer Baseline Model'}</span>
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#5A584F] uppercase text-[10px]">Data Provenance Grounding</p>
                <p className="text-[#5A584F] mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#405B43]" />
                  <span>{selectedNode.dataSource || 'Configured Event Ledger'}</span>
                </p>
              </div>

              <div>
                <p className="font-semibold text-[#5A584F] uppercase text-[10px]">Recommended Action</p>
                <p className="text-[#302F28] font-semibold mt-1 bg-[#EDF3EC] text-[#405B43] p-3 rounded-xl border border-[#DCE6D6]">
                  {selectedNode.nextAction || 'Continue with scheduled event operations.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E0D3] mt-6">
            <p className="text-[11px] text-[#5A584F] italic">
              Bandobast Twin: All calculations are deterministic and provenance-grounded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
