import React, { useState } from 'react';
import { CelebrationEvent, BudgetCategory, BudgetLineItem, ProvenanceRecord, UnitType } from '../types';
import { calculateBudgetTotals } from '../services/rippleEngine';
import { ProvenanceBadge } from './ProvenanceBadge';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  IndianRupee, 
  Users, 
  AlertCircle, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface BudgetStudioViewProps {
  event: CelebrationEvent;
  onUpdateEvent: (updatedEvent: CelebrationEvent) => void;
  onOpenTradeoffModal: () => void;
}

export const BudgetStudioView: React.FC<BudgetStudioViewProps> = ({
  event,
  onUpdateEvent,
  onOpenTradeoffModal
}) => {
  const budget = calculateBudgetTotals(event);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(event.categories[0]?.id || null);

  // Modals for editing category or adding line items
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState(20000);

  // Line item modal
  const [activeCategoryIdForLineItem, setActiveCategoryIdForLineItem] = useState<string | null>(null);
  const [newLineItemName, setNewLineItemName] = useState('');
  const [newLineItemCost, setNewLineItemCost] = useState(5000);
  const [newLineItemType, setNewLineItemType] = useState<UnitType>('fixed');
  const [newLineItemUnitCost, setNewLineItemUnitCost] = useState(250);

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategoryId(expandedCategoryId === id ? null : id);
  };

  const handleToggleCategoryPreserve = (categoryId: string) => {
    const updatedCategories = event.categories.map(c => 
      c.id === categoryId ? { ...c, isMustPreserve: !c.isMustPreserve } : c
    );
    onUpdateEvent({ ...event, categories: updatedCategories, updatedAt: new Date().toISOString() });
  };

  const handleSaveCategoryBudget = (categoryId: string, newAmount: number) => {
    if (newAmount < 0) return;
    const updatedCategories = event.categories.map(c => 
      c.id === categoryId ? { ...c, plannedAmount: newAmount } : c
    );
    onUpdateEvent({ ...event, categories: updatedCategories, updatedAt: new Date().toISOString() });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (event.categories.length <= 1) return;
    const updatedCategories = event.categories.filter(c => c.id !== categoryId);
    onUpdateEvent({ ...event, categories: updatedCategories, updatedAt: new Date().toISOString() });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || newCatBudget < 0) return;

    const newCategory: BudgetCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      iconName: 'Wallet',
      color: '#405B43',
      plannedAmount: newCatBudget,
      committedAmount: 0,
      paidAmount: 0,
      isMustPreserve: false,
      notes: 'Custom organizer category',
      lineItems: []
    };

    onUpdateEvent({
      ...event,
      categories: [...event.categories, newCategory],
      updatedAt: new Date().toISOString()
    });
    setNewCatName('');
    setShowAddCategoryModal(false);
  };

  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryIdForLineItem || !newLineItemName.trim()) return;

    const calculatedPlanned = newLineItemType === 'per_guest'
      ? newLineItemUnitCost * event.guestCount
      : newLineItemCost;

    const newItem: BudgetLineItem = {
      id: `li-${Date.now()}`,
      categoryId: activeCategoryIdForLineItem,
      name: newLineItemName.trim(),
      unitType: newLineItemType,
      unitCost: newLineItemType === 'per_guest' ? newLineItemUnitCost : undefined,
      quantity: newLineItemType === 'per_guest' ? event.guestCount : 1,
      plannedAmount: calculatedPlanned,
      committedAmount: 0,
      paidAmount: 0,
      isProtected: false,
      provenance: {
        source: 'user_entered',
        calculationBasis: newLineItemType === 'per_guest'
          ? `Per-head: ₹${newLineItemUnitCost} × ${event.guestCount} guests`
          : 'User specified item amount',
        verified: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };

    const updatedCategories = event.categories.map(cat => {
      if (cat.id !== activeCategoryIdForLineItem) return cat;
      const updatedLineItems = [...(cat.lineItems || []), newItem];
      const sumPlanned = updatedLineItems.reduce((acc, item) => acc + item.plannedAmount, 0);
      return {
        ...cat,
        plannedAmount: sumPlanned,
        lineItems: updatedLineItems
      };
    });

    onUpdateEvent({
      ...event,
      categories: updatedCategories,
      updatedAt: new Date().toISOString()
    });

    setNewLineItemName('');
    setActiveCategoryIdForLineItem(null);
  };

  const handleDeleteLineItem = (categoryId: string, lineItemId: string) => {
    const updatedCategories = event.categories.map(cat => {
      if (cat.id !== categoryId) return cat;
      const filtered = (cat.lineItems || []).filter(item => item.id !== lineItemId);
      const sumPlanned = filtered.reduce((acc, item) => acc + item.plannedAmount, 0);
      return {
        ...cat,
        plannedAmount: sumPlanned,
        lineItems: filtered
      };
    });

    onUpdateEvent({ ...event, categories: updatedCategories, updatedAt: new Date().toISOString() });
  };

  // Recharts bar chart data
  const barData = event.categories.map(c => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    Planned: c.plannedAmount,
    Committed: c.committedAmount,
    Paid: c.paidAmount
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6]">
              Budget Studio
            </span>
            <span className="text-xs text-[#77756B]">Deterministic Arithmetic & Provenance Audit</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302F28]">Celebration Financial Ledger</h1>
          <p className="text-xs text-[#77756B] mt-1">
            Every rupee is grounded in source quotations or explicit organizer confirmations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {budget.isOverBudget && (
            <button
              type="button"
              onClick={onOpenTradeoffModal}
              className="px-4 py-2.5 rounded-xl bg-[#E7A83E] hover:bg-[#d6962e] text-[#302F28] font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:scale-[1.02]"
            >
              <AlertCircle className="w-4 h-4 text-[#302F28]" />
              <span>Simulate Overrun Trade-offs</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] uppercase font-semibold text-[#77756B]">Total Ceiling</p>
          <p className="font-serif text-2xl font-bold text-[#302F28] mt-1">
            ₹{budget.totalBudget.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1">Fixed budget baseline</p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] uppercase font-semibold text-[#405B43]">Planned Allocations</p>
          <p className="font-serif text-2xl font-bold text-[#405B43] mt-1">
            ₹{budget.totalPlanned.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1">
            {Math.round((budget.totalPlanned / budget.totalBudget) * 100)}% of ceiling allocated
          </p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] uppercase font-semibold text-[#77756B]">Committed & Contracts</p>
          <p className="font-serif text-2xl font-bold text-[#302F28] mt-1">
            ₹{budget.totalCommitted.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1">
            Paid: ₹{budget.totalPaid.toLocaleString('en-IN')} in advances
          </p>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] uppercase font-semibold text-[#77756B]">
            {budget.isOverBudget ? 'Deficit / Shortfall' : 'Unallocated Buffer'}
          </p>
          <p className={`font-serif text-2xl font-bold mt-1 ${budget.isOverBudget ? 'text-[#C76F50]' : 'text-[#405B43]'}`}>
            ₹{Math.abs(budget.remainingBudget).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[#77756B] mt-1">
            ₹{budget.costPerGuest.toLocaleString('en-IN')} / guest ({event.guestCount} pax)
          </p>
        </div>
      </div>

      {/* Comparison Chart: Planned vs Committed by Category */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 shadow-xs">
        <h3 className="font-serif text-lg font-bold text-[#302F28] mb-1">
          Category Financial Velocity
        </h3>
        <p className="text-xs text-[#77756B] mb-4">
          Visual comparison of Planned allocations vs Committed signed contracts and Paid deposits.
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D3" opacity={0.6} />
              <XAxis dataKey="name" stroke="#77756B" fontSize={11} tickLine={false} />
              <YAxis stroke="#77756B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
              <Tooltip 
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E7E0D3', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="Planned" fill="#405B43" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Committed" fill="#E7A83E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Paid" fill="#C76F50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories & Detailed Line Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-[#302F28]">Category Breakdown & Line Items</h3>
          <span className="text-xs text-[#77756B]">{event.categories.length} Active Categories</span>
        </div>

        {event.categories.map((category) => {
          const isExpanded = expandedCategoryId === category.id;
          const catPercent = Math.round((category.plannedAmount / (budget.totalBudget || 1)) * 100);

          return (
            <div 
              key={category.id} 
              className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl overflow-hidden shadow-xs transition-all"
            >
              {/* Category Header Row */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF9] hover:bg-[#FAF7F0]/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#FAF7F0] shrink-0" style={{ backgroundColor: category.color }}>
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#302F28]">{category.name}</h4>
                      {category.isMustPreserve && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#405B43]/15 text-[#405B43]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Must Preserve</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#77756B] mt-0.5">{category.notes || 'No notes specified'}</p>
                  </div>
                </div>

                {/* Amounts & Controls */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
                  <div className="text-right">
                    <p className="font-serif font-bold text-base text-[#405B43]">
                      ₹{category.plannedAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-[#77756B] font-mono">
                      {catPercent}% of budget • Paid: ₹{category.paidAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryPreserve(category.id)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        category.isMustPreserve 
                          ? 'bg-[#405B43] text-[#FAF7F0] border-[#405B43]' 
                          : 'bg-[#FAF7F0] text-[#77756B] border-[#E7E0D3] hover:text-[#302F28]'
                      }`}
                      title={category.isMustPreserve ? 'Locked priority: will not be reduced during trade-offs' : 'Click to lock as a must-preserve priority'}
                    >
                      {category.isMustPreserve ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingCategory(category)}
                      className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E7E0D3]/50 text-[#77756B] hover:text-[#302F28] border border-[#E7E0D3] transition-colors"
                      title="Edit Category Target"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(category.id)}
                      className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-[#E7E0D3]/50 text-[#302F28] border border-[#E7E0D3] transition-colors"
                      aria-label="Expand line items"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Line Items Drawer */}
              {isExpanded && (
                <div className="bg-[#FAF7F0]/60 border-t border-[#E7E0D3] p-5 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#405B43] uppercase tracking-wider">
                      Verified Line Items ({category.lineItems?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCategoryIdForLineItem(category.id)}
                      className="text-xs font-semibold text-[#405B43] hover:text-[#324734] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Line Item</span>
                    </button>
                  </div>

                  {(!category.lineItems || category.lineItems.length === 0) ? (
                    <div className="p-4 text-center text-xs text-[#77756B] bg-[#FFFDF9] rounded-2xl border border-dashed border-[#E7E0D3]">
                      No individual line items added yet. Click "+ Add Line Item" or import from a supplier quote.
                    </div>
                  ) : (
                    <div className="border border-[#E7E0D3] rounded-2xl overflow-hidden bg-[#FFFDF9] divide-y divide-[#E7E0D3]">
                      {category.lineItems.map((item) => (
                        <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="sm:max-w-[45%]">
                            <p className="font-semibold text-[#302F28]">{item.name}</p>
                            {item.unitType === 'per_guest' ? (
                              <p className="text-[11px] text-[#405B43] font-mono mt-0.5">
                                ₹{item.unitCost}/guest × {event.guestCount} guests (Dynamic headcount link)
                              </p>
                            ) : (
                              <p className="text-[11px] text-[#77756B] mt-0.5 font-mono">
                                Fixed price item
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center">
                            {/* Provenance Badge */}
                            <ProvenanceBadge provenance={item.provenance} />

                            <div className="text-right">
                              <p className="font-mono font-bold text-[#302F28]">
                                ₹{item.plannedAmount.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] text-[#77756B]">
                                Paid: ₹{item.paidAmount.toLocaleString('en-IN')}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLineItem(category.id, item.id)}
                              className="p-1.5 text-[#77756B] hover:text-[#C76F50] rounded-lg transition-colors"
                              title="Delete line item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#302F28] mb-2">Edit {editingCategory.name}</h3>
            <p className="text-xs text-[#77756B] mb-4">Set revised planned budget ceiling for this category.</p>
            
            <label className="block text-xs font-semibold text-[#302F28] mb-1">Planned Target Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="1000"
              defaultValue={editingCategory.plannedAmount}
              id="edit-cat-amount-input"
              className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] font-mono text-sm mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3.5 py-2 rounded-xl border border-[#E7E0D3] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('edit-cat-amount-input') as HTMLInputElement;
                  if (input) handleSaveCategoryBudget(editingCategory.id, parseInt(input.value) || 0);
                }}
                className="px-4 py-2 bg-[#405B43] text-[#FAF7F0] rounded-xl text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleAddCategory} className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#302F28] mb-2">Add Budget Category</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Stationery & Signage"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Planned Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E7E0D3] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#405B43] text-[#FAF7F0] rounded-xl text-xs font-semibold"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Line Item Modal */}
      {activeCategoryIdForLineItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleAddLineItem} className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#302F28] mb-1">Add Verified Line Item</h3>
            <p className="text-xs text-[#77756B] mb-4">Attach dynamic per-guest pricing or fixed quote amounts.</p>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live Chaat Counter or 4K Teaser Film"
                  value={newLineItemName}
                  onChange={(e) => setNewLineItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Pricing Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLineItemType('fixed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium ${
                      newLineItemType === 'fixed'
                        ? 'bg-[#EDF3EC] text-[#405B43] border-[#405B43]'
                        : 'bg-[#FAF7F0] border-[#E7E0D3] text-[#77756B]'
                    }`}
                  >
                    Fixed Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLineItemType('per_guest')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium ${
                      newLineItemType === 'per_guest'
                        ? 'bg-[#EDF3EC] text-[#405B43] border-[#405B43]'
                        : 'bg-[#FAF7F0] border-[#E7E0D3] text-[#77756B]'
                    }`}
                  >
                    Per Guest (Dynamic)
                  </button>
                </div>
              </div>

              {newLineItemType === 'fixed' ? (
                <div>
                  <label className="block text-xs font-medium text-[#302F28] mb-1">Fixed Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={newLineItemCost}
                    onChange={(e) => setNewLineItemCost(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#302F28] mb-1">Rate Per Guest (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="50"
                    value={newLineItemUnitCost}
                    onChange={(e) => setNewLineItemUnitCost(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs font-mono"
                  />
                  <p className="text-[11px] text-[#405B43] mt-1 font-mono">
                    Total: ₹{(newLineItemUnitCost * event.guestCount).toLocaleString('en-IN')} for {event.guestCount} guests
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryIdForLineItem(null)}
                className="px-3.5 py-2 rounded-xl border border-[#E7E0D3] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#405B43] text-[#FAF7F0] rounded-xl text-xs font-semibold"
              >
                Add Line Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
