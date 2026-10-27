import React, { useState, useRef, useEffect } from 'react';
import { 
  CelebrationEvent, 
  ChatSession, 
  ChatMessage, 
  VendorRecommendation 
} from '../types';
import { sendChatMessage, fetchBudgetVendorRecommendations } from '../services/aiService';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  IndianRupee, 
  Check, 
  Building, 
  Utensils, 
  Camera, 
  Flower2, 
  Star, 
  Sliders, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiChatViewProps {
  currentEvent: CelebrationEvent;
  chatSessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onStartNewChat: () => void;
  onUpdateSessionMessages: (sessionId: string, messages: ChatMessage[], newBudget?: number) => void;
  onAddVendorToLedger: (rec: VendorRecommendation) => void;
  onSyncBudgetToEvent: (budget: number) => void;
}

export const AiChatView: React.FC<AiChatViewProps> = ({
  currentEvent,
  chatSessions,
  activeSessionId,
  onSelectSession,
  onStartNewChat,
  onUpdateSessionMessages,
  onAddVendorToLedger,
  onSyncBudgetToEvent
}) => {
  const activeSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<number>(activeSession?.budget || currentEvent.totalBudget);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [addedRecIds, setAddedRecIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSession) {
      setCurrentBudget(activeSession.budget);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isSending]);

  // In-memory cache for vendor recommendations to avoid duplicate API requests (Section 9)
  const recCacheRef = useRef<Map<string, VendorRecommendation[]>>(new Map());

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending || !activeSession) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      budgetContext: currentBudget
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    onUpdateSessionMessages(activeSession.id, updatedMessages);
    setInputText('');
    setIsSending(true);

    try {
      // Check if message is asking for vendor/place/food/photography recommendations
      const isVendorQuery = /place|venue|hall|lawn|cater|food|photo|decor|vendor|suggest/i.test(text);

      let suggestedVendors: VendorRecommendation[] | undefined = undefined;
      if (isVendorQuery) {
        const catFilter = /venue|place|lawn|hall/i.test(text) ? 'venue' :
          /cater|food|plate|menu/i.test(text) ? 'catering' :
          /photo|cinema|camera|video/i.test(text) ? 'photography' :
          /decor|floral|flower|mandap/i.test(text) ? 'decor' : 'all';

        const cacheKey = `${catFilter}-${Math.round(currentBudget / 25000) * 25000}`;
        const cached = recCacheRef.current.get(cacheKey);

        if (cached && cached.length > 0) {
          suggestedVendors = cached.slice(0, 3);
        } else {
          const recRes = await fetchBudgetVendorRecommendations({
            budget: currentBudget,
            location: currentEvent.location,
            guestCount: currentEvent.guestCount,
            category: catFilter,
            occasion: currentEvent.occasion
          });

          if (recRes.success && recRes.recommendations) {
            recCacheRef.current.set(cacheKey, recRes.recommendations);
            suggestedVendors = recRes.recommendations.slice(0, 3);
          }
        }
      }

      // Send chat to Gemini API via backend proxy
      const chatRes = await sendChatMessage({
        message: text,
        history: updatedMessages.map(m => ({ role: m.role as any, content: m.content })),
        budget: currentBudget,
        eventDetails: {
          name: currentEvent.name,
          occasion: currentEvent.occasion,
          location: currentEvent.location,
          guestCount: currentEvent.guestCount,
          totalBudget: currentBudget
        }
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: chatRes.reply || 'Here are our recommendations based on your budget.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        budgetContext: currentBudget,
        suggestedVendors
      };

      onUpdateSessionMessages(activeSession.id, [...updatedMessages, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateBudget = (newAmount: number) => {
    setCurrentBudget(newAmount);
    if (activeSession) {
      onUpdateSessionMessages(activeSession.id, activeSession.messages, newAmount);
    }
  };

  const handleSyncBudget = () => {
    onSyncBudgetToEvent(currentBudget);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#405B43', '#E7A83E']
    });
    setIsEditingBudget(false);
  };

  const handleAddVendor = (rec: VendorRecommendation) => {
    onAddVendorToLedger(rec);
    setAddedRecIds(prev => new Set(prev).add(rec.id));
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#E7A83E', '#405B43']
    });
  };

  const samplePrompts = [
    `Suggest top venues and heritage lawns under ₹${Math.round(currentBudget * 0.25).toLocaleString('en-IN')}`,
    `What food catering packages fit ₹${Math.round((currentBudget * 0.38) / (currentEvent.guestCount || 180))}/plate?`,
    `Recommend 4K cinematic photographers for ₹${Math.round(currentBudget * 0.13).toLocaleString('en-IN')}`,
    `How should I allocate ₹${currentBudget.toLocaleString('en-IN')} between food, decor, and photography?`
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-200">
      {/* Left Column: Saved Chats Drawer */}
      <div className="hidden lg:flex flex-col bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-5 shadow-xs justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3] mb-3">
            <h3 className="font-serif font-bold text-base text-[#302F28]">Saved Chats</h3>
            <button
              type="button"
              onClick={onStartNewChat}
              className="p-1.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] cursor-pointer"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {chatSessions.map((s) => {
              const isSelected = s.id === activeSession?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EDF3EC] border border-[#405B43] shadow-xs'
                      : 'bg-[#FAF7F0] border border-[#E7E0D3] hover:border-[#405B43]/40'
                  }`}
                >
                  <p className="font-serif font-bold text-xs text-[#302F28] truncate">{s.title}</p>
                  <p className="text-[10px] text-[#77756B] mt-0.5 truncate">
                    {s.messages[s.messages.length - 1]?.content || 'Empty session'}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-[#405B43]">
                    <span>₹{s.budget.toLocaleString('en-IN')}</span>
                    <span className="text-[#77756B]">{s.messages.length} msgs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#E7E0D3]">
          <button
            type="button"
            onClick={onStartNewChat}
            className="w-full py-2.5 px-3 bg-[#FAF7F0] hover:bg-[#EDF3EC] text-[#405B43] rounded-xl text-xs font-semibold border border-[#405B43]/30 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      {/* Main Column: Chat Area */}
      <div className="lg:col-span-3 bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl shadow-xs flex flex-col justify-between overflow-hidden">
        {/* Chat Top Header with Budget Adjuster */}
        <div className="p-4 sm:px-6 bg-[#FAF7F0] border-b border-[#E7E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#405B43] text-[#FAF7F0] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#E7A83E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#302F28]">
                  {activeSession?.title || 'Bandobast AI Advisor'}
                </h3>
                <span className="text-[10px] bg-[#E7A83E]/20 text-[#B45309] font-bold px-2 py-0.2 rounded-full uppercase">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-[#77756B]">
                Venue discovery, catering menus, and budget optimization for {currentEvent.name}.
              </p>
            </div>
          </div>

          {/* Interactive Budget Pill in Chat Header */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {isEditingBudget ? (
              <div className="flex items-center gap-2 bg-[#FFFDF9] p-1.5 rounded-2xl border border-[#405B43]">
                <span className="text-xs font-bold text-[#77756B] pl-2">₹</span>
                <input
                  type="number"
                  min="50000"
                  step="25000"
                  value={currentBudget}
                  onChange={(e) => handleUpdateBudget(parseInt(e.target.value) || 0)}
                  className="font-mono font-bold text-xs text-[#405B43] w-28 bg-transparent focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleSyncBudget}
                  className="px-2.5 py-1 bg-[#405B43] text-[#FAF7F0] text-[11px] font-semibold rounded-xl cursor-pointer"
                >
                  Sync Event
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#EDF3EC] border border-[#E7E0D3] hover:border-[#405B43]/50 text-xs cursor-pointer transition-colors"
                title="Click to change budget"
              >
                <Sliders className="w-3.5 h-3.5 text-[#E7A83E]" />
                <span className="text-[#77756B]">Active Budget:</span>
                <span className="font-mono font-bold text-[#405B43]">
                  ₹{currentBudget.toLocaleString('en-IN')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeSession?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#405B43] text-[#FAF7F0] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#E7A83E]" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#405B43] text-[#FAF7F0] rounded-tr-none'
                        : 'bg-[#FAF7F0] text-[#302F28] border border-[#E7E0D3] rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    <div className={`flex justify-end items-center gap-2 mt-2 pt-1.5 border-t text-[10px] ${
                      isUser ? 'border-[#FAF7F0]/20 text-[#FAF7F0]/70' : 'border-[#E7E0D3] text-[#77756B]'
                    }`}>
                      {msg.budgetContext && (
                        <span>Budget: ₹{msg.budgetContext.toLocaleString('en-IN')}</span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* If assistant returned suggested vendors / places */}
                  {msg.suggestedVendors && msg.suggestedVendors.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-[11px] font-bold text-[#405B43] uppercase tracking-wider">
                        Matched Places & Vendors for ₹{currentBudget.toLocaleString('en-IN')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.suggestedVendors.map((v) => {
                          const isAdded = addedRecIds.has(v.id);
                          return (
                            <div
                              key={v.id}
                              className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="font-bold text-[#405B43] uppercase">{v.category}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                    Illustrative Demo
                                  </span>
                                </div>
                                <h4 className="font-serif font-bold text-xs text-[#302F28]">{v.name}</h4>
                                <p className="text-[11px] text-[#526354] mt-1 line-clamp-2">{v.fitDescription}</p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-[#E7E0D3] flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-[#405B43]">
                                  ₹{v.estimatedCost.toLocaleString('en-IN')}
                                </span>

                                <button
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() => handleAddVendor(v)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer ${
                                    isAdded
                                      ? 'bg-[#EDF3EC] text-[#405B43]'
                                      : 'bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0]'
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-[#E7A83E]" />}
                                  <span>{isAdded ? 'Added' : 'Add to Budget'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#E7A83E] text-[#302F28] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center text-xs text-[#77756B] animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#405B43] text-[#FAF7F0] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#E7A83E]" />
              </div>
              <div className="p-3 bg-[#FAF7F0] rounded-2xl border border-[#E7E0D3]">
                <span>Bandobast AI is analyzing venues, catering menus, and budget formulas...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2 bg-[#FAF7F0] border-t border-[#E7E0D3] flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-[#77756B] shrink-0 font-medium">Quick Suggestions:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-xl bg-[#FFFDF9] hover:bg-[#EDF3EC] border border-[#E7E0D3] text-[#302F28] shrink-0 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#FFFDF9] border-t border-[#E7E0D3]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask for venues, catering styles, photo packages for ₹${currentBudget.toLocaleString('en-IN')}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3] text-xs sm:text-sm text-[#302F28] focus:outline-hidden focus:border-[#405B43]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3 bg-[#405B43] hover:bg-[#324734] disabled:opacity-40 text-[#FAF7F0] rounded-2xl transition-colors cursor-pointer shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-[#E7A83E]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
