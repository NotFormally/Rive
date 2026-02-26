const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'messages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const mockKeys = {
  f1_mock_date: {
    fr: "23 FÉV • SERVICE DU SOIR",
    en: "FEB 23 • EVENING SERVICE",
    it: "23 FEB • SERVIZIO SERALE"
  },
  f1_mock_urgent: {
    fr: "1 URGENT",
    en: "1 URGENT",
    it: "1 URGENTE"
  },
  f1_mock_entry1: {
    fr: "Le frigo 2 fuit, réparateur appelé",
    en: "Fridge 2 is leaking, repairman called",
    it: "Il frigo 2 perde, tecnico chiamato"
  },
  f1_mock_ai_task: {
    fr: "✨ IA: Tâche \"Appeler le plombier\" créée",
    en: "✨ AI: Task \"Call the plumber\" created",
    it: "✨ IA: Attività \"Chiama idraulico\" creata"
  },
  f1_mock_entry2: {
    fr: "Service parfait, RAS",
    en: "Perfect service, All clear",
    it: "Servizio perfetto, Tutto ok"
  },
  f1_mock_ai_badge: {
    fr: "IA Active",
    en: "AI Active",
    it: "IA Attiva"
  },
  f2_mock_alert: {
    fr: "Frigo 2 : 8.5°C détecté",
    en: "Fridge 2: 8.5°C detected",
    it: "Frigo 2: 8.5°C rilevato"
  },
  f2_mock_action: {
    fr: "Action : Jeter les aliments à risque",
    en: "Action: Discard high-risk food",
    it: "Azione: Scartare alimenti a rischio"
  },
  bcg_stars: {
    fr: "Phares",
    en: "Stars",
    it: "Stelle"
  },
  bcg_cashcows: {
    fr: "Vaches à lait",
    en: "Cash Cows",
    it: "Mucche da mungere"
  },
  bcg_deadweights: {
    fr: "Poids morts",
    en: "Dead Weights",
    it: "Pesi morti"
  },
  bcg_puzzles: {
    fr: "Énigmes",
    en: "Puzzles",
    it: "Enigmi"
  },
  pos_sync_text: {
    fr: "↓ Sync API (Toast, Square...)",
    en: "↓ API Sync (Toast, Square...)",
    it: "↓ Sincronizzazione API"
  },
  ocr_product: {
    fr: "Saumon Norvège",
    en: "Norwegian Salmon",
    it: "Salmone Norvegese"
  },
  ocr_price: {
    fr: "12.50/KG",
    en: "12.50/KG",
    it: "12.50/KG"
  },
  ocr_alert: {
    fr: "▲ +0.50€ / KG",
    en: "▲ +0.50€ / KG",
    it: "▲ +0.50€ / KG"
  },
  ocr_status: {
    fr: "MAJ OK : TARTARE",
    en: "UPDATE OK: TARTARE",
    it: "AGG. OK: TARTARE"
  },
  prep_header: {
    fr: "PRÉPARATION — 47 cvts",
    en: "PREPARATION — 47 covers",
    it: "PREPARAZIONE — 47 coperti"
  },
  prep_item_beef: {
    fr: "Filet de bœuf",
    en: "Beef Tenderloin",
    it: "Filetto di manzo"
  },
  prep_item_salmon: {
    fr: "Saumon frais",
    en: "Fresh Salmon",
    it: "Salmone fresco"
  },
  prep_item_potato: {
    fr: "Pommes de terre",
    en: "Potatoes",
    it: "Patate"
  },
  prep_item_cream: {
    fr: "Crème fraîche",
    en: "Fresh Cream",
    it: "Panna fresca"
  },
  prep_item_cream: {
    fr: "Crème fraîche",
    en: "Fresh Cream",
    it: "Panna fresca"
  },
  prep_cost_label: {
    fr: "Coût estimé",
    en: "Estimated Cost",
    it: "Costo stimato"
  },
  res_confirmed: {
    fr: "Confirmé",
    en: "Confirmed",
    it: "Confermato"
  },
  res_cancelled: {
    fr: "Annulé",
    en: "Cancelled",
    it: "Annullato"
  },
  f6_mock_caption: {
    fr: "Découvrez le menu spécial de ce soir ! Un thon rouge mi-cuit parfaitement braisé... ✨ Réservation en bio 👇",
    en: "Discover tonight's special menu! A perfectly seared bluefin tuna... ✨ Reservation in bio 👇",
    it: "Scopri il menu speciale di stasera! Un tonno rosso scottato alla perfezione... ✨ Prenotazione in bio 👇"
  }
};

