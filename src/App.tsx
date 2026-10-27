import React, { useState, useEffect } from 'react';
import { 
  CelebrationEvent, 
  RippleSimulationState, 
  VendorQuote, 
  ChatSession, 
  ChatMessage, 
  VendorRecommendation,
  BudgetLineItem
} from './types';
import { SAMPLE_WEDDING, SAMPLE_BIRTHDAY } from './data/sampleCelebration';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { HomeHubView } from './components/HomeHubView';
import { AiChatView } from './components/AiChatView';
import { OverviewView } from './components/OverviewView';
import { BudgetStudioView } from './components/BudgetStudioView';
import { RippleEngineView } from './components/RippleEngineView';
import { VendorQuotesView } from './components/VendorQuotesView';
import { TimelineView } from './components/TimelineView';
import { PrioritiesView } from './components/PrioritiesView';
import { SimulateChangeModal } from './components/SimulateChangeModal';
import { TradeoffSimulatorModal } from './components/TradeoffSimulatorModal';
import { EventWizardModal } from './components/EventWizardModal';
import { calculateBudgetTotals, calculateEventReadiness } from './services/rippleEngine';

const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Jaipur Heritage Wedding Strategy',
    budget: 300000,
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-25T14:00:00Z',
    messages: [
      {
        id: 'msg-init-1',
        role: 'user',
        content: 'Hi Bandobast AI! We are organizing a 4-function wedding in Jaipur with 180 guests and a budget of ₹3,00,000. How should we allocate this between venue, catering, and photography?',
        timestamp: '10:00 AM',
        budgetContext: 300000
      },
      {
        id: 'msg-init-2',
        role: 'assistant',
        content: `Namaste! Planning a traditional celebration in Jaipur is wonderful. For a budget of ₹3,00,000 and 180 guests, here is our recommended operational formula:

• **Catering & Feasts (38% — ₹1,14,000):** Gives approx ₹630/guest across the main functions. This comfortably supports a rich regional buffet with live chaat and hot jalebi-rabdi.
• **Venues & Mandap Lawns (22% — ₹66,000):** Covers a boutique heritage haveli or lawn with auspicious morning muhurat access.
• **Decoration & Floral Canopies (16% — ₹48,000):** Focus on vibrant local yellow & orange marigolds with fairy light canopies.
• **Photography & Cinema (13% — ₹39,000):** 2 candid photographers + 4K cinematic teaser film.
• **Contingency Buffer (11% — ₹33,000):** Essential reserve for sudden plate increases or overtime.

You can ask me to recommend specific verified venues, caterers, or photographers, or adjust your budget anytime using the slider above!`,
        timestamp: '10:01 AM',
        budgetContext: 300000
      }
    ]
  },
  {
    id: 'session-2',
    title: 'Food Catering & Live Counters Review',
    budget: 300000,
    createdAt: '2026-10-23T15:30:00Z',
    updatedAt: '2026-10-24T12:00:00Z',
    messages: [
      {
        id: 'msg-c-1',
        role: 'user',
        content: 'What catering options can we get for around ₹400 to ₹500 per plate in Jaipur for 180 guests?',
        timestamp: '03:30 PM',
        budgetContext: 300000
      },
      {
        id: 'msg-c-2',
        role: 'assistant',
        content: `At ₹400-₹500/plate in Jaipur, you can book excellent royal vegetarian specialists such as **Royal Rasoi Gourmet Caterers** or **Annapurna Satvik Banquets**.

They typically include:
1. 3 Welcome beverages (Aam Panna, Badam Thandai, Masala Chaas)
2. Live Chaat counter (Pani Puri, Dahi Papdi, Aloo Tikki)
3. 3 Paneer & Dal preparations (Dal Baati Churma, Paneer Lababdar)
4. 2 Hot Desserts (Gulab Jamun, Moong Dal Halwa or Live Jalebi)

Would you like me to add Royal Rasoi to your Event Budget Ledger?`,
        timestamp: '03:31 PM',
        budgetContext: 300000
      }
    ]
  }
];

