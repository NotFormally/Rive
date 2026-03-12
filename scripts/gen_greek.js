#!/usr/bin/env node
/**
 * Generate complete Greek (el.json) from en.json
 * Merges existing el.json translations with new translations for missing keys
 */
const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/en.json'), 'utf8'));
const el = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/el.json'), 'utf8'));

// Translation dictionary for common terms
const dict = {
  // Navigation & UI
  'Loading...': 'Φόρτωση...',
  'Loading': 'Φόρτωση',
  'Save': 'Αποθήκευση',
  'Cancel': 'Ακύρωση',
  'Close': 'Κλείσιμο',
  'Back': 'Πίσω',
  'Delete': 'Διαγραφή',
  'Edit': 'Επεξεργασία',
  'New': 'Νέο',
  'Actions': 'Ενέργειες',
  'Search': 'Αναζήτηση',
  'Filter': 'Φίλτρο',
  'Submit': 'Υποβολή',
  'Confirm': 'Επιβεβαίωση',
  'Yes': 'Ναι',
  'No': 'Όχι',
  'Error': 'Σφάλμα',
  'Success': 'Επιτυχία',
  'Warning': 'Προειδοποίηση',
  'Info': 'Πληροφορία',
  'Unknown': 'Άγνωστο',
  'Saving...': 'Αποθήκευση...',
  'Sending...': 'Αποστολή...',
  'Logout': 'Αποσύνδεση',
  'Overview': 'Επισκόπηση',
  'Settings': 'Ρυθμίσεις',
  'Pricing': 'Τιμολόγηση',
  'Start Free': 'Ξεκινήστε Δωρεάν',
  'See Pricing': 'Δείτε Τιμολόγηση',
};

