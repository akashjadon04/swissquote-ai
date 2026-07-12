import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type QuoteStatus = 'draft' | 'review' | 'finalized' | 'missing_items' | 'sent' | 'accepted' | 'invoiced';

export interface QuoteItem {
  id: string;
  reference: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  lineTotal: number | null;
  supplierCode: string | null;
  supplierName: string | null;
  aiLabel: string | null;
  aiConfidence: number | null;
  isMissing: boolean;
  isManuallyAdded: boolean;
  matchedTextStart: number | null;
  matchedTextEnd: number | null;
  sortOrder: number;
}

export interface QuoteSection {
  id: string;
  sectionCode: string;
  sectionLabel: string;
  description: string | null;
  items: QuoteItem[];
  sortOrder: number;
}

export interface QuoteFinancials {
  materialsSubtotal: number;
  materialsMarginPct: number;
  materialsMargin: number;
  labourHours: number;
  labourRate: number;
  labourTotal: number;
  travelFee: number;
  subtotalExclVat: number;
  vatRate: number;
  vatAmount: number;
  totalInclVat: number;
}

export interface QuoteData {
  id: string | null;
  quoteNumber: string;
  status: QuoteStatus;
  // Client
  clientId: string | null;
  clientName: string;
  clientAddress: string;
  clientPostal: string;
  clientCity: string;
  clientContact: string;
  // Project
  buildingAddress: string;
  apartmentZone: string;
  subjectLine: string;
  // AI
  originalDescription: string;
  aiExtraction: unknown | null;
  aiProvider: string | null;
  interventionType: string | null;
  technicalSummary: string | null;
  aiConfidence: number | null;
  // Content
  sections: QuoteSection[];
  financials: QuoteFinancials;
  // Config
  canton: string;
  preferredSupplier: string | null;
  // Meta
  companyName: string;
  companyAddress: string;
  technicianName: string;
  exclusions: string[];
  hasMissingItems: boolean;
  version: number;
}

// ─────────────────────────────────────────
// Wizard Steps
// ─────────────────────────────────────────

export type WizardStep = 'client' | 'description' | 'processing' | 'review' | 'preview';

// ─────────────────────────────────────────
// App Store
// ─────────────────────────────────────────

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Mobile
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;

  // Toast messages
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

      isMobile: false,
      setIsMobile: (isMobile) => set({ isMobile }),

      toastMessage: null,
      setToastMessage: (toastMessage) => set({ toastMessage }),
    }),
    { name: 'AstraQuote-app' }
  )
);

// ─────────────────────────────────────────
// Quote Store (with undo/redo)
// ─────────────────────────────────────────

const DEFAULT_FINANCIALS: QuoteFinancials = {
  materialsSubtotal: 0,
  materialsMarginPct: 15,
  materialsMargin: 0,
  labourHours: 0,
  labourRate: 145,
  labourTotal: 0,
  travelFee: 45,
  subtotalExclVat: 0,
  vatRate: 0.081,
  vatAmount: 0,
  totalInclVat: 0,
};

const DEFAULT_QUOTE: QuoteData = {
  id: null,
  quoteNumber: '',
  status: 'draft',
  clientId: null,
  clientName: '',
  clientAddress: '',
  clientPostal: '',
  clientCity: '',
  clientContact: '',
  buildingAddress: '',
  apartmentZone: '',
  subjectLine: '',
  originalDescription: '',
  aiExtraction: null,
  aiProvider: null,
  interventionType: null,
  technicalSummary: null,
  aiConfidence: null,
  sections: [],
  financials: { ...DEFAULT_FINANCIALS },
  canton: 'Genève',
  preferredSupplier: 'NSB',
  companyName: 'AstraQuote (by Green AI Groupe)',
  companyAddress: '',
  technicianName: '',
  exclusions: [],
  hasMissingItems: false,
  version: 1,
};

interface QuoteState {
  // Current quote
  quote: QuoteData;
  setQuote: (quote: Partial<QuoteData>) => void;
  resetQuote: () => void;

  // Wizard
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;

  // Processing state
  isProcessing: boolean;
  processingStep: number;
  processingError: string | null;
  setProcessing: (isProcessing: boolean, step?: number) => void;
  setProcessingError: (error: string | null) => void;

  // Undo/Redo
  undoStack: QuoteData[];
  redoStack: QuoteData[];
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Auto-save
  isDirty: boolean;
  lastSaved: Date | null;
  setDirty: (dirty: boolean) => void;
  setLastSaved: (date: Date) => void;

  // Item editing
  updateItem: (sectionIndex: number, itemIndex: number, updates: Partial<QuoteItem>) => void;
  removeItem: (sectionIndex: number, itemIndex: number) => void;
  addItem: (sectionIndex: number, item: QuoteItem) => void;
  reorderItems: (sectionIndex: number, fromIndex: number, toIndex: number) => void;

  // Financial recalculation
  recalculateFinancials: () => void;
}

