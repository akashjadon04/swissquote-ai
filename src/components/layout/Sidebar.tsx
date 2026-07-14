'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store';
import { useTranslation } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui';
import { useTheme } from 'next-themes';

// ─────────────────────────────────────────
// Icons (inline SVGs — no dependency)
// ─────────────────────────────────────────

const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="2" />
      <rect x="11" y="2" width="7" height="7" rx="2" />
      <rect x="2" y="11" width="7" height="7" rx="2" />
      <rect x="11" y="11" width="7" height="7" rx="2" />
    </svg>
  ),
  quote: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      <path d="M7 7h6M7 10h6M7 13h3" />
    </svg>
  ),
  catalogue: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12v12H4zM4 8h12M8 4v12" />
    </svg>
  ),
  config: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
    </svg>
  ),
  clients: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" />
    </svg>
  ),
  audit: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2l7 4v4c0 4.42-2.98 8.56-7 10-4.02-1.44-7-5.58-7-10V6l7-4Z" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="5" />
      <path d="M16 16l-3.5-3.5" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.54 9.54a7 7 0 0 1-9.08-9.08A7 7 0 1 0 15.54 9.54Z" />
    </svg>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="4" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.64 3.64l1.41 1.41M12.95 12.95l1.41 1.41M3.64 14.36l1.41-1.41M12.95 5.05l1.41-1.41" />
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12L6 8l4-4" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  ),
  command: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H4Z" />
      <path d="M4 10a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H4Z" />
      <path d="M6 6v4M10 6v4" />
    </svg>
  ),
};

// ─────────────────────────────────────────
// Navigation Items
// ─────────────────────────────────────────

// Navigation Items will be defined inside components using translations

// ─────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, isMobile } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
    
    // Auto-collapse sidebar on smaller desktop/tablet screens (e.g. < 1200px)
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1200 && width >= 768) {
        useAppStore.getState().setSidebarOpen(false);
      } else if (width >= 1200) {
        useAppStore.getState().setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  // Mobile: overlay sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
            />
            <motion.aside
              className="sidebar clay-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <SidebarContent pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <motion.aside
      className="sidebar clay-sidebar"
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <SidebarContent pathname={pathname} collapsed={!sidebarOpen} />
    </motion.aside>
  );
}

function SidebarContent({ pathname, collapsed = false }: { pathname: string; collapsed?: boolean }) {
  const { toggleSidebar, setCommandPaletteOpen, isMobile } = useAppStore();
  const { t } = useTranslation();

  const navItems = [
    { href: '/', label: t('sidebar', 'dashboard'), icon: Icons.dashboard },
    { href: '/quotes', label: t('sidebar', 'quotes'), icon: Icons.quote },
    { href: '/catalogue', label: t('sidebar', 'catalogue'), icon: Icons.catalogue },
    { href: '/clients', label: t('sidebar', 'clients'), icon: Icons.clients },
    { href: '/config', label: t('sidebar', 'settings'), icon: Icons.config },
    { href: '/admin', label: t('sidebar', 'audit'), icon: Icons.audit },
  ];

  return (
    <div className="sidebar-content">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="var(--color-accent)" />
              <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <motion.div
              className="logo-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="logo-name">AstraQuote</span>
              <span className="logo-badge">AI</span>
            </motion.div>
          )}
        </div>
        {!collapsed && (
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} aria-label={t('generic', 'collapse')}>
            {Icons.chevronLeft}
          </button>
        )}
        {collapsed && (
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} aria-label={t('generic', 'expand')}>
            {Icons.menu}
          </button>
        )}
      </div>

      {/* New Quote CTA */}
      <div className="sidebar-cta">
        <Link 
          href="/quotes/new" 
          className="btn-new-quote clay-button"
          onClick={() => {
            if (isMobile) toggleSidebar();
          }}
        >
          {Icons.plus}
          {!collapsed && <span>{t('dashboard', 'newQuote')}</span>}
        </Link>
      </div>

      {/* Search shortcut */}
      {!collapsed && (
        <button
          className="sidebar-search"
          onClick={() => setCommandPaletteOpen(true)}
        >
          {Icons.search}
          <span>{t('generic', 'search')}</span>
          <kbd>⌘K</kbd>
        </button>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) toggleSidebar();
              }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && (
                <motion.span
                  className="nav-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  className="nav-active-indicator"
                  layoutId="activeNav"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-footer">
        <LanguageToggle />
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">AD</div>
            <div className="user-info">
              <span className="user-name">Arnaud Dimec</span>
              <span className="user-role">Technicien</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Theme Toggle
// ─────────────────────────────────────────

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-6"></div>; // Placeholder
  }

  const isDark = resolvedTheme === 'dark';
  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center gap-2">
      <label className="bb8-toggle" title={isDark ? 'Mode clair' : 'Mode sombre'}>
        <input 
          className="bb8-toggle__checkbox" 
          type="checkbox" 
          onChange={toggle} 
          checked={isDark} 
        />
        <div className="bb8-toggle__container">
          <div className="bb8-toggle__scenery">
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="bb8-toggle__star"></div>
            <div className="tatto-1"></div>
            <div className="tatto-2"></div>
            <div className="gomrassen"></div>
            <div className="hermes"></div>
            <div className="chenini"></div>
            <div className="bb8-toggle__cloud"></div>
            <div className="bb8-toggle__cloud"></div>
            <div className="bb8-toggle__cloud"></div>
          </div>
          <div className="bb8">
            <div className="bb8__head-container">
              <div className="bb8__antenna"></div>
              <div className="bb8__antenna"></div>
              <div className="bb8__head"></div>
            </div>
            <div className="bb8__body"></div>
          </div>
          <div className="artificial__hidden">
            <div className="bb8__shadow"></div>
          </div>
        </div>
      </label>
    </div>
  );
}

// ─────────────────────────────────────────
// Mobile Bottom Navigation
// ─────────────────────────────────────────

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const mobileNavItems = [
    { href: '/', label: t('sidebar', 'dashboard'), icon: Icons.dashboard },
    { href: '/quotes', label: t('sidebar', 'quotes'), icon: Icons.quote },
    { href: '/catalogue', label: t('sidebar', 'catalogue'), icon: Icons.catalogue },
    { href: '/clients', label: t('sidebar', 'clients'), icon: Icons.clients },
    { href: '/config', label: t('sidebar', 'settings'), icon: Icons.config },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {mobileNavItems.map((item) => {
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label.split(' ')[0]}</span>
            {isActive && (
              <motion.div
                className="mobile-nav-indicator"
                layoutId="mobileActiveNav"
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────
// Top Bar
// ─────────────────────────────────────────

export function TopBar({ title, breadcrumb }: { title?: string; breadcrumb?: string[] }) {
  const { toggleSidebar, isMobile, setCommandPaletteOpen } = useAppStore();
  const { t } = useTranslation();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button className="topbar-menu-btn" onClick={toggleSidebar} aria-label="Menu">
            {Icons.menu}
          </button>
        )}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="breadcrumb">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'breadcrumb-current' : 'breadcrumb-item'}>
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        {title && !breadcrumb && <h1 className="topbar-title">{title}</h1>}
      </div>
      <div className="topbar-right flex items-center gap-4">
        {!isMobile && (
          <button
            className="topbar-search-btn"
            onClick={() => setCommandPaletteOpen(true)}
          >
            {Icons.search}
            <span>{t('topbar', 'search')}</span>
            <kbd>⌘K</kbd>
          </button>
        )}
        <ThemeToggle collapsed={false} />
      </div>
    </header>
  );
}
