const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/LandingPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix BCG Matrix
const bcgTarget = `               {/* Matrix Background */}
               <div className="absolute inset-5 grid grid-cols-2 grid-rows-2 gap-1 opacity-70">
                 <div className="bg-green-50 rounded-tl-2xl border border-green-100 flex items-center justify-center text-green-700/50 text-xs font-bold font-jakarta">Étoiles</div>
                 <div className="bg-amber-50 rounded-tr-2xl border border-amber-100 flex items-center justify-center text-amber-700/50 text-xs font-bold font-jakarta">Vaches à lait</div>
                 <div className="bg-red-50 rounded-bl-2xl border border-red-100 flex items-center justify-center text-red-700/50 text-xs font-bold font-jakarta">Poids morts</div>
                 <div className="bg-blue-50 rounded-br-2xl border border-blue-100 flex items-center justify-center text-blue-700/50 text-xs font-bold font-jakarta">Énigmes</div>
               </div>`;

const bcgReplacement = `               {/* Matrix Background */}
               <div className="absolute inset-5 grid grid-cols-2 grid-rows-2 gap-1 opacity-70">
                 <div className="bg-green-50 rounded-tl-2xl border border-green-100 flex items-center justify-center text-green-700/50 text-xs font-bold font-jakarta">{t('bcg_stars')}</div>
                 <div className="bg-amber-50 rounded-tr-2xl border border-amber-100 flex items-center justify-center text-amber-700/50 text-xs font-bold font-jakarta">{t('bcg_cashcows')}</div>
                 <div className="bg-red-50 rounded-bl-2xl border border-red-100 flex items-center justify-center text-red-700/50 text-xs font-bold font-jakarta">{t('bcg_deadweights')}</div>
                 <div className="bg-blue-50 rounded-br-2xl border border-blue-100 flex items-center justify-center text-blue-700/50 text-xs font-bold font-jakarta">{t('bcg_puzzles')}</div>
               </div>`;

// Use a more regex-friendly replacement for safety
content = content.replace(/Étoiles/g, "{t('bcg_stars')}");
content = content.replace(/Vaches à lait/g, "{t('bcg_cashcows')}");
content = content.replace(/Poids morts/g, "{t('bcg_deadweights')}");
content = content.replace(/Énigmes/g, "{t('bcg_puzzles')}");
content = content.replace(/↓ API Sync \(Toast, Square\.\.\.\)/g, "{t('pos_sync_text')}");
content = content.replace(/Saumon Norvège/g, "{t('ocr_product')}");
content = content.replace(/12\.50\/KG/g, "{t('ocr_price')}");
content = content.replace(/▲ \+0\.50€ \/ KG/g, "{t('ocr_alert')}");
content = content.replace(/MAJ OK : TARTARE/g, "{t('ocr_status')}");
content = content.replace(/"Découvrez le menu spécial de ce soir ! Un thon rouge mi-cuit parfaitement braisé\.\.\. ✨ Réservation en bio 👇"/g, "{t('f6_mock_caption')}");

fs.writeFileSync(filePath, content);
console.log('Successfully updated LandingPage.tsx hardcoded strings.');
