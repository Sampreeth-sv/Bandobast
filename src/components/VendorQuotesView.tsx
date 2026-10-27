import React, { useState } from 'react';
import { CelebrationEvent, VendorQuote } from '../types';
import { extractVendorQuote, generateVendorQuestions } from '../services/aiService';
import { ProvenanceBadge } from './ProvenanceBadge';
import { 
  FileSpreadsheet, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  MessageSquare, 
  Copy, 
  Check, 
  Plus, 
  IndianRupee, 
  Layers, 
  FileCheck,
  Languages,
  Eye,
  FileQuestion
} from 'lucide-react';

interface VendorQuotesViewProps {
  event: CelebrationEvent;
  onAddQuoteToEvent: (quote: VendorQuote) => void;
}

export const VendorQuotesView: React.FC<VendorQuotesViewProps> = ({
  event,
  onAddQuoteToEvent
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(event.quotes[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'comparison' | 'xray' | 'inquiry'>('comparison');

  // X-Ray Upload / Paste State
  const [pastedText, setPastedText] = useState('');
  const [vendorHint, setVendorHint] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  // Inquiry Generator State
  const [selectedInquiryLanguage, setSelectedInquiryLanguage] = useState<'English' | 'Hindi' | 'Gujarati'>('English');
  const [isGeneratingInquiry, setIsGeneratingInquiry] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);

  const currentQuote = event.quotes.find(q => q.id === selectedQuoteId) || event.quotes[0];

  const handleRunXray = async () => {
    setIsExtracting(true);
    setExtractionNote(null);

    const result = await extractVendorQuote({
      rawText: pastedText || undefined,
      vendorNameHint: vendorHint || undefined
    });

    setIsExtracting(false);
    if (result.success && result.data) {
      setExtractionResult(result.data);
      if (result.warning) {
        setExtractionNote(result.warning);
      }
    }
  };

  const handleSaveExtractedQuote = () => {
    if (!extractionResult) return;

    const newQuote: VendorQuote = {
      id: `q-${Date.now()}`,
      vendorName: extractionResult.vendorName || 'New Vendor',
      vendorCategory: extractionResult.vendorCategory || 'General',
      quoteDate: extractionResult.quoteDate || new Date().toISOString().split('T')[0],
      totalAmount: extractionResult.totalAmount || 0,
      subtotal: extractionResult.subtotal || 0,
      gstAmount: extractionResult.gstAmount || 0,
      serviceCharges: extractionResult.serviceCharges || 0,
      paymentTerms: extractionResult.paymentTerms || 'Terms pending',
      cancellationPolicy: extractionResult.cancellationPolicy || 'Policy not specified',
      validityPeriod: extractionResult.validityPeriod || '15 days',
      inclusions: extractionResult.inclusions || [],
      exclusions: extractionResult.exclusions || [],
      missingFields: extractionResult.missingFields || [],
      lineItems: extractionResult.lineItems || [],
      rawText: pastedText,
      status: 'under_review',
      provenance: {
        source: 'quoted',
        quoteId: `q-${Date.now()}`,
        calculationBasis: 'Extracted via Quote X-Ray',
        verified: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    onAddQuoteToEvent(newQuote);
    setSelectedQuoteId(newQuote.id);
    setExtractionResult(null);
    setPastedText('');
    setActiveTab('comparison');
  };

  const handleGenerateInquiryDraft = async () => {
    if (!currentQuote) return;
    setIsGeneratingInquiry(true);

    const res = await generateVendorQuestions({
      vendorName: currentQuote.vendorName,
      category: currentQuote.vendorCategory,
      missingFields: currentQuote.missingFields,
      language: selectedInquiryLanguage,
      context: `${event.name} (${event.guestCount} guests)`
    });

    setIsGeneratingInquiry(false);
    setGeneratedDraft(res.draft);
  };

  const handleCopyDraft = () => {
    if (navigator.clipboard && generatedDraft) {
      navigator.clipboard.writeText(generatedDraft);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6]">
              Quote X-Ray & Audit
            </span>
            <span className="text-xs text-[#77756B]">Structured Line-Item Normalization & Missing Field Alerts</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302F28]">Vendor Quotation Intelligence</h1>
          <p className="text-xs text-[#77756B] mt-1 max-w-2xl">
            Never sign ambiguous vendor proposals. Extract exact deliverables, flag hidden overtime/GST omissions, and draft multilingual inquiries.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#E7E0D3]">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'comparison' ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs' : 'text-[#77756B] hover:text-[#302F28]'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xray')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'xray' ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs' : 'text-[#77756B] hover:text-[#302F28]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E7A83E]" />
            <span>Upload & Extract</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inquiry' ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs' : 'text-[#77756B] hover:text-[#302F28]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C76F50]" />
            <span>Clarification Drafter</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Side-by-Side Quotation Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Quote Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {event.quotes.map((quote) => {
              const isSelected = quote.id === selectedQuoteId;
              return (
                <div
                  key={quote.id}
                  onClick={() => setSelectedQuoteId(quote.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#FFFDF9] border-[#405B43] ring-2 ring-[#405B43]/20 shadow-sm'
                      : 'bg-[#FFFDF9] border-[#E7E0D3] hover:border-[#405B43]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-[#405B43] uppercase text-[10px] tracking-wider">
                        {quote.vendorCategory}
                      </span>
                      <ProvenanceBadge provenance={quote.provenance} />
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#302F28] leading-tight">
                      {quote.vendorName}
                    </h3>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-[#77756B]">Quoted Total:</span>
                      <span className="font-serif font-bold text-lg text-[#302F28]">
                        ₹{quote.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#77756B] mt-1 font-mono">
                      Subtotal: ₹{quote.subtotal.toLocaleString('en-IN')} + GST ₹{quote.gstAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Missing Fields Warning Indicator */}
                  <div className="mt-4 pt-3 border-t border-[#E7E0D3]">
                    {quote.missingFields.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#B45309]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#E7A83E]" />
                        <span className="font-medium">{quote.missingFields.length} ambiguities/omissions flagged</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-[#405B43]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>All critical terms verified</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Inspection of Selected Quote */}
          {currentQuote && (
            <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7E0D3] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-[#302F28]">{currentQuote.vendorName}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EDF3EC] text-[#405B43] font-semibold">
                      {currentQuote.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#77756B] mt-0.5">
                    Quotation Date: {currentQuote.quoteDate} • {currentQuote.validityPeriod}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('inquiry')}
                  className="px-4 py-2 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#E7A83E]" />
                  <span>Draft Clarification Inquiry</span>
                </button>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-[#405B43] uppercase tracking-wider mb-2.5">
                  Normalized Deliverables & Quantities
                </h4>
                <div className="border border-[#E7E0D3] rounded-2xl overflow-hidden divide-y divide-[#E7E0D3]">
                  <div className="bg-[#FAF7F0] px-4 py-2.5 flex justify-between text-xs font-semibold text-[#302F28]">
                    <span>Description</span>
                    <div className="flex gap-8 text-right font-mono">
                      <span className="w-16">Qty</span>
                      <span className="w-20">Rate</span>
                      <span className="w-24">Subtotal</span>
                    </div>
                  </div>
                  {currentQuote.lineItems.map((li) => (
                    <div key={li.id} className="px-4 py-3 flex items-center justify-between text-xs">
                      <p className="font-medium text-[#302F28]">{li.description}</p>
                      <div className="flex gap-8 text-right font-mono">
                        <span className="w-16 text-[#77756B]">{li.quantity}</span>
                        <span className="w-20 text-[#77756B]">₹{li.unitPrice}</span>
                        <span className="w-24 font-bold text-[#302F28]">₹{li.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Columns: Inclusions, Exclusions, Missing Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Inclusions */}
                <div className="p-4 rounded-2xl bg-[#EDF3EC] border border-[#DCE6D6]">
                  <p className="font-semibold text-[#405B43] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#405B43]" />
                    <span>Included Services ({currentQuote.inclusions.length})</span>
                  </p>
                  <ul className="space-y-1.5 text-[#302F28]">
                    {currentQuote.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#405B43] font-bold">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3]">
                  <p className="font-semibold text-[#77756B] mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#77756B]" />
                    <span>Excluded from Scope</span>
                  </p>
                  <ul className="space-y-1.5 text-[#77756B]">
                    {currentQuote.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#C76F50] font-bold">&times;</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing / Ambiguous Fields */}
                <div className="p-4 rounded-2xl bg-[#FEF7EB] border border-[#E7A83E]/40">
                  <p className="font-semibold text-[#B45309] mb-2 flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4 text-[#E7A83E]" />
                    <span>Missing Details — Ask Vendor</span>
                  </p>
                  <ul className="space-y-1.5 text-[#302F28]">
                    {currentQuote.missingFields.map((field, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#E7A83E] font-bold">&bull;</span>
                        <span className="font-medium text-[#B45309]">{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Terms & Policies */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#77756B] uppercase text-[10px]">Payment Milestones</p>
                  <p className="text-[#302F28] mt-1">{currentQuote.paymentTerms}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#77756B] uppercase text-[10px]">Cancellation Policy</p>
                  <p className="text-[#302F28] mt-1">{currentQuote.cancellationPolicy}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Upload & Extract (Quote X-Ray) */}
      {activeTab === 'xray' && (
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#302F28]">Vendor Quote X-Ray Processor</h3>
            <p className="text-xs text-[#77756B] mt-1">
              Paste vendor WhatsApp quotation text, contract email, or rate card to extract structured line items and spot hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#302F28] mb-1">Vendor Name / Category Hint</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Rasoi Caterers (Catering)"
                  value={vendorHint}
                  onChange={(e) => setVendorHint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#302F28]">Quotation Text or Breakdown</label>
                  <button
                    type="button"
                    onClick={() => {
                      setVendorHint('Amrapali Royal Florals & Mandap');
                      setPastedText(`Amrapali Royal Florals Estimate:
- Traditional 4-pillar Vedic Mandap with marigolds and fresh roses: ₹32,000
- Sangeet Backdrop Stage: ₹20,000
- 100 Floral Chair Accents: ₹5,000
Total estimated cost: ₹57,000.
Advance required: 40%.
Cancellation: Non-refundable within 10 days.`);
                    }}
                    className="text-[11px] text-[#405B43] hover:underline cursor-pointer"
                  >
                    Paste Sample Quote
                  </button>
                </div>
                <textarea
                  rows={8}
                  placeholder="Paste raw vendor proposal text, email rates, or WhatsApp estimate..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono text-[#302F28] focus:outline-hidden focus:border-[#405B43]"
                />
              </div>

              <button
                type="button"
                onClick={handleRunXray}
                disabled={isExtracting}
                className="w-full py-3 px-4 rounded-xl bg-[#405B43] hover:bg-[#324734] disabled:opacity-50 text-[#FAF7F0] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FAF7F0] border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Structured Fields with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E7A83E]" />
                    <span>Run Quote X-Ray Extraction</span>
                  </>
                )}
              </button>
            </div>

            {/* Extracted Preview Side */}
            <div className="bg-[#FAF7F0] rounded-2xl border border-[#E7E0D3] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D3] mb-3">
                  <span className="text-xs font-bold text-[#405B43] uppercase tracking-wider">
                    Extracted Schema Preview
                  </span>
                  {extractionResult && (
                    <span className="text-[10px] font-bold bg-[#405B43]/15 text-[#405B43] px-2 py-0.5 rounded-full">
                      Extraction Complete
                    </span>
                  )}
                </div>

                {extractionNote && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#FEF7EB] text-[11px] text-[#B45309] border border-[#E7A83E]/30">
                    {extractionNote}
                  </div>
                )}

                {!extractionResult ? (
                  <div className="py-16 text-center text-xs text-[#77756B]">
                    <FileSpreadsheet className="w-10 h-10 text-[#77756B]/40 mx-auto mb-2" />
                    <p>Enter text on the left and click "Run Quote X-Ray Extraction".</p>
                    <p className="text-[11px] mt-1 text-[#77756B]/80">Works seamlessly in demo mode without requiring API keys.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-[#E7E0D3]">
                      <span className="text-[#77756B]">Vendor:</span>
                      <span className="font-bold text-[#302F28]">{extractionResult.vendorName}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#E7E0D3]">
                      <span className="text-[#77756B]">Total Amount:</span>
                      <span className="font-serif font-bold text-sm text-[#405B43]">
                        ₹{extractionResult.totalAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-[#302F28] mb-1">Missing / Omitted Details:</p>
                      <ul className="space-y-1 text-[#B45309]">
                        {(extractionResult.missingFields || []).map((m: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>&bull;</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {extractionResult && (
                <div className="mt-6 pt-3 border-t border-[#E7E0D3]">
                  <button
                    type="button"
                    onClick={handleSaveExtractedQuote}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save to Active Event Quotations</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Multi-lingual Clarification Drafter */}
      {activeTab === 'inquiry' && (
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#302F28]">Vendor Inquiry & Clarification Drafter</h3>
              <p className="text-xs text-[#77756B] mt-0.5">
                Targeting ambiguities in: <strong className="text-[#302F28]">{currentQuote?.vendorName}</strong>
              </p>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#77756B]" />
              <div className="flex rounded-xl bg-[#FAF7F0] p-1 border border-[#E7E0D3] text-xs">
                {(['English', 'Hindi', 'Gujarati'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedInquiryLanguage(lang)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedInquiryLanguage === lang ? 'bg-[#405B43] text-[#FAF7F0]' : 'text-[#77756B] hover:text-[#302F28]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Missing items checklist to address */}
          <div className="p-4 rounded-2xl bg-[#FEF7EB] border border-[#E7A83E]/40 text-xs">
            <p className="font-bold text-[#B45309] mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#E7A83E]" />
              <span>Questions being drafted from quote omissions:</span>
            </p>
            <ul className="space-y-1 text-[#302F28]">
              {currentQuote?.missingFields.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#E7A83E] font-bold">{i + 1}.</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Generator Action */}
          <div>
            <button
              type="button"
              onClick={handleGenerateInquiryDraft}
              disabled={isGeneratingInquiry}
              className="py-2.5 px-5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-bold flex items-center gap-2 shadow-xs transition-transform hover:scale-[1.01] cursor-pointer"
            >
              {isGeneratingInquiry ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#FAF7F0] border-t-transparent rounded-full animate-spin" />
                  <span>Drafting in {selectedInquiryLanguage}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#E7A83E]" />
                  <span>Generate Inquiry Draft in {selectedInquiryLanguage}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Draft Box */}
          {generatedDraft && (
            <div className="bg-[#FAF7F0] rounded-2xl border border-[#E7E0D3] p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E7E0D3]">
                <span className="font-bold text-[#405B43]">
                  Ready-to-Send Draft ({selectedInquiryLanguage})
                </span>
                <span className="text-[10px] text-[#77756B] bg-[#FFFDF9] px-2 py-0.5 rounded border border-[#E7E0D3]">
                  Status: Draft (Not Sent)
                </span>
              </div>

              <textarea
                readOnly
                rows={8}
                value={generatedDraft}
                className="w-full p-3 rounded-xl bg-[#FFFDF9] border border-[#E7E0D3] text-xs font-sans text-[#302F28] focus:outline-hidden"
              />

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-[#77756B] italic">
                  Note: Bandobast creates un-sent drafts. Copy to WhatsApp or email to dispatch to vendor.
                </p>

                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="px-4 py-2 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDraft ? 'Copied to Clipboard!' : 'Copy Inquiry Text'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