const dashboardSections = {
  MenuEditor: {
    fr: {
      title: "🍽️ Gestionnaire de Menu",
      desc: "Modifiez votre menu ici — les changements sont instantanément reflétés sur votre QR code et mini-site.",
      btn_view_qr: "Voir le Menu QR →",
      btn_show_qr: "📱 Afficher le QR Code à imprimer",
      btn_hide_qr: "Masquer le QR Code",
      qr_scan_prompt: "Scannez pour accéder au menu",
      status_unavailable: "Indisponible",
      btn_edit: "Modifier",
      btn_hide: "Masquer",
      btn_show: "Remettre",
      btn_delete: "Suppr.",
      no_items: "Aucun plat dans cette catégorie.",
      btn_add_item: "+ Ajouter un plat à « {cat} »",
      form_new: "➕ Nouveau plat",
      form_edit: "✏️ Modifier le plat",
      label_name: "Nom",
      label_price: "Prix ({symbol})",
      label_desc: "Description",
      label_allergens: "Allergènes (séparés par virgule)",
      placeholder_name: "Risotto aux champignons...",
      placeholder_desc: "Décrivez le plat...",
      placeholder_allergens: "Gluten, Produits laitiers, Noix...",
      btn_cancel: "Annuler",
      btn_save: "Sauvegarder"
    },
    en: {
      title: "🍽️ Menu Manager",
      desc: "Edit your menu here — changes are instantly reflected on your QR code and mini-site.",
      btn_view_qr: "View QR Menu →",
      btn_show_qr: "📱 Show QR Code for printing",
      btn_hide_qr: "Hide QR Code",
      qr_scan_prompt: "Scan to access menu",
      status_unavailable: "Unavailable",
      btn_edit: "Edit",
      btn_hide: "Hide",
      btn_show: "Show",
      btn_delete: "Del.",
      no_items: "No dishes in this category.",
      btn_add_item: "+ Add a dish to \"{cat}\"",
      form_new: "➕ New dish",
      form_edit: "✏️ Edit dish",
      label_name: "Name",
      label_price: "Price ({symbol})",
      label_desc: "Description",
      label_allergens: "Allergens (comma separated)",
      placeholder_name: "Mushroom Risotto...",
      placeholder_desc: "Describe the dish...",
      placeholder_allergens: "Gluten, Dairy, Nuts...",
      btn_cancel: "Cancel",
      btn_save: "Save"
    },
    it: {
      title: "🍽️ Gestione Menu",
      desc: "Modifica il tuo menu qui — le modifiche sono istantaneamente riflesse sul tuo codice QR e mini-sito.",
      btn_view_qr: "Visualizza Menu QR →",
      btn_show_qr: "📱 Mostra Codice QR da stampare",
      btn_hide_qr: "Nascondi Codice QR",
      qr_scan_prompt: "Scansiona per accedere al menu",
      status_unavailable: "Non disponibile",
      btn_edit: "Modifica",
      btn_hide: "Nascondi",
      btn_show: "Mostra",
      btn_delete: "Elim.",
      no_items: "Nessun piatto in questa categoria.",
      btn_add_item: "+ Aggiungi un piatto a \"{cat}\"",
      form_new: "➕ Nuovo piatto",
      form_edit: "✏️ Modifica piatto",
      label_name: "Nome",
      label_price: "Prezzo ({symbol})",
      label_desc: "Descrizione",
      label_allergens: "Allergeni (separati da virgola)",
      placeholder_name: "Risotto ai funghi...",
      placeholder_desc: "Descrivi il piatto...",
      placeholder_allergens: "Glutine, Latticini, Noci...",
      btn_cancel: "Annulla",
      btn_save: "Salva"
    }
  },
  MenuEngineering: {
    fr: {
      title: "🧭 Performance Matrix — Carte de Navigation",
      desc_full: "Générez une Topographie des Profits détaillée de votre Écosystème du Menu croisant vos prix, coûts et popularité pour découvrir vos Phares et Écueils.",
      desc_short: "Classification automatique de vos plats par popularité et rentabilité.",
      median_info: "Médiane marge : {margin}% | Médiane commandes : {orders}/sem.",
      btn_generate: "Lancer l'analyse du menu",
      btn_generating: "Génération en cours...",
      analyzing: "Analyse du menu en cours...",
      quota_reached: "Quota atteint",
      quota_desc: "Vous avez généré vos {count} analyses gratuites. Passez au forfait Performance.",
      quota_usage: "{used} / {total} analyses utilisées",
      table_title: "Recommandations IA par plat",
      profit_label: "{amount}$/sem",
      orders_label: "{count} commandes/sem",
      margin_label: "Marge {percent}%",
      axis_pop: "← Populaire",
      axis_impop: "Impopulaire →",
      cat_phare: "🏮 Phares",
      cat_phare_desc: "Populaire + Rentable",
      cat_ancre: "⚓ Ancres",
      cat_ancre_desc: "Populaire + Peu rentable",
      cat_derive: "🧭 Dérives",
      cat_derive_desc: "Impopulaire + Rentable",
      cat_ecueil: "🪸 Écueils",
      cat_ecueil_desc: "Impopulaire + Peu rentable"
    },
    en: {
      title: "🧭 Performance Matrix — Navigation Map",
      desc_full: "Generate a detailed Profit Topography of your Menu Ecosystem crossing your prices, costs, and popularity to discover your Stars and Rocks.",
      desc_short: "Automatic classification of your dishes by popularity and profitability.",
      median_info: "Median margin: {margin}% | Median orders: {orders}/week.",
      btn_generate: "Launch menu analysis",
      btn_generating: "Generating...",
      analyzing: "Menu analysis in progress...",
      quota_reached: "Quota reached",
      quota_desc: "You have generated your {count} free analyses. Upgrade to Performance.",
      quota_usage: "{used} / {total} analyses used",
      table_title: "AI Recommendations by dish",
      profit_label: "{amount}$/week",
      orders_label: "{count} orders/week",
      margin_label: "Margin {percent}%",
      axis_pop: "← Popular",
      axis_impop: "Unpopular →",
      cat_phare: "🏮 Stars",
      cat_phare_desc: "Popular + Profitable",
      cat_ancre: "⚓ Anchors",
      cat_ancre_desc: "Popular + Low profit",
      cat_derive: "🧭 Drifts",
      cat_derive_desc: "Unpopular + Profitable",
      cat_ecueil: "🪸 Rocks",
      cat_ecueil_desc: "Unpopular + Low profit"
    },
    it: {
      title: "🧭 Performance Matrix — Carta di Navigazione",
      desc_full: "Genera una Topografia dei Profitti dettagliata del tuo Ecosistema del Menu incrociando prezzi, costi e popolarità per scoprire le tue Stelle e Scogli.",
      desc_short: "Classificazione automatica dei piatti per popolarità e redditività.",
      median_info: "Margine mediano: {margin}% | Ordini mediani: {orders}/sett.",
      btn_generate: "Avvia analisi menu",
      btn_generating: "Generazione in corso...",
      analyzing: "Analisi del menu in corso...",
      quota_reached: "Quota raggiunta",
      quota_desc: "Hai generato le tue {count} analisi gratuite. Passa al piano Performance.",
      quota_usage: "{used} / {total} analisi utilizzate",
      table_title: "Raccomandazioni IA per piatto",
      profit_label: "{amount}$/sett",
      orders_label: "{count} ordini/sett",
      margin_label: "Margine {percent}%",
      axis_pop: "← Popolare",
      axis_impop: "Impopolare →",
      cat_phare: "🏮 Stelle",
      cat_phare_desc: "Popolare + Redditizio",
      cat_ancre: "⚓ Ancore",
      cat_ancre_desc: "Popolare + Bassa redditività",
      cat_derive: "🧭 Derive",
      cat_derive_desc: "Impopolare + Redditizio",
      cat_ecueil: "🪸 Scogli",
      cat_ecueil_desc: "Impopolare + Bassa redditività"
    }
  },
  Instagram: {
    fr: {
      title: "📸 Générateur Instagram",
      subtitle: "Générez un post complet avec IA",
      desc: "Rive va générer un post Instagram complet avec caption, hashtags et call-to-action, adapté à la classification de votre plat.",
      btn_generate: "🚀 Générer le post",
      btn_loading: "L'IA compose votre post...",
      btn_retry: "Réessayer",
      btn_copy: "📋 Copier le texte",
      btn_copied: "✅ Copié !",
      btn_regenerate: "🔄 Régénérer",
      quota_reached: "Quota atteint",
      quota_desc: "Vous avez généré vos {count} posts gratuits. Passez au forfait Performance.",
      eng_version: "🇬🇧 Version anglaise",
      best_time: "Meilleur moment pour poster :",
      error_conn: "Erreur de connexion."
    },
    en: {
      title: "📸 Instagram Generator",
      subtitle: "Generate a complete post with AI",
      desc: "Rive will generate a full Instagram post with caption, hashtags, and call-to-action, tailored to your dish's classification.",
      btn_generate: "🚀 Generate post",
      btn_loading: "AI is composing your post...",
      btn_retry: "Retry",
      btn_copy: "📋 Copy text",
      btn_copied: "✅ Copied!",
      btn_regenerate: "🔄 Regenerate",
      quota_reached: "Quota reached",
      quota_desc: "You have generated your {count} free posts. Upgrade to Performance.",
      eng_version: "🇬🇧 English version",
      best_time: "Best time to post:",
      error_conn: "Connection error."
    },
    it: {
      title: "📸 Generatore Instagram",
      subtitle: "Genera un post completo con l'IA",
      desc: "Rive genererà un post Instagram completo di didascalia, hashtag e call-to-action, personalizzato in base alla classificazione del tuo piatto.",
      btn_generate: "🚀 Genera post",
      btn_loading: "L'IA sta componendo il tuo post...",
      btn_retry: "Riprova",
      btn_copy: "📋 Copia testo",
      btn_copied: "✅ Copiato!",
      btn_regenerate: "🔄 Rigenera",
      quota_reached: "Quota raggiunta",
      quota_desc: "Hai generato i tuoi {count} post gratuiti. Passa al piano Performance.",
      eng_version: "🇬🇧 Versione inglese",
      best_time: "Momento migliore per postare:",
      error_conn: "Errore di connessione."
    }
  },
  Logbook: {
    fr: {
      title: "Journal de Bord",
      placeholder: "Chaque service est une traversée. Que s'est-il passé aujourd'hui ? L'IA cartographie votre récit...",
      btn_save: "Consigner",
      btn_loading: "Analyse par l'IA...",
      scan_title: "Scanner un reçu de livraison",
      btn_scan: "Extraire les données",
      scan_loading: "Analyse en cours...",
      quota_reached: "Quota atteint",
      quota_desc: "Vous avez analysé vos {count} notes gratuites. Passez au forfait Performance.",
      scan_quota_desc: "Quota atteint ({count} scans). Passez au forfait Entreprise.",
      last_entries: "Dernières entrées",
      view_lang: "Afficher en:",
      lang_original: "Langue originale",
      ai_summary: "💡 Résumé IA:",
      urgent: "🚨 Urgent",
      confirm_delete: "Supprimer la note ?",
      extracted_data: "Données extraites :",
      supplier: "Fournisseur",
      amount: "Montant Total",
      items: "Articles"
    },
    en: {
      title: "The Captain's Log",
      placeholder: "Every service is a voyage. What happened today? The AI maps your narrative...",
      btn_save: "Log Entry",
      btn_loading: "Analyzing with AI...",
      scan_title: "Scan delivery receipt",
      btn_scan: "Extract data",
      scan_loading: "Scanning...",
      quota_reached: "Quota reached",
      quota_desc: "You have analyzed your {count} free notes. Upgrade to Performance.",
      scan_quota_desc: "Quota reached ({count} scans). Upgrade to Enterprise.",
      last_entries: "Latest entries",
      view_lang: "Show in:",
      lang_original: "Original language",
      ai_summary: "💡 AI Summary:",
      urgent: "🚨 Urgent",
      confirm_delete: "Delete note?",
      extracted_data: "Extracted data:",
      supplier: "Supplier",
      amount: "Total Amount",
      items: "Items"
    },
    it: {
      title: "Logbook Intelligente",
      placeholder: "Cosa è successo durante questo servizio? L'IA analizzerà e classificherà la tua nota automaticamente...",
      btn_save: "Salva nota",
      btn_loading: "Analisi con IA...",
      scan_title: "Scansiona ricevuta di consegna",
      btn_scan: "Estrai dati",
      scan_loading: "Scansione...",
      quota_reached: "Quota raggiunta",
      quota_desc: "Hai analizzato le tue {count} note gratuite. Passa al piano Performance.",
      scan_quota_desc: "Quota raggiunta ({count} scansioni). Passa al piano Enterprise.",
      last_entries: "Ultime voci",
      view_lang: "Mostra in:",
      lang_original: "Lingua originale",
      ai_summary: "💡 Riepilogo IA:",
      urgent: "🚨 Urgente",
      confirm_delete: "Elimina nota?",
      extracted_data: "Dati estratti:",
      supplier: "Fornitore",
      amount: "Importo Totale",
      items: "Articoli"
    }
  },
  Common: {
    fr: {
       error_unknown: "Inconnue",
       error_payment: "Erreur lors de la redirection vers le paiement.",
       btn_close: "Fermer"
    },
    en: {
       error_unknown: "Unknown",
       error_payment: "Error during payment redirection.",
       btn_close: "Close"
    },
    it: {
       error_unknown: "Sconosciuto",
       error_payment: "Errore durante il reindirizzamento al pagamento.",
       btn_close: "Chiudi"
    }
  }
};

