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
  Check
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
      setSelectedNodeId('node-task-task-1');
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
          badgeText: 'text-white',
          label: 'Critical / Overdue'
        };
      case 'warning':
        return {
          border: 'border-[#E7A83E] ring-2 ring-[#E7A83E]/30',
          bg: 'bg-[#FEF7EB]',
          text: 'text-[#B45309]',
          badgeBg: 'bg-[#E7A83E]',
          badgeText: 'text-[#302F28]',
          label: 'Warning / Review'
        };
      case 'affected':
        return {
          border: 'border-[#405B43] ring-1 ring-[#405B43]/30',
          bg: 'bg-[#EDF3EC]',
          text: 'text-[#405B43]',
          badgeBg: 'bg-[#405B43]',
          badgeText: 'text-[#FAF7F0]',
          label: 'Downstream Affected'
        };
      case 'confirmed':
        return {
          border: 'border-[#405B43]/40',
          bg: 'bg-[#FAF7F0]',
          text: 'text-[#405B43]',
          badgeBg: 'bg-[#405B43]/20',
          badgeText: 'text-[#405B43]',
          label: 'Confirmed Locked'
        };
      case 'normal':
      default:
        return {
          border: 'border-[#E7E0D3]',
          bg: 'bg-[#FFFDF9]',
          text: 'text-[#302F28]',
          badgeBg: 'bg-[#FAF7F0]',
          badgeText: 'text-[#77756B]',
          label: 'Baseline'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Signature Banner */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#E7A83E]/20 text-[#B45309] border border-[#E7A83E]/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bandobast Signature Feature</span>
            </span>
            <span className="text-xs text-[#77756B]">Deterministic Multi-Variable Dependency Engine</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302F28]">Living Event Twin & Ripple Engine</h1>
          <p className="text-xs text-[#77756B] mt-1 max-w-2xl">
            Simulate decisions before committing money. Changes in guest headcount, dates, or supplier quotes propagate deterministically through linked tasks, venue limits, and budgets.
          </p>
        </div>

        {/* Quick Reset / Summary */}
        <div className="flex items-center gap-3">
          {simulation.activePreset !== 'none' && (
            <button
              type="button"
              onClick={() => handleApplyPreset('none')}
              className="px-4 py-2.5 rounded-xl border border-[#E7E0D3] hover:bg-[#FAF7F0] text-xs font-medium text-[#77756B] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulation</span>
            </button>
          )}

          {rippleResult.isOverBudget && (
            <button
              type="button"
              onClick={onOpenTradeoffModal}
              className="px-4 py-2.5 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Trade-off Simulator</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Preset Demonstrations specified in prompt */}
      <div className="bg-[#FAF7F0] border border-[#E7E0D3] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#405B43] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#405B43]" />
            <span>Interactive Scenario Controls</span>
          </p>
          <span className="text-[11px] text-[#77756B]">Click any preset to trigger instant propagation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Preset 1: Guest increase */}
          <button
            type="button"
            onClick={() => handleApplyPreset('guest_increase')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
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
                simulation.activePreset === 'guest_increase' ? 'bg-[#405B43] text-white' : 'bg-[#FAF7F0] text-[#77756B]'
              }`}>
                Scenario 1
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">+40 Guest Headcount (180 &rarr; 220)</h4>
            <p className="text-[11px] text-[#77756B] mt-1 leading-relaxed">
              Recalculates per-person catering rates, gift count, and checks Heritage Lawns max capacity (200 pax).
            </p>
          </button>

          {/* Preset 2: Earlier Date */}
          <button
            type="button"
            onClick={() => handleApplyPreset('early_date')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
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
                simulation.activePreset === 'early_date' ? 'bg-[#C76F50] text-white' : 'bg-[#FAF7F0] text-[#77756B]'
              }`}>
                Scenario 2
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">Move Dates 2 Weeks Earlier</h4>
            <p className="text-[11px] text-[#77756B] mt-1 leading-relaxed">
              Compresses task lead-times by -14 days; flags newly overdue catering and decor approvals.
            </p>
          </button>

          {/* Preset 3: Vendor Quote Spike */}
          <button
            type="button"
            onClick={() => handleApplyPreset('vendor_increase')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
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
                simulation.activePreset === 'vendor_increase' ? 'bg-[#E7A83E] text-[#302F28]' : 'bg-[#FAF7F0] text-[#77756B]'
              }`}>
                Scenario 3
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-[#302F28]">Vendor Price Spike (+20%)</h4>
            <p className="text-[11px] text-[#77756B] mt-1 leading-relaxed">
              Applies a 20% quote hike on catering and florals; recalculates budget ceiling overrun.
            </p>
          </button>
        </div>

        {/* Impact Warning Banner */}
        {rippleResult.warningMessages.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FAECE7] border border-[#E7E0D3] space-y-1.5 text-xs text-[#302F28]">
            {rippleResult.warningMessages.map((msg, i) => (
              <p key={i} className="font-medium flex items-center gap-1.5">
                <span>{msg}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Main Interactive Grid: Dependency Node Network + Details Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive Living Graph Canvas */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[580px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302F28]">Interactive Dependency Network</h3>
                <p className="text-xs text-[#77756B]">Click any node to inspect causality, trigger sources, and action items.</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-[#405B43]">
                  <span className="w-2 h-2 rounded-full bg-[#405B43]" /> Affected
                </span>
                <span className="flex items-center gap-1 text-[#E7A83E]">
                  <span className="w-2 h-2 rounded-full bg-[#E7A83E]" /> Warning
                </span>
                <span className="flex items-center gap-1 text-[#C76F50]">
                  <span className="w-2 h-2 rounded-full bg-[#C76F50]" /> Overdue/Overcap
                </span>
              </div>
            </div>

            {/* Visual Multi-Tier Dependency Graph */}
            <div className="space-y-6 pt-2">
              {/* TIER 1: Upstream Drivers (Headcount & Dates) */}
              <div>
                <p className="text-[10px] font-bold text-[#77756B] uppercase tracking-wider mb-2">
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
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${visual.bg} ${visual.border} ${
                          isSelected ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[#77756B] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#405B43]" />
                            {node.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <p className="font-serif font-bold text-base text-[#302F28]">{node.value}</p>
                        {node.previousValue && (
                          <p className="text-[11px] text-[#77756B] font-mono mt-0.5">Base: {node.previousValue}</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Dates Node */}
                  <div
                    onClick={() => setSelectedNodeId('node-task-task-1')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      simulation.dateDaysShift !== 0 ? 'bg-[#FAECE7] border-[#C76F50] ring-2 ring-[#C76F50]/30' : 'bg-[#FFFDF9] border-[#E7E0D3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#77756B] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C76F50]" />
                        Event Timeline Anchor
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        simulation.dateDaysShift !== 0 ? 'bg-[#C76F50] text-white' : 'bg-[#FAF7F0] text-[#77756B]'
                      }`}>
                        {simulation.dateDaysShift !== 0 ? `${Math.abs(simulation.dateDaysShift)}d Shifted` : 'Locked'}
                      </span>
                    </div>
                    <p className="font-serif font-bold text-base text-[#302F28]">
                      {event.startDate} &rarr; {event.endDate}
                    </p>
                    <p className="text-[11px] text-[#77756B] font-mono mt-0.5">
                      {simulation.dateDaysShift !== 0 ? `Shifted by ${simulation.dateDaysShift} days` : 'Baseline Wedding Muhurat'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting Flow Lines */}
              <div className="flex justify-around text-xs text-[#77756B] py-0.5">
                <span className="flex items-center gap-1">&darr; Drives per-plate & capacity</span>
                <span className="flex items-center gap-1">&darr; Drives task lead-times</span>
              </div>

              {/* TIER 2: Secondary Intermediary Nodes (Venue Capacity, Catering, Gifts) */}
              <div>
                <p className="text-[10px] font-bold text-[#77756B] uppercase tracking-wider mb-2">
                  Tier 2 &bull; Direct Dependents (Venue, Catering, Gifts)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Venue Node */}
                  {(() => {
                    const node = rippleResult.affectedNodes.get('node-venue-func-wedding') || {
                      id: 'node-venue-func-wedding',
                      label: 'Heritage Lawns Venue',
                      category: 'venue' as const,
                      status: rippleResult.venueCapacityWarning ? 'critical' as const : 'normal' as const,
                      value: `Capacity: 200 pax`,
                      dataSource: 'Venue Contract',
                      isConfirmed: true
                    };
                    const visual = getNodeVisualConfig(node.status);
                    return (
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${visual.bg} ${visual.border} ${
                          selectedNodeId === node.id ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Building className="w-3.5 h-3.5 text-[#E7A83E]" />
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-[#302F28]">Heritage Lawns</p>
                        <p className="font-mono text-xs text-[#405B43] mt-1 font-bold">{node.value}</p>
                      </div>
                    );
                  })()}

                  {/* Catering Node */}
                  {(() => {
                    const node = rippleResult.affectedNodes.get('node-catering')!;
                    const visual = getNodeVisualConfig(node.status);
                    return (
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${visual.bg} ${visual.border} ${
                          selectedNodeId === node.id ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Utensils className="w-3.5 h-3.5 text-[#405B43]" />
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-[#302F28]">Royal Rasoi Catering</p>
                        <p className="font-mono text-xs text-[#405B43] mt-1 font-bold">{node.value}</p>
                      </div>
                    );
                  })()}

                  {/* Return Gifts Node */}
                  {(() => {
                    const node = rippleResult.affectedNodes.get('node-gifts')!;
                    const visual = getNodeVisualConfig(node.status);
                    return (
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${visual.bg} ${visual.border} ${
                          selectedNodeId === node.id ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Gift className="w-3.5 h-3.5 text-[#E7A83E]" />
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-[#302F28]">Favor Hampers</p>
                        <p className="font-mono text-xs text-[#405B43] mt-1 font-bold">{node.value}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Connecting Flow Lines */}
              <div className="flex justify-around text-xs text-[#77756B] py-0.5">
                <span className="flex items-center gap-1">&darr; Feeds procurement & layout</span>
                <span className="flex items-center gap-1">&darr; Feeds total financial ceiling</span>
              </div>

              {/* TIER 3: Downstream Aggregators (Total Budget & Overdue Tasks) */}
              <div>
                <p className="text-[10px] font-bold text-[#77756B] uppercase tracking-wider mb-2">
                  Tier 3 &bull; Downstream Impact (Total Budget & Deadlines)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Total Budget Node */}
                  {(() => {
                    const node = rippleResult.affectedNodes.get('node-total-budget')!;
                    const visual = getNodeVisualConfig(node.status);
                    return (
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${visual.bg} ${visual.border} ${
                          selectedNodeId === node.id ? 'shadow-md scale-[1.02]' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[#77756B] flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-[#405B43]" />
                            {node.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${visual.badgeBg} ${visual.badgeText}`}>
                            {visual.label}
                          </span>
                        </div>
                        <p className="font-serif font-bold text-base text-[#302F28]">{node.value}</p>
                        <p className="text-[11px] text-[#77756B] mt-0.5">
                          {rippleResult.isOverBudget 
                            ? `Over budget by ₹${rippleResult.overrunAmount.toLocaleString('en-IN')}` 
                            : 'Within target parameters'}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Overdue Tasks Node */}
                  {(() => {
                    const isCritical = rippleResult.overdueTaskCount > 0;
                    return (
                      <div
                        onClick={() => setSelectedNodeId('node-task-task-1')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isCritical ? 'bg-[#FAECE7] border-[#C76F50] ring-2 ring-[#C76F50]/30' : 'bg-[#FFFDF9] border-[#E7E0D3]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[#77756B] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#77756B]" />
                            Task Schedule Feasibility
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCritical ? 'bg-[#C76F50] text-white' : 'bg-[#405B43] text-white'
                          }`}>
                            {isCritical ? `${rippleResult.overdueTaskCount} Tasks Overdue` : 'Schedule Healthy'}
                          </span>
                        </div>
                        <p className="font-serif font-bold text-base text-[#302F28]">
                          {rippleResult.affectedTaskCount} Affected Milestones
                        </p>
                        <p className="text-[11px] text-[#77756B] mt-0.5">
                          {isCritical ? 'Urgent escalation to family leads' : 'Milestone dates synchronized'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper tip */}
          <div className="mt-6 pt-3 border-t border-[#E7E0D3] text-xs text-[#77756B] flex items-center justify-between">
            <span>Deterministic Graph Rules: Pure code, zero hallucinated math.</span>
            <span className="font-mono text-[11px] bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#E7E0D3]">
              Active Nodes: {rippleResult.affectedNodes.size}
            </span>
          </div>
        </div>

        {/* Right 1 Col: Deep Inspection Details Panel */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3] mb-4">
              <div>
                <p className="text-[10px] font-bold text-[#405B43] uppercase tracking-wider">Node Details Inspector</p>
                <h3 className="font-serif text-lg font-bold text-[#302F28]">{selectedNode.label}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getNodeVisualConfig(selectedNode.status).badgeBg} ${getNodeVisualConfig(selectedNode.status).badgeText}`}>
                {getNodeVisualConfig(selectedNode.status).label}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Current Value */}
              <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E7E0D3]">
                <p className="text-[10px] uppercase font-bold text-[#77756B]">Current Computed State</p>
                <p className="font-serif font-bold text-base text-[#302F28] mt-0.5">{selectedNode.value}</p>
                {selectedNode.previousValue && (
                  <p className="text-[11px] text-[#77756B] font-mono mt-0.5">
                    Previous baseline: {selectedNode.previousValue}
                  </p>
                )}
              </div>

              {/* What changed & Why */}
              <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E7E0D3]">
                <p className="text-[10px] uppercase font-bold text-[#77756B]">Causality & Why it Changed</p>
                <p className="text-[#302F28] mt-1 leading-relaxed">
                  {selectedNode.whyChanged || 'Operating within standard baseline parameters. No upstream ripple divergence detected.'}
                </p>
              </div>

              {/* Trigger Source */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#E7E0D3]">
                <span className="text-[#77756B]">Upstream Trigger:</span>
                <span className="font-medium text-[#405B43]">{selectedNode.triggerSource || 'Initial Organizer Plan'}</span>
              </div>

              {/* Data Source */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#E7E0D3]">
                <span className="text-[#77756B]">Authoritative Data Source:</span>
                <span className="font-medium text-[#302F28]">{selectedNode.dataSource || 'Event Ledger'}</span>
              </div>

              {/* Verification status */}
              <div className="flex justify-between items-center py-1.5 border-b border-[#E7E0D3]">
                <span className="text-[#77756B]">Verification:</span>
                <span className="font-medium text-[#405B43]">
                  {selectedNode.isConfirmed ? 'Confirmed & Grounded' : 'Simulation Estimate'}
                </span>
              </div>

              {/* Next Action Required */}
              <div className="bg-[#EDF3EC] p-3.5 rounded-2xl border border-[#DCE6D6]">
                <p className="text-[10px] uppercase font-bold text-[#405B43]">Recommended Action</p>
                <p className="text-[#526354] mt-0.5 font-medium leading-relaxed">
                  {selectedNode.nextAction || 'Continue tracking milestone progress.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action to resolve overrun */}
          <div className="mt-6 pt-4 border-t border-[#E7E0D3]">
            {rippleResult.isOverBudget ? (
              <button
                type="button"
                onClick={onOpenTradeoffModal}
                className="w-full py-3 px-4 bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Rebalance with Trade-off Simulator</span>
              </button>
            ) : (
              <p className="text-[11px] text-[#77756B] text-center italic">
                Plan is balanced within available budget and venue capacities.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
