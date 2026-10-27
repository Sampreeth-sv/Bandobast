import React, { useState } from 'react';
import { CelebrationEvent, EventType, EventFunction, BudgetCategory } from '../types';
import { X, Sparkles, Calendar, MapPin, Users, IndianRupee, Heart, Cake, Users2, Landmark, HelpCircle, Check } from 'lucide-react';

interface EventWizardModalProps {
  onEventCreated: (newEvent: CelebrationEvent) => void;
  onClose: () => void;
}

export const EventWizardModal: React.FC<EventWizardModalProps> = ({
  onEventCreated,
  onClose
}) => {
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [location, setLocation] = useState('Jaipur, Rajasthan');
  const [startDate, setStartDate] = useState('2026-12-05');
  const [endDate, setEndDate] = useState('2026-12-07');
  const [budget, setBudget] = useState(250000);
  const [guestCount, setGuestCount] = useState(150);
  const [primaryPriority, setPrimaryPriority] = useState('Food Quality & Catering');

  const eventTypes: { type: EventType; label: string; icon: any; defaultOccasion: string; defaultFunctions: string[] }[] = [
    {
      type: 'wedding',
      label: 'Wedding',
      icon: Heart,
      defaultOccasion: 'Multi-Function Traditional Indian Wedding',
      defaultFunctions: ['Mehendi & Sangeet', 'Vedic Wedding Ceremony', 'Grand Gala Reception']
    },
    {
      type: 'birthday',
      label: 'Birthday Bash',
      icon: Cake,
      defaultOccasion: 'Milestone Birthday Party',
      defaultFunctions: ['Evening Cocktails & Cake Cutting']
    },
    {
      type: 'engagement',
      label: 'Engagement / Roka',
      icon: Sparkles,
      defaultOccasion: 'Ring Ceremony & Family Celebration',
      defaultFunctions: ['Ring Exchange & Dinner Banquet']
    },
    {
      type: 'community',
      label: 'Community / Festival',
      icon: Landmark,
      defaultOccasion: 'Diwali / Navratri Cultural Gala',
      defaultFunctions: ['Cultural Performances & Community Feast']
    },
    {
      type: 'reunion',
      label: 'Family Reunion',
      icon: Users2,
      defaultOccasion: 'Annual Family Get-Together',
      defaultFunctions: ['Day Picnic & Evening Campfire Dinner']
    },
    {
      type: 'custom',
      label: 'Custom Event',
      icon: HelpCircle,
      defaultOccasion: 'Special Celebration',
      defaultFunctions: ['Main Gathering']
    }
  ];

  const handleSelectType = (selected: EventType) => {
    setEventType(selected);
    const config = eventTypes.find(t => t.type === selected);
    if (config) {
      setOccasion(config.defaultOccasion);
      if (!eventName || eventName.includes('Celebration') || eventName.includes('Wedding')) {
        setEventName(
          selected === 'wedding' ? 'Karan & Pooja Wedding' :
          selected === 'birthday' ? "Vikram's 40th Birthday" :
          selected === 'community' ? 'Community Diwali Mela' :
          selected === 'engagement' ? 'Ananya & Rohan Ring Ceremony' :
          'Family Golden Jubilee'
        );
      }
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation checks for date range and numeric inputs
    if (!startDate || !endDate) {
      setValidationError('Both start and end dates are required.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setValidationError('End date cannot be earlier than the start date.');
      return;
    }
    if (guestCount <= 0) {
      setValidationError('Guest count must be at least 1.');
      return;
    }
    if (budget <= 0) {
      setValidationError('Total event budget must be greater than zero.');
      return;
    }

    const selectedConfig = eventTypes.find(t => t.type === eventType)!;
    const initialFunctions: EventFunction[] = selectedConfig.defaultFunctions.map((name, i) => ({
      id: `func-${Date.now()}-${i}`,
      name,
      date: startDate,
      time: '06:00 PM - 10:30 PM',
      venueName: `${location} Banquet Grounds`,
      venueCapacity: Math.round(guestCount * 1.25),
      guestCount: guestCount,
      attireTheme: 'Festive Traditional',
      description: `Primary celebration slot for ${name}`,
      color: i === 0 ? '#405B43' : i === 1 ? '#E7A83E' : '#C76F50'
    }));

    // Generate event-specific default categories
    let initialCategories: BudgetCategory[] = [];
    if (eventType === 'wedding') {
      initialCategories = [
        {
          id: `cat-cat-${Date.now()}`,
          name: 'Catering & Dining',
          iconName: 'Utensils',
          color: '#405B43',
          plannedAmount: Math.round(budget * 0.40),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: true,
          notes: 'Multi-course regional feasts & live stations',
          lineItems: [
            {
              id: `li-c1-${Date.now()}`,
              categoryId: `cat-cat-${Date.now()}`,
              name: 'Per-Head Catering Service',
              unitCost: Math.round((budget * 0.40) / guestCount),
              unitType: 'per_guest',
              quantity: guestCount,
              plannedAmount: Math.round(budget * 0.40),
              committedAmount: 0,
              paidAmount: 0,
              isProtected: true,
              provenance: {
                source: 'user_entered',
                calculationBasis: `Initial budget allocation: ₹${Math.round((budget * 0.40) / guestCount)}/guest`,
                verified: true,
                lastUpdated: new Date().toISOString().split('T')[0]
              }
            }
          ]
        },
        {
          id: `cat-ven-${Date.now()}`,
          name: 'Venue & Property',
          iconName: 'Building',
          color: '#E7A83E',
          plannedAmount: Math.round(budget * 0.25),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Lawn and banquet space rentals',
          lineItems: []
        },
        {
          id: `cat-dec-${Date.now()}`,
          name: 'Decoration & Florals',
          iconName: 'Flower2',
          color: '#C76F50',
          plannedAmount: Math.round(budget * 0.18),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Floral mandap, stage & entrance lighting',
          lineItems: []
        },
        {
          id: `cat-pho-${Date.now()}`,
          name: 'Photography & Cinema',
          iconName: 'Camera',
          color: '#405B43',
          plannedAmount: Math.round(budget * 0.12),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Candid photographer & video coverage',
          lineItems: []
        },
        {
          id: `cat-con-${Date.now()}`,
          name: 'Contingency Reserve',
          iconName: 'ShieldAlert',
          color: '#77756B',
          plannedAmount: Math.round(budget * 0.05),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Buffer reserve for sudden price adjustments',
          lineItems: []
        }
      ];
    } else {
      // Birthday / Community / Get-Together template
      initialCategories = [
        {
          id: `cat-food-${Date.now()}`,
          name: 'Food & Refreshments',
          iconName: 'Utensils',
          color: '#405B43',
          plannedAmount: Math.round(budget * 0.50),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: true,
          notes: 'Buffet grazing, drinks, and cake',
          lineItems: [
            {
              id: `li-b1-${Date.now()}`,
              categoryId: `cat-food-${Date.now()}`,
              name: 'Buffet & Appetizers',
              unitCost: Math.round((budget * 0.50) / guestCount),
              unitType: 'per_guest',
              quantity: guestCount,
              plannedAmount: Math.round(budget * 0.50),
              committedAmount: 0,
              paidAmount: 0,
              isProtected: true,
              provenance: {
                source: 'user_entered',
                calculationBasis: `Initial allocation: ₹${Math.round((budget * 0.50) / guestCount)}/guest`,
                verified: true,
                lastUpdated: new Date().toISOString().split('T')[0]
              }
            }
          ]
        },
        {
          id: `cat-ven-${Date.now()}`,
          name: 'Venue & Audio Setup',
          iconName: 'Building',
          color: '#E7A83E',
          plannedAmount: Math.round(budget * 0.25),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Rental & sound equipment',
          lineItems: []
        },
        {
          id: `cat-dec-${Date.now()}`,
          name: 'Theme Styling & Favors',
          iconName: 'Sparkles',
          color: '#C76F50',
          plannedAmount: Math.round(budget * 0.15),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Balloons, signage & guest gifts',
          lineItems: []
        },
        {
          id: `cat-res-${Date.now()}`,
          name: 'Contingency Reserve',
          iconName: 'ShieldAlert',
          color: '#77756B',
          plannedAmount: Math.round(budget * 0.10),
          committedAmount: 0,
          paidAmount: 0,
          isMustPreserve: false,
          notes: 'Overrun safety buffer',
          lineItems: []
        }
      ];
    }

    const newEvent: CelebrationEvent = {
      id: `evt-${Date.now()}`,
      name: eventName || 'New Celebration',
      occasion: occasion || 'Celebration',
      eventType,
      location,
      startDate,
      endDate,
      totalBudget: budget,
      guestCount,
      contingencyReserve: Math.round(budget * 0.08),
      readinessScore: 45,
      functions: initialFunctions,
      categories: initialCategories,
      tasks: [
        {
          id: `t-${Date.now()}-1`,
          name: 'Lock RSVP & Confirmed Guest Count',
          description: 'Establish finalized attendance for catering bookings',
          dueDate: startDate,
          originalDueDate: startDate,
          category: 'Coordination',
          status: 'in_progress',
          priority: 'critical',
          dependencies: []
        },
        {
          id: `t-${Date.now()}-2`,
          name: 'Review & Confirm Vendor Quotes',
          description: 'Compare quotations via Bandobast Quote X-Ray',
          dueDate: startDate,
          originalDueDate: startDate,
          category: 'Vendors',
          status: 'not_started',
          priority: 'high',
          dependencies: [`t-${Date.now()}-1`]
        }
      ],
      quotes: [],
      priorities: [
        {
          id: 'p-1',
          label: primaryPriority,
          rank: 1,
          locked: true,
          description: 'Primary designated core priority'
        },
        {
          id: 'p-2',
          label: 'Guest Comfort & Experience',
          rank: 2,
          locked: false,
          description: 'Seating, welcome drinks and seamless hospitality'
        },
        {
          id: 'p-3',
          label: 'Theme Decoration & Aesthetic',
          rank: 3,
          locked: false,
          description: 'Lighting, staging and atmosphere'
        }
      ],
      protectedRequirements: [
        `${primaryPriority} must remain protected during budget trade-offs`
      ],
      activeSimulation: {
        activePreset: 'none',
        guestCountDelta: 0,
        dateDaysShift: 0,
        vendorIncreasePercent: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onEventCreated(newEvent);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div 
        className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#5A584F] hover:text-[#302F28] p-1.5 rounded-xl hover:bg-[#FAF7F0] focus-visible:ring-2 focus-visible:ring-[#405B43] cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#405B43] text-[#FAF7F0] flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-[#E7A83E]" />
          </div>
          <div>
            <h2 id="wizard-modal-title" className="font-serif text-2xl font-bold text-[#302F28]">Configure New Celebration</h2>
            <p className="text-xs text-[#5A584F]">Set up a living event twin for weddings, birthdays, reunions, or community galas.</p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          {/* 1. Event Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#405B43] uppercase tracking-wider mb-2">
              Select Celebration Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {eventTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = eventType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleSelectType(t.type)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDF3EC] border-[#405B43] text-[#405B43] font-semibold ring-1 ring-[#405B43]'
                        : 'bg-[#FAF7F0] border-[#E7E0D3] text-[#302F28] hover:border-[#405B43]/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#405B43]' : 'text-[#77756B]'}`} />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Celebration Name</label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Aarav & Meera Wedding"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28] focus:outline-hidden focus:border-[#405B43]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Occasion / Theme</label>
              <input
                type="text"
                required
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28] focus:outline-hidden focus:border-[#405B43]"
              />
            </div>
          </div>

          {/* 3. Location & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Location</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#77756B] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#77756B] absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">End Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#77756B] absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
                />
              </div>
            </div>
          </div>

          {/* 4. Budget & Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Total Target Budget (₹)</label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-[#77756B] absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  min="10000"
                  step="5000"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono font-bold text-[#405B43]"
                />
              </div>
              <p className="text-[10px] text-[#77756B] mt-1">₹{budget.toLocaleString('en-IN')} planned pool</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#302F28] mb-1">Initial Expected Guests</label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-[#77756B] absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  min="5"
                  max="5000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono font-bold text-[#302F28]"
                />
              </div>
              <p className="text-[10px] text-[#77756B] mt-1">Est. ₹{Math.round(budget / (guestCount || 1)).toLocaleString('en-IN')} / guest</p>
            </div>
          </div>

          {/* 5. Core Priority Selection */}
          <div>
            <label className="block text-xs font-medium text-[#302F28] mb-1">
              Protected Priority (Must Not Be Reduced During Trade-offs)
            </label>
            <select
              value={primaryPriority}
              onChange={(e) => setPrimaryPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
            >
              <option value="Food Quality & Catering">Food Quality & Authentic Catering</option>
              <option value="Guest Headcount Scale">Preserving Full Guest Count (No Cuts)</option>
              <option value="Photography & Cinema">Cinematic Photography & Film Documentation</option>
              <option value="Theme Decoration & Atmosphere">Visual Decor, Lighting & Floral Aesthetics</option>
              <option value="Hospitality & Convenience">Guest Experience, Shuttles & Comfort</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E0D3]">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-[#E7E0D3] text-[#302F28] hover:bg-[#FAF7F0] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-bold shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Initialize Event Twin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