export default function App() {
  // Available celebration events
  const [events, setEvents] = useState<CelebrationEvent[]>(() => {
    const saved = localStorage.getItem('bandobast_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved events:', e);
      }
    }
    return [SAMPLE_WEDDING, SAMPLE_BIRTHDAY];
  });

  const [activeEventId, setActiveEventId] = useState<string>(SAMPLE_WEDDING.id);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home'); // Opens on Home Page as requested!
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const savedChats = localStorage.getItem('bandobast_chats');
    if (savedChats) {
      try {
        return JSON.parse(savedChats);
      } catch (e) {
        console.error('Failed to parse saved chats:', e);
      }
    }
    return INITIAL_CHAT_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(INITIAL_CHAT_SESSIONS[0].id);

  // Modals
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showTradeoffModal, setShowTradeoffModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  // PWA deferred prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Read URL query params on load (e.g. for PWA shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as NavigationTab;
    if (tabParam && ['home', 'chat', 'overview', 'budget', 'ripple', 'quotes', 'timeline', 'priorities'].includes(tabParam)) {
      setCurrentTab(tabParam);
    }
  }, []);

  // Handle PWA install event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('bandobast_events', JSON.stringify(events));
  }, [events]);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('bandobast_chats', JSON.stringify(chatSessions));
  }, [chatSessions]);

  const activeEvent = events.find(e => e.id === activeEventId) || events[0] || SAMPLE_WEDDING;
  const budget = calculateBudgetTotals(activeEvent);

  const handleUpdateCurrentEvent = (updated: CelebrationEvent) => {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleSelectEvent = (eventId: string) => {
    setActiveEventId(eventId);
  };

  const handleResetDemoData = () => {
    setEvents([
      JSON.parse(JSON.stringify(SAMPLE_WEDDING)),
      JSON.parse(JSON.stringify(SAMPLE_BIRTHDAY))
    ]);
    setChatSessions(INITIAL_CHAT_SESSIONS);
    setActiveEventId(SAMPLE_WEDDING.id);
    setActiveSessionId(INITIAL_CHAT_SESSIONS[0].id);
    setCurrentTab('home');
  };

  const handleApplySimulation = (simulation: RippleSimulationState) => {
    const updated: CelebrationEvent = {
      ...activeEvent,
      activeSimulation: simulation,
      updatedAt: new Date().toISOString()
    };
    handleUpdateCurrentEvent(updated);
    setCurrentTab('ripple'); // Navigate to Ripple Engine to inspect consequences
  };

  const handleAddQuoteToEvent = (quote: VendorQuote) => {
    const updated: CelebrationEvent = {
      ...activeEvent,
      quotes: [quote, ...activeEvent.quotes],
      updatedAt: new Date().toISOString()
    };
    handleUpdateCurrentEvent(updated);
  };

  const handleEventCreated = (newEvent: CelebrationEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    setCurrentTab('overview');
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstallPwa(false);
      }
    }
  };

  // Chat management methods
  const handleStartNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Celebration Plan & Ideas #${chatSessions.length + 1}`,
      budget: activeEvent.totalBudget,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Namaste! I am your Bandobast AI Advisor. We have your active celebration "${activeEvent.name}" configured with a budget of ₹${activeEvent.totalBudget.toLocaleString('en-IN')} for ${activeEvent.guestCount} guests in ${activeEvent.location}.