// Large translation map for all missing keys
const translations = {
  // ===== Sidebar =====
  Sidebar: {
    nav_overview: 'Επισκόπηση',
    nav_my_intelligence: 'Η Ευφυΐα μου',
    nav_menu: 'Επεξεργαστής Μενού',
    nav_foodcost: 'Κόστος Τροφίμων',
    nav_engineering: 'Μηχανική Μενού',
    nav_reservations: 'Κρατήσεις',
    nav_smartprep: 'Έξυπνη Προετοιμασία',
    nav_social: 'Κέντρο Κοινωνικών',
    nav_settings: 'Ρυθμίσεις',
    restaurant_space: 'Χώρος Εστιατορίου',
    btn_logout: 'Αποσύνδεση',
    nav_deposits: 'Παρακολούθηση Εγγυήσεων',
    nav_variance: 'Κέντρο Αποκλίσεων',
    nav_production: 'Το Αμπάρι',
    nav_multilingual_team: 'Πολύγλωσση Ομάδα',
    nav_carte: 'La Carte',
    nav_pavillon: 'Le Pavillon',
    nav_compas: 'Le Compas',
    nav_estime: "L'Estime",
    nav_appareillage: "L'Appareillage",
    nav_mouillage: 'Le Mouillage (Κρατήσεις)',
    nav_nid: 'Le Nid',
    nav_barometre: 'Le Baromètre',
    nav_greement: 'Le Gréement',
    nav_health_score: 'Le Compas',
    active_language: 'Ενεργή Γλώσσα',
    nav_reception_ocr: 'Ο Φακός',
    nav_dictee_voice: 'Φωνητική Υπαγόρευση (AI)',
    nav_sonar: 'Sonar (Έλεγχοι)',
    nav_haccp_runner: 'HACCP Runner',
    nav_haccp_builder: 'HACCP Builder',
    section_passerelle: 'Η Γέφυρα',
    section_reserve: 'Το Αμπάρι',
    section_manoeuvre: 'Λειτουργίες',
    section_journal: 'Ημερολόγιο Πλοίου',
    section_gouvernail: 'Πηδάλιο',
    current_language: 'Τρέχουσα Γλώσσα',
    aria_open_menu: 'Άνοιγμα μενού',
    aria_close_menu: 'Κλείσιμο μενού',
  },

  // ===== TrialModal =====
  TrialModal: {
    title: '100% Δωρεάν Δοκιμή',
    description_before: 'Δημιουργήστε τον χώρο εργασίας του εστιατορίου σας σε 30 δευτερόλεπτα.',
    description_bold: 'Δεν απαιτείται πιστωτική κάρτα.',
    description_after: 'Αποκτήστε πρόσβαση σε όλες τις λειτουργίες AI του RiveHub με γενναιόδωρα quotas.',
    credits_label: 'Τα δωρεάν credits σας',
    feature1_label: '150 σημειώσεις AI',
    feature1_desc: 'Ευφυές Ημερολόγιο',
    feature2_label: '40 διορθωτικές ενέργειες',
    feature2_desc: 'Προτάσεις AI',
    feature3_label: '30 μεταφράσεις',
    feature3_desc: 'Πολύγλωσσο',
    feature4_label: '2 αναλύσεις μενού',
    feature4_desc: 'Βελτιστοποίηση Μενού',
    feature5_label: '20 δημοσιεύσεις Instagram',
    feature5_desc: 'Περιεχόμενο AI',
    feature6_label: '10 σαρώσεις αποδείξεων',
    feature6_desc: 'Ψηφιοποίηση AI',
    cta_free: 'Δημιουργήστε τον χώρο εργασίας μου δωρεάν →',
    cta_subscribe: 'Εγγραφείτε τώρα',
    footer_note: 'Η πληρωμή ξεκινά μόνο όταν εξαντληθούν τα δωρεάν credits σας.',
  },

  // ===== Common =====
  Common: {
    loading: 'Φόρτωση...',
    error_unknown: 'Άγνωστο',
    error_payment: 'Σφάλμα κατά την ανακατεύθυνση πληρωμής.',
    btn_close: 'Κλείσιμο',
    module_disabled: 'Αυτή η μονάδα είναι απενεργοποιημένη. Μπορείτε να την ενεργοποιήσετε στις Ρυθμίσεις.',
    cancel: 'Ακύρωση',
    save: 'Αποθήκευση',
    back: '← Πίσω',
    new_item: 'Νέο',
    actions: 'Ενέργειες',
    no_items_found: 'Δεν βρέθηκαν στοιχεία.',
  },

  // ===== Meta =====
  Meta: {
    home_title: 'RiveHub — Λογισμικό Διαχείρισης Εστιατορίου με AI',
    home_description: 'Πλατφόρμα διαχείρισης εστιατορίου με AI: συμμόρφωση HACCP, ευφυές ημερολόγιο, ανάλυση κόστους τροφίμων, σαρωτής τιμολογίων OCR, μηχανική μενού, ενσωμάτωση POS, μετάφραση σε {count} γλώσσες. Δωρεάν έκδοση διαθέσιμη.',
    pricing_title: 'Τιμολόγηση & Πλάνα — Λογισμικό Διαχείρισης Εστιατορίου RiveHub',
    pricing_description: 'Συνδρομές RiveHub από $59/μήνα. AI ημερολόγιο, συμμόρφωση HACCP, παρακολούθηση κόστους τροφίμων, ενσωμάτωση POS (Toast, Square, Lightspeed), μετάφραση σε {count} γλώσσες. Δωρεάν πλάνο, χωρίς πιστωτική κάρτα.',
    cgu_title: 'Όροι Χρήσης — RiveHub',
    cgu_description: 'Όροι χρήσης του RiveHub, της πλατφόρμας διαχείρισης εστιατορίου με AI. Πολιτική AI, προστασία δεδομένων, ενσωματώσεις τρίτων και δεσμεύσεις απορρήτου.',
    ai_page_title: 'AI για Διαχείριση Εστιατορίου — RiveHub',
    ai_page_description: 'Ανακαλύψτε πώς η AI για τη διαχείριση εστιατορίου αυτοματοποιεί το κόστος τροφίμων, τη συμμόρφωση HACCP, τη μηχανική μενού και τις καθημερινές λειτουργίες. Δωρεάν πλατφόρμα AI εστιατορίου — χωρίς πιστωτική κάρτα.',
  },

  // ===== AIPage =====
  AIPage: {
    meta_title: 'AI για Διαχείριση Εστιατορίου — RiveHub',
    meta_description: 'Ανακαλύψτε πώς η AI για τη διαχείριση εστιατορίου αυτοματοποιεί το κόστος τροφίμων, τη συμμόρφωση HACCP, τη μηχανική μενού και τις καθημερινές λειτουργίες. Δωρεάν πλατφόρμα AI εστιατορίου — χωρίς πιστωτική κάρτα.',
    nav_pricing: 'Τιμολόγηση',
    nav_signup: 'Ξεκινήστε Δωρεάν',
    hero_label: 'AI για Διαχείριση Εστιατορίου',
    hero_title: 'Η πλατφόρμα AI σχεδιασμένη για εστιατόρια',
    hero_description: 'Το RiveHub χρησιμοποιεί τεχνητή νοημοσύνη για να αυτοματοποιήσει την παρακολούθηση κόστους τροφίμων, τη συμμόρφωση HACCP, τη μηχανική μενού και τις λειτουργικές αποφάσεις — ώστε να μπορείτε να εστιάσετε στη φιλοξενία, όχι στα υπολογιστικά φύλλα.',
    hero_cta: 'Ξεκινήστε Δωρεάν',
    hero_cta_secondary: 'Δείτε Τιμολόγηση',
    what_title: 'Τι μπορεί να κάνει η AI για το εστιατόριό σας;',
    what_description: 'Η AI για τη διαχείριση εστιατορίου αντικαθιστά τις χειροκίνητες διαδικασίες με ευφυή αυτοματισμό. Από τη σάρωση τιμολογίων έως την πρόβλεψη αναγκών προετοιμασίας, δείτε πώς η AI μεταμορφώνει τις καθημερινές λειτουργίες.',
    f1_title: 'Ευφυές Ημερολόγιο',
    f1_desc: 'Η AI αναλύει μοτίβα υπηρεσίας, αρχεία θερμοκρασίας και σημειώσεις προσωπικού για να αναδείξει αξιοποιήσιμες πληροφορίες — αντικαθιστώντας τα χάρτινα αρχεία με ένα ευφυές, αναζητήσιμο αρχείο.',
    f2_title: 'Αυτοματοποιημένη Συμμόρφωση HACCP',
    f2_desc: 'Η AI παρακολουθεί σημεία ελέγχου συμμόρφωσης, επισημαίνει ελλείψεις και δημιουργεί αναφορές έτοιμες για έλεγχο — κρατώντας το εστιατόριό σας ασφαλές και έτοιμο για επιθεώρηση.',
    f3_title: 'Ανάλυση Κόστους Τροφίμων σε Πραγματικό Χρόνο',
    f3_desc: 'Παρακολουθήστε κόστη υλικών, εντοπίστε ανωμαλίες τιμών και υπολογίστε πραγματικό περιθώριο ανά πιάτο — συμπεριλαμβανομένης της εργασίας. Η AI σας ειδοποιεί πριν τα κόστη ξεφύγουν.',
    f4_title: 'Σαρωτής Τιμολογίων OCR',
    f4_desc: 'Βγάλτε μια φωτογραφία ή ανεβάστε ένα PDF. Η AI εξάγει κάθε γραμμή, προϊόν, ποσότητα και τιμή — μετατρέποντας ώρες εισαγωγής δεδομένων σε δευτερόλεπτα.',
    f5_title: 'Μηχανική Μενού AI',
    f5_desc: 'Εντοπίστε τα πιο κερδοφόρα πιάτα σας με ανάλυση μήτρας BCG. Η AI προτείνει αλλαγές μενού βασισμένες σε κόστος τροφίμων, δημοτικότητα και δεδομένα περιθωρίων.',
    f6_title: 'Μετάφραση σε {count} Γλώσσες',
    f6_desc: 'Η AI μεταφράζει οδηγίες εργασιών, λίστες ελέγχου και μενού για πολύγλωσσες ομάδες — εξασφαλίζοντας ότι κάθε μέλος κατανοεί τέλεια τον ρόλο του.',
    why_title: 'Γιατί τα εστιατόρια στρέφονται στην AI',
    why_description: 'Εστιατόρια που χρησιμοποιούν AI για διαχείριση αναφέρουν ταχύτερες αποφάσεις, λιγότερη σπατάλη τροφίμων και ισχυρότερη συμμόρφωση. Δείτε τι αλλάζει όταν σταματάτε να μαντεύετε και αρχίζετε να γνωρίζετε.',
    b1_title: 'Εξοικονομήστε 15+ Ώρες την Εβδομάδα',
    b1_desc: 'Η AI αυτοματοποιεί την επεξεργασία τιμολογίων, την καταγραφή συμμόρφωσης και τους υπολογισμούς κόστους που κατανάλωναν ολόκληρες βάρδιες. Η ομάδα σας ξοδεύει λιγότερο χρόνο σε γραφειοκρατία και περισσότερο στην υπηρεσία.',
    b2_title: 'Μειώστε το Κόστος Τροφίμων κατά 3-8%',
    b2_desc: 'Η παρακολούθηση κόστους σε πραγματικό χρόνο και η ανίχνευση σπατάλης βοηθούν τα εστιατόρια να εντοπίσουν και να εξαλείψουν κρυφές απώλειες — συχνά αποπληρώνοντας την πλατφόρμα εντός του πρώτου μήνα.',
    b3_title: 'Πάντα Έτοιμοι για Έλεγχο',
    b3_desc: 'Η συνεχής παρακολούθηση HACCP σημαίνει ότι δεν πανικοβάλλεστε ποτέ πριν από έλεγχο. Η AI κρατά τα αρχεία συμμόρφωσής σας πλήρη, ακριβή και άμεσα προσβάσιμα.',
    how_title: 'Πώς το RiveHub εφαρμόζει AI στο εστιατόριό σας',
    how_description: 'Το RiveHub δεν είναι ένα γενικό εργαλείο με AI κολλημένη πάνω. Κάθε λειτουργία σχεδιάστηκε γύρω από τον τρόπο που λειτουργούν πραγματικά τα εστιατόρια — από την κουζίνα ως τον χώρο εξυπηρέτησης.',
    step1_label: 'Βήμα 01',
    step1_title: 'Συνδέστε τα Συστήματά σας',
    step1_desc: 'Συνδέστε το POS σας (Toast, Square, Lightspeed, SumUp, Zettle), ανεβάστε τιμολόγια και προσκαλέστε την ομάδα σας. Η ρύθμιση διαρκεί λιγότερο από 15 λεπτά.',
    step2_label: 'Βήμα 02',
    step2_title: 'Η AI Μαθαίνει τα Μοτίβα σας',
    step2_desc: 'Εντός 48 ωρών, η AI του RiveHub κατανοεί τη δομή κόστους, τα μοτίβα υπηρεσίας και τις ρουτίνες συμμόρφωσής σας — και αρχίζει να παρέχει πληροφορίες.',
    step3_label: 'Βήμα 03',
    step3_title: 'Λάβετε Αξιοποιήσιμη Πληροφόρηση',
    step3_desc: 'Καθημερινές ειδοποιήσεις για ανωμαλίες κόστους τροφίμων, αυτοματοποιημένες αναφορές συμμόρφωσης, κατατάξεις κερδοφορίας μενού και προβλεπτικές λίστες προετοιμασίας — χωρίς χειροκίνητη εισαγωγή.',
    step4_label: 'Βήμα 04',
    step4_title: 'Κλιμακώστε με Αυτοπεποίθηση',
    step4_desc: 'Καθώς το εστιατόριό σας αναπτύσσεται, η AI κλιμακώνεται μαζί σας — διαχειρίζεται πολλαπλές τοποθεσίες, νέα μέλη ομάδας και αυξανόμενη πολυπλοκότητα χωρίς πρόσθετο κόστος.',
    cta_title: 'Είστε έτοιμοι να φέρετε την AI στο εστιατόριό σας;',
    cta_description: 'Γίνετε μέλος εστιατορίων παγκοσμίως που χρησιμοποιούν το RiveHub για αυτοματοποίηση λειτουργιών, μείωση κόστους και συμμόρφωση — με τη δύναμη της τεχνητής νοημοσύνης.',
    cta_button: 'Ξεκινήστε Δωρεάν Σήμερα',
    cta_subtext: 'Δεν απαιτείται πιστωτική κάρτα. Δωρεάν πλάνο, για πάντα.',
  },

  // ===== Pilote =====
  Pilote: {
    btn_label: 'Ο Πιλότος',
    title: 'Ο Πιλότος',
    subtitle: 'Λειτουργική Πλοήγηση',
    welcome: 'Πιλότος στο πλοίο. Τι πορεία θα χαράξουμε σήμερα;',
    placeholder: 'Κάντε μια ερώτηση σχετικά με την υπηρεσία...',
    quick_prompts_title: 'Γρήγορα Αιτήματα',
    qp1_label: 'Ανάλυση σημερινού Κόστους Τροφίμων',
    qp1_prompt: 'Δώσε μου μια σύνοψη των τρεχουσών ειδοποιήσεων Κόστους Τροφίμων.',
    qp2_label: 'Έλεγχος Λίστας Προετοιμασίας',
    qp2_prompt: 'Αξιολόγησε τις ποσότητες που δημιούργησε η AI για τη σημερινή Λίστα Προετοιμασίας.',
    qp3_label: 'Σύνοψη πρόσφατων πωλήσεων',
    qp3_prompt: 'Ποια ήταν τα έσοδα τις τελευταίες ημέρες και ποια είναι η τάση;',
    qp4_label: 'Σημερινές κρατήσεις',
    qp4_prompt: 'Πόσες καλύψεις αναμένονται σήμερα; Περιέγραψε τις κρατήσεις.',
    qp5_label: 'Τελευταίες σημειώσεις ημερολογίου',
    qp5_prompt: 'Δείξε μου τις τελευταίες σημειώσεις ημερολογίου, ειδικά τις επείγουσες.',
    error_message: 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά ή αναφέρετε το πρόβλημα.',
    error_count: '{count} σφάλμα(τα) αντιμετωπίστηκαν κατά τη συνεδρία.',
    btn_sending: 'Αποστολή...',
    btn_report: 'Αναφορά στην ομάδα Rive',
    report_sent: 'Αναφορά εστάλη',
    report_sent_confirm: 'Αναφορά εστάλη στην ομάδα.',
    tooltip_report: 'Αναφορά προβλήματος',
  },

  // ===== DailyInsight =====
  DailyInsight: {
    section_title: 'η πληροφορία της ημέρας',
  },

  // ===== Carte =====
  Carte: {
    performance_title: 'Απόδοση Μενού',
    performance_desc: 'Ταξινόμηση BCG και βελτιστοποίηση AI του μενού σας',
    tab_matrix: 'Μήτρα',
    tab_sales: 'Πωλήσεις POS',
    breadcrumb_sales: 'Πωλήσεις POS',
    sales_entry_title: 'Εισαγωγή Όγκου Πωλήσεων',
    import_csv: 'Εισαγωγή CSV',
    analyzing_ai: 'Ανάλυση AI...',
    sync_pos: 'Συγχρονισμός POS',
    syncing: 'Συγχρονισμός...',
    save_sales: 'Αποθήκευση πωλήσεων',
    saving: 'Αποθήκευση...',
    sales_updated: 'Οι όγκοι πωλήσεων ενημερώθηκαν επιτυχώς.',
    sync_success: 'Επιτυχής συγχρονισμός. Βρέθηκαν {count} αντιστοιχίσεις.',
    sync_error: 'Σφάλμα {provider}: {error}',
    csv_error: 'Σφάλμα επεξεργασίας CSV',
    csv_success: 'Επιτυχής εισαγωγή CSV. {count} στοιχεία ενημερώθηκαν.',
    no_items: 'Δεν βρέθηκαν στοιχεία στο μενού.',
    add_items_hint: 'Προσθέστε στοιχεία μέσω του επεξεργαστή μενού για να εισάγετε τις πωλήσεις τους.',
    weekly_sales: 'Εβδομαδιαίες πωλήσεις:',
  },

  // ===== Reserve =====
  Reserve: {
    food_cost_title: 'Κόστος Τροφίμων',
    food_cost_desc: 'Ανάλυση κερδοφορίας και μεικτά περιθώρια',
    tab_overview: 'Επισκόπηση',
    tab_ingredients: 'Υλικά',
    tab_recipes: 'Συνταγές',
    tab_invoices: 'Σαρωμένα Τιμολόγια',
    ingredients_catalog: 'Κατάλογος Υλικών',
    ingredient_name: 'Όνομα υλικού',
    cost: 'Κόστος',
    unit: 'Μονάδα',
    placeholder_ingredient: 'Π.χ.: Φρέσκος σολομός',
    placeholder_cost: '38.00',
    placeholder_unit: 'kg, L, μονάδα...',
    all_fields_required: 'Όλα τα πεδία είναι υποχρεωτικά.',
    delete_ingredient_confirm: 'Θέλετε πραγματικά να διαγράψετε αυτό το υλικό;',
    no_ingredients: 'Δεν υπάρχουν ρυθμισμένα υλικά.',
    recipe_associations: 'Συσχετίσεις Μενού / Υλικών',
    recipe_summary: '{count} υλικό(ά) — Εκτιμώμενο κόστος: {cost}',
    no_recipe: 'Δεν υπάρχει ρυθμισμένη συνταγή',
    configured: 'Ρυθμισμένο',
    to_configure: 'Προς ρύθμιση',
    recipe_ingredients_label: 'Υλικά συνταγής',
    select_ingredient: 'Επιλέξτε υλικό...',
    qty_placeholder: 'Ποσ.',
    add_ingredient: 'Προσθήκη υλικού',
    time_yield: 'Χρόνος & Απόδοση',
    prep_time: 'Χρόνος προετοιμασίας',
    cook_time: 'Χρόνος μαγειρέματος',
    yield_portions: 'Μερίδες που παράγονται',
    prep_time_help: 'Ο χρόνος προετοιμασίας χρησιμοποιείται για τον υπολογισμό κόστους εργασίας ανά μερίδα (χρόνος × ωριαία αμοιβή ÷ μερίδες). Ορίστε την ωριαία αμοιβή σας στις Ρυθμίσεις.',
    save_recipe: 'Αποθήκευση συνταγής',
    validation_error: 'Παρακαλούμε επιλέξτε υλικό και ορίστε έγκυρη ποσότητα για κάθε γραμμή.',
    add_items_hint: 'Προσθέστε στοιχεία μέσω του επεξεργαστή μενού (ή περιμένετε συγχρονισμό POS) για να ρυθμίσετε τις συνταγές τους.',
  },

  // ===== Coulage =====
  Coulage: {
    back: '← Πίσω',
    title: 'Δήλωση Απώλειας',
    description: 'Καταγράψτε ένα χυμένο, ληγμένο ή κερασμένο προϊόν',
    details_title: 'Λεπτομέρειες απώλειας',
    product_label: 'Προϊόν / Υλικό',
    select_product: 'Επιλέξτε προϊόν...',
    quantity_label: 'Χαμένη Ποσότητα',
    quantity_placeholder: 'Π.χ.: 1',
    unit_label: 'Μονάδα',
    unit_oz: 'oz',
    unit_liters: 'Λίτρα (L)',
    unit_ml: 'ml',
    unit_glass: 'Ποτήρι',
    unit_unit: 'Μονάδα',
    reason_label: 'Αιτία',
    reason_spill: 'Χυμένο (Χύσιμο / Σπάσιμο)',
    reason_comp: 'Κέρασμα σε πελάτη (Comp)',
    reason_spoil: 'Ληγμένο / Κακή γεύση (Φθορά)',
    reason_staff: 'Σφάλμα προσωπικού / Κατανάλωση',
    note_label: 'Πρόσθετη Σημείωση (Προαιρετικό)',
    note_placeholder: 'Π.χ.: Ο πελάτης δεν του άρεσε το κοκτέιλ...',
    recording: 'Καταγραφή...',
    record_loss: 'Καταγραφή απώλειας',
    success: 'Η απώλεια καταγράφηκε και αφαιρέθηκε από το απόθεμα.',
  },

  // ===== Provisions =====
  Provisions: {
    title: 'Σαρώσεις OCR & Τιμολόγια',
    description: 'Ψηφιοποιήστε τα τιμολόγιά σας για να τροφοδοτήσετε το Δυναμικό Κόστος Τροφίμων',
    history_title: 'Ιστορικό σαρώσεων',
    invoices_count: '{count} τιμολόγια καταγεγραμμένα',
    loading_history: 'Φόρτωση ιστορικού...',
    no_invoices: 'Δεν έχουν σαρωθεί τιμολόγια ακόμα από το Rive AI.',
    items_detected: '{count} στοιχεία εντοπίστηκαν',
    includes: 'Περιλαμβάνει: {items}...',
  },
};

