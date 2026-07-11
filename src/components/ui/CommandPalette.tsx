'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';

// ─────────────────────────────────────────
// Command Registry
// ─────────────────────────────────────────

interface Command {
  id: string;
  label: string;
  keywords: string[];
  icon: string;
  action: () => void;
  group: 'navigation' | 'actions' | 'quotes' | 'config';
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentQuotes, setRecentQuotes] = useState<{ id: string; quote_number: string; client_name: string | null }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch recent quotes for quick access
  useEffect(() => {
    if (commandPaletteOpen) {
      fetch('/api/quotes?pageSize=5&sortBy=updated_at&sortOrder=desc')
        .then(r => r.json())
        .then(d => setRecentQuotes(d.data || []))
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      Promise.resolve().then(() => {
        setQuery('');
        setSelectedIndex(0);
      });
    }
  }, [commandPaletteOpen]);

  // Static commands
  const staticCommands: Command[] = [
    {
      id: 'new-quote',
      label: 'Nouveau devis',
      keywords: ['nouveau', 'créer', 'devis', 'new'],
      icon: '✏️',
      action: () => { router.push('/quotes/new'); setCommandPaletteOpen(false); },
      group: 'actions',
    },
    {
      id: 'quotes',
      label: 'Liste des devis',
      keywords: ['devis', 'liste', 'quotes'],
      icon: '📋',
      action: () => { router.push('/quotes'); setCommandPaletteOpen(false); },
      group: 'navigation',
    },
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      keywords: ['dashboard', 'accueil', 'home'],
      icon: '🏠',
      action: () => { router.push('/'); setCommandPaletteOpen(false); },
      group: 'navigation',
    },
    {
      id: 'catalogue',
      label: 'Catalogue articles',
      keywords: ['catalogue', 'articles', 'fournisseur'],
      icon: '📦',
      action: () => { router.push('/catalogue'); setCommandPaletteOpen(false); },
      group: 'navigation',
    },
    {
      id: 'clients',
      label: 'Base clients',
      keywords: ['clients', 'client', 'carnet'],
      icon: '👥',
      action: () => { router.push('/clients'); setCommandPaletteOpen(false); },
      group: 'navigation',
    },
    {
      id: 'config',
      label: 'Configuration',
      keywords: ['config', 'paramètres', 'réglages', 'settings'],
      icon: '⚙️',
      action: () => { router.push('/config'); setCommandPaletteOpen(false); },
      group: 'config',
    },
    {
      id: 'dark-mode',
      label: 'Basculer mode sombre',
      keywords: ['dark', 'sombre', 'light', 'clair', 'thème'],
      icon: '🌙',
      action: () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        setCommandPaletteOpen(false);
      },
      group: 'actions',
    },
  ];

  // Dynamic: recent quotes as commands
  const quoteCommands: Command[] = recentQuotes.map(q => ({
    id: `quote-${q.id}`,
    label: `${q.quote_number}${q.client_name ? ` — ${q.client_name}` : ''}`,
    keywords: [q.quote_number, q.client_name || ''],
    icon: '📄',
    action: () => { router.push(`/quotes/${q.id}`); setCommandPaletteOpen(false); },
    group: 'quotes' as const,
  }));

  const allCommands = [...staticCommands, ...quoteCommands];

  // Filter
  const filtered = query.trim()
    ? allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : allCommands;

  // Group
  const grouped = filtered.reduce<Record<string, { label: string; commands: Command[] }>>((acc, cmd) => {
    const groupLabels: Record<string, string> = {
      navigation: '📍 Navigation',
      actions: '⚡ Actions',
      quotes: '🕐 Devis récents',
      config: '⚙️ Réglages',
    };
    if (!acc[cmd.group]) acc[cmd.group] = { label: groupLabels[cmd.group] || cmd.group, commands: [] };
    acc[cmd.group].commands.push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatFiltered = filtered;

  const execute = useCallback((cmd: Command) => {
    cmd.action();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCommandPaletteOpen(false); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && flatFiltered[selectedIndex]) { execute(flatFiltered[selectedIndex]); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, flatFiltered, selectedIndex, execute, setCommandPaletteOpen]);

  // Reset selection on query change
  useEffect(() => { Promise.resolve().then(() => setSelectedIndex(0)); }, [query]);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  let flatIdx = 0;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="cp-panel clay-card"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          >
            {/* Search Input */}
            <div className="cp-input-wrap">
              <svg className="cp-search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="5" />
                <path d="M15 15l-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                className="cp-input"
                placeholder="Rechercher une action, un devis..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="cp-kbd">ESC</kbd>
            </div>

            {/* Results */}
            <div className="cp-results">
              {flatFiltered.length === 0 ? (
                <div className="cp-empty">Aucun résultat pour «{query}»</div>
              ) : (
                Object.entries(grouped).map(([groupKey, group]) => (
                  <div key={groupKey} className="cp-group">
                    <div className="cp-group-label">{group.label}</div>
                    {group.commands.map(cmd => {
                      const isSelected = flatFiltered[selectedIndex]?.id === cmd.id;
                      const currentIdx = flatIdx++;
                      return (
                        <button
                          key={cmd.id}
                          className={`cp-item ${isSelected ? 'selected' : ''}`}
                          onMouseEnter={() => setSelectedIndex(currentIdx)}
                          onClick={() => execute(cmd)}
                        >
                          <span className="cp-item-icon">{cmd.icon}</span>
                          <span className="cp-item-label">{cmd.label}</span>
                          {isSelected && (
                            <span className="cp-item-enter">
                              <kbd>↵</kbd>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="cp-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
              <span><kbd>↵</kbd> ouvrir</span>
              <span><kbd>ESC</kbd> fermer</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
