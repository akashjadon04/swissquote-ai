'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { EmptyState } from '@/components/ui';
import { Users, Edit2, MapPin, Phone, Mail } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface Client {
  id: string;
  name: string;
  address: string | null;
  postal: string | null;
  city: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  quote_count?: number;
}

export default function ClientsPage() {
  const { setIsMobile } = useAppStore();
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: '', address: '', postal: '', city: '', contact_person: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchDebounce ? { search: searchDebounce } : {});
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [searchDebounce]);

  useEffect(() => { Promise.resolve().then(() => fetchClients()); }, [fetchClients]);

  const openNew = () => {
    setEditingClient(null);
    setForm({ name: '', address: '', postal: '', city: '', contact_person: '', phone: '', email: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      address: client.address || '',
      postal: client.postal || '',
      city: client.city || '',
      contact_person: client.contact_person || '',
      phone: client.phone || '',
      email: client.email || '',
      notes: client.notes || '',
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name.trim()) { toast.error(t('clients', 'nameRequired')); return; }
    setSubmitting(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editingClient ? t('clients', 'successUpdate') : t('clients', 'successCreate'));
        setShowForm(false);
        fetchClients();
      } else {
        toast.error(t('clients', 'errorSave'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title={t('sidebar', 'clients')} />
        <div className="page-content">

          {/* Controls */}
          <div className="ql-header">
            <div className="ql-search-wrap">
              <svg className="ql-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="4" /><path d="M13 13l-2.8-2.8" />
              </svg>
              <input className="ql-search-input" placeholder={t('clients', 'searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="ql-search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
            <div className="ql-controls">
              <button className="clay-button clay-button--primary ql-new-btn" onClick={openNew}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
                {t('clients', 'newClient')}
              </button>
            </div>
          </div>

          <div className="ql-count">{clients.length} {t('clients', 'clientsCount')}</div>

          {/* Client Grid */}
          {loading ? (
            <div className="clients-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="clay-card client-card-skeleton" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="skeleton-line w-60" />
                  <div className="skeleton-line w-40" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? t('generic', 'noResults') : t('clients', 'emptyTitle')}
              description={search ? t('quotes', 'emptySearch') : t('clients', 'emptyDesc')}
              action={
                !search && (
                  <button className="clay-button clay-button--primary" onClick={openNew}>{t('clients', 'newClient')}</button>
                )
              }
            />
          ) : (
            <div className="clients-grid">
              {clients.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="clay-card client-card">
                    <div className="client-card-header">
                      <div className="client-avatar">
                        {client.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="client-info">
                        <div className="client-name">{client.name}</div>
                        {client.contact_person && <div className="client-contact">{client.contact_person}</div>}
                      </div>
                      <button className="ql-action-btn" onClick={() => openEdit(client)} title={t('generic', 'edit')}>
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <div className="client-details">
                      {client.address && (
                        <div className="client-detail-row flex items-center gap-2">
                          <MapPin size={14} className="text-text-muted" /> 
                          <span>{client.address}{client.city ? `, ${client.postal} ${client.city}` : ''}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="client-detail-row flex items-center gap-2">
                          <Phone size={14} className="text-text-muted" /> 
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="client-detail-row flex items-center gap-2">
                          <Mail size={14} className="text-text-muted" /> 
                          <span>{client.email}</span>
                        </div>
                      )}
                    </div>
                    {client.notes && (
                      <div className="client-notes">{client.notes}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />

      {/* Client Form Modal / Bottom Sheet */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className="cp-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />
            <div className="fixed inset-0 z-[100] flex items-center sm:items-center justify-center items-end pointer-events-none">
              <motion.div
                className="client-form-panel clay-card pointer-events-auto"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              >
              <div className="client-form-header">
                <h2>{editingClient ? t('clients', 'editClient') : t('clients', 'newClient')}</h2>
                <button className="ql-action-btn" onClick={() => setShowForm(false)}>✕</button>
              </div>

              <div className="client-form-grid">
                <div className="config-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="config-label">{t('clients', 'name')}</label>
                  <input className="clay-input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Régie Immobilière SA" />
                </div>
                <div className="config-field">
                  <label className="config-label">{t('clients', 'contact')}</label>
                  <input className="clay-input w-full" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="M. Dupont" />
                </div>
                <div className="config-field">
                  <label className="config-label">{t('clients', 'phone')}</label>
                  <input className="clay-input w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+41 22 000 00 00" />
                </div>
                <div className="config-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="config-label">{t('clients', 'email')}</label>
                  <input className="clay-input w-full" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="contact@exemple.ch" />
                </div>
                <div className="config-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="config-label">{t('clients', 'address')}</label>
                  <input className="clay-input w-full" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rue de la Paix 1" />
                </div>
                <div className="config-field">
                  <label className="config-label">{t('clients', 'postal')}</label>
                  <input className="clay-input w-full" value={form.postal} onChange={e => setForm(f => ({ ...f, postal: e.target.value }))} placeholder="1207" />
                </div>
                <div className="config-field">
                  <label className="config-label">{t('clients', 'city')}</label>
                  <input className="clay-input w-full" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Genève" />
                </div>
                <div className="config-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="config-label">{t('clients', 'notes')}</label>
                  <textarea className="clay-input w-full" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div className="client-form-actions">
                <button className="clay-button" onClick={() => setShowForm(false)}>{t('generic', 'cancel')}</button>
                <button className="clay-button clay-button--primary" onClick={submit} disabled={submitting}>
                  {submitting ? t('clients', 'saving') : editingClient ? t('clients', 'updateClient') : t('clients', 'createClient')}
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
