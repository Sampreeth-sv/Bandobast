import React, { useState } from 'react';
import { CelebrationEvent } from '../types';
import { 
  Menu, 
  RotateCcw, 
  GitFork, 
  Plus, 
  ChevronDown, 
  Download, 
  Share2, 
  Check, 
  Calendar,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { exportCateringBrief, exportIcsCalendar } from '../services/rippleEngine';

interface HeaderProps {
  currentEvent: CelebrationEvent;
  availableEvents: CelebrationEvent[];
  onSelectEvent: (eventId: string) => void;
  onOpenNewEventModal: () => void;
  onOpenSimulateModal: () => void;
  onResetDemoData: () => void;
  onToggleMobileMenu: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentEvent,
  availableEvents,
  onSelectEvent,
  onOpenNewEventModal,
  onOpenSimulateModal,
  onResetDemoData,
  onToggleMobileMenu,
  onInstallPwa,
  canInstallPwa
}) => {
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleDownloadIcs = () => {
    const icsData = exportIcsCalendar(currentEvent);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentEvent.name.replace(/\s+/g, '_')}_schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleDownloadBrief = () => {
    const briefText = exportCateringBrief(currentEvent);
    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentEvent.name.replace(/\s+/g, '_')}_catering_brief.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportDropdown(false);
  };

  const handleShareSummary = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Bandobast Event Overview: ${currentEvent.name}\nBudget: ₹${currentEvent.totalBudget.toLocaleString('en-IN')} | Guests: ${currentEvent.guestCount} | Functions: ${currentEvent.functions.length}\nLiving Event Twin link: ${window.location.origin}`
      );
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E7E0D3] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Event Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#302F28] hover:bg-[#FAF7F0] border border-[#E7E0D3]"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Event Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEventDropdown(!showEventDropdown)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EDF3EC] border border-[#E7E0D3] transition-colors cursor-pointer text-left"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#E7A83E] animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-[#405B43] uppercase tracking-wider leading-none">
                {currentEvent.occasion}
              </p>
              <h2 className="font-serif text-sm font-bold text-[#302F28] truncate max-w-[180px] sm:max-w-[260px] leading-tight">
                {currentEvent.name}
              </h2>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#77756B] transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showEventDropdown && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#77756B] uppercase tracking-wider border-b border-[#E7E0D3]">
                Switch Active Celebration
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {availableEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      onSelectEvent(evt.id);
                      setShowEventDropdown(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-[#FAF7F0] transition-colors ${
                      evt.id === currentEvent.id ? 'bg-[#EDF3EC] text-[#405B43] font-semibold' : 'text-[#302F28]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{evt.name}</p>
                      <p className="text-[10px] text-[#77756B]">{evt.occasion} • {evt.guestCount} guests</p>
                    </div>
                    {evt.id === currentEvent.id && <Check className="w-4 h-4 text-[#405B43]" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-1 border-t border-[#E7E0D3] px-2">
                <button
                  onClick={() => {
                    setShowEventDropdown(false);
                    onOpenNewEventModal();
                  }}
                  className="w-full py-2 px-3 bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Celebration</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions (Simulate, PWA install, Export, Reset) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulate a Change Action Button */}
        <button
          type="button"
          onClick={onOpenSimulateModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-medium text-xs sm:text-sm shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          title="Simulate a guest count, date, or vendor quote change and inspect ripple effects"
        >
          <GitFork className="w-4 h-4" />
          <span className="hidden sm:inline">Simulate Change</span>
          <span className="sm:hidden">Simulate</span>
        </button>

        {/* PWA App Install Button */}
        {canInstallPwa && (
          <button
            type="button"
            onClick={onInstallPwa}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EDF3EC] text-[#405B43] border border-[#405B43]/30 font-medium text-xs transition-all hover:scale-[1.02]"
            title="Install Bandobast as a standalone desktop or mobile application"
          >
            <Smartphone className="w-4 h-4 text-[#405B43]" />
            <span>Install App</span>
          </button>
        )}

        {/* Export / Sync Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E7E0D3]/50 text-[#302F28] border border-[#E7E0D3] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export calendar or briefing files"
          >
            <Download className="w-4 h-4 text-[#77756B]" />
            <span className="hidden md:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-[#77756B]" />
          </button>

          {showExportDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <button
                onClick={handleDownloadIcs}
                className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F0] flex items-center gap-2 text-[#302F28]"
              >
                <Calendar className="w-4 h-4 text-[#405B43]" />
                <div>
                  <p className="font-medium">Download Calendar (.ics)</p>
                  <p className="text-[10px] text-[#77756B]">Syncs all functions & tasks</p>
                </div>
              </button>

              <button
                onClick={handleDownloadBrief}
                className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F0] flex items-center gap-2 text-[#302F28]"
              >
                <Download className="w-4 h-4 text-[#E7A83E]" />
                <div>
                  <p className="font-medium">Catering & Logistics Brief</p>
                  <p className="text-[10px] text-[#77756B]">Headcounts, menu & venues</p>
                </div>
              </button>

              <button
                onClick={handleShareSummary}
                className="w-full px-3.5 py-2 text-left hover:bg-[#FAF7F0] flex items-center gap-2 text-[#302F28]"
              >
                <Share2 className="w-4 h-4 text-[#C76F50]" />
                <div>
                  <p className="font-medium">{copyFeedback ? 'Copied to Clipboard!' : 'Share Snapshot Link'}</p>
                  <p className="text-[10px] text-[#77756B]">Copy quick executive summary</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          type="button"
          onClick={onResetDemoData}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FAECE7] text-[#C76F50] border border-[#E7E0D3] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Reset demonstration state back to standard sample wedding values"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
