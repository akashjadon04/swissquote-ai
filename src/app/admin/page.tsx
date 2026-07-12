
import React from "react";
import Link from "next/link";
import { TopBar, Sidebar, MobileBottomNav } from "@/components/layout/Sidebar";
import { FileText, CheckCircle, Edit2, DollarSign } from "lucide-react";
import { formatCHF } from "@/lib/financial";

export default function AdminDashboardPage() {
  const fakeStats = { total: 12, draft: 3, finalized: 6, revenue: 257651.25 };
  const fakeQuotes = [
    { id: "1", quote_number: "Q-2024-001", status: "finalized", client_name: "Rolex SA", building_address: "Rue François-Dussaud 3, 1211 Genève", created_at: new Date().toISOString(), total_incl_vat: 145000.50, has_missing_items: false },
    { id: "2", quote_number: "Q-2024-002", status: "sent", client_name: "Patek Philippe", building_address: "Chemin du Pont-du-Centenaire 141, 1228 Plan-les-Ouates", created_at: new Date(Date.now() - 86400000).toISOString(), total_incl_vat: 89250.00, has_missing_items: false },
    { id: "3", quote_number: "Q-2024-003", status: "review", client_name: "Clinique La Colline", building_address: "Avenue de la Roseraie 76, 1205 Geneve", created_at: new Date(Date.now() - 172800000).toISOString(), total_incl_vat: 23400.75, has_missing_items: true },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Tableau de bord administrateur (Demo)" />
        <div className="page-content">
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 font-medium">
            Attention: Ces données sont simulées pour la démonstration.
          </div>
          <div className="stats-bar">
            <div className="stat-card clay-card"><div className="stat-icon"><FileText size={20}/></div><div className="stat-info"><p>Devis en cours</p><h3>{fakeStats.total}</h3></div></div>
            <div className="stat-card clay-card"><div className="stat-icon"><CheckCircle size={20}/></div><div className="stat-info"><p>Taux de conversion</p><h3>50%</h3></div></div>
            <div className="stat-card clay-card"><div className="stat-icon"><Edit2 size={20}/></div><div className="stat-info"><p>Pipeline</p><h3>{fakeStats.total - fakeStats.draft - fakeStats.finalized}</h3></div></div>
            <div className="stat-card clay-card"><div className="stat-icon"><DollarSign size={20}/></div><div className="stat-info"><p>Chiffre d'Affaires (YTD)</p><h3>{formatCHF(fakeStats.revenue)}</h3></div></div>
          </div>
          <div className="recent-section mt-8">
            <div className="section-header"><h2>Devis Récents (Simulation)</h2></div>
            <div className="quote-list">
              {fakeQuotes.map((quote) => (
                <div key={quote.id} className="quote-card clay-card">
                  <div className="quote-header">
                    <span className="quote-number">{quote.quote_number}</span>
                    <span className={`status-badge ${quote.status}`}>{quote.status}</span>
                  </div>
                  <h3 className="quote-client">{quote.client_name}</h3>
                  <p className="quote-address">{quote.building_address}</p>
                  <div className="quote-footer">
                    <span className="quote-date">{new Date(quote.created_at).toLocaleDateString("fr-CH")}</span>
                    <span className="quote-total font-bold">{formatCHF(quote.total_incl_vat)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