const enFixes = {
  "features_title": "All the instruments you need to navigate, in one place.",
  "f1_title": "The Captain's Log",
  "f1_desc": "Forget loose notebooks. Staff handovers, equipment issues, and crew incidents are logged, mapped, and tracked by AI.",
  "f1_ex1": "Log an equipment storm (e.g., \"Fridge 2 is leaking, mechanic called\").",
  "f1_ex2": "Pass precise navigational instructions to the evening crew.",
  "f1_ex3": "Track passenger (guest) incidents to adjust course.",
  "f2_title": "Streamline Your Course Safety",
  "f2_desc": "Rive helps you spot temperature and process anomalies, plotting corrective courses to avoid the compliance rocks.",
  "f2_ex1": "Fridge hits 8°C: suggestion for corrective action \"Isolate or discard high-risk food\".",
  "f2_ex2": "Automatic reminder for fryer oil checks.",
  "f2_ex3": "Documented HACCP procedures in case of inspection.",
  "f3_title": "Instant Translation (14 Languages)",
  "f3_desc": "The language barrier no longer exists. Every member accesses the app and notes in their native language.",
  "f3_ex1": "The chef writes in Spanish, the dishwasher reads in Bengali.",
  "f3_ex2": "Recipe cards immediately understood by all new hires.",
  "f3_ex3": "Safety procedures acquired regardless of the employee's origin.",
  "f4_title": "Performance Matrix & POS Synchronization",
  "f4_desc": "Your Profit Radar connects to your POS to cross-reference sales volumes with costs in real-time. Maximize your margins autonomously.",
  "f4_ex1": "Automatically import your sales from Toast, Square, SumUp, Zettle, or Lightspeed.",
  "f4_ex2": "Identify \"Stars\" vs \"Rocks\" dishes with the smart Performance Matrix.",
  "f4_ex3": "Incompatible system? Rive's AI natively parses and imports any CSV export.",
  "f5_title": "Advanced OCR Invoice Scanning",
  "f5_desc": "Stop entering invoices manually. AI extracts line items, products, and quantities granularly to update your net costs.",
  "f5_ex1": "Photograph a supplier's crumpled invoice upon delivery.",
  "f5_ex2": "Granular line-by-line extraction and price variation alerts for ingredients.",
  "f5_ex3": "Live and automatic update of your recipes' Food Cost.",
  "f6_title": "Social Media & Marketing",
  "f6_desc": "Attract new clients with engaging posts of your culinary highlights generated in one click.",
  "f6_ex1": "Generate a captivating caption for a Valentine's Day menu with perfect emojis.",
  "f6_ex2": "Automatically translate your posts to attract international clients.",
  "f6_ex3": "Draft a tempting description for your delivery platforms (UberEats, Deliveroo).",
  "f7_title": "Reservations",
  "f7_desc": "Sync all your client reservations from Libro, Resy, and Zenchef. Webhooks and automatic polling for real-time updates.",
  "f7_ex1": "Receive online reservations instantly without manual entry.",
  "f7_ex2": "Consolidate arriving guests, cancellations, and no-shows in a single central view.",
  "f7_ex3": "Cross-reference client data to anticipate your service volume.",
  "f8_title": "Charting the Course (Prep Lists)",
  "f8_desc": "Sonar Analysis cross-references your arriving passengers, sales currents, and maps to automatically generate the prep course.",
  "f8_ex1": "Calculate rations for each dish based on exact confirmed passengers.",
  "f8_ex2": "Aggregate raw ingredients needed to survive the upcoming expedition.",
  "f8_ex3": "Estimate total cargo cost before even raising the sails.",
  "philosophy_approach": "Our Navigation",
  "tier_essential_name": "The Vessel (Essence)",
  "tier_essential_badge": "Navigation Map",
  "tier_essential_desc": "The sturdy hull and ecosystem to structure your daily operations.",
  "tier_performance_name": "The Compass (Performance)",
  "tier_performance_badge": "Performance Compass",
  "tier_performance_desc": "Your Profit Radar to chart the most lucrative courses and margins.",
  "tier_intelligence_name": "The Sonar (Intelligence)",
  "tier_intelligence_badge": "Sonar Analysis",
  "tier_intelligence_desc": "Deep Profit Topography with predictions to steer the fleet autonomously."
};

