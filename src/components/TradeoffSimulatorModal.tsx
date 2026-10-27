import React, { useState } from 'react';
import { CelebrationEvent, Scenario } from '../types';
import { calculateTradeoffScenarios, applyScenarioToEvent } from '../services/rippleEngine';
import { X, CheckCircle, Shield, AlertTriangle, ArrowRight, Utensils, Users, Camera, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TradeoffSimulatorModalProps {
  event: CelebrationEvent;
  overrunAmount: number;
  onApplyScenario: (updatedEvent: CelebrationEvent) => void;
  onClose: () => void;
}

export const TradeoffSimulatorModal: React.FC<TradeoffSimulatorModalProps> = ({
  event,
  overrunAmount,
  onApplyScenario,
  onClose
}) => {
  const scenarios = calculateTradeoffScenarios(event, overrunAmount);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const handleApply = (scen: Scenario) => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#405B43', '#E7A83E', '#C76F50', '#FAF7F0']
    });

    const updated = applyScenarioToEvent(event, scen);
    onApplyScenario(updated);
    onClose();
  };

  const getScenarioIcon = (key: Scenario['key']) => {
    switch (key) {
      case 'protect_food':
        return <Utensils className="w-4 h-4 text-[#405B43]" />;
      case 'protect_guests':
        return <Users className="w-4 h-4 text-[#E7A83E]" />;
      case 'protect_memories':
        return <Camera className="w-4 h-4 text-[#C76F50]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#405B43]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
      <div 
        className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E7E0D3]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7A83E]/15 text-[#B45309] text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Priority Compass & Trade-off Engine</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#302F28]">
              Rebalance Budget: 3 Living Scenarios
            </h2>
            <p className="text-xs text-[#77756B]">
              Deterministic trade-off proposals adhering to your protected requirements. Choose a strategy to sync the plan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#77756B] hover:text-[#302F28] p-1.5 rounded-xl hover:bg-[#FAF7F0]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Scenario Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {scenarios.map((scen) => {
            const isSelected = scen.id === selectedScenarioId;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => setSelectedScenarioId(scen.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#EDF3EC] border-[#405B43] shadow-sm ring-2 ring-[#405B43]/20'
                    : 'bg-[#FAF7F0] border-[#E7E0D3] hover:border-[#405B43]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getScenarioIcon(scen.key)}
                    <span className="font-serif font-bold text-sm text-[#302F28]">{scen.title}</span>
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-[#405B43]" />}
                </div>

                <p className="text-[11px] font-medium text-[#405B43] mb-1.5">{scen.subtitle}</p>
                <p className="text-[11px] text-[#77756B] line-clamp-2 leading-relaxed">{scen.description}</p>

                <div className="mt-3 pt-2 border-t border-[#E7E0D3]/60 flex items-center justify-between text-xs">
                  <span className="text-[#77756B]">Est. Savings:</span>
                  <span className="font-mono font-bold text-[#405B43]">₹{scen.savings.toLocaleString('en-IN')}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspection of Selected Scenario */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Summary Metric Ribbon */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#77756B]">Original Total</p>
              <p className="font-mono font-bold text-sm text-[#302F28] mt-0.5">
                ₹{selectedScenario.originalTotal.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#405B43]">Revised Total</p>
              <p className="font-mono font-bold text-sm text-[#405B43] mt-0.5">
                ₹{selectedScenario.revisedTotal.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#E7A83E]">Net Savings</p>
              <p className="font-mono font-bold text-sm text-[#B45309] mt-0.5">
                ₹{selectedScenario.savings.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#77756B]">Budget Variance</p>
              <p className={`font-mono font-bold text-sm mt-0.5 ${selectedScenario.variance <= 0 ? 'text-[#405B43]' : 'text-[#C76F50]'}`}>
                {selectedScenario.variance <= 0 
                  ? `₹${Math.abs(selectedScenario.variance).toLocaleString('en-IN')} surplus` 
                  : `₹${selectedScenario.variance.toLocaleString('en-IN')} gap`}
              </p>
            </div>
          </div>

          {/* Line-item Changes Table */}
          <div className="border border-[#E7E0D3] rounded-2xl overflow-hidden bg-[#FFFDF9]">
            <div className="bg-[#FAF7F0] px-4 py-2.5 border-b border-[#E7E0D3] flex items-center justify-between text-xs font-semibold text-[#302F28]">
              <span>Category & Proposed Adjustment</span>
              <span>Amount Diff & Rationale</span>
            </div>
            <div className="divide-y divide-[#E7E0D3]">
              {selectedScenario.changes.map((change, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="sm:max-w-[55%]">
                    <p className="font-serif font-bold text-sm text-[#302F28]">{change.categoryName}</p>
                    <p className="text-[11px] text-[#77756B] mt-0.5">{change.rationale}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right self-end sm:self-center font-mono">
                    <div>
                      <span className="text-[#77756B] line-through text-[11px]">₹{change.originalAmount.toLocaleString('en-IN')}</span>
                      <span className="mx-1 text-[#77756B]">&rarr;</span>
                      <span className="font-bold text-[#405B43]">₹{change.revisedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#405B43]/10 text-[#405B43]">
                      {change.delta >= 0 ? `+₹${change.delta.toLocaleString('en-IN')}` : `-₹${Math.abs(change.delta).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column: Protected Items vs Compromises & Assumptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#EDF3EC] border border-[#DCE6D6]">
              <div className="flex items-center gap-2 mb-2 font-semibold text-[#405B43]">
                <Shield className="w-4 h-4 text-[#405B43]" />
                <span>Protected Priorities (Untouched)</span>
              </div>
              <ul className="space-y-1.5 text-[#302F28]">
                {selectedScenario.protectedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#405B43] font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAECE7] border border-[#E7E0D3]">
              <div className="flex items-center gap-2 mb-2 font-semibold text-[#C76F50]">
                <AlertTriangle className="w-4 h-4 text-[#C76F50]" />
                <span>Compromises & Known Assumptions</span>
              </div>
              <ul className="space-y-1.5 text-[#302F28]">
                {selectedScenario.compromises.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#C76F50] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-3 border-t border-[#E7E0D3] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#77756B] italic hidden sm:block">
            Applying this scenario will synchronize Budget Studio, Ripple Engine, and Timeline.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[#E7E0D3] text-[#302F28] hover:bg-[#FAF7F0] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApply(selectedScenario)}
              className="py-2.5 px-5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-bold flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>Apply "{selectedScenario.title}" to Living Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
