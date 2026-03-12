const fs = require('fs');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const fr = JSON.parse(fs.readFileSync('messages/fr.json', 'utf8'));

const pillarsEN = {
  "title_prefix": "RiveHub: One Platform.",
  "title_highlight": "Three Instruments.",
  "subtitle": "Like a captain needs one command center (not a sextant, barometer, AND compass separately), you need one unified dashboard for Margins, Crew, and Compliance.",
  "persona_select": "WHO ARE YOU?",
  "owner_name": "Restaurant Owner",
  "owner_title": "Margin Compass",
  "owner_subtitle": "See the cost of inaction",
  "owner_prob": "Your suppliers raised prices by $0.50/kg. You discovered it at month-end inventory.",
  "owner_sol": "OCR invoice scanner detects price drift immediately. Next time, you know in 5 seconds.",
  "owner_b1": "Detect supplier inflation before it kills your profit",
  "owner_b2": "Know your true Food Cost in real-time (not guesswork)",
  "owner_b3": "Margin drop alerts: \"Salmon +$0.50/kg → Tartare cost 28%→29.5%\"",
  "owner_b4": "Save $8,653/year on overproduction detection",
  "owner_demo": "$416 weekly overproduction → -$8,653/year",
  "owner_cta": "Calculate your waste",
  "owner_vid": "See owner dashboard in action",
  "owner_tip": "Real ROI. Real savings. Real data.",
  
  "chef_name": "Chef / Kitchen Manager",
  "chef_title": "Crew Lexicon",
  "chef_subtitle": "No miscommunication. Just clarity.",
  "chef_prob": "Your sous-chef speaks French. Dishwasher speaks Bengali. Safety instructions get lost in translation.",
  "chef_sol": "Every recipe, every procedure, every alert — in their native language. Automatically.",
  "chef_b1": "25 languages supported (French, Spanish, Bengali, Cantonese, etc.)",
  "chef_b2": "Recipe cards understood by all new hires, regardless of origin",
  "chef_b3": "Reduce training time by 40% (no language barrier)",
  "chef_b4": "Zero miscommunication on safety procedures",
  "chef_demo": "Same instruction in 5 languages",
  "chef_cta": "See recipe translation",
  "chef_vid": "Watch: Crew Lexicon in action",
  "chef_tip": "One recipe. Five languages. Instant clarity.",
  
  "comp_name": "Compliance Officer",
  "comp_title": "Compliance Charts",
  "comp_subtitle": "Inspections on demand, not panic.",
  "comp_prob": "Manual HACCP logs. Scattered temperature checks. Inspector arrives, you scramble.",
  "comp_sol": "HACCP logs write themselves. Compliance auto-generated from daily operations.",
  "comp_b1": "Temperature monitoring → auto-logged HACCP records",
  "comp_b2": "Ingredient tracking → food safety traceability (automatic)",
  "comp_b3": "Staff training logs → certification records (by-product)",
  "comp_b4": "Inspection-ready 24/7. 60% faster audit prep.",
  "comp_demo": "Full inspection checklist in 2 minutes",
  "comp_cta": "Build your HACCP",
  "comp_vid": "No-Code HACCP Builder demo",
  "comp_tip": "Inspection-ready. Always. 24/7.",

  "lbl_problem": "THE PROBLEM",
  "lbl_solution": "THE SOLUTION",
  
  "adv_title": "Why ",
  "adv_title_highlight": "Unified",
  "adv_title_suffix": " Beats Fragmented",
  "adv_bad_title": "Three Separate Tools",
  "adv_bad_1": "MarginEdge for Food Cost",
  "adv_bad_1_sub": "(misses crew/compliance)",
  "adv_bad_2": "SafetyCulture for HACCP",
  "adv_bad_2_sub": "(misses margin/crew)",
  "adv_bad_3": "7shifts for Crew",
  "adv_bad_3_sub": "(misses margin/compliance)",
  "adv_bad_end": "Three subscriptions, three logins, three data silos",
  
  "adv_good_badge": "The RiveHub Solution",
  "adv_good_title": "One Unified Platform",
  "adv_good_1": "Margin Compass → Crew Lexicon → Compliance Charts",
  "adv_good_2": "One login, one dashboard, one unified source of truth",
  "adv_good_3": "Operations and data flow into compliance logs automatically",
  "adv_good_end": "Crew satisfaction + Margin control + Inspection-ready. In one tab.",
  
  "adv_manifesto_start": "RiveHub isn't three tools shoved together. It's ",
  "adv_manifesto_bold": "one intelligent operating system",
  "adv_manifesto_end": " where margin data, crew communication, and compliance documentation flow together naturally.",
  
  "cta_title": "Ready to navigate with data?",
  "cta_desc": "Choose your path. Start at your current Intelligence Score. Build progressively. RiveHub grows with your kitchen's data maturity.",
  "cta_btn": "Build Your Command Center"
};