const itFixes = {
  "features_title": "Tutto ciò di cui hai bisogno per operare, in un unico posto.",
  "f1_title": "Logbook Intelligente",
  "f1_desc": "Dimentica i taccuini volanti. Consegne, problemi alle attrezzature e incidenti con gli ospiti vengono registrati, analizzati e monitorati dall'IA.",
  "f1_ex1": "Annotare un problema all'attrezzatura (es. \"Il frigo 2 perde, tecnico chiamato\").",
  "f1_ex2": "Trasmettere istruzioni di servizio chiare al team serale.",
  "f1_ex3": "Registrare incidenti con gli ospiti per il monitoraggio della qualità.",
  "f2_title": "Semplifica la tua Conformità Sanitaria",
  "f2_desc": "Rive ti aiuta a individuare anomalie di temperatura e processo e suggerisce azioni correttive per semplificare la tua conformità.",
  "f2_ex1": "Il frigo raggiunge gli 8°C: suggerimento per l'azione correttiva \"Isolare o scartare gli alimenti ad alto rischio\".",
  "f2_ex2": "Promemoria automatico per i controlli dell'olio della friggitrice.",
  "f2_ex3": "Procedure HACCP documentate in caso di ispezione.",
  "f3_title": "Traduzione Istantanea (14 Lingue)",
  "f3_desc": "La barriera linguistica non esiste più. Ogni membro accede all'app e alle note nella propria lingua madre.",
  "f3_ex1": "Lo chef scrive in spagnolo, il lavapiatti legge in bengalese.",
  "f3_ex2": "Schede ricetta immediatamente comprese da tutti i nuovi assunti.",
  "f3_ex3": "Procedure di sicurezza acquisite indipendentemente dall'origine del dipendente.",
  "f4_title": "Performance Matrix & Sincronizzazione POS",
  "f4_desc": "Il tuo Profit Radar si connette alla tua cassa per incrociare in tempo reale i volumi di vendita con i costi. Massimizza i tuoi margini in totale autonomia.",
  "f4_ex1": "Importa automaticamente le tue vendite da Toast, Square, SumUp, Zettle o Lightspeed.",
  "f4_ex2": "Identifica i tuoi piatti \"Stelle\" vs. \"Scogli\" con la Performance Matrix intelligente.",
  "f4_ex3": "Sistema incompatibile? L'IA di Rive analizza e importa nativamente qualsiasi esportazione CSV.",
  "f5_title": "Scansione Avanzata Fatture OCR",
  "f5_desc": "Smetti di inserire le fatture a mano. L'IA estrae riga per riga, prodotti e quantità per aggiornare i tuoi costi netti.",
  "f5_ex1": "Scatta una foto della fattura sgualcita del fornitore alla consegna.",
  "f5_ex2": "Estrazione granulare riga per riga e avvisi di variazione di prezzo sugli ingredienti.",
  "f5_ex3": "Aggiornamento live e automatico del Food Cost delle tue ricette.",
  "f6_title": "Assistente Contenuti (Social Media)",
  "f6_desc": "Attira nuovi clienti con post coinvolgenti generati in un clic dai tuoi menu.",
  "f6_ex1": "Genera un post accattivante per un menu di San Valentino con emoji e hashtag.",
  "f6_ex2": "Traduci automaticamente un post per attirare turisti locali.",
  "f6_ex3": "Bozza una descrizione allettante per le tue piattaforme di consegna (Uber Eats/Deliveroo).",
  "f7_title": "Prenotazioni Centralizzate",
  "f7_desc": "Sincronizza tutte le tue prenotazioni da Libro, Resy e Zenchef in tempo reale. Webhook e polling automatici — zero inserimento manuale.",
  "f7_ex1": "Ricevi le prenotazioni Libro istantaneamente non appena vengono effettuate online.",
  "f7_ex2": "Consolida coperti, cancellazioni e no-show in un'unica dashboard.",
  "f7_ex3": "Incrocia i dati delle prenotazioni con le tue liste di preparazione per anticipare ogni service.",
  "f8_title": "Liste di Preparazione Predittive",
  "f8_desc": "L'Analisi Sonar incrocia le tue prenotazioni, le vendite POS e le ricette per generare automaticamente le quantità esatte da preparare.",
  "f8_ex1": "Calcolare le porzioni di ogni piatto in base al numero esatto di coperti confermati.",
  "f8_ex2": "Aggregare gli ingredienti grezzi incrociando ricette e vendite storiche.",
  "f8_ex3": "Stimare il costo totale della preparazione prima ancora di aprire la cucina.",
  "tier_essential_name": "Essence",
  "tier_essential_badge": "Carta di Navigazione",
  "tier_essential_desc": "L'Ecosistema del Menu fondamentale per strutturare le tue operazioni.",
  "tier_performance_name": "Performance",
  "tier_performance_badge": "Bussola di Performance",
  "tier_performance_desc": "Il tuo Profit Radar per ottimizzare i costi e i margini alimentari.",
  "tier_intelligence_name": "Intelligence",
  "tier_intelligence_badge": "Analisi Sonar",
  "tier_intelligence_desc": "Topografia dei Profitti profonda con previsioni e controllo autonomo.",
  "feature_reservations": "Integrazione Prenotazioni (Resy, Libro)",
  "feature_preplists": "Smart Prep Lists (AI Predittiva)",
  "enterprise_custom_title": "Gruppi & Franchising",
  "enterprise_custom_desc": "Dashboard consolidata, multi-sede, implementazione personalizzata e formazione.",
  "enterprise_custom_cta": "Contattaci (Preventivo personalizzato)"
};

