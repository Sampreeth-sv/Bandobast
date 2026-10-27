import React, { useState } from 'react';
import { CelebrationEvent, PriorityItem } from '../types';
import { 
  SlidersHorizontal, 
  Lock, 
  Unlock, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Edit2, 
  AlertCircle 
} from 'lucide-react';

interface PrioritiesViewProps {
  event: CelebrationEvent;
  onUpdateEvent: (updatedEvent: CelebrationEvent) => void;
  onOpenTradeoffModal: () => void;
}

export const PrioritiesView: React.FC<PrioritiesViewProps> = ({
  event,
  onUpdateEvent,
  onOpenTradeoffModal
}) => {
  const [priorities, setPriorities] = useState<PriorityItem[]>(event.priorities);
  const [protectedList, setProtectedList] = useState<string[]>(event.protectedRequirements);
  const [newRequirement, setNewRequirement] = useState('');

  // Event details editing
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [eventName, setEventName] = useState(event.name);
  const [totalBudget, setTotalBudget] = useState(event.totalBudget);
  const [guestCount, setGuestCount] = useState(event.guestCount);
  const [location, setLocation] = useState(event.location);

  const handleToggleLock = (id: string) => {
    const updated = priorities.map(p => 
      p.id === id ? { ...p, locked: !p.locked } : p
    );
    setPriorities(updated);
    onUpdateEvent({ ...event, priorities: updated, updatedAt: new Date().toISOString() });
  };

  const handleMoveRank = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === priorities.length - 1)) {
      return;
    }
    const newItems = [...priorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Reassign ranks 1..N
    const reRanked = newItems.map((item, i) => ({ ...item, rank: i + 1 }));
    setPriorities(reRanked);
    onUpdateEvent({ ...event, priorities: reRanked, updatedAt: new Date().toISOString() });
  };

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequirement.trim()) return;

    const updated = [...protectedList, newRequirement.trim()];
    setProtectedList(updated);
    onUpdateEvent({ ...event, protectedRequirements: updated, updatedAt: new Date().toISOString() });
    setNewRequirement('');
  };

  const handleDeleteRequirement = (index: number) => {
    const updated = protectedList.filter((_, i) => i !== index);
    setProtectedList(updated);
    onUpdateEvent({ ...event, protectedRequirements: updated, updatedAt: new Date().toISOString() });
  };

  const handleSaveEventDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEvent({
      ...event,
      name: eventName,
      totalBudget: totalBudget,
      guestCount: guestCount,
      location: location,
      updatedAt: new Date().toISOString()
    });
    setIsEditingEvent(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6]">
              Family Priority Compass
            </span>
            <span className="text-xs text-[#77756B]">Value Governance & Non-Negotiable Locks</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302F28]">Priority Hierarchy & Trade-off Rules</h1>
          <p className="text-xs text-[#77756B] mt-1 max-w-2xl">
            Rank what matters most to the family. When cost overruns occur, the simulator preserves top-ranked and locked items while proposing intelligent reductions elsewhere.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTradeoffModal}
          className="px-4 py-2.5 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch 3-Way Trade-off Simulator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Compass Ranking */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3]">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#302F28]">Ranked Priorities</h3>
              <p className="text-xs text-[#77756B]">Top items receive maximum budget protection in scenarios.</p>
            </div>
            <span className="text-xs text-[#405B43] font-semibold bg-[#EDF3EC] px-2.5 py-0.5 rounded-full">
              {priorities.filter(p => p.locked).length} Locked Items
            </span>
          </div>

          <div className="space-y-3">
            {priorities.map((item, index) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  item.locked 
                    ? 'bg-[#EDF3EC] border-[#405B43]/40 shadow-xs' 
                    : 'bg-[#FAF7F0] border-[#E7E0D3]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-serif font-bold text-sm ${
                    item.locked ? 'bg-[#405B43] text-[#FAF7F0]' : 'bg-[#E7E0D3] text-[#302F28]'
                  }`}>
                    #{item.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-serif font-bold text-sm text-[#302F28]">{item.label}</p>
                      {item.locked && (
                        <span className="text-[10px] font-bold bg-[#405B43] text-white px-2 py-0.2 rounded-full uppercase">
                          Non-Negotiable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#77756B] mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleLock(item.id)}
                    className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                      item.locked 
                        ? 'bg-[#405B43] text-white border-[#405B43]' 
                        : 'bg-[#FFFDF9] text-[#77756B] border-[#E7E0D3] hover:text-[#302F28]'
                    }`}
                    title={item.locked ? 'Locked: Guaranteed no cuts' : 'Click to lock as non-negotiable'}
                  >
                    {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveRank(index, 'up')}
                      className="p-1 rounded-md bg-[#FFFDF9] border border-[#E7E0D3] text-[#77756B] hover:text-[#302F28] disabled:opacity-30 cursor-pointer"
                      title="Move higher priority"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === priorities.length - 1}
                      onClick={() => handleMoveRank(index, 'down')}
                      className="p-1 rounded-md bg-[#FFFDF9] border border-[#E7E0D3] text-[#77756B] hover:text-[#302F28] disabled:opacity-30 cursor-pointer"
                      title="Move lower priority"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Protected Requirements & Event Meta */}
        <div className="space-y-6">
          {/* Protected Requirements Card */}
          <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#405B43]" />
                <h3 className="font-serif text-lg font-bold text-[#302F28]">Family Mandates</h3>
              </div>
              <p className="text-xs text-[#77756B]">Strict constraints that cannot be altered.</p>
            </div>

            <ul className="space-y-2 text-xs">
              {protectedList.map((req, i) => (
                <li key={i} className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E7E0D3] flex items-center justify-between gap-2 text-[#302F28]">
                  <span>{req}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequirement(i)}
                    className="text-[#77756B] hover:text-[#C76F50] p-1 rounded-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddRequirement} className="flex gap-2 pt-2 border-t border-[#E7E0D3]">
              <input
                type="text"
                placeholder="Add new family rule..."
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#405B43] text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Core Event Parameters Card */}
          <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7E0D3]">
              <h3 className="font-serif text-base font-bold text-[#302F28]">Event Parameters</h3>
              <button
                type="button"
                onClick={() => setIsEditingEvent(!isEditingEvent)}
                className="text-xs text-[#405B43] hover:underline flex items-center gap-1 font-medium"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingEvent ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {isEditingEvent ? (
              <form onSubmit={handleSaveEventDetails} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#77756B] mb-1 font-medium">Event Title</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0]"
                  />
                </div>
                <div>
                  <label className="block text-[#77756B] mb-1 font-medium">Total Budget (₹)</label>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#77756B] mb-1 font-medium">Guest Headcount</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#77756B] mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#405B43] text-white rounded-xl text-xs font-semibold cursor-pointer mt-2"
                >
                  Save Parameters
                </button>
              </form>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E7E0D3]">
                  <span className="text-[#77756B]">Name:</span>
                  <span className="font-semibold text-[#302F28]">{event.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E7E0D3]">
                  <span className="text-[#77756B]">Budget Ceiling:</span>
                  <span className="font-mono font-bold text-[#405B43]">₹{event.totalBudget.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E7E0D3]">
                  <span className="text-[#77756B]">Baseline Guests:</span>
                  <span className="font-mono font-bold text-[#302F28]">{event.guestCount} pax</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#77756B]">Location:</span>
                  <span className="font-medium text-[#77756B]">{event.location}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