export const useQuoteStore = create<QuoteState>()(
  devtools(
    (set, get) => ({
      quote: { ...DEFAULT_QUOTE },
      setQuote: (partial) => {
        const state = get();
        set({
          quote: { ...state.quote, ...partial },
          isDirty: true,
        });
        if (partial.sections) {
          get().recalculateFinancials();
        }
      },
      resetQuote: () => set({
        quote: { ...DEFAULT_QUOTE },
        wizardStep: 'client',
        undoStack: [],
        redoStack: [],
        isDirty: false,
        isProcessing: false,
        processingStep: 0,
        processingError: null,
      }),

      wizardStep: 'client',
      setWizardStep: (wizardStep) => set({ wizardStep }),

      isProcessing: false,
      processingStep: 0,
      processingError: null,
      setProcessing: (isProcessing, step = 0) => set({ isProcessing, processingStep: step }),
      setProcessingError: (processingError) => set({ processingError, isProcessing: false }),

      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      pushUndo: () => {
        const state = get();
        const newStack = [...state.undoStack, { ...state.quote }].slice(-50);
        set({ undoStack: newStack, redoStack: [], canUndo: true, canRedo: false });
      },
      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return;
        const previous = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);
        set({
          redoStack: [...state.redoStack, { ...state.quote }],
          quote: previous,
          undoStack: newUndoStack,
          canUndo: newUndoStack.length > 0,
          canRedo: true,
          isDirty: true,
        });
      },
      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;
        const next = state.redoStack[state.redoStack.length - 1];
        const newRedoStack = state.redoStack.slice(0, -1);
        set({
          undoStack: [...state.undoStack, { ...state.quote }],
          quote: next,
          redoStack: newRedoStack,
          canUndo: true,
          canRedo: newRedoStack.length > 0,
          isDirty: true,
        });
      },

      isDirty: false,
      lastSaved: null,
      setDirty: (isDirty) => set({ isDirty }),
      setLastSaved: (lastSaved) => set({ lastSaved, isDirty: false }),

      updateItem: (sectionIndex, itemIndex, updates) => {
        const state = get();
        state.pushUndo();
        const sections = [...state.quote.sections];
        const items = [...sections[sectionIndex].items];
        items[itemIndex] = { ...items[itemIndex], ...updates };
        // Recalculate line total if price or quantity changed
        if (updates.unitPrice !== undefined || updates.quantity !== undefined) {
          const item = items[itemIndex];
          items[itemIndex].lineTotal = item.unitPrice && item.quantity
            ? Number((item.unitPrice * item.quantity).toFixed(2))
            : null;
        }
        sections[sectionIndex] = { ...sections[sectionIndex], items };
        set({
          quote: { ...state.quote, sections },
          isDirty: true,
        });
        get().recalculateFinancials();
      },

      removeItem: (sectionIndex, itemIndex) => {
        const state = get();
        state.pushUndo();
        const sections = [...state.quote.sections];
        const items = sections[sectionIndex].items.filter((_, i) => i !== itemIndex);
        sections[sectionIndex] = { ...sections[sectionIndex], items };
        set({
          quote: { ...state.quote, sections },
          isDirty: true,
        });
        get().recalculateFinancials();
      },

      addItem: (sectionIndex, item) => {
        const state = get();
        state.pushUndo();
        const sections = [...state.quote.sections];
        const items = [...sections[sectionIndex].items, item];
        sections[sectionIndex] = { ...sections[sectionIndex], items };
        set({
          quote: { ...state.quote, sections },
          isDirty: true,
        });
        get().recalculateFinancials();
      },

      reorderItems: (sectionIndex, fromIndex, toIndex) => {
        const state = get();
        state.pushUndo();
        const sections = [...state.quote.sections];
        const items = [...sections[sectionIndex].items];
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        sections[sectionIndex] = { ...sections[sectionIndex], items };
        set({
          quote: { ...state.quote, sections },
          isDirty: true,
        });
      },

      recalculateFinancials: () => {
        const state = get();
        const allItems = state.quote.sections.flatMap(s => s.items);
        
        const materialsSubtotal = allItems
          .filter(i => !i.isMissing && i.lineTotal)
          .reduce((sum, i) => sum + (i.lineTotal || 0), 0);

        const f = state.quote.financials;
        const materialsMargin = Number((materialsSubtotal * (f.materialsMarginPct / 100)).toFixed(2));
        const labourTotal = Number((f.labourHours * f.labourRate).toFixed(2));
        const subtotalExclVat = Number((materialsSubtotal + materialsMargin + labourTotal + f.travelFee).toFixed(2));
        const vatAmount = Number((subtotalExclVat * f.vatRate).toFixed(2));
        const totalInclVat = Number((subtotalExclVat + vatAmount).toFixed(2));
        const hasMissingItems = allItems.some(i => i.isMissing);

        set({
          quote: {
            ...state.quote,
            hasMissingItems,
            financials: {
              ...f,
              materialsSubtotal: Number(materialsSubtotal.toFixed(2)),
              materialsMargin,
              labourTotal,
              subtotalExclVat,
              vatAmount,
              totalInclVat,
            },
          },
        });
      },
    }),
    { name: 'AstraQuote-quote' }
  )
);