const frFixes = {
  "features_title": "Tous les instruments nautiques réunis sur la passerelle.",
  "f1_title": "Le Journal de Bord",
  "f1_desc": "Oubliez la paperasse. Les relèves d'équipage, avaries matérielles et incidents passagers sont consignés et cartographiés par l'IA.",
  "f1_ex1": "Signalez une avarie (ex: \"Frigo 2 percé, mécanicien contacté\").",
  "f1_ex2": "Transmettez des coordonnées de cap claires à l'équipe de quart (soir).",
  "f1_ex3": "Historisez les turbulences en salle pour ajuster votre navigation.",
  "f2_title": "Une Traversée Sans Écueils Sanitaires",
  "f2_desc": "Rive détecte les anomalies climatiques (températures) de vos cales et propose un cap correctif.",
  "f4_title": "Matrice de Performance & Synchronisation",
  "f4_desc": "Votre Radar de Rentabilité se connecte à vos caisses pour croiser en direct les courants de vente et le coût des vivres.",
  "f4_ex2": "Identifiez vos plats « Phares » et évitez les « Écueils » via la carte marine algorithmique.",
  "f5_title": "Lecture Optique des Cargaisons",
  "f5_desc": "Cessez de saisir le manifeste à la main. L'IA extrait les denrées, soutes et quantités de vos bons de livraison pour ajuster vos coûts.",
  "f6_title": "Réseaux Sociaux & Marketing",
  "f6_desc": "Attirez de nouveaux clients avec des publications engageantes sur vos plats phares générées en un clic.",
  "f6_ex1": "Générez une légende captivante pour un menu de la Saint-Valentin avec les emojis parfaits.",
  "f6_ex2": "Traduisez automatiquement vos posts pour attirer une clientèle internationale.",
  "f6_ex3": "Rédigez une description appétissante pour vos plateformes de livraison (UberEats, Deliveroo).",
  "f7_title": "Réservations",
  "f7_desc": "Synchronisez toutes vos réservations clients de Libro, Resy et Zenchef. Webhooks et actualisation automatique en temps réel.",
  "f7_ex1": "Recevez les réservations en ligne instantanément sans double saisie.",
  "f7_ex2": "Consolidez les arrivées, annulations et no-shows sur une interface unique.",
  "f7_ex3": "Croisez les données clients pour anticiper le volume de votre service.",
  "f8_title": "Feuille de Route (Préparations)",
  "f8_desc": "Le Sonar croise les passagers en approche, les vents de vente et vos cartes pour générer les quantités exactes de vivres à préparer.",
  "f8_ex1": "Rationnez la soute par plat selon le nombre exact de passagers confirmés à bord.",
  "f8_ex3": "Réalisez l'inventaire et les coûts avant même de lever l'ancre.",
  "philosophy_approach": "Notre Cap",
  "tier_essential_name": "Le Navire (Essence)",
  "tier_essential_badge": "Carte de Navigation",
  "tier_essential_desc": "L'Écosystème du Menu fondamental pour structurer vos expéditions quotidiennes.",
  "tier_performance_name": "La Boussole (Performance)",
  "tier_performance_badge": "Boussole de Performance",
  "tier_performance_desc": "Votre Radar de Rentabilité pour naviguer vers vos meilleures marges alimentaires.",
  "tier_intelligence_name": "Le Sonar (Intelligence)",
  "tier_intelligence_badge": "Analyse Sonar",
  "tier_intelligence_desc": "Une Topographie des Profits automatisée avec prédictions de trajectoire pour les capitaines d'élite."
};

for (const file of files) {
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const lang = file.split('.')[0].startsWith('zh') ? file.split('.json')[0] : file.split('.')[0];
  const shortLang = lang.split('-')[0];
  const targetLang = ['fr', 'en', 'it'].includes(shortLang) ? shortLang : 'en';

  if (!data.LandingPage) data.LandingPage = {};
  if (!data.Pricing) data.Pricing = {};

  if (lang === 'en') {
    Object.assign(data.LandingPage, enFixes);
    Object.assign(data.Pricing, enFixes);
  } else if (lang === 'it') {
    Object.assign(data.LandingPage, itFixes);
    Object.assign(data.Pricing, itFixes);
  } else if (lang === 'fr') {
    Object.assign(data.LandingPage, frFixes);
    Object.assign(data.Pricing, frFixes);
  }

  // Inject mock keys
  for (const [key, translations] of Object.entries(mockKeys)) {
    data.LandingPage[key] = translations[targetLang] || translations['en'];
  }

  // Inject section translations
  for (const [section, langs] of Object.entries(dashboardSections)) {
    data[section] = langs[targetLang] || langs['en'];
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated ' + file);
}
