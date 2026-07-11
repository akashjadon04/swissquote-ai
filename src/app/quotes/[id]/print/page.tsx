'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCHF, formatAmount } from '@/lib/financial';

interface QuoteItem {
  id: string;
  reference: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  line_total: number | null;
  sort_order: number;
}

interface QuoteSection {
  id: string;
  section_code: string | null;
  section_label: string | null;
  description: string | null;
  sort_order: number;
  items: QuoteItem[];
}

interface FullQuote {
  quote_number: string;
  client_name: string | null;
  client_address: string | null;
  client_postal: string | null;
  client_city: string | null;
  client_contact: string | null;
  building_address: string | null;
  apartment_zone: string | null;
  subject_line: string | null;
  original_description: string | null;
  canton: string | null;
  materials_subtotal: number | null;
  materials_margin: number | null;
  labour_hours: number | null;
  labour_rate: number | null;
  labour_total: number | null;
  travel_fee: number | null;
  subtotal_excl_vat: number | null;
  vat_rate: number | null;
  vat_amount: number | null;
  total_incl_vat: number | null;
  exclusions: string[] | null;
  company_name: string | null;
  sections: QuoteSection[];
  created_at: string;
}

export default function PrintQuotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<FullQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (!res.ok) throw new Error('Quote not found');
      const data = await res.json();
      setQuote(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    if (quote && !loading) {
      // Trigger print after a short delay so fonts and styles load
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [quote, loading]);

  if (loading) return <div className="p-8 text-center text-gray-500">Génération du document en cours...</div>;
  if (error || !quote) return <div className="p-8 text-center text-red-500">Erreur lors du chargement du devis.</div>;

  const dateStr = new Date(quote.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Safe defaults for math
  const tvaRate = quote.vat_rate || 8.1;

  return (
    <div className="print-container bg-white text-gray-900 font-sans mx-auto max-w-5xl" style={{ fontSize: '12pt', lineHeight: 1.5 }}>
      {/* ─── Header ─── */}
      <header className="flex justify-between items-start mb-16 pt-8 px-8">
        <div className="company-info w-1/2">
          <h1 className="font-bold text-2xl tracking-tight mb-2">{quote.company_name || 'J.J. Pallud SA'}</h1>
          <p className="text-gray-600">Tronchet 8, avenue - 1226 Thonex</p>
        </div>
        
        <div className="client-info w-1/2 pl-12">
          <div className="font-bold text-lg mb-1">{quote.client_name || 'Client non renseigné'}</div>
          {quote.client_contact && <div className="mb-1">A l'att. de {quote.client_contact}</div>}
          <div className="whitespace-pre-line leading-snug">
            {quote.client_address}
            {quote.client_postal && quote.client_city ? `\n${quote.client_postal} ${quote.client_city}` : ''}
          </div>
        </div>
      </header>

      <main className="px-8 pb-16">
        {/* ─── Meta ─── */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-gray-900 pb-2">
          <div className="font-semibold text-xl">Devis N° {quote.quote_number}</div>
          <div>Thônex, le {dateStr}</div>
        </div>

        {/* ─── Concerne / Objet ─── */}
        <div className="mb-8">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-32 font-bold align-top">Chantier:</td>
                <td className="align-top font-medium">{quote.building_address} {quote.apartment_zone ? ` - ${quote.apartment_zone}` : ''}</td>
              </tr>
              {quote.subject_line && (
                <tr>
                  <td className="w-32 font-bold align-top pt-2">Concerne:</td>
                  <td className="align-top font-medium pt-2 italic">{quote.subject_line}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-12 text-justify">
          Madame, Monsieur,
          <br /><br />
          Nous vous remercions d'avoir bien voulu nous consulter pour cette affaire et avons l'avantage de vous soumettre, ci-après, notre offre détaillée pour la réalisation de ces travaux.
        </div>

        {/* ─── Articles Table ─── */}
        <div className="articles-section mb-12">
          {quote.sections.sort((a, b) => a.sort_order - b.sort_order).map((section, sIdx) => (
            <div key={section.id} className="mb-8 keep-together">
              <h2 className="font-bold text-lg mb-4 text-gray-900 border-b border-gray-300 pb-1">
                {section.section_code ? `${section.section_code} ` : ''}{section.section_label || `Section ${sIdx + 1}`}
              </h2>
              {section.description && <p className="text-gray-600 mb-4 italic text-sm">{section.description}</p>}
              
              <table className="w-full text-left mb-4">
                <thead>
                  <tr className="border-b border-gray-300 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="py-2 w-32 font-semibold">Référence</th>
                    <th className="py-2 font-semibold">Désignation</th>
                    <th className="py-2 w-16 text-right font-semibold">Qté</th>
                    <th className="py-2 w-16 text-center font-semibold">Unité</th>
                    <th className="py-2 w-24 text-right font-semibold">Prix Unit.</th>
                    <th className="py-2 w-28 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {section.items.sort((a, b) => a.sort_order - b.sort_order).map((item) => (
                    <tr key={item.id} className="border-b border-gray-100/50 hover:bg-gray-50/50">
                      <td className="py-2 font-mono text-xs text-gray-600 align-top">{item.reference || 'N/A'}</td>
                      <td className="py-2 align-top pr-4">{item.description}</td>
                      <td className="py-2 text-right align-top">{item.quantity || 0}</td>
                      <td className="py-2 text-center align-top">{item.unit || '-'}</td>
                      <td className="py-2 text-right align-top">{item.unit_price ? formatAmount(item.unit_price) : '-'}</td>
                      <td className="py-2 text-right align-top font-medium">{item.line_total ? formatAmount(item.line_total) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* ─── Financial Summary ─── */}
        <div className="financial-summary flex justify-end mb-16 keep-together">
          <div className="w-80">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Matériel (sous-total)</td>
                  <td className="py-1 text-right">{formatCHF(quote.materials_subtotal || 0)}</td>
                </tr>
                {quote.materials_margin ? (
                  <tr>
                    <td className="py-1 text-gray-600">Marge matériaux</td>
                    <td className="py-1 text-right">{formatCHF(quote.materials_margin || 0)}</td>
                  </tr>
                ) : null}
                {quote.labour_total ? (
                  <tr>
                    <td className="py-1 text-gray-600">Main-d'œuvre ({quote.labour_hours}h à {quote.labour_rate}/h)</td>
                    <td className="py-1 text-right">{formatCHF(quote.labour_total || 0)}</td>
                  </tr>
                ) : null}
                {quote.travel_fee ? (
                  <tr>
                    <td className="py-1 text-gray-600">Frais de déplacement</td>
                    <td className="py-1 text-right">{formatCHF(quote.travel_fee || 0)}</td>
                  </tr>
                ) : null}
                <tr className="border-t border-gray-300 font-bold">
                  <td className="py-2 pt-3">Montant net HT</td>
                  <td className="py-2 pt-3 text-right">{formatCHF(quote.subtotal_excl_vat || 0)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">TVA {tvaRate}%</td>
                  <td className="py-1 text-right">{formatCHF(quote.vat_amount || 0)}</td>
                </tr>
                <tr className="border-t-2 border-gray-900 font-bold text-lg">
                  <td className="py-3">TOTAL TTC</td>
                  <td className="py-3 text-right">{formatCHF(quote.total_incl_vat || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Exclusions ─── */}
        {quote.exclusions && quote.exclusions.length > 0 && (
          <div className="exclusions keep-together border border-gray-300 rounded p-6 bg-gray-50/50">
            <h3 className="font-bold mb-3 uppercase text-sm tracking-widest text-gray-500">Ne sont pas compris dans cette offre</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {quote.exclusions.map((exclusion, i) => (
                <li key={i}>{exclusion}</li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Global Print Styles to force styling and page breaks */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
          }
          .keep-together {
            page-break-inside: avoid;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}} />
    </div>
  );
}
