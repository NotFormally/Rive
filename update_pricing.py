import os
import json

locales_dir = '/Users/nassim/Shore/messages'
for filename in os.listdir(locales_dir):
    if filename.endswith('.json'):
        filepath = os.path.join(locales_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'Pricing' in data:
            if filename == 'fr.json':
                data['Pricing']['tier_essential_name'] = "Essence"
                data['Pricing']['tier_performance_name'] = "Performance"
                data['Pricing']['tier_intelligence_name'] = "Intelligence"
                data['Pricing']['tier_intelligence_badge'] = "Pilotage Autonome"
                data['Pricing']['tier_intelligence_desc'] = "L'outil ultime avec prédictions et intégrations de réservations."
                data['Pricing']['feature_reservations'] = "Intégration Réservations (Resy, Libro)"
                data['Pricing']['feature_preplists'] = "Smart Prep Lists (IA Prédictive)"
                data['Pricing']['enterprise_custom_title'] = "Groupe & Franchises"
                data['Pricing']['enterprise_custom_desc'] = "Tableau de bord consolidé, multi-sites, déploiement sur mesure et formation."
                data['Pricing']['enterprise_custom_cta'] = "Contactez-nous (Sur Devis)"
            elif filename == 'en.json':
                data['Pricing']['tier_essential_name'] = "Essence"
                data['Pricing']['tier_performance_name'] = "Performance"
                data['Pricing']['tier_intelligence_name'] = "Intelligence"
                data['Pricing']['tier_intelligence_badge'] = "Autonomous Control"
                data['Pricing']['tier_intelligence_desc'] = "The ultimate tool with predictions and reservation integrations."
                data['Pricing']['feature_reservations'] = "Reservations Integration (Resy, Libro)"
                data['Pricing']['feature_preplists'] = "Smart Prep Lists (Predictive AI)"
                data['Pricing']['enterprise_custom_title'] = "Groups & Franchises"
                data['Pricing']['enterprise_custom_desc'] = "Consolidated dashboard, multi-site, custom deployment, and training."
                data['Pricing']['enterprise_custom_cta'] = "Contact Us (Custom Pricing)"
            else:
                data['Pricing']['tier_essential_name'] = "Essence"
                data['Pricing']['tier_performance_name'] = "Performance"
                data['Pricing']['tier_intelligence_name'] = "Intelligence"
                data['Pricing']['tier_intelligence_badge'] = "Autonomous Control"
                data['Pricing']['tier_intelligence_desc'] = "The ultimate tool with predictions and reservation integrations."
                data['Pricing']['feature_reservations'] = "Reservations Integration"
                data['Pricing']['feature_preplists'] = "Smart Prep Lists"
                data['Pricing']['enterprise_custom_title'] = "Groups & Franchises"
                data['Pricing']['enterprise_custom_desc'] = "Consolidated dashboard, multi-site, custom deployment, and training."
                data['Pricing']['enterprise_custom_cta'] = "Contact Us"

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')

