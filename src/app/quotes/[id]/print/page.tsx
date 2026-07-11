'use client';

import { useEffect } from 'react';

// Mock data to simulate the Quote object
const mockQuote = {
  quoteNumber: "21648/AL/jf",
  date: "2 février 2026",
  company: {
    name: "J.J. Pallud SA",
    address: "Tronchet 8, avenue - 1226 Thonex",
  },
  client: {
    name: "S.I.CH.TRONCHET A SA",
    careOf: "p.a. Agence immobilière SCHMIDHAUSER & BORDIER",
    attention: "A l'att. de Madame Julia CONUS",
    address: "Rue du Vieux-Collège 8\nCase Postale 3056\n1211 Genève 3",
  },
  location: {
    building: "Tronchet 8, avenue - 1226 Thonex",
    apartment: "Sous-sol",
  },
  concerne: "Devis estimatif selon votre demande de devis (contre-offre) n°2026012562 du 30/01/2026.",
  intro: "Madame,\n\nNous vous remercions d'avoir bien voulu nous consulter pour cette affaire et avons l'avantage de vous soumettre, ci-après, notre meilleure offre et conditions pour la réalisation de ces travaux.",
  sections: [
    {
      id: "25",
      title: "Installations sanitaires",
      subsections: [
        {
          id: "254",
          title: "Conduites sanitaires",
          groups: [
            {
              id: "254.1",
              title: "Conduites d'eau chaude",
              subGroups: [
                {
                  id: "01",
                  title: "Distribution sous-sol",
                  descriptions: [
                    "Coupure d'eau et vidange des installations.",
                    "Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu'au sous-sol au droit de la cave n° 1.",
                    "Reprise sur la conduite d'eau chaude dans la chaufferie.",
                    "Remplacement en tuyau type Inox ø 54 mm depuis la chaufferie jusqu'à la nourrice existante.",
                    "Vidange des colonnes d'eau chaude de l'immeuble.",
                    "Remplacement des conduites horizontales en tuyau type Inox ø 28 mm, y compris raccords et fixations.",
                    "Reprise sur les pieds de colonnes.",
                    "Réfection des isolations avec finition PVC.",
                    "Remise en pression des installations.",
                  ],
                  articles: [
                    { reference: "426.264.127", description: "Tuyau acier inox 1:4521 Optipress RN 810 82 ø mm 54", quantity: 6, unit: "m", unitPrice: 45.50, total: 273.00 },
                    { reference: "426.264.124", description: "Tuyau acier inox 1:4521 Optipress RN 810 82 ø mm 28", quantity: 24, unit: "m", unitPrice: 28.00, total: 672.00 },
                    { reference: "426.264.125", description: "Tuyau acier inox 1:4521 Optipress RN 810 82 ø mm 35", quantity: 52, unit: "m", unitPrice: 32.20, total: 1674.40 },
                    { reference: "426.264.414", description: "Manchon coulissant à sertir inox Optipress RN 80022 ø mm 28", quantity: 1, unit: "p", unitPrice: 15.00, total: 15.00 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  totalHT: 2634.40,
  tvaRate: 8.1,
  tvaAmount: 213.39,
  totalTTC: 2847.79,
  exclusions: [
    "murs ou galandages, dont l'épaisseur est inférieure à 60 mm;",
    "les travaux de démontage et le traitement des éléments existants contenant de l'amiante;",
    "les percements dans les revêtements de mur en pierre (marbre - granit) et carrelage en grès (supplément de chf 30.- HT par trou).",
    "le raccordement des appareils électrique;",
    "tous les travaux non décrits,",
    "les hausses matériaux et main-d'oeuvre postérieures à la validité de notre offre,",
    "validité de l'offre : 3 mois",
  ],
};

export default function PrintQuotePage() {
  useEffect(() => {
    // Automatically trigger print dialog when the page is loaded
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const { quoteNumber, date, company, client, location, concerne, intro, sections, exclusions, totalHT, tvaRate, tvaAmount, totalTTC } = mockQuote;

  return (
    <div className="print-container clay-container min-h-screen bg-slate-50 text-gray-900 p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-start mb-12">
        <div className="company-info clay-card p-4 rounded-xl">
          <h1 className="font-bold text-xl">{company.name}</h1>
          <p className="text-sm text-gray-600">{company.address}</p>
        </div>
        <div className="client-info text-right clay-card p-4 rounded-xl min-w-[300px]">
          <p className="font-bold">{client.name}</p>
          <p>{client.careOf}</p>
          <p>{client.attention}</p>
          <p className="whitespace-pre-line mt-2">{client.address}</p>
        </div>
      </header>

      {/* Meta Info */}
      <div className="meta-info mb-8 flex justify-between border-b pb-4 border-gray-200">
        <div>
          <p><span className="font-semibold">Devis N° :</span> {quoteNumber}</p>
        </div>
        <div>
          <p>Carouge, le {date}</p>
        </div>
      </div>

      {/* Location & Concerne */}
      <div className="location-concerne mb-8">
        <div className="grid grid-cols-[120px_1fr] gap-2 mb-4">
          <span className="font-semibold">Immeuble :</span>
          <span>{location.building}</span>
          <span className="font-semibold">Appartement :</span>
          <span>{location.apartment}</span>
          <span className="font-semibold mt-2">Concerne :</span>
          <span className="mt-2 font-medium">{concerne}</span>
        </div>
        <p className="whitespace-pre-line mt-6">{intro}</p>
      </div>

      {/* Sections and Items */}
      <div className="sections mb-12">
        {sections.map((section) => (
          <div key={section.id} className="section mb-8">
            <h2 className="font-bold text-lg mb-4">{section.id} - {section.title}</h2>
            {section.subsections.map((sub) => (
              <div key={sub.id} className="subsection ml-4 mb-6">
                <h3 className="font-semibold text-md mb-2">{sub.id} - {sub.title}</h3>
                {sub.groups.map((group) => (
                  <div key={group.id} className="group ml-4 mb-4">
                    <h4 className="font-medium mb-2">{group.id} - {group.title}</h4>
                    {group.subGroups.map((sg) => (
                      <div key={sg.id} className="subgroup ml-4 mb-4">
                        <h5 className="font-medium mb-2">{sg.id} - {sg.title}</h5>
                        <ul className="list-disc ml-5 mb-4 text-sm text-gray-700">
                          {sg.descriptions.map((desc, idx) => (
                            <li key={idx}>{desc}</li>
                          ))}
                        </ul>
                        <div className="articles mt-4 overflow-x-auto">
                          <table className="w-full text-sm text-left text-gray-700 clay-table">
                            <thead className="text-xs uppercase bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2">Référence</th>
                                <th className="px-4 py-2">Désignation</th>
                                <th className="px-4 py-2 text-right">Quantité</th>
                                <th className="px-4 py-2">Unité</th>
                                <th className="px-4 py-2 text-right">Prix Unitaire</th>
                                <th className="px-4 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sg.articles.map((article, idx) => (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                  <td className="px-4 py-2">{article.reference}</td>
                                  <td className="px-4 py-2 font-medium">{article.description}</td>
                                  <td className="px-4 py-2 text-right">{article.quantity}</td>
                                  <td className="px-4 py-2">{article.unit}</td>
                                  <td className="px-4 py-2 text-right">CHF {article.unitPrice.toFixed(2)}</td>
                                  <td className="px-4 py-2 text-right">CHF {article.total.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="totals flex justify-end mb-12">
        <div className="w-64 clay-card p-4 rounded-xl">
          <div className="flex justify-between mb-2">
            <span>Total HT</span>
            <span>CHF {totalHT.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span>TVA ({tvaRate}%)</span>
            <span>CHF {tvaAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-300 font-bold text-lg">
            <span>Total TTC</span>
            <span>CHF {totalTTC.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Exclusions */}
      <div className="exclusions mt-12 pt-8 border-t border-gray-200">
        <h3 className="font-bold mb-4">Sont exclus de notre offre :</h3>
        <ul className="list-disc ml-5 text-sm text-gray-700">
          {exclusions.map((exclusion, index) => (
            <li key={index} className="mb-1">{exclusion}</li>
          ))}
        </ul>
      </div>
      
      {/* Footer Signatures */}
      <div className="signatures mt-16 flex justify-between">
        <div>
          <p className="font-semibold mb-8">Pour accord :</p>
          <div className="border-b border-gray-400 w-48"></div>
          <p className="text-xs mt-1 text-gray-500">Date et signature du client</p>
        </div>
        <div>
          <p className="font-semibold mb-8">L'entreprise :</p>
          <p className="font-bold">{company.name}</p>
        </div>
      </div>
    </div>
  );
}