How can I assist today? You can:
1. Ask me to suggest top venues, caterers, or photographers for your budget.
2. Change the budget anytime using the slider at the top.
3. Ask how a date change or guest surge impacts your timeline.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          budgetContext: activeEvent.totalBudget
        }
      ]
    };

    setChatSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentTab('chat');
  };

  const handleSelectChatSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentTab('chat');
  };

  const handleUpdateSessionMessages = (sessionId: string, messages: ChatMessage[], newBudget?: number) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        messages,
        budget: newBudget !== undefined ? newBudget : s.budget,
        updatedAt: new Date().toISOString()
      };
    }));
  };

  // Sync budget from Chat or Home Page into the living event
  const handleUpdateEventBudget = (newBudget: number) => {
    if (newBudget <= 0) return;

    // Scale category planned amounts proportionally to the new ceiling
    const oldBudget = activeEvent.totalBudget || 1;
    const ratio = newBudget / oldBudget;

    const updatedCategories = activeEvent.categories.map(cat => ({
      ...cat,
      plannedAmount: Math.round(cat.plannedAmount * ratio),
      lineItems: (cat.lineItems || []).map(li => ({
        ...li,
        plannedAmount: Math.round(li.plannedAmount * ratio)
      }))
    }));

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      totalBudget: newBudget,
      contingencyReserve: Math.round(newBudget * 0.08),
      categories: updatedCategories,
      updatedAt: new Date().toISOString()
    };

    updatedEvent.readinessScore = calculateEventReadiness(updatedEvent).score;
    handleUpdateCurrentEvent(updatedEvent);
  };

  // 1-Click Add Recommended Vendor/Place directly to Event Ledger
  const handleAddVendorToLedger = (rec: VendorRecommendation) => {
    const targetCategoryId = 
      rec.category === 'catering' ? 'cat-catering' :
      rec.category === 'venue' ? 'cat-venue' :
      rec.category === 'photography' ? 'cat-photo' : 'cat-decor';

    const newLineItem: BudgetLineItem = {
      id: `li-rec-${Date.now()}`,
      categoryId: targetCategoryId,
      name: `${rec.name} (${rec.priceRange})`,
      unitType: rec.category === 'catering' ? 'per_guest' : 'fixed',
      unitCost: rec.category === 'catering' ? Math.round(rec.estimatedCost / (activeEvent.guestCount || 180)) : undefined,
      quantity: rec.category === 'catering' ? activeEvent.guestCount : 1,
      plannedAmount: rec.estimatedCost,
      committedAmount: 0,
      paidAmount: 0,
      isProtected: false,
      provenance: {
        source: 'ai_estimate',
        calculationBasis: `Suggested by Gen AI Recommendation Engine based on ₹${activeEvent.totalBudget.toLocaleString('en-IN')} budget`,
        verified: true,
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: `Vendor contact: ${rec.contactName || 'Manager'} (${rec.contactNumber || 'Available'})`
      }
    };

    const updatedCategories = activeEvent.categories.map(cat => {
      if (cat.id !== targetCategoryId) return cat;
      const currentItems = cat.lineItems || [];
      const updatedItems = [...currentItems, newLineItem];
      const sum = updatedItems.reduce((acc, item) => acc + item.plannedAmount, 0);
      return {
        ...cat,
        plannedAmount: sum,
        lineItems: updatedItems
      };
    });

    const updatedEvent: CelebrationEvent = {
      ...activeEvent,
      categories: updatedCategories,
      updatedAt: new Date().toISOString()
    };
    updatedEvent.readinessScore = calculateEventReadiness(updatedEvent).score;
    handleUpdateCurrentEvent(updatedEvent);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#302F28] flex flex-col font-sans selection:bg-[#E7A83E]/25">
      {/* PWA App Install Notification Banner */}
      <PWAInstallBanner
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setCanInstallPwa(false)}
      />

      <div className="flex-1 flex">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          activeSimulationCount={activeEvent.activeSimulation.activePreset !== 'none' ? 1 : 0}
        />

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Header */}
          <Header
            currentEvent={activeEvent}
            availableEvents={events}
            onSelectEvent={handleSelectEvent}
            onOpenNewEventModal={() => setShowNewEventModal(true)}
            onOpenSimulateModal={() => setShowSimulateModal(true)}
            onResetDemoData={handleResetDemoData}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onInstallPwa={handleInstallPwa}
            canInstallPwa={canInstallPwa}
          />

          {/* Dynamic Content Views */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentTab === 'home' && (
              <HomeHubView
                currentEvent={activeEvent}
                chatSessions={chatSessions}
                onStartNewChat={handleStartNewChat}
                onSelectChatSession={handleSelectChatSession}
                onNavigateTab={setCurrentTab}
                onUpdateEventBudget={handleUpdateEventBudget}
                onAddVendorToLedger={handleAddVendorToLedger}
                onOpenSimulateModal={() => setShowSimulateModal(true)}
              />
            )}

            {currentTab === 'chat' && (
              <AiChatView
                currentEvent={activeEvent}
                chatSessions={chatSessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onStartNewChat={handleStartNewChat}
                onUpdateSessionMessages={handleUpdateSessionMessages}
                onAddVendorToLedger={handleAddVendorToLedger}
                onSyncBudgetToEvent={handleUpdateEventBudget}
              />
            )}

            {currentTab === 'overview' && (
              <OverviewView
                event={activeEvent}
                onNavigateTab={setCurrentTab}
                onOpenSimulateModal={() => setShowSimulateModal(true)}
                onOpenTradeoffModal={() => setShowTradeoffModal(true)}
              />
            )}

            {currentTab === 'budget' && (
              <BudgetStudioView
                event={activeEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onOpenTradeoffModal={() => setShowTradeoffModal(true)}
              />
            )}

            {currentTab === 'ripple' && (
              <RippleEngineView
                event={activeEvent}
                onUpdateSimulation={(sim) => {
                  const updated: CelebrationEvent = {
                    ...activeEvent,
                    activeSimulation: sim,
                    updatedAt: new Date().toISOString()
                  };
                  handleUpdateCurrentEvent(updated);
                }}
                onOpenTradeoffModal={() => setShowTradeoffModal(true)}
              />
            )}

            {currentTab === 'quotes' && (
              <VendorQuotesView
                event={activeEvent}
                onAddQuoteToEvent={handleAddQuoteToEvent}
              />
            )}

            {currentTab === 'timeline' && (
              <TimelineView
                event={activeEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
              />
            )}

            {currentTab === 'priorities' && (
              <PrioritiesView
                event={activeEvent}
                onUpdateEvent={handleUpdateCurrentEvent}
                onOpenTradeoffModal={() => setShowTradeoffModal(true)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showSimulateModal && (
        <SimulateChangeModal
          event={activeEvent}
          currentSimulation={activeEvent.activeSimulation}
          onApplySimulation={handleApplySimulation}
          onClose={() => setShowSimulateModal(false)}
        />
      )}

      {showTradeoffModal && (
        <TradeoffSimulatorModal
          event={activeEvent}
          overrunAmount={budget.overrunAmount}
          onApplyScenario={(updated) => handleUpdateCurrentEvent(updated)}
          onClose={() => setShowTradeoffModal(false)}
        />
      )}

      {showNewEventModal && (
        <EventWizardModal
          onEventCreated={handleEventCreated}
          onClose={() => setShowNewEventModal(false)}
        />
      )}
    </div>
  );
}
