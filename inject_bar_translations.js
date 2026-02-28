const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'messages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const sidebarAdditions = {
  fr: {
    nav_deposits: "Tracker Consignes",
    nav_variance: "Pertes & Coulage",
    nav_production: "Production Brasc."
  },
  en: {
    nav_deposits: "Deposits Tracker",
    nav_variance: "Variance Hub",
    nav_production: "Brewery Prod."
  },
  it: {
    nav_deposits: "Tracciatore Vuoti",
    nav_variance: "Perdite e Sprechi",
    nav_production: "Produzione"
  }
};

const settingsAdditions = {
  fr: {
    module_deposits_label: "Suivi des Consignes",
    module_deposits_desc: "Séparez vos fûts et consignes verres de votre Food Cost.",
    module_variance_label: "Pertes & Coulage",
    module_variance_desc: "Repérez les liquidités perdues entre votre caisse et l'inventaire.",
    module_production_label: "Production Brassicole",
    module_production_desc: "Pilotez vos brassins de la fermenteuse à l'enfûtage."
  },
  en: {
    module_deposits_label: "Deposits Tracker",
    module_deposits_desc: "Track kegs and bottle deposits separately from Food Cost.",
    module_variance_label: "Variance & Spoilage",
    module_variance_desc: "Spot discrepancies between POS expectations and physical inventory.",
    module_production_label: "Brewery Production",
    module_production_desc: "Track your beer batches from fermentation to kegs."
  },
  it: {
    module_deposits_label: "Tracciatore Vuoti",
    module_deposits_desc: "Traccia i fusti e i vuoti a rendere separatamente.",
    module_variance_label: "Perdite e Sprechi",
    module_variance_desc: "Individua le discrepanze tra POS e inventario fisico.",
    module_production_label: "Produzione Birrificio",
    module_production_desc: "Traccia i lotti di birra dalla fermentazione in poi."
  }
};

for (const file of files) {
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const lang = file.split('.')[0].startsWith('zh') ? file.split('.json')[0] : file.split('.')[0];
  const shortLang = lang.split('-')[0];
  const targetLang = ['fr', 'en', 'it'].includes(shortLang) ? shortLang : 'en';

  if (!data.Sidebar) data.Sidebar = {};
  if (!data.Settings) data.Settings = {};

  Object.assign(data.Sidebar, sidebarAdditions[targetLang] || sidebarAdditions['en']);
  Object.assign(data.Settings, settingsAdditions[targetLang] || settingsAdditions['en']);

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated ' + file);
}
