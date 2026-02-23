const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const newLandingPageKeys = {
  hero_title: "L'assistant IA complet pour les restaurateurs.",
  hero_subtitle: "DÉLÉGUEZ L'OPÉRATIONNEL",
  hero_description: "Rive remplace vos cahiers de bord papier, pilote votre rentabilité, assure votre conformité sanitaire et gère vos réseaux sociaux. Le tout traduit instantanément pour vos équipes de toutes origines.",
  hero_cta: "Commencer l'essai gratuit",
  
  features_title: "Tout ce dont vous avez besoin pour opérer, au même endroit.",
  
  f1_title: "Cahier de Bord Intelligent (Logbook)",
  f1_desc: "Oubliez les carnets volants. La relève, les problèmes matériels et les incidents clients sont consignés, analysés et suivis par l'IA.",
  f1_ex1: "Noter un problème d'équipement (ex: \"Le frigo 2 fuit, réparateur appelé\").",
  f1_ex2: "Transmettre des consignes de service claires à l'équipe du soir.",
  f1_ex3: "Consigner les incidents clients pour le suivi qualité.",
  
  f2_title: "Conformité Sanitaire (Actions Correctives)",
  f2_desc: "Rive détecte les anomalies dans la température et les processus, et génère instantanément la marche à suivre pour rester conforme.",
  f2_ex1: "Le frigo passe à 8°C : création d'une tâche d'urgence \"Isoler ou jeter les denrées non conformes\".",
  f2_ex2: "Rappel automatique pour la vérification des huiles de friture.",
  f2_ex3: "Procédures HACCP documentées en cas d'inspection.",

  f3_title: "Traduction Instantanée (14 Langues)",
  f3_desc: "La barrière de la langue n'existe plus. Chaque membre accède à l'application et aux notes dans sa langue natale.",
  f3_ex1: "Le chef écrit en espagnol, le plongeur lit en bengali.",
  f3_ex2: "Fiches de recettes immédiatement comprises par tous les nouveaux arrivants.",
  f3_ex3: "Procédures de sécurité acquises quelle que soit l'origine de l'employé.",

  f4_title: "Food Cost & Menu Engineering",
  f4_desc: "L'intelligence artificielle croise vos coûts d'ingrédients et vos prix de vente pour traquer le gaspillage et maximiser la marge.",
  f4_ex1: "Calculer la marge exacte au centime de votre Plat du Jour.",
  f4_ex2: "Identifier les plats \"Vaches à lait\" vs les plats \"Poids morts\".",
  f4_ex3: "Simuler l'impact sur les profits d'une augmentation de 10% du prix du saumon.",

  f5_title: "Scan de Reçus IA",
  f5_desc: "Ne saisissez plus les factures à la main. L'IA extrait les lignes de produits, les quantités et met à jour vos coûts.",
  f5_ex1: "Prendre en photo la facture froissée du maraîcher à la réception.",
  f5_ex2: "Extraction des données et alerte de variation de prix sur un produit.",
  f5_ex3: "Mise à jour automatique du Coût de Revient (Food Cost) de vos recettes.",

  f6_title: "Assistant Contenu (Social Media)",
  f6_desc: "Attirez de nouveaux clients avec des publications engageantes générées en un clic à partir de vos menus.",
  f6_ex1: "Générer un post accrocheur pour le menu Saint-Valentin avec emojis et hashtags.",
  f6_ex2: "Traduire automatiquement un post pour attirer la clientèle touristique locale.",
  f6_ex3: "Rédiger une description alléchante pour votre plateforme de livraison (Uber Eats/Deliveroo)."
};

// Also inject missing pricing keys if any
const newPricingKeys = {
  pricing_title: "Tarification Simple",
  pricing_desc: "Rentabilisé en une journée de gestion économisée.",
};

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.LandingPage = { ...data.LandingPage, ...newLandingPageKeys };
  
  if (!data.Pricing) data.Pricing = {};
  data.Pricing = { ...data.Pricing, ...newPricingKeys };

  // Write back formatted with 2 spaces
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\\n');
  console.log(`Updated ${file}`);
}
