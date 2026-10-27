import React, { useState } from 'react';
import { RippleSimulationState, CelebrationEvent } from '../types';
import { X, Users, Calendar, TrendingUp, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface SimulateChangeModalProps {
  event: CelebrationEvent;
  currentSimulation: RippleSimulationState;
  onApplySimulation: (newSimulation: RippleSimulationState) => void;
  onClose: () => void;
}

export const SimulateChangeModal: React.FC<SimulateChangeModalProps> = ({
  event,
  currentSimulation,
  onApplySimulation,
  onClose
}) => {
  const [guestDelta, setGuestDelta] = useState(currentSimulation.guestCountDelta);
  const [daysShift, setDaysShift] = useState(currentSimulation.dateDaysShift);
  const [vendorHike, setVendorHike] = useState(currentSimulation.vendorIncreasePercent);
  const [activePreset, setActivePreset] = useState<RippleSimulationState['activePreset']>(currentSimulation.activePreset);

  const applyPreset = (preset: 'guest_increase' | 'early_date' | 'vendor_increase' | 'none') => {
    setActivePreset(preset);
    if (preset === 'guest_increase') {
      setGuestDelta(40); // 180 -> 220
      setDaysShift(0);
      setVendorHike(0);
    } else if (preset === 'early_date') {
      setGuestDelta(0);
      setDaysShift(-14); // 2 weeks earlier
      setVendorHike(0);
    } else if (preset === 'vendor_increase') {
      setGuestDelta(0);
      setDaysShift(0);
      setVendorHike(20); // +20%
    } else {
      setGuestDelta(0);
      setDaysShift(0);
      setVendorHike(0);
    }
  };

  const handleApply = () => {
    onApplySimulation({
      activePreset,
      guestCountDelta: guestDelta,
      dateDaysShift: daysShift,
      vendorIncreasePercent: vendorHike
    });
    onClose();
  };

  const currentTotalGuests = event.guestCount + guestDelta;
  const maxVenueCapacity = Math.max(...event.functions.map(f => f.venueCapacity), 200);
  const isOverCapacity = currentTotalGuests > maxVenueCapacity;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div 
        className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulate-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#5A584F] hover:text-[#302F28] p-1.5 rounded-xl hover:bg-[#FAF7F0] focus-visible:ring-2 focus-visible:ring-[#405B43] cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#E7A83E]/20 text-[#B45309] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 id="simulate-modal-title" className="font-serif text-2xl font-bold text-[#302F28]">Simulate an Event Change</h2>
            <p className="text-xs text-[#5A584F]">Test how changes ripple through budgets, deadlines & venue capacities.</p>
          </div>
        </div>

        {/* Quick Presets required by spec */}
        <div className="my-5">
          <p className="text-xs font-semibold text-[#405B43] uppercase tracking-wider mb-2.5">
            Demonstration Presets
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset('guest_increase')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activePreset === 'guest_increase'
                  ? 'bg-[#EDF3EC] border-[#405B43] ring-2 ring-[#405B43]/20'
                  : 'bg-[#FAF7F0] border-[#E7E0D3] hover:border-[#405B43]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Users className="w-4 h-4 text-[#405B43]" />
                <span className="text-[10px] font-bold text-[#405B43] uppercase bg-[#FAF7F0] px-1.5 py-0.5 rounded">Preset 1</span>
              </div>
              <p className="font-serif font-bold text-xs text-[#302F28]">+40 Guests</p>
              <p className="text-[10px] text-[#77756B] mt-0.5">180 &rarr; 220 attendees</p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('early_date')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activePreset === 'early_date'
                  ? 'bg-[#EDF3EC] border-[#405B43] ring-2 ring-[#405B43]/20'
                  : 'bg-[#FAF7F0] border-[#E7E0D3] hover:border-[#405B43]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Calendar className="w-4 h-4 text-[#C76F50]" />
                <span className="text-[10px] font-bold text-[#C76F50] uppercase bg-[#FAF7F0] px-1.5 py-0.5 rounded">Preset 2</span>
              </div>
              <p className="font-serif font-bold text-xs text-[#302F28]">-2 Weeks Earlier</p>
              <p className="text-[10px] text-[#77756B] mt-0.5">Compress lead-times</p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('vendor_increase')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activePreset === 'vendor_increase'
                  ? 'bg-[#EDF3EC] border-[#405B43] ring-2 ring-[#405B43]/20'
                  : 'bg-[#FAF7F0] border-[#E7E0D3] hover:border-[#405B43]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="w-4 h-4 text-[#E7A83E]" />
                <span className="text-[10px] font-bold text-[#E7A83E] uppercase bg-[#FAF7F0] px-1.5 py-0.5 rounded">Preset 3</span>
              </div>
              <p className="font-serif font-bold text-xs text-[#302F28]">+20% Quote Hike</p>
              <p className="text-[10px] text-[#77756B] mt-0.5">Catering & florals</p>
            </button>
          </div>
        </div>

        {/* Custom Fine-Tuning Sliders */}
        <div className="space-y-4 pt-2 border-t border-[#E7E0D3]">
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-[#302F28] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#405B43]" />
                Guest Count Adjustment
              </span>
              <span className="font-mono font-bold text-[#405B43]">
                {guestDelta >= 0 ? `+${guestDelta}` : guestDelta} guests (Total: {currentTotalGuests})
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="80"
              step="5"
              value={guestDelta}
              onChange={(e) => {
                setActivePreset('custom');
                setGuestDelta(parseInt(e.target.value));
              }}
              className="w-full accent-[#405B43] cursor-pointer"
            />
            {isOverCapacity && (
              <p className="text-[11px] text-[#C76F50] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Exceeds venue capacity ({maxVenueCapacity} guests) by {currentTotalGuests - maxVenueCapacity} people!</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-[#302F28] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C76F50]" />
                Event Date Shift
              </span>
              <span className="font-mono font-bold text-[#C76F50]">
                {daysShift === 0 ? 'No date change' : daysShift < 0 ? `${Math.abs(daysShift)} days earlier` : `${daysShift} days later`}
              </span>
            </div>
            <input
              type="range"
              min="-28"
              max="28"
              step="7"
              value={daysShift}
              onChange={(e) => {
                setActivePreset('custom');
                setDaysShift(parseInt(e.target.value));
              }}
              className="w-full accent-[#C76F50] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-[#302F28] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E7A83E]" />
                Vendor Quotation Hike
              </span>
              <span className="font-mono font-bold text-[#B45309]">
                +{vendorHike}% Price Increase
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={vendorHike}
              onChange={(e) => {
                setActivePreset('custom');
                setVendorHike(parseInt(e.target.value));
              }}
              className="w-full accent-[#E7A83E] cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 mt-7 pt-4 border-t border-[#E7E0D3]">
          <button
            type="button"
            onClick={() => applyPreset('none')}
            className="text-xs text-[#77756B] hover:text-[#302F28] underline underline-offset-4"
          >
            Clear Simulation
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[#E7E0D3] text-[#302F28] hover:bg-[#FAF7F0] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="py-2.5 px-5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-semibold flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <span>Propagate Ripple Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
