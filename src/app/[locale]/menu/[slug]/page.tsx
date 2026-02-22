"use client";

import { useState, useEffect } from "react";
import { MenuItem, MenuCategory, RestaurantInfo, loadMenuFromSupabase } from "@/lib/menu-store";

const LANG_LABELS: Record<string, string> = {
  original: '🇫🇷 FR',
  en: '🇬🇧 EN',
  es: '🇪🇸 ES',
};

export default function PublicMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [lang, setLang] = useState<string>('original');

  useEffect(() => {
    const load = async () => {
      const data = await loadMenuFromSupabase();
      setCategories(data.categories);
      setItems(data.items.filter(i => i.available));
      setRestaurant(data.restaurant);
      if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
    };
    load();
  }, []);

  if (!restaurant) return null;

  const getItemDisplay = (item: MenuItem) => {
    if (lang !== 'original' && item.translations?.[lang]) {
      return { name: item.translations[lang].name, description: item.translations[lang].description };
    }
    return { name: item.name, description: item.description };
  };

  const filteredItems = items.filter(i => i.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-zinc-900 to-zinc-950" />
        <div className="relative max-w-lg mx-auto px-6 pt-12 pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-1">{restaurant.name}</h1>
          <p className="text-sm text-indigo-300 italic mb-4">{restaurant.tagline}</p>
          <div className="text-xs text-zinc-400 space-y-0.5">
            <p>📍 {restaurant.address}</p>
            <p>📞 {restaurant.phone}</p>
            <p>🕐 {restaurant.hours}</p>
          </div>
        </div>
      </header>

      {/* Language Switcher */}
      <div className="max-w-lg mx-auto px-6 py-3 flex justify-end gap-1.5">
        {Object.entries(LANG_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              lang === code
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <nav className="max-w-lg mx-auto px-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-white text-zinc-900 shadow-md'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </nav>

      {/* Menu Items */}
      <main className="max-w-lg mx-auto px-6 py-6 space-y-4">
        {filteredItems.map(item => {
          const display = getItemDisplay(item);
          return (
            <div key={item.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 backdrop-blur-sm hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight">{display.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{display.description}</p>
                  {item.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.allergens.map((a, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-lg font-bold text-emerald-400 tabular-nums shrink-0">{item.price.toFixed(2)}$</span>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">Aucun plat dans cette catégorie.</div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-6 py-8 text-center border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">
          Menu propulsé par <span className="text-indigo-500 font-medium">Rive</span> — Intelligence Artificielle pour la restauration
        </p>
      </footer>
    </div>
  );
}
