import React, { useState, useRef } from 'react';
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
  FileQuestion,
  X,
  FileUp,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface VendorQuotesViewProps {
  event: CelebrationEvent;
  onAddQuoteToEvent: (quote: VendorQuote) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: 'draft' | 'under_review' | 'accepted' | 'rejected', verified: boolean) => void;
}

export const VendorQuotesView: React.FC<VendorQuotesViewProps> = ({
  event,
  onAddQuoteToEvent,
  onUpdateQuoteStatus
}) => {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(event.quotes[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'comparison' | 'xray' | 'inquiry'>('comparison');

  // X-Ray Upload / Paste State
  const [pastedText, setPastedText] = useState('');
  const [vendorHint, setVendorHint] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    base64: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  // Inquiry Generator State
  const [selectedInquiryLanguage, setSelectedInquiryLanguage] = useState<'English' | 'Hindi' | 'Gujarati'>('English');
  const [isGeneratingInquiry, setIsGeneratingInquiry] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);

  const currentQuote = event.quotes.find(q => q.id === selectedQuoteId) || event.quotes[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload a PDF document or JPEG/PNG/WebP image.');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setFileError('File size exceeds the 6MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        mimeType: file.type,
        base64: base64Str
      });
      if (!vendorHint && file.name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setVendorHint(cleanName);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file. Please retry or paste text directly.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunXray = async () => {
    if (!pastedText.trim() && !uploadedFile) {
      setFileError('Please provide either quotation text or upload a document.');
      return;
    }

    setIsExtracting(true);
    setExtractionNote(null);
    setFileError(null);

    const result = await extractVendorQuote({
      rawText: pastedText.trim() || undefined,
      fileBase64: uploadedFile?.base64,
      mimeType: uploadedFile?.mimeType,
      vendorNameHint: vendorHint.trim() || undefined
    });

    setIsExtracting(false);
    if (result.success && result.data) {
      // Ensure data defaults to unverified and pending review
      setExtractionResult({
        ...result.data,
        status: 'under_review',
        provenance: {
          source: 'quoted',
          calculationBasis: 'Extracted via Quote X-Ray',
          verified: false,
          lastUpdated: new Date().toISOString().split('T')[0],
          notes: 'AI-extracted quotation pending organizer manual review and verification.'
        }
      });
      if (result.warning) {
        setExtractionNote(result.warning);
      }
    } else {
      setFileError('Unable to parse quotation. Please verify text formatting or try with clear rate breakdown.');
    }
  };

  const handleSaveExtractedQuote = (markVerified = false) => {
    if (!extractionResult) return;

    const newQuote: VendorQuote = {
      id: `q-${Date.now()}`,
      vendorName: extractionResult.vendorName || vendorHint || 'New Vendor',
      vendorCategory: extractionResult.vendorCategory || 'General',
      quoteDate: extractionResult.quoteDate || new Date().toISOString().split('T')[0],
      totalAmount: Number(extractionResult.totalAmount) || 0,
      subtotal: Number(extractionResult.subtotal) || Number(extractionResult.totalAmount) || 0,
      gstAmount: Number(extractionResult.gstAmount) || 0,
      serviceCharges: Number(extractionResult.serviceCharges) || 0,
      paymentTerms: extractionResult.paymentTerms || 'Terms pending written vendor agreement',
      cancellationPolicy: extractionResult.cancellationPolicy || 'Policy not specified in quote',
      validityPeriod: extractionResult.validityPeriod || '15 days',
      inclusions: Array.isArray(extractionResult.inclusions) ? extractionResult.inclusions : [],
      exclusions: Array.isArray(extractionResult.exclusions) ? extractionResult.exclusions : [],
      missingFields: Array.isArray(extractionResult.missingFields) ? extractionResult.missingFields : [],
      lineItems: Array.isArray(extractionResult.lineItems) ? extractionResult.lineItems : [],
      rawText: pastedText || uploadedFile?.name,
      status: markVerified ? 'accepted' : 'under_review',
      provenance: {
        source: 'quoted',
        quoteId: `q-${Date.now()}`,
        calculationBasis: markVerified ? 'Verified by organizer' : 'Extracted via Quote X-Ray (Pending Verification)',
        verified: markVerified,
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: markVerified ? 'Confirmed and verified by event organizer.' : 'AI-extracted quote pending contract verification.'
      }
    };

    onAddQuoteToEvent(newQuote);
    setSelectedQuoteId(newQuote.id);
    setExtractionResult(null);
    setPastedText('');
    handleClearFile();
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
      context: `${event.name} (${event.guestCount} guests, Location: ${event.location})`
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
              Quote X-Ray & Verification Hub
            </span>
            <span className="text-xs text-[#5A584F]">Structured Line-Item Audit, Missing Terms & Verification</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#302F28]">
            Vendor Quotation Ledger & X-Ray
          </h2>
          <p className="text-xs text-[#5A584F] mt-1 max-w-2xl">
            Upload quotes (PDF/Image) or paste proposal text. Bandobast normalizes line items, highlights missing contractual terms, and keeps provenance unverified until you approve.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-2xl bg-[#FAF7F0] p-1.5 border border-[#E7E0D3] self-start lg:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs'
                : 'text-[#5A584F] hover:text-[#302F28]'
            }`}
          >
            Quotation Audit ({event.quotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xray')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'xray'
                ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs'
                : 'text-[#5A584F] hover:text-[#302F28]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E7A83E]" />
            <span>Upload & X-Ray</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inquiry'
                ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs'
                : 'text-[#5A584F] hover:text-[#302F28]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C76F50]" />
            <span>Inquiry Drafter</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Comparison & Deep X-Ray Audit */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Quote Selection Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {event.quotes.map((q) => {
              const isSelected = q.id === (currentQuote?.id || '');
              const isVerified = q.provenance?.verified;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuoteId(q.id)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#405B43] text-[#FAF7F0] border-[#405B43] shadow-xs'
                      : 'bg-[#FFFDF9] text-[#302F28] border-[#E7E0D3] hover:border-[#405B43]/50'
                  }`}
                >
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FAF7F0]' : 'text-[#405B43]'}`} />
                  <span className="font-semibold">{q.vendorName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-[#FAF7F0] text-[#5A584F]'}`}>
                    ₹{q.totalAmount.toLocaleString('en-IN')}
                  </span>
                  {isVerified ? (
                    <span className="text-[10px] text-emerald-300 font-bold">✓ Verified</span>
                  ) : (
                    <span className="text-[10px] text-amber-200">Pending Review</span>
                  )}
                </button>
              );
            })}
          </div>

          {currentQuote && (
            <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Quote Meta Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E0D3]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-2xl font-bold text-[#302F28]">{currentQuote.vendorName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#FAF7F0] border border-[#E7E0D3] text-[#5A584F]">
                      {currentQuote.vendorCategory}
                    </span>
                    {currentQuote.provenance?.verified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Quote</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Pending Review (Unverified)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A584F]">
                    Quote Date: {currentQuote.quoteDate} &bull; Validity: {currentQuote.validityPeriod} &bull; Status: <strong className="uppercase">{currentQuote.status}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#5A584F] font-medium">Total Contract Estimate</p>
                  <p className="font-serif text-3xl font-bold text-[#405B43]">
                    ₹{currentQuote.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-2 text-xs text-[#5A584F]">
                    <span>Subtotal: ₹{currentQuote.subtotal.toLocaleString('en-IN')}</span>
                    {currentQuote.gstAmount > 0 && <span>&bull; GST: ₹{currentQuote.gstAmount.toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              </div>

              {/* Verified Provenance Banner */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E7E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <ProvenanceBadge provenance={currentQuote.provenance} />
                {!currentQuote.provenance?.verified && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#B45309]">Mark as human-verified if contract matches:</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuoteStatus?.(currentQuote.id, 'accepted', true)}
                      className="px-3 py-1.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Verify Quote</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Normalized Line Items Table */}
              <div>
                <h4 className="font-serif text-lg font-bold text-[#302F28] mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#405B43]" />
                  <span>Normalized Itemized Line Items</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#E7E0D3]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F0] border-b border-[#E7E0D3] text-[#5A584F] font-bold">
                        <th className="py-3 px-4">Line Item Description</th>
                        <th className="py-3 px-4 text-center">Quantity</th>
                        <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                        <th className="py-3 px-4 text-right">Subtotal (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E0D3] bg-[#FFFDF9]">
                      {currentQuote.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#FAF7F0]/60">
                          <td className="py-3 px-4 font-semibold text-[#302F28]">{item.description}</td>
                          <td className="py-3 px-4 text-center text-[#5A584F]">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-[#5A584F]">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-serif font-bold text-[#405B43]">
                            ₹{item.subtotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inclusions, Exclusions, and Missing Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Inclusions */}
                <div className="p-4 rounded-2xl bg-[#EDF3EC] border border-[#DCE6D6]">
                  <p className="font-bold text-[#405B43] mb-2 flex items-center gap-1.5">
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
                  <p className="font-bold text-[#5A584F] mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#5A584F]" />
                    <span>Excluded from Scope</span>
                  </p>
                  <ul className="space-y-1.5 text-[#5A584F]">
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
                  <p className="font-bold text-[#B45309] mb-2 flex items-center gap-1.5">
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
                  <p className="font-semibold text-[#5A584F] uppercase text-[10px]">Payment Milestones</p>
                  <p className="text-[#302F28] mt-1">{currentQuote.paymentTerms}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#5A584F] uppercase text-[10px]">Cancellation Policy</p>
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
            <p className="text-xs text-[#5A584F] mt-1">
              Upload PDF rate sheets, proposal images, or paste raw text. Quotes are classified as unverified and pending review until explicitly confirmed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#302F28] mb-1">Vendor Name / Category Hint</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Rasoi Gourmet Caterers (Catering)"
                  value={vendorHint}
                  onChange={(e) => setVendorHint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs text-[#302F28]"
                />
              </div>

              {/* File Upload Control */}
              <div>
                <label className="block text-xs font-semibold text-[#302F28] mb-1">
                  Upload Quotation Document (PDF or Image)
                </label>
                <div className="border-2 border-dashed border-[#E7E0D3] hover:border-[#405B43] rounded-2xl p-4 bg-[#FAF7F0]/60 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="quote-file-input"
                  />
                  {!uploadedFile ? (
                    <label
                      htmlFor="quote-file-input"
                      className="flex flex-col items-center justify-center cursor-pointer py-2 text-center"
                    >
                      <FileUp className="w-8 h-8 text-[#405B43] mb-2" />
                      <span className="text-xs font-bold text-[#405B43]">Click to choose PDF or Image</span>
                      <span className="text-[11px] text-[#5A584F] mt-0.5">Supports PDF, PNG, JPG, WebP up to 6MB</span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E7E0D3]">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileCheck className="w-5 h-5 text-[#405B43] shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#302F28] truncate">{uploadedFile.name}</p>
                          <p className="text-[10px] text-[#5A584F]">{(uploadedFile.size / 1024).toFixed(1)} KB &bull; {uploadedFile.mimeType}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="p-1 rounded-lg hover:bg-[#FAF7F0] text-[#5A584F] hover:text-[#C76F50] cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {fileError && (
                  <p className="text-xs text-[#C76F50] font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>

              {/* Text Paste Fallback */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-[#302F28]">Or Paste Quotation Text</label>
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
                  rows={5}
                  placeholder="Paste proposal text, message rates, or itemized breakdown..."
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
                    <span>Extracting Structured Fields...</span>
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
                    Extracted Schema Review
                  </span>
                  {extractionResult && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                      Pending Organizer Review
                    </span>
                  )}
                </div>

                {extractionNote && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#FEF7EB] text-[11px] text-[#B45309] border border-[#E7A83E]/30">
                    {extractionNote}
                  </div>
                )}

                {!extractionResult ? (
                  <div className="py-16 text-center text-xs text-[#5A584F]">
                    <FileSpreadsheet className="w-10 h-10 text-[#5A584F]/40 mx-auto mb-2" />
                    <p className="font-medium text-[#302F28]">Upload a document or paste text on the left.</p>
                    <p className="text-[11px] mt-1 text-[#5A584F]">Bandobast normalizes line items and audits missing supplier commitments.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-[#E7E0D3]">
                      <span className="text-[#5A584F]">Vendor Name:</span>
                      <input
                        type="text"
                        value={extractionResult.vendorName || ''}
                        onChange={(e) => setExtractionResult({ ...extractionResult, vendorName: e.target.value })}
                        className="text-right font-bold text-[#302F28] bg-white px-2 py-1 rounded border border-[#E7E0D3] text-xs max-w-[200px]"
                      />
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-[#E7E0D3]">
                      <span className="text-[#5A584F]">Total Amount (₹):</span>
                      <input
                        type="number"
                        value={extractionResult.totalAmount || 0}
                        onChange={(e) => setExtractionResult({ ...extractionResult, totalAmount: Number(e.target.value) })}
                        className="text-right font-serif font-bold text-sm text-[#405B43] bg-white px-2 py-1 rounded border border-[#E7E0D3] text-xs max-w-[140px]"
                      />
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#E7E0D3] text-[#5A584F]">
                      <span>Category:</span>
                      <span className="font-semibold text-[#302F28]">{extractionResult.vendorCategory || 'General'}</span>
                    </div>

                    {/* Missing Fields Alerts */}
                    <div className="pt-2">
                      <p className="font-semibold text-[#B45309] mb-1 flex items-center gap-1">
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>Contractual Omissions Detected:</span>
                      </p>
                      <ul className="space-y-1 text-[#B45309] bg-[#FEF7EB] p-2.5 rounded-xl border border-[#E7A83E]/30">
                        {(extractionResult.missingFields || []).length === 0 ? (
                          <li className="text-[11px] text-[#5A584F] italic">No missing fields flagged in quote.</li>
                        ) : (
                          (extractionResult.missingFields || []).map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-[11px]">
                              <span>&bull;</span>
                              <span>{m}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {extractionResult && (
                <div className="mt-6 pt-3 border-t border-[#E7E0D3] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSaveExtractedQuote(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save to Quotes (Pending Review)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveExtractedQuote(true)}
                    className="w-full py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Mark as Verified Quote</span>
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
              <p className="text-xs text-[#5A584F] mt-0.5">
                Targeting ambiguities in: <strong className="text-[#302F28]">{currentQuote?.vendorName}</strong>
              </p>
            </div>

            {/* Language Selection */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#5A584F]" />
              <div className="flex rounded-xl bg-[#FAF7F0] p-1 border border-[#E7E0D3] text-xs">
                {(['English', 'Hindi', 'Gujarati'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedInquiryLanguage(lang)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedInquiryLanguage === lang ? 'bg-[#405B43] text-[#FAF7F0]' : 'text-[#5A584F] hover:text-[#302F28]'
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
                <span className="text-[10px] text-[#5A584F] bg-[#FFFDF9] px-2 py-0.5 rounded border border-[#E7E0D3]">
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
                <p className="text-[11px] text-[#5A584F] italic">
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