// Merge: start with el, add missing sections, add missing keys
const result = {};

// Process in en.json order to maintain section ordering
for (const section of Object.keys(en)) {
  if (el[section]) {
    // Section exists — copy existing, add missing keys
    result[section] = { ...el[section] };
    for (const key of Object.keys(en[section])) {
      if (!result[section][key]) {
        // Try translations map first
        if (translations[section] && translations[section][key]) {
          result[section][key] = translations[section][key];
        } else {
          // Fallback: keep English value (better than nothing)
          result[section][key] = en[section][key];
        }
      }
    }
  } else if (translations[section]) {
    // New section with translations
    result[section] = {};
    for (const key of Object.keys(en[section])) {
      result[section][key] = translations[section][key] || en[section][key];
    }
  } else {
    // Section not translated — copy English as fallback
    result[section] = { ...en[section] };
  }
}

// Remove extra sections not in en.json (FoodCost -> Reserve, AIRestaurantManagement -> AIPage)
// Actually keep them if they have unique content, but the validator showed they're extras
// Let's check if these correspond to renamed sections
// FoodCost keys are in Reserve, AIRestaurantManagement is separate from AIPage
// Keep them as-is since the app may reference them

fs.writeFileSync(
  path.join(__dirname, '../messages/el.json'),
  JSON.stringify(result, null, 2) + '\n',
  'utf8'
);

// Verify
const final = JSON.parse(fs.readFileSync(path.join(__dirname, '../messages/el.json'), 'utf8'));
const finalKeys = Object.keys(final);
const enKeys = Object.keys(en);
const stillMissing = enKeys.filter(k => !finalKeys.includes(k));
let missingSubKeys = 0;
for (const s of enKeys) {
  if (!final[s]) continue;
  for (const k of Object.keys(en[s])) {
    if (!final[s][k]) missingSubKeys++;
  }
}
console.log(`Sections: ${finalKeys.length}/${enKeys.length}`);
console.log(`Missing sections: ${stillMissing.length}`);
console.log(`Missing sub-keys: ${missingSubKeys}`);
console.log('Done!');
