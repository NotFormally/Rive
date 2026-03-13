"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown, ChevronRight, Trash2, Plus, AlertTriangle,
  GripVertical, Pencil, Check, X
} from "lucide-react";
import type { MenuExtractionResult } from "@/app/api/extract-menu/route";

interface MenuImportPreviewProps {
  data: MenuExtractionResult;
  onChange: (data: MenuExtractionResult) => void;
}

export function MenuImportPreview({ data, onChange }: MenuImportPreviewProps) {
  const t = useTranslations("MenuImport");
  const [expandedCats, setExpandedCats] = useState<Set<number>>(
    new Set(data.categories.map((_, i) => i))
  );
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());

  const totalItems = data.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalIngredients = new Set(
    data.categories.flatMap(cat =>
      cat.items.flatMap(item =>
        (item.ingredients || []).map(ing => ing.name.toLowerCase())
      )
    )
  ).size;

  const toggleCat = (idx: number) => {
    const next = new Set(expandedCats);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setExpandedCats(next);
  };

  const toggleIngredients = (key: string) => {
    const next = new Set(expandedIngredients);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedIngredients(next);
  };

  const updateCategory = (catIdx: number, field: string, value: string) => {
    const updated = { ...data, categories: [...data.categories] };
    updated.categories[catIdx] = { ...updated.categories[catIdx], [field]: value };
    onChange(updated);
  };

  const updateItem = (catIdx: number, itemIdx: number, field: string, value: any) => {
    const updated = { ...data, categories: [...data.categories] };
    updated.categories[catIdx] = {
      ...updated.categories[catIdx],
      items: [...updated.categories[catIdx].items],
    };
    updated.categories[catIdx].items[itemIdx] = {
      ...updated.categories[catIdx].items[itemIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const updated = { ...data, categories: [...data.categories] };
    updated.categories[catIdx] = {
      ...updated.categories[catIdx],
      items: updated.categories[catIdx].items.filter((_, i) => i !== itemIdx),
    };
    onChange(updated);
  };

  const removeCategory = (catIdx: number) => {
    const updated = { ...data, categories: data.categories.filter((_, i) => i !== catIdx) };
    onChange(updated);
  };

  const addItem = (catIdx: number) => {
    const updated = { ...data, categories: [...data.categories] };
    updated.categories[catIdx] = {
      ...updated.categories[catIdx],
      items: [
        ...updated.categories[catIdx].items,
        { name: '', description: '', price: 0, allergens: [], ingredients: [], confidence: 1.0 },
      ],
    };
    onChange(updated);
    setExpandedCats(prev => new Set(prev).add(catIdx));
  };

  const addCategory = () => {
    const updated = {
      ...data,
      categories: [
        ...data.categories,
        { name: t('new_category'), items: [] },
      ],
    };
    onChange(updated);
    setExpandedCats(prev => new Set(prev).add(data.categories.length));
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
          {data.categories.length} {t('summary_categories')}
        </span>
        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
          {totalItems} {t('summary_items')}
        </span>
        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full font-medium">
          {totalIngredients} {t('summary_ingredients')}
        </span>
      </div>

      {/* Categories accordion */}
      {data.categories.map((cat, catIdx) => (
        <div key={catIdx} className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          {/* Category header */}
          <div
            className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer select-none"
            onClick={() => toggleCat(catIdx)}
          >
            {expandedCats.has(catIdx) ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
            <EditableText
              value={cat.name}
              onChange={(v) => updateCategory(catIdx, 'name', v)}
              className="font-semibold text-zinc-900 dark:text-zinc-100"
            />
            <span className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
              {cat.items.length}
            </span>
            <div className="ml-auto">
              <button
                onClick={(e) => { e.stopPropagation(); removeCategory(catIdx); }}
                className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                title={t('btn_remove')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Items */}
          {expandedCats.has(catIdx) && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {cat.items.map((item, itemIdx) => {
                const itemKey = `${catIdx}-${itemIdx}`;
                return (
                  <div key={itemIdx} className="px-4 py-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-zinc-300 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Price row */}
                        <div className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(catIdx, itemIdx, 'name', e.target.value)}
                            placeholder={t('item_name')}
                            className="flex-1 px-2 py-1 text-sm font-medium border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-zinc-400">{data.currency || '$'}</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(catIdx, itemIdx, 'price', parseFloat(e.target.value) || 0)}
                              step="0.50"
                              className="w-20 px-2 py-1 text-sm text-right border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
                            />
                          </div>
                          {item.confidence < 0.7 && (
                            <span title={t('low_confidence_warning')} className="shrink-0">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'description', e.target.value)}
                          placeholder={t('item_desc')}
                          className="w-full px-2 py-1 text-xs border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-indigo-500 bg-transparent text-zinc-500 dark:text-zinc-400 focus:outline-none transition-colors"
                        />

                        {/* Allergens */}
                        <div className="flex flex-wrap gap-1">
                          {(item.allergens || []).map((allergen, ai) => (
                            <span
                              key={ai}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full"
                            >
                              {allergen}
                              <button
                                onClick={() => {
                                  const next = item.allergens.filter((_, i) => i !== ai);
                                  updateItem(catIdx, itemIdx, 'allergens', next);
                                }}
                                className="hover:text-red-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          <AllergenAdder
                            onAdd={(a) => updateItem(catIdx, itemIdx, 'allergens', [...(item.allergens || []), a])}
                          />
                        </div>

                        {/* Ingredients (collapsible) */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div>
                            <button
                              onClick={() => toggleIngredients(itemKey)}
                              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
                            >
                              {expandedIngredients.has(itemKey) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              {item.ingredients.length} {t('item_ingredients')}
                            </button>
                            {expandedIngredients.has(itemKey) && (
                              <div className="mt-1 pl-4 space-y-1">
                                {item.ingredients.map((ing, ii) => (
                                  <div key={ii} className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span className="w-2 h-2 bg-zinc-300 dark:bg-zinc-600 rounded-full shrink-0" />
                                    <span>{ing.name}</span>
                                    {ing.estimatedQuantity && (
                                      <span className="text-zinc-400">({ing.estimatedQuantity}{ing.unit ? ` ${ing.unit}` : ''})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => removeItem(catIdx, itemIdx)}
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                        title={t('btn_remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add item button */}
              <div className="px-4 py-2">
                <button
                  onClick={() => addItem(catIdx)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t('btn_add_item')}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add category button */}
      <button
        onClick={addCategory}
        className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('btn_add_category')}
      </button>
    </div>
  );
}

/** Inline editable text — click to edit, blur/enter to save */
function EditableText({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(draft); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        onClick={(e) => e.stopPropagation()}
        className={`${className} px-1 border-b border-indigo-500 bg-transparent focus:outline-none`}
      />
    );
  }

  return (
    <span
      className={`${className} cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-700/50 px-1 rounded`}
      onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

/** Mini allergen adder — shows common allergens */
const COMMON_ALLERGENS = ['Gluten', 'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Soy', 'Sesame', 'Sulfites'];

function AllergenAdder({ onAdd }: { onAdd: (allergen: string) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-full transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {COMMON_ALLERGENS.map((a) => (
        <button
          key={a}
          onClick={() => { onAdd(a); setOpen(false); }}
          className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-full transition-colors"
        >
          {a}
        </button>
      ))}
      <button
        onClick={() => setOpen(false)}
        className="px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