const pillarsFR = {
  "title_prefix": "RiveHub : Une Plateforme.",
  "title_highlight": "Trois Instruments.",
  "subtitle": "Comme un capitaine a besoin d'un centre de commande (et non d'un sextant, d'un baromètre ET d'une boussole séparément), vous avez besoin d'un tableau de bord unifié pour les Marges, l'Équipage et la Conformité.",
  "persona_select": "QUI ÊTES-VOUS ?",
  "owner_name": "Propriétaire",
  "owner_title": "Boussole de Marge",
  "owner_subtitle": "Voyez le coût de l'inaction",
  "owner_prob": "Vos fournisseurs ont augmenté leurs prix de 0,50€/kg. Vous l'avez découvert lors de l'inventaire de fin de mois.",
  "owner_sol": "Le scanner de factures OCR détecte la dérive des prix immédiatement. La prochaine fois, vous le saurez en 5 secondes.",
  "owner_b1": "Détectez l'inflation fournisseur avant qu'elle ne tue votre profit",
  "owner_b2": "Connaissez votre vrai Coût Matière en temps réel (sans deviner)",
  "owner_b3": "Alertes de chute de marge : \"Saumon +0.50€/kg → Coût Tartare 28%→29.5%\"",
  "owner_b4": "Économisez 8 653€/an sur la détection de surproduction",
  "owner_demo": "416€ de surproduction hebdo → -8 653€/an",
  "owner_cta": "Calculez votre gaspillage",
  "owner_vid": "Voir le tableau de bord propriétaire",
  "owner_tip": "Vrai ROI. Vraies économies. Vraies données.",
  
  "chef_name": "Chef / Manager Cuisine",
  "chef_title": "Lexique d'Équipage",
  "chef_subtitle": "Pas de malentendus. Juste de la clarté.",
  "chef_prob": "Votre sous-chef parle français. Le plongeur parle bengali. Les consignes de sécurité se perdent dans la traduction.",
  "chef_sol": "Chaque recette, chaque procédure, chaque alerte — dans leur langue maternelle. Automatiquement.",
  "chef_b1": "25 langues supportées (Français, Espagnol, Bengali, Cantonais, etc.)",
  "chef_b2": "Fiches recettes comprises par toutes les nouvelles recrues, peu importe leur origine",
  "chef_b3": "Réduisez le temps de formation de 40% (sans barrière de la langue)",
  "chef_b4": "Zéro problème de communication sur la sécurité",
  "chef_demo": "La même consigne en 5 langues",
  "chef_cta": "Voir la traduction de recette",
  "chef_vid": "Voir : Lexique d'Équipage en action",
  "chef_tip": "Une recette. Cinq langues. Clarté instantanée.",
  
  "comp_name": "Responsable Conformité",
  "comp_title": "Cartes de Conformité",
  "comp_subtitle": "Inspections sur demande, pas de panique.",
  "comp_prob": "Registres HACCP manuels. Relevés de température éparpillés. L'inspecteur arrive, vous paniquez.",
  "comp_sol": "Les registres HACCP s'écrivent tout seuls. Conformité autogénérée depuis les opérations quotidiennes.",
  "comp_b1": "Suivi des températures → relevés HACCP auto-enregistrés",
  "comp_b2": "Traçabilité des ingrédients → sécurité alimentaire (automatique)",
  "comp_b3": "Registres de formation → dossiers de certification (sous-produit)",
  "comp_b4": "Prêt pour inspection 24/7. Préparation d'audit 60% plus rapide.",
  "comp_demo": "Checklist d'inspection complète en 2 minutes",
  "comp_cta": "Créez votre HACCP",
  "comp_vid": "Démo Générateur HACCP sans code",
  "comp_tip": "Prêt pour inspection. Toujours. 24/7.",

  "lbl_problem": "LE PROBLÈME",
  "lbl_solution": "LA SOLUTION",
  
  "adv_title": "Pourquoi l'",
  "adv_title_highlight": "Unifié",
  "adv_title_suffix": " Bat le Fragmenté",
  "adv_bad_title": "Trois Outils Séparés",
  "adv_bad_1": "MarginEdge pour le Coût Matière",
  "adv_bad_1_sub": "(manque l'équipage/conformité)",
  "adv_bad_2": "SafetyCulture pour l'HACCP",
  "adv_bad_2_sub": "(manque marge/équipage)",
  "adv_bad_3": "7shifts pour l'Équipage",
  "adv_bad_3_sub": "(manque marge/conformité)",
  "adv_bad_end": "Trois abonnements, trois logins, trois silos de données",
  
  "adv_good_badge": "La Solution RiveHub",
  "adv_good_title": "Une Plateforme Unifiée",
  "adv_good_1": "Boussole de Marge → Lexique d'Équipage → Cartes de Conformité",
  "adv_good_2": "Un login, un tableau de bord, une source de vérité unifiée",
  "adv_good_3": "Opérations et données alimentent automatiquement l'HACCP",
  "adv_good_end": "Satisfaction équipe + Contrôle marge + Prêt pour inspection. En un onglet.",
  
  "adv_manifesto_start": "RiveHub n'est pas trois outils collés ensemble. C'est ",
  "adv_manifesto_bold": "un système d'exploitation intelligent",
  "adv_manifesto_end": " où les données de marge, de communication et de conformité circulent naturellement.",
  
  "cta_title": "Prêt à naviguer avec les données ?",
  "cta_desc": "Choisissez votre chemin. Commencez à votre Score d'Intelligence actuel. Construisez progressivement. RiveHub grandit avec la maturité de votre cuisine.",
  "cta_btn": "Construire Mon Centre de Commande"
};

en.ThreePillarsDemo = pillarsEN;
fr.ThreePillarsDemo = pillarsFR;

fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync('messages/fr.json', JSON.stringify(fr, null, 2) + '\n');
console.log('Translations for ThreePillarsDemo added.');
