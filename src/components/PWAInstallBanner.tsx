import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';

interface PWAInstallBannerProps {
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  deferredPrompt,
  onInstallSuccess
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA window
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If deferredPrompt is available or if iOS device, prompt once
    if (!isInStandaloneMode && (deferredPrompt || isIosDevice)) {
      const dismissed = sessionStorage.getItem('bandobast_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstallSuccess();
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('bandobast_pwa_dismissed', 'true');
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="bg-[#405B43] text-[#FAF7F0] px-4 py-2.5 sm:px-6 relative z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FAF7F0]/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-[#E7A83E]" />
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <span>Install Bandobast as an App</span>
              <span className="text-[10px] bg-[#E7A83E] text-[#302F28] font-bold px-1.5 py-0.2 rounded-full uppercase">PWA</span>
            </p>
            <p className="text-xs text-[#FAF7F0]/80">
              {isIOS 
                ? 'Tap Share then "Add to Home Screen" for instant offline access on your phone.'
                : 'Experience fast, full-screen offline access on your phone, tablet, or desktop.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
          )}

          {isIOS && (
            <div className="flex items-center gap-1.5 text-xs bg-[#FAF7F0]/10 px-2.5 py-1 rounded-lg">
              <Share className="w-3.5 h-3.5 text-[#E7A83E]" />
              <span>Share &rarr;</span>
              <PlusSquare className="w-3.5 h-3.5 text-[#E7A83E]" />
              <span>Add to Home</span>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-[#FAF7F0]/20 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-[#FAF7F0]/70" />
          </button>
        </div>
      </div>
    </div>
  );
};
