import React, { useState, useEffect } from 'react';
import { 
  CelebrationEvent, 
  ChatSession, 
  VendorRecommendation, 
  RecommendationCategory 
} from '../types';
import { fetchBudgetVendorRecommendations } from '../services/aiService';
import { 
  Sparkles, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  IndianRupee, 
  Building, 
  Utensils, 
  Camera, 
  Flower2, 
  Star, 
  Phone, 
  Check, 
  GitFork, 
  Wallet, 
  FileSpreadsheet, 
  CalendarClock, 
  Clock, 
  Sliders,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HomeHubViewProps {
  currentEvent: CelebrationEvent;
  chatSessions: ChatSession[];
  onStartNewChat: () => void;
  onSelectChatSession: (sessionId: string) => void;
  onNavigateTab: (tab: any) => void;
  onUpdateEventBudget: (newBudget: number) => void;
  onAddVendorToLedger: (rec: VendorRecommendation) => void;
  onOpenSimulateModal: () => void;
}

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  currentEvent,
  chatSessions,
  onStartNewChat,
  onSelectChatSession,
  onNavigateTab,
  onUpdateEventBudget,
  onAddVendorToLedger,
  onOpenSimulateModal
}) => {
  const [budgetSlider, setBudgetSlider] = useState<number>(currentEvent.totalBudget);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | RecommendationCategory>('all');
  const [recommendations, setRecommendations] = useState<VendorRecommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Load recommendations when budget or category changes
  useEffect(() => {
    let isMounted = true;
    const loadRecs = async () => {
      setIsLoadingRecs(true);
      const res = await fetchBudgetVendorRecommendations({
        budget: budgetSlider,
        location: currentEvent.location,
        guestCount: currentEvent.guestCount,
        category: selectedCategoryFilter,
        occasion: currentEvent.occasion
      });
      if (isMounted && res.success && res.recommendations) {
        setRecommendations(res.recommendations);
      }
      if (isMounted) setIsLoadingRecs(false);
    };

    const timer = setTimeout(loadRecs, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [budgetSlider, selectedCategoryFilter, currentEvent.location, currentEvent.guestCount, currentEvent.occasion]);

  const handleApplyBudgetToEvent = () => {
    onUpdateEventBudget(budgetSlider);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#405B43', '#E7A83E', '#FAF7F0']
    });
  };

  const handleAddVendor = (rec: VendorRecommendation) => {
    onAddVendorToLedger(rec);
    setAddedIds(prev => new Set(prev).add(rec.id));
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#E7A83E', '#405B43']
    });
  };

  const categories = [
    { id: 'all', label: 'All Picks', icon: Sparkles },
    { id: 'venue', label: 'Places & Venues', icon: Building },
    { id: 'catering', label: 'Food & Catering', icon: Utensils },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'decor', label: 'Decoration & Florals', icon: Flower2 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Royal Welcome Hero Card */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#E7A83E]/15 to-transparent rounded-full -translate-y-24 translate-x-24 pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E7A83E]" />
            <span>AI-Powered Event Operations Platform</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#302F28] tracking-tight leading-tight">
            Welcome to Bandobast
          </h1>

          <p className="text-sm sm:text-base text-[#77756B] mt-2.5 leading-relaxed">
            One change. A thousand connections. Plan celebrations, chat with our AI advisor, explore top places and caterers tailored to your exact budget, and manage your living event twin.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <button
              type="button"
              onClick={onStartNewChat}
              className="px-5 py-3 rounded-2xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#E7A83E]" />
              <span>Start New AI Chat</span>
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('ripple')}
              className="px-5 py-3 rounded-2xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <GitFork className="w-4 h-4" />
              <span>Open Ripple Engine</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('overview')}
              className="px-4 py-3 rounded-2xl border border-[#E7E0D3] hover:bg-[#FAF7F0] text-[#302F28] font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Chat Sessions Hub & Interactive Budget Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chat Sessions (New Chat or Resume Old Chat) */}
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3] mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#405B43]" />
                <h3 className="font-serif text-lg font-bold text-[#302F28]">Conversations & Chats</h3>
              </div>
              <button
                type="button"
                onClick={onStartNewChat}
                className="text-xs font-bold text-[#405B43] hover:text-[#324734] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            <p className="text-xs text-[#77756B] mb-3">
              Resume past consultations with Bandobast AI or start fresh:
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {chatSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#77756B] bg-[#FAF7F0] rounded-2xl border border-dashed border-[#E7E0D3]">
                  No past chats yet. Click "Start New AI Chat" to begin!
                </div>
              ) : (
                chatSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      onSelectChatSession(session.id);
                      onNavigateTab('chat');
                    }}
                    className="w-full p-3.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#EDF3EC] border border-[#E7E0D3] hover:border-[#405B43]/50 transition-all text-left flex items-start justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <p className="font-serif font-bold text-xs text-[#302F28] group-hover:text-[#405B43]">
                        {session.title}
                      </p>
                      <p className="text-[11px] text-[#77756B] mt-0.5 line-clamp-1">
                        {session.messages[session.messages.length - 1]?.content || 'Planning discussion'}
                      </p>
                      <span className="text-[10px] font-mono text-[#405B43] font-semibold block mt-1">
                        Budget Context: ₹{session.budget.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#77756B] group-hover:text-[#405B43] shrink-0 mt-1" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E7E0D3]">
            <button
              type="button"
              onClick={onStartNewChat}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F0] hover:bg-[#EDF3EC] text-[#405B43] font-semibold text-xs border border-[#405B43]/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Planning Chat</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Interactive Celebration Budget Controller */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3] mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#405B43] uppercase tracking-wider">
                  Live Budget Controller
                </span>
                <h3 className="font-serif text-xl font-bold text-[#302F28]">
                  Adjust Celebration Budget
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#77756B]">Current Event:</span>
                <span className="font-serif font-bold text-xs text-[#302F28] bg-[#FAF7F0] px-2.5 py-1 rounded-xl border border-[#E7E0D3]">
                  {currentEvent.name}
                </span>
              </div>
            </div>

            {/* Big Interactive Amount & Slider */}
            <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#E7E0D3] mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-[#77756B] uppercase tracking-wider">
                  Target Event Budget Ceiling
                </span>

                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-sm font-bold text-[#77756B]">₹</span>
                  <input
                    type="number"
                    min="50000"
                    max="5000000"
                    step="10000"
                    value={budgetSlider}
                    onChange={(e) => setBudgetSlider(parseInt(e.target.value) || 0)}
                    className="font-serif font-bold text-2xl text-[#405B43] bg-[#FFFDF9] px-3 py-1 rounded-xl border border-[#E7E0D3] w-48 text-right focus:outline-hidden focus:border-[#405B43]"
                  />
                </div>
              </div>

              <input
                type="range"
                min="100000"
                max="2500000"
                step="25000"
                value={budgetSlider}
                onChange={(e) => setBudgetSlider(parseInt(e.target.value))}
                className="w-full accent-[#405B43] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-[#77756B] font-mono mt-1">
                <span>₹1,00,000 (Boutique)</span>
                <span>₹5,00,000 (Classic)</span>
                <span>₹10,00,000 (Grand)</span>
                <span>₹25,00,000 (Royal)</span>
              </div>
            </div>

            {/* Real-time Category Allocations Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E7E0D3]">
                <span className="text-[10px] text-[#77756B] uppercase font-semibold">Catering (38%)</span>
                <p className="font-serif font-bold text-sm text-[#405B43] mt-0.5">
                  ₹{Math.round(budgetSlider * 0.38).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#77756B] font-mono mt-0.5">
                  ~₹{Math.round((budgetSlider * 0.38) / (currentEvent.guestCount || 180))}/guest
                </p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E7E0D3]">
                <span className="text-[10px] text-[#77756B] uppercase font-semibold">Venue (22%)</span>
                <p className="font-serif font-bold text-sm text-[#302F28] mt-0.5">
                  ₹{Math.round(budgetSlider * 0.22).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#77756B] mt-0.5">Lawn & Hall package</p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E7E0D3]">
                <span className="text-[10px] text-[#77756B] uppercase font-semibold">Photo/Cinema (13%)</span>
                <p className="font-serif font-bold text-sm text-[#302F28] mt-0.5">
                  ₹{Math.round(budgetSlider * 0.13).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#77756B] mt-0.5">Candid & Teaser</p>
              </div>

              <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E7E0D3]">
                <span className="text-[10px] text-[#77756B] uppercase font-semibold">Decor & Flowers (16%)</span>
                <p className="font-serif font-bold text-sm text-[#C76F50] mt-0.5">
                  ₹{Math.round(budgetSlider * 0.16).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#77756B] mt-0.5">Vedic Mandap</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7E0D3] flex items-center justify-between gap-3">
            <span className="text-xs text-[#77756B]">
              Changes update vendor recommendations and recalculate living plan ledger.
            </span>
            <button
              type="button"
              onClick={handleApplyBudgetToEvent}
              className="px-5 py-2.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-bold text-xs flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#E7A83E]" />
              <span>Apply ₹{budgetSlider.toLocaleString('en-IN')} to Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Gen AI Recommendation Engine (Venues, Catering, Photography based on Budget) */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E0D3]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7A83E]/15 text-[#B45309] text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gen AI Vendor Intelligence</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#302F28]">
              Recommended Places, Catering & Photography
            </h2>
            <p className="text-xs text-[#77756B] mt-0.5">
              Grounded in your specified budget of <strong className="text-[#405B43]">₹{budgetSlider.toLocaleString('en-IN')}</strong> in {currentEvent.location}.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategoryFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(c.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs' 
                      : 'bg-[#FAF7F0] border border-[#E7E0D3] text-[#77756B] hover:text-[#302F28]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendations Cards Grid */}
        {isLoadingRecs ? (
          <div className="py-16 text-center text-xs text-[#77756B]">
            <div className="w-6 h-6 border-2 border-[#405B43] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Evaluating vendor rate cards and venue availability for ₹{budgetSlider.toLocaleString('en-IN')}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((rec) => {
              const isAdded = addedIds.has(rec.id);
              return (
                <div
                  key={rec.id}
                  className="bg-[#FAF7F0] border border-[#E7E0D3] hover:border-[#405B43]/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xs"
                >
                  <div>
                    {/* Category & Match Score */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[#405B43] uppercase text-[10px] tracking-wider">
                        {rec.category}
                      </span>
                      <span className="bg-[#EDF3EC] text-[#405B43] px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {rec.matchScore}% Match
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[#302F28] leading-tight">
                      {rec.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 text-xs text-[#77756B]">
                      <span className="flex items-center gap-1 text-[#E7A83E]">
                        <Star className="w-3 h-3 fill-[#E7A83E]" />
                        <span className="font-bold text-[#302F28]">{rec.rating}</span>
                      </span>
                      <span>•</span>
                      <span>{rec.reviewsCount} verified reviews</span>
                    </div>

                    <p className="text-xs text-[#526354] mt-2.5 leading-relaxed line-clamp-3">
                      {rec.fitDescription}
                    </p>

                    {/* Highlights */}
                    <div className="space-y-1 mt-3 text-[11px] text-[#302F28]">
                      {rec.highlights.slice(0, 2).map((h, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-[#405B43] shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Add to Ledger CTA */}
                  <div className="mt-5 pt-3 border-t border-[#E7E0D3]">
                    <div className="flex items-baseline justify-between mb-2.5">
                      <span className="text-[11px] text-[#77756B]">Estimated:</span>
                      <span className="font-serif font-bold text-sm text-[#405B43]">
                        ₹{rec.estimatedCost.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddVendor(rec)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isAdded 
                          ? 'bg-[#EDF3EC] text-[#405B43] border border-[#405B43]/30' 
                          : 'bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Event Ledger</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#E7A83E]" />
                          <span>Add to Event Budget</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 4: Fast Navigation Grid to Core Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('ripple')}
          className="bg-[#FFFDF9] border border-[#E7E0D3] hover:border-[#405B43]/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#405B43]/10 text-[#405B43] flex items-center justify-center mb-3">
            <GitFork className="w-5 h-5 text-[#405B43]" />
          </div>
          <h4 className="font-serif font-bold text-sm text-[#302F28]">Ripple Engine</h4>
          <p className="text-xs text-[#77756B] mt-1 leading-relaxed">
            Test guest count shifts, date compression, and supplier quote spikes.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('budget')}
          className="bg-[#FFFDF9] border border-[#E7E0D3] hover:border-[#405B43]/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#E7A83E]/15 text-[#B45309] flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-[#E7A83E]" />
          </div>
          <h4 className="font-serif font-bold text-sm text-[#302F28]">Budget Studio</h4>
          <p className="text-xs text-[#77756B] mt-1 leading-relaxed">
            Manage granular categories, per-head costs, and verified data provenance.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('quotes')}
          className="bg-[#FFFDF9] border border-[#E7E0D3] hover:border-[#405B43]/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C76F50]/15 text-[#C76F50] flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-5 h-5 text-[#C76F50]" />
          </div>
          <h4 className="font-serif font-bold text-sm text-[#302F28]">Quote X-Ray</h4>
          <p className="text-xs text-[#77756B] mt-1 leading-relaxed">
            Extract PDF & WhatsApp quotes, spot omissions, and draft inquiries.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('timeline')}
          className="bg-[#FFFDF9] border border-[#E7E0D3] hover:border-[#405B43]/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#405B43]/10 text-[#405B43] flex items-center justify-center mb-3">
            <CalendarClock className="w-5 h-5 text-[#405B43]" />
          </div>
          <h4 className="font-serif font-bold text-sm text-[#302F28]">Timeline & ICS</h4>
          <p className="text-xs text-[#77756B] mt-1 leading-relaxed">
            Sequential ceremony tracking and one-click iCalendar phone export.
          </p>
        </div>
      </div>
    </div>
  );
};
