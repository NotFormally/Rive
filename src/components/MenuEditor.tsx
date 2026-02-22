"use client";

import { useState, useEffect, useCallback } from "react";
import { MenuItem, MenuCategory, RestaurantInfo, loadMenuFromSupabase, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "@/lib/menu-store";
import { QRCode } from "react-qrcode-logo";
import { InstagramGenerator } from "./InstagramGenerator";

export function MenuEditor() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({ name: '', tagline: '', address: '', phone: '', hours: '' });
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [instagramItem, setInstagramItem] = useState<{ id: string; name: string } | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadMenuFromSupabase();
    setCategories(data.categories);
    setItems(data.items);
    setRestaurant(data.restaurant);
    if (!activeCategory && data.categories.length > 0) setActiveCategory(data.categories[0].id);
  }, [activeCategory]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggleAvailability = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await toggleMenuItemAvailability(id, item.available);
    setItems(items.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  const handleDeleteItem = async (id: string) => {
    await deleteMenuItem(id);
    setItems(items.filter(i => i.id !== id));
  };

  const handleSaveItem = async (item: MenuItem) => {
    const exists = items.find(i => i.id === item.id);
    if (exists) {
      await updateMenuItem(item);
      setItems(items.map(i => i.id === item.id ? item : i));
    } else {
      await addMenuItem(item);
      setItems([...items, item]);
    }
    setEditingItem(null);
    setShowAddForm(false);
  };

  const filteredItems = items.filter(item => item.categoryId === activeCategory);

  return (
    <>
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">🍽️ Gestionnaire de Menu</h2>
            <p className="text-sm text-zinc-500 mt-1">Modifiez votre menu ici — les changements sont instantanément reflétés sur votre QR code et mini-site.</p>
          </div>
          <a
            href="/menu/chez-marcel"
            target="_blank"
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            Voir le Menu QR →
          </a>
        </div>

        {/* Restaurant Info Summary */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{restaurant.name}</span> — {restaurant.tagline} | {restaurant.hours}
        </div>

        {/* QR Code Toggle */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showQR ? 'Masquer le QR Code' : '📱 Afficher le QR Code à imprimer'}
          </button>
        </div>

        {showQR && (
          <div className="mt-4 flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-zinc-200">
            <QRCode
              value={typeof window !== 'undefined' ? `${window.location.origin}/menu/chez-marcel` : 'https://shore.app/menu/chez-marcel'}
              size={180}
              bgColor="#ffffff"
              fgColor="#1e1b4b"
              qrStyle="dots"
              eyeRadius={8}
            />
            <p className="text-[10px] text-zinc-400 mt-1">Scannez pour accéder au menu</p>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-lg shadow-sm border p-4 transition-opacity ${!item.available ? 'opacity-50 border-dashed' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{item.name}</h3>
                  {!item.available && (
                    <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">Indisponible</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{item.description}</p>
                {item.allergens.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {item.allergens.map((a, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-amber-200/50">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.price.toFixed(2)}$</span>
                <div className="flex gap-1">
                  <button onClick={() => setEditingItem(item)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Modifier</button>
                  <span className="text-zinc-300">|</span>
                  <button onClick={() => handleToggleAvailability(item.id)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
                    {item.available ? 'Masquer' : 'Remettre'}
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">Suppr.</button>
                    <span className="text-zinc-300">|</span>
                    <button onClick={() => setInstagramItem({ id: item.id, name: item.name })} className="text-xs text-pink-600 dark:text-pink-400 hover:underline">📸</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-sm">Aucun plat dans cette catégorie.</div>
        )}
      </div>

      {/* Add Item Button */}
      {!showAddForm && !editingItem && (
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingItem({
              id: String(Date.now()),
              name: '',
              description: '',
              price: 0,
              categoryId: activeCategory,
              allergens: [],
              available: true,
            });
          }}
          className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + Ajouter un plat à « {categories.find(c => c.id === activeCategory)?.name} »
        </button>
      )}

      {/* Edit/Add Form */}
      {editingItem && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-800 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {showAddForm ? '➕ Nouveau plat' : '✏️ Modifier le plat'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nom</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="Risotto aux champignons..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Prix ($)</label>
              <input
                type="number"
                step="0.50"
                value={editingItem.price || ''}
                onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                placeholder="24.00"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
            <textarea
              rows={2}
              value={editingItem.description}
              onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Décrivez le plat..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Allergènes (séparés par virgule)</label>
            <input
              type="text"
              value={editingItem.allergens.join(', ')}
              onChange={e => setEditingItem({ ...editingItem, allergens: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Gluten, Produits laitiers, Noix..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setEditingItem(null); setShowAddForm(false); }}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            >
              Annuler
            </button>
            <button
              onClick={() => handleSaveItem(editingItem)}
              disabled={!editingItem.name || !editingItem.price}
              className="px-4 py-2 rounded-md bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>

      {instagramItem && (
        <InstagramGenerator
          menuItemId={instagramItem.id}
          menuItemName={instagramItem.name}
          onClose={() => setInstagramItem(null)}
        />
      )}
    </>
  );
}
