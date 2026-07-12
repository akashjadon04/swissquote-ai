import { useLocaleStore } from '@/store/localeStore';

export const translations = {
  fr: {
    // Sidebar
    sidebar: {
      dashboard: 'Tableau de bord',
      quotes: 'Devis',
      clients: 'Clients',
      catalogue: 'Catalogue',
      settings: 'Paramètres',
      audit: 'Audit'
    },
    // TopBar
    topbar: {
      search: 'Recherche rapide... (Ctrl+K)'
    },
    // Dashboard
    dashboard: {
      totalRevenue: 'Chiffre d\'Affaires (YTD)',
      activeQuotes: 'Devis en cours',
      winRate: 'Taux de conversion',
      recentQuotes: 'Devis Récents',
      viewAll: 'Voir tout',
      noRecent: 'Aucun devis récent',
      newQuote: 'Nouveau devis'
    },
    // Generic
    generic: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      noResults: 'Aucun résultat',
      search: 'Rechercher...',
      collapse: 'Réduire',
      expand: 'Développer',
      prev: '← Préc.',
      next: 'Suiv. →',
      page: 'Page'
    },
    // Quotes
    quotes: {
      emptyTitle: 'Aucun devis',
      emptyDesc: 'Créez votre premier devis en quelques secondes avec l\'IA.',
      emptySearch: 'Essayez de modifier vos filtres ou votre recherche.',
      status: {
        draft: 'Brouillon',
        review: 'En révision',
        finalized: 'Finalisé',
        missing_items: 'Articles manquants',
        sent: 'Envoyé',
        accepted: 'Accepté',
        invoiced: 'Facturé'
      }
    },
    // Clients
    clients: {
      emptyTitle: 'Aucun client',
      emptyDesc: 'Créez votre premier client pour démarrer.',
      newClient: 'Nouveau client',
      editClient: 'Modifier le client',
      name: 'Nom *',
      contact: 'Contact',
      phone: 'Téléphone',
      email: 'Email',
      address: 'Adresse',
      postal: 'NPA',
      city: 'Ville',
      notes: 'Notes',
      createClient: 'Créer le client',
      updateClient: 'Mettre à jour',
      saving: 'Enregistrement...',
      successCreate: 'Client créé',
      successUpdate: 'Client mis à jour',
      errorSave: 'Erreur lors de l\'enregistrement',
      nameRequired: 'Le nom est requis',
      searchPlaceholder: 'Nom, adresse, email...',
      clientsCount: 'clients'
    },
    // Admin
    admin: {
      events: 'événements',
      noEvents: 'Aucun événement enregistré.'
    },
    // Config
    config: {
      title: 'Configuration',
      companyInfo: '🏢 Informations société',
      companyName: 'Nom de la société',
      address: 'Adresse',
      postal: 'Code postal',
      city: 'Ville',
      phone: 'Téléphone',
      email: 'Email',
      tvaNumber: 'Numéro TVA',
      financialParams: '💰 Paramètres financiers',
      defaultMargin: 'Marge matériaux par défaut (%)',
      vatRate: 'TVA Suisse (%)',
      travelFee: 'Frais de déplacement par défaut (CHF)',
      defaultCanton: 'Canton par défaut',
      preferredSupplier: 'Fournisseur préféré par défaut',
      labourRates: '⏱️ Taux horaires par canton (CHF/h)',
      systemAndNumbers: '🤖 Système et numérotation',
      lastQuoteNumber: 'Dernier numéro de devis',
      nextQuote: '→ prochain: {num}/AL/jf',
      aiLimit: 'Limite requêtes Astra AI v1 / jour',
      reqPerDay: 'req/jour',
      aiCascade: '⚡ Cascade IA configurée',
      aiPrimary: 'Primaire: Astra AI v1 (gratuit, 1500/j)',
      aiSecondary: 'Secondaire: OpenRouter free tier (cascade automatique)',
      saved: '✓ Enregistré'
    },
    // Catalogue
    catalogue: {
      title: 'Catalogue articles',
      searchPlaceholder: 'Référence, description, spécification...',
      allSuppliers: 'Tous les fournisseurs',
      allCategories: 'Toutes les catégories',
      columns: {
        supplier: 'Fournisseur',
        reference: 'Référence',
        description: 'Désignation',
        specification: 'Spéc.',
        category: 'Catégorie',
        unit: 'Unité',
        unitPrice: 'Prix unitaire HT',
        quantity: 'Qté',
        total: 'Total'
      },
      emptyTitle: 'Aucun article trouvé',
      emptyDesc: 'Vérifiez vos filtres ou effectuez une autre recherche.',
      suppliers: 'Fournisseurs',
      categories: 'Catégories'
    },
    // AI Processing
    ai: {
      step1: 'Lecture de la demande...',
      step2: 'Extraction sémantique...',
      step3: 'Correspondance catalogue...',
      step4: 'Calculs financiers...'
    },
    // Quote Wizard
    quoteWizard: {
      devis: 'Devis',
      previewPdf: 'Aperçu PDF',
      technicalSummary: 'Résumé technique',
      articleNotFound: 'Article non trouvé',
      downloadPdf: 'Télécharger PDF',
      financialSummary: 'Résumé financier',
      financialSummaryDesc: 'Vérifiez et ajustez les paramètres financiers du devis.',
      parameters: 'Paramètres',
      canton: 'Canton',
      labourHours: 'Heures de travail',
      labourRate: 'Taux horaire (CHF/h)',
      materialsMarginPct: 'Marge matériaux (%)',
      travelFee: 'Frais de déplacement (CHF)',
      descriptionTitle: 'Description des travaux',
      descriptionSubtitle: 'Décrivez les travaux en français, comme vous le feriez pour un collègue technicien.',
      placeholder: 'Ex: Coupure d\'eau et vidange des installations. Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu\'au sous-sol...',
      analyzeBtn: 'Analyser avec l\'IA',
      orChooseTemplate: 'Ou choisissez un modèle:',
      templates: {
        replacement: {
          title: 'Remplacement canalisation',
          desc: 'Client: M. Dupont (Rue des Alpes 12, 1201 Genève).\nCoupure d\'eau et vidange des installations. Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu\'au sous-sol. Remplacement en tuyau type Inox Ø 54 mm (longueur 12 m) depuis la chaufferie jusqu\'à la nourrice existante. Remplacement des conduites horizontales en tuyau type Inox Ø 28 mm (longueur 8 m), y compris 4 raccords et 12 colliers de fixation. Mise en pression et contrôle de l\'étanchéité.'
        },
        installation: {
          title: 'Installation robinetterie',
          desc: 'Client: Mme. Lemoine (Av. de la Gare 45, 1003 Lausanne).\nFourniture et pose de robinetterie neuve dans la salle de bain : 2 mitigeurs lavabo chromés, 1 robinet d\'arrêt, et 1 siphon en laiton. Raccordement sur attente existante et test de mise en eau.'
        },
        urgent: {
          title: 'Dépannage urgent',
          desc: 'Client: Gérance ABC (Route de Meyrin 10, 1211 Genève).\nFuite sur colonne montante eau froide au 3ème étage. Coupure d\'eau urgente. Remplacement de 2 mètres de tuyau Geberit Mepla Ø 32 mm, pose de 2 manchons à sertir et 1 coude 90°. Remise en eau et purge du réseau.'
        }
      },
      steps: {
        description: 'Description',
        processing: 'Analyse IA',
        review: 'Révision',
        financials: 'Financier'
      },
      reviewTitle: 'Révision des articles',
      backToArticles: 'Retour aux articles',
      continueToFinancials: 'Continuer vers financier',
      saveQuote: 'Enregistrer le devis',
      totals: 'Totaux du devis',
      materials: 'Matériaux',
      margin: 'Marge',
      labour: 'Main-d\'œuvre',
      travel: 'Déplacement',
      subtotalExclVat: 'Sous-total HT',
      vat: 'TVA',
      totalInclVat: 'Total TTC',
      missingWarning: 'Ce devis contient des articles non référencés. Le total est partiel.',
      exclusions: 'Non compris dans ce devis:'
    }
  },
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      quotes: 'Quotes',
      clients: 'Clients',
      catalogue: 'Catalog',
      settings: 'Settings',
      audit: 'Audit Log'
    },
    topbar: {
      search: 'Quick search... (Ctrl+K)'
    },
    dashboard: {
      totalRevenue: 'Total Revenue (YTD)',
      activeQuotes: 'Active Quotes',
      winRate: 'Win Rate',
      recentQuotes: 'Recent Quotes',
      viewAll: 'View All',
      noRecent: 'No recent quotes',
      newQuote: 'New Quote'
    },
    generic: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      noResults: 'No results',
      search: 'Search...',
      collapse: 'Collapse',
      expand: 'Expand',
      prev: '← Prev',
      next: 'Next →',
      page: 'Page'
    },
    quotes: {
      emptyTitle: 'No quotes',
      emptyDesc: 'Create your first quote in seconds with AI.',
      emptySearch: 'Try adjusting your filters or search terms.',
      status: {
        draft: 'Draft',
        review: 'In Review',
        finalized: 'Finalized',
        missing_items: 'Missing Items',
        sent: 'Sent',
        accepted: 'Accepted',
        invoiced: 'Invoiced'
      }
    },
    clients: {
      emptyTitle: 'No clients',
      emptyDesc: 'Create your first client to get started.',
      newClient: 'New Client',
      editClient: 'Edit Client',
      name: 'Name *',
      contact: 'Contact',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      postal: 'ZIP / Postal',
      city: 'City',
      notes: 'Notes',
      createClient: 'Create Client',
      updateClient: 'Update Client',
      saving: 'Saving...',
      successCreate: 'Client created',
      successUpdate: 'Client updated',
      errorSave: 'Error saving',
      nameRequired: 'Name is required',
      searchPlaceholder: 'Name, address, email...',
      clientsCount: 'clients'
    },
    admin: {
      events: 'events',
      noEvents: 'No events recorded.'
    },
    config: {
      title: 'Configuration',
      companyInfo: '🏢 Company Info',
      companyName: 'Company Name',
      address: 'Address',
      postal: 'Postal Code',
      city: 'City',
      phone: 'Phone',
      email: 'Email',
      tvaNumber: 'VAT Number',
      financialParams: '💰 Financial Parameters',
      defaultMargin: 'Default Material Margin (%)',
      vatRate: 'Swiss VAT (%)',
      travelFee: 'Default Travel Fee (CHF)',
      defaultCanton: 'Default Canton',
      preferredSupplier: 'Default Preferred Supplier',
      labourRates: '⏱️ Hourly Rates by Canton (CHF/h)',
      systemAndNumbers: '🤖 System and Numbering',
      lastQuoteNumber: 'Last Quote Number',
      nextQuote: '→ next: {num}/AL/jf',
      aiLimit: 'Astra AI v1 daily limit',
      reqPerDay: 'req/day',
      aiCascade: '⚡ AI Cascade configured',
      aiPrimary: 'Primary: Astra AI v1 (free, 1500/d)',
      aiSecondary: 'Secondary: OpenRouter free tier (auto-cascade)',
      saved: '✓ Saved'
    },
    catalogue: {
      title: 'Catalog Items',
      searchPlaceholder: 'Reference, description, specification...',
      allSuppliers: 'All Suppliers',
      allCategories: 'All Categories',
      columns: {
        supplier: 'Supplier',
        reference: 'Reference',
        description: 'Description',
        specification: 'Spec',
        category: 'Category',
        unit: 'Unit',
        unitPrice: 'Unit Price (Excl. VAT)',
        quantity: 'Qty',
        total: 'Total'
      },
      emptyTitle: 'No items found',
      emptyDesc: 'Check your filters or try a different search.',
      suppliers: 'Suppliers',
      categories: 'Categories'
    },
    ai: {
      step1: 'Reading request...',
      step2: 'Semantic extraction...',
      step3: 'Catalog matching...',
      step4: 'Financial calculations...'
    },
    quoteWizard: {
      devis: 'Quote',
      previewPdf: 'Preview PDF',
      technicalSummary: 'Technical Summary',
      articleNotFound: 'Article not found',
      downloadPdf: 'Download PDF',
      financialSummary: 'Financial Summary',
      financialSummaryDesc: 'Review and adjust the financial parameters of the quote.',
      parameters: 'Parameters',
      canton: 'Canton',
      labourHours: 'Labour Hours',
      labourRate: 'Hourly Rate (CHF/h)',
      materialsMarginPct: 'Materials Margin (%)',
      travelFee: 'Travel Fee (CHF)',
      descriptionTitle: 'Job Description',
      descriptionSubtitle: 'Describe the work in French, as you would to a fellow technician.',
      placeholder: 'Ex: Water shutdown and draining of installations. Dismantling, removal and evacuation of existing pipe from boiler room to basement...',
      analyzeBtn: 'Analyze with AI',
      orChooseTemplate: 'Or choose a template:',
      templates: {
        replacement: {
          title: 'Pipe Replacement',
          desc: 'Client: Mr. Dupont (Rue des Alpes 12, 1201 Geneva).\nWater shutdown and draining of installations. Dismantling, removal and evacuation of the existing pipe from the boiler room to the basement. Replacement with 12 meters of Stainless steel pipe Ø 54 mm from the boiler room to the existing manifold. Replacement of horizontal pipes with 8 meters of Stainless steel pipe Ø 28 mm, including 4 fittings and 12 mounting brackets. Pressure test and leak check.'
        },
        installation: {
          title: 'Faucet Installation',
          desc: 'Client: Mrs. Lemoine (Av. de la Gare 45, 1003 Lausanne).\nSupply and installation of new faucets in the bathroom: 2 chrome washbasin mixers, 1 shut-off valve, and 1 brass siphon. Connection to existing waiting pipes and water test.'
        },
        urgent: {
          title: 'Urgent Repair',
          desc: 'Client: ABC Management (Route de Meyrin 10, 1211 Geneva).\nLeak on the cold water riser on the 3rd floor. Urgent water shutdown. Replacement of 2 meters of Geberit Mepla pipe Ø 32 mm, installation of 2 press sleeves and 1 90° elbow. Water restoration and network bleed.'
        }
      },
      steps: {
        description: 'Description',
        processing: 'AI Analysis',
        review: 'Review',
        financials: 'Financials'
      },
      reviewTitle: 'Review Articles',
      backToArticles: 'Back to Articles',
      continueToFinancials: 'Continue to Financials',
      saveQuote: 'Save Quote',
      totals: 'Quote Totals',
      materials: 'Materials',
      margin: 'Margin',
      labour: 'Labour',
      travel: 'Travel',
      subtotalExclVat: 'Subtotal (Excl. VAT)',
      vat: 'VAT',
      totalInclVat: 'Total (Incl. VAT)',
      missingWarning: 'This quote contains missing items. The total is partial.',
      exclusions: 'Not included in this quote:'
    }
  }
};

export type TranslationKey = keyof typeof translations.fr;

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  
  const t = (section: TranslationKey, key: string): string => {
    // Basic nested object lookup
    const keys = key.split('.');
    let val: any = translations[locale][section]; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const k of keys) {
      if (val && val[k]) {
        val = val[k];
      } else {
        return `${section}.${key}`; // Fallback if key not found
      }
    }
    return val as string;
  };

  return { t, locale };
}
