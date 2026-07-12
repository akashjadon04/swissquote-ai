'use client';

import React, { useEffect, useState } from 'react';
import { formatCHF } from '@/lib/financial';

interface QuoteData {
  quote_number: string;
  client_name: string;
  client_address: string;
  client_postal: string;
  client_city: string;
  client_contact: string;
  building_address: string;
  apartment_zone: string;
  subject_line: string;
  created_at: string;
  sections: Array<{
    section_code?: string;
    section_label: string;
    description: string;
    items: Array<{
      description: string;
      specification: string;
      quantity: number;
      unit: string;
      unit_price: number;
      line_total: number;
    }>;
  }>;
  total_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_incl_vat: number;
  exclusions: string[];
}

export default function PrintQuotePage({ params }: { params: { id: string } }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch quote data
    fetch(`/api/quotes/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setQuote(data);
        setLoading(false);
        // Delay print slightly to ensure render
        setTimeout(() => window.print(), 500);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement du devis pour impression...</div>;
  }

  if (!quote) {
    return <div className="p-8 text-center text-red-500">Devis introuvable.</div>;
  }

  const createdDate = new Date(quote.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white min-h-screen text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="max-w-[21cm] mx-auto p-12 print:p-0">
        
        {/* Header: Company Logo (Left) and Client Address (Right) */}
        <div className="flex justify-between items-start mb-16">
          <div className="w-1/2">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">AstraQuote</h1>
            <p className="text-sm text-gray-600 font-medium mb-1">by Green AI Groupe</p>
            <p className="text-sm text-gray-600">
              Rue de l'Artisanat 42<br />
              1200 Genève<br />
              info@astraquote.ch<br />
              IDE: CHE-123.456.789 TVA
            </p>
          </div>
          <div className="w-1/2 flex justify-end">
            <div className="text-right border-l-2 border-blue-100 pl-6">
              <h2 className="text-xl font-bold mb-1">{quote.client_name || 'Client non spécifié'}</h2>
              {quote.client_contact && <p className="mb-1 text-gray-700">Attn: {quote.client_contact}</p>}
              <p className="text-gray-700">
                {quote.client_address}<br />
                {quote.client_postal} {quote.client_city}
              </p>
            </div>
          </div>
        </div>

        {/* Quote Meta */}
        <div className="mb-12">
          <div className="flex justify-between items-end border-b-2 border-gray-800 pb-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Devis</h1>
              <p className="text-gray-500 mt-1">N° {quote.quote_number}</p>
            </div>
            <div className="text-right text-gray-600">
              <p>Genève, le {createdDate}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-bold text-gray-800 mb-2">Concerne :</h3>
            <p className="text-lg text-blue-900 font-medium">
              {quote.subject_line || 'Travaux de plomberie et sanitaire'}
            </p>
            {quote.building_address && (
              <p className="text-gray-600 mt-1">
                📍 Bâtiment: {quote.building_address} {quote.apartment_zone ? ` - ${quote.apartment_zone}` : ''}
              </p>
            )}
          </div>
          
          <p className="mb-8">
            Madame, Monsieur,<br /><br />
            Suite à notre visite, nous avons le plaisir de vous soumettre notre meilleure offre pour l'exécution des travaux mentionnés sous rubrique :
          </p>
        </div>

        {/* Quote Items Table */}
        <div className="mb-12">
          {quote.sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-8 break-inside-avoid">
              <h3 className="text-xl font-bold text-gray-800 mb-2 border-b border-gray-300 pb-2">
                {section.section_code && <span className="text-blue-600 mr-2">{section.section_code}</span>}
                {section.section_label || 'Travaux'}
              </h3>
              {section.description && (
                <p className="text-gray-600 text-sm mb-4 italic">{section.description}</p>
              )}
              
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-500">
                    <th className="text-left py-2 font-medium w-12">Pos.</th>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium w-16">Qté</th>
                    <th className="text-right py-2 font-medium w-24">Prix Uni.</th>
                    <th className="text-right py-2 font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, iIdx) => (
                    <tr key={iIdx} className="border-b border-gray-100">
                      <td className="py-3 align-top text-gray-500">{iIdx + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-800">{item.description}</div>
                        {item.specification && <div className="text-xs text-gray-500 mt-1">{item.specification}</div>}
                      </td>
                      <td className="py-3 text-right align-top">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right align-top text-gray-600">{item.unit_price ? formatCHF(item.unit_price) : '-'}</td>
                      <td className="py-3 text-right align-top font-medium">{item.line_total ? formatCHF(item.line_total) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16 break-inside-avoid">
          <div className="w-1/2 border-t-2 border-gray-800 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total net (HT)</span>
              <span>{formatCHF(quote.total_excl_vat || 0)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">TVA ({(quote.vat_rate * 100).toFixed(1)}%)</span>
              <span>{formatCHF(quote.vat_amount || 0)}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-lg">Total TTC</span>
              <span className="font-bold text-xl text-blue-900">{formatCHF(quote.total_incl_vat || 0)}</span>
            </div>
          </div>
        </div>

        {/* Exclusions & Footer */}
        {quote.exclusions && quote.exclusions.length > 0 && (
          <div className="mb-12 break-inside-avoid text-sm">
            <h4 className="font-bold text-gray-800 mb-2">Sont exclus de notre offre :</h4>
            <ul className="list-disc pl-5 text-gray-600">
              {quote.exclusions.map((exc, idx) => (
                <li key={idx} className="mb-1">{exc}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-20 pt-8 border-t border-gray-200 text-sm text-gray-500 flex justify-between break-inside-avoid">
          <div>
            <p>Conditions de paiement : 30 jours net</p>
            <p>Validité de l'offre : 3 mois</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-800 mb-8">La direction</p>
            <p className="border-t border-gray-400 pt-2 w-48 ml-auto">Signature</p>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0;
            padding: 0;
          }
          /* Hide everything outside the print component */
          body > *:not(main) {
            display: none !important;
          }
          .clay-card, .clay-btn {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}
