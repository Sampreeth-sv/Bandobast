import React, { useState } from 'react';
import { ProvenanceRecord, ProvenanceSource } from '../types';
import { ShieldCheck, UserCheck, Sparkles, FileText, HelpCircle, X } from 'lucide-react';

interface ProvenanceBadgeProps {
  provenance: ProvenanceRecord;
  showDetailOnHover?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance }) => {
  const [showModal, setShowModal] = useState(false);

  const getSourceConfig = (source: ProvenanceSource) => {
    switch (source) {
      case 'quoted':
        return {
          label: 'Quoted',
          icon: FileText,
          bg: 'bg-[#405B43]/10',
          text: 'text-[#405B43]',
          border: 'border-[#405B43]/30',
          description: 'Extracted from or confirmed in an official supplier quotation.'
        };
      case 'user_entered':
        return {
          label: 'Organizer Confirmed',
          icon: UserCheck,
          bg: 'bg-[#405B43]/10',
          text: 'text-[#405B43]',
          border: 'border-[#405B43]/30',
          description: 'Entered directly or explicitly approved by event organizer.'
        };
      case 'ai_estimate':
        return {
          label: 'AI Estimate',
          icon: Sparkles,
          bg: 'bg-[#E7A83E]/15',
          text: 'text-[#B45309]',
          border: 'border-[#E7A83E]/40',
          description: 'Calculated or suggested by AI model. Not yet locked with vendor.'
        };
      case 'illustrative':
      default:
        return {
          label: 'Illustrative',
          icon: ShieldCheck,
          bg: 'bg-[#C76F50]/15',
          text: 'text-[#C76F50]',
          border: 'border-[#C76F50]/30',
          description: 'Provided as baseline sample data for demonstration.'
        };
    }
  };

  const config = getSourceConfig(provenance.source);
  const Icon = config.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} transition-colors hover:brightness-95 cursor-pointer`}
        title={`Source: ${config.label}. Click for full data provenance details.`}
      >
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div 
            className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#77756B] hover:text-[#302F28] p-1 rounded-lg"
              aria-label="Close provenance modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302F28]">Data Provenance Audit</h3>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
                  Classification: {config.label}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[#302F28]">
              <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D3]">
                <p className="text-xs text-[#77756B] uppercase font-semibold tracking-wider">Classification Meaning</p>
                <p className="mt-1 text-[#302F28]">{config.description}</p>
              </div>

              {provenance.calculationBasis && (
                <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D3]">
                  <p className="text-xs text-[#77756B] uppercase font-semibold tracking-wider">Calculation Basis</p>
                  <p className="mt-1 font-mono text-xs text-[#302F28]">{provenance.calculationBasis}</p>
                </div>
              )}

              {provenance.quoteId && (
                <div className="flex justify-between items-center text-xs py-1 border-b border-[#E7E0D3]">
                  <span className="text-[#77756B]">Quotation Reference:</span>
                  <span className="font-mono font-medium text-[#405B43]">{provenance.quoteId}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs py-1 border-b border-[#E7E0D3]">
                <span className="text-[#77756B]">Verification Status:</span>
                <span className="font-medium text-[#405B43]">
                  {provenance.verified ? 'Verified & Documented' : 'Pending Verification'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-[#77756B]">Last Recorded:</span>
                <span className="text-[#77756B]">{provenance.lastUpdated || 'Initial setup'}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 px-4 bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-medium rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
