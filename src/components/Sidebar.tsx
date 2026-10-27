import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  MessageSquare,
  Wallet, 
  GitFork, 
  FileSpreadsheet, 
  CalendarClock, 
  SlidersHorizontal,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export type NavigationTab = 
  | 'home'
  | 'chat'
  | 'overview' 
  | 'budget' 
  | 'ripple' 
  | 'quotes' 
  | 'timeline' 
  | 'priorities';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeSimulationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  activeSimulationCount
}) => {
  const navItems = [
    {
      id: 'home' as NavigationTab,
      label: 'Home Hub',
      icon: Home,
      badge: 'Hub'
    },
    {
      id: 'chat' as NavigationTab,
      label: 'AI Advisor Chat',
      icon: MessageSquare,
      badge: 'Gen AI'
    },
    {
      id: 'overview' as NavigationTab,
      label: 'Event Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'budget' as NavigationTab,
      label: 'Budget Studio',
      icon: Wallet,
      badge: null
    },
    {
      id: 'ripple' as NavigationTab,
      label: 'Ripple Engine',
      icon: GitFork,
      badge: activeSimulationCount > 0 ? `${activeSimulationCount} active` : 'Signature'
    },
    {
      id: 'quotes' as NavigationTab,
      label: 'Vendor Quotes',
      icon: FileSpreadsheet,
      badge: 'Quote X-Ray'
    },
    {
      id: 'timeline' as NavigationTab,
      label: 'Timeline & Functions',
      icon: CalendarClock,
      badge: null
    },
    {
      id: 'priorities' as NavigationTab,
      label: 'Priorities & Compass',
      icon: SlidersHorizontal,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#FFFDF9] border-r border-[#E7E0D3] flex flex-col transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E7E0D3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#405B43] flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/icons/bandobast-icon.svg" alt="Bandobast" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-wide text-[#302F28] block leading-none">
                BANDOBAST
              </span>
              <span className="text-[11px] font-sans text-[#77756B] tracking-wider uppercase">
                Event Operations
              </span>
            </div>
          </div>
        </div>

        {/* Tagline Ribbon */}
        <div className="px-5 py-2.5 bg-[#FAF7F0] border-b border-[#E7E0D3]">
          <p className="text-[11px] text-[#77756B] italic leading-tight">
            "One change. A thousand connections. Bandobast keeps it together."
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                  ${isActive 
                    ? 'bg-[#405B43] text-[#FAF7F0] shadow-sm' 
                    : 'text-[#302F28] hover:bg-[#FAF7F0] hover:text-[#405B43]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#E7A83E]' : 'text-[#77756B]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`
                    text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full
                    ${isActive 
                      ? 'bg-[#E7A83E] text-[#302F28]' 
                      : item.id === 'ripple' && activeSimulationCount > 0 
                        ? 'bg-[#E7A83E]/20 text-[#B45309]'
                        : 'bg-[#DCE6D6] text-[#405B43]'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Signature Feature Callout */}
        <div className="p-4 m-3 rounded-2xl bg-[#EDF3EC] border border-[#DCE6D6]">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#405B43]" />
            <span className="text-xs font-semibold text-[#405B43] uppercase tracking-wider">Living Event Twin</span>
          </div>
          <p className="text-xs text-[#526354] leading-relaxed">
            Deterministic graph engine propagates guest count, date, and vendor quotation shifts automatically.
          </p>
        </div>

        {/* Footer / Multi-Event Badge */}
        <div className="p-4 border-t border-[#E7E0D3] bg-[#FFFDF9] flex items-center justify-between text-xs text-[#77756B]">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#C76F50]" />
            <span>PromptWars Challenge 5</span>
          </div>
          <span className="font-mono text-[10px] bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#E7E0D3]">v1.0</span>
        </div>
      </aside>
    </>
  );
};
