import React from 'react';
import { QuoteData } from '@/store';
import { formatCHF } from '@/lib/financial';
import { Building2, Mail, Phone, Globe, MapPin, Calendar, FileText, CheckCircle, Quote as QuoteIcon, PenTool } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PremiumPDFTemplateProps {
  quote: QuoteData;
}

export const PremiumPDFTemplate = React.forwardRef<HTMLDivElement, PremiumPDFTemplateProps>(({ quote }, ref) => {
  const { t } = useTranslation();
  const currentDate = new Date().toLocaleDateString('fr-CH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div 
      ref={ref} 
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        position: 'relative',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        color: '#1a1a2e',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* 
        =========================================
        MASSIVE BACKGROUND GEOMETRY & GRAPHICS 
        =========================================
      */}
      
      {/* 1. Deep Blue Gradient Side Panel */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '20mm',
        background: 'linear-gradient(180deg, #1A365D 0%, #2563EB 50%, #3B82F6 100%)',
        zIndex: 1,
        boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.1)'
      }} />

      {/* 2. Abstract Geometric Grid Top Right */}
      <svg 
        style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', opacity: 0.05, zIndex: 0, transform: 'rotate(15deg)' }}
        viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#2563EB" d="M42.7,-73.4C55.9,-67.9,67.6,-57.4,75.3,-44.5C83,-31.6,86.7,-15.8,85.1,-0.9C83.5,14,76.5,28.1,67.4,39.9C58.3,51.7,47.1,61.3,34.2,68.2C21.3,75.1,6.8,79.3,-7.4,78.2C-21.6,77.1,-35.5,70.7,-48.5,61.8C-61.5,52.9,-73.6,41.5,-80.1,27.1C-86.6,12.7,-87.5,-4.7,-83.1,-20.9C-78.7,-37.1,-69,-52.1,-55.4,-61.7C-41.8,-71.3,-24.3,-75.5,-7.9,-75.2C8.5,-74.9,29.5,-78.9,42.7,-73.4Z" transform="translate(100 100)" />
      </svg>

      {/* 3. Subtle Hexagon Watermark Center */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        fontSize: '140px',
        fontWeight: 900,
        color: '#2563EB',
        opacity: 0.03,
        whiteSpace: 'nowrap',
        zIndex: 0,
        pointerEvents: 'none',
        letterSpacing: '20px',
        textTransform: 'uppercase'
      }}>
        AstraQuote (by Green AI Groupe)
      </div>

      {/* 
        =========================================
        FOREGROUND CONTENT CONTAINER
        =========================================
      */}
      <div style={{ padding: '25mm 20mm 25mm 35mm', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '297mm' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25mm' }}>
          
          {/* Company Branding */}
          <div style={{ maxWidth: '50%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: 'linear-gradient(135deg, #1A365D, #3B82F6)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#fff', 
                fontWeight: '900', 
                fontSize: '24px',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
              }}>
                SQ
              </div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>
                AstraQuote <span style={{ color: '#3B82F6' }}>AI</span>
              </h1>
            </div>
            
            <div style={{ paddingLeft: '4px', borderLeft: '2px solid #E2E8F0' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <Building2 size={14} color="#3B82F6"/> {quote.companyName}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="#3B82F6"/> {quote.companyAddress || 'Rue de l\'Innovation 1, 1201 Genève'}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#3B82F6"/> +41 22 123 45 67
              </p>
              <p style={{ margin: '0 0 0 0', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} color="#3B82F6"/> www.AstraQuote-ai.ch
              </p>
            </div>
          </div>

          {/* Quote Meta Block */}
          <div style={{ textAlign: 'right', width: '220px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '42px', fontWeight: 900, color: '#1A365D', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {t('quoteWizard', 'devis')}
            </h2>
            
            <div style={{ 
              background: '#F8FAFC', 
              borderRadius: '12px', 
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Référence</span>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 800, fontFamily: 'monospace' }}>{quote.id ? quote.id.split('-')[0].toUpperCase() : 'BROUILLON'}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Date</span>
                <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 600 }}>{currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CLIENT & PROJECT INFO GRID */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20mm' }}>
          
          {/* Client Details */}
          <div style={{ flex: 1, background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#3B82F6', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Informations Client
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{quote.clientName}</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>
                <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  {quote.clientAddress}
                  {(quote.clientPostal || quote.clientCity) && <br />}
                  {quote.clientPostal} {quote.clientCity}
                </span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#1A365D', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Détails du Projet
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: '1.4' }}>
                {quote.subjectLine}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#64748b', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} /> {quote.buildingAddress}
                </span>
                {quote.apartmentZone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {quote.apartmentZone}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ARTICLES & FINANCIAL TABLES */}
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#1A365D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #3B82F6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Détail des Prestations
          </h3>

          {quote.sections.map((section, sIdx) => (
            <div key={section.id} style={{ marginBottom: '25px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              {/* Section Header */}
              <div style={{ background: '#F1F5F9', padding: '12px 15px', borderBottom: '2px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                  {sIdx + 1}. {section.sectionCode ? `${section.sectionCode} - ` : ''}{section.sectionLabel}
                </h4>
              </div>

              {/* Advanced Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '15%' }}>{t('catalogue', 'columns.reference')}</th>
                    <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '40%' }}>{t('catalogue', 'columns.description')}</th>
                    <th style={{ padding: '10px 15px', textAlign: 'center', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '15%' }}>{t('catalogue', 'columns.quantity')}</th>
                    <th style={{ padding: '10px 15px', textAlign: 'right', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '15%' }}>PU HT</th>
                    <th style={{ padding: '10px 15px', textAlign: 'right', fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '15%' }}>{t('catalogue', 'columns.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, iIdx) => (
                    <tr key={item.id} style={{ 
                      backgroundColor: iIdx % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
                      borderBottom: iIdx === section.items.length - 1 ? 'none' : '1px solid #F1F5F9',
                      transition: 'background-color 0.2s'
                    }}>
                      <td style={{ padding: '12px 15px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', verticalAlign: 'top' }}>
                        {item.reference || '—'}
                      </td>
                      <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px', lineHeight: '1.4' }}>
                          {item.description}
                        </div>
                        {item.specification && (
                          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
                            {item.specification}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px', color: '#0F172A', textAlign: 'center', verticalAlign: 'top' }}>
                        <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px', color: '#475569', textAlign: 'right', verticalAlign: 'top' }}>
                        {formatCHF(item.unitPrice || 0)}
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px', color: '#0F172A', fontWeight: 700, textAlign: 'right', verticalAlign: 'top' }}>
                        {formatCHF(item.lineTotal || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* FINANCIAL SUMMARY TOTALS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10mm', marginBottom: '20mm' }}>
          <div style={{ width: '80mm', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
              <span>Total Matière HT</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCHF((quote.financials.materialsSubtotal + quote.financials.materialsMargin) || 0)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
              <span>Total Main d'Œuvre HT</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCHF((quote.financials.labourTotal + quote.financials.travelFee) || 0)}</span>
            </div>
            
            <div style={{ height: '1px', background: '#CBD5E1', margin: '12px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              <span>Total HT</span>
              <span>{formatCHF(quote.financials.subtotalExclVat || 0)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
              <span>TVA ({(quote.financials.vatRate * 100).toFixed(1)}%)</span>
              <span>{formatCHF(quote.financials.vatAmount || 0)}</span>
            </div>
            
            {/* The Grand Total Box */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1A365D, #2563EB)', 
              color: '#fff', 
              padding: '20px', 
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total TTC
              </span>
              <span style={{ fontSize: '20px', fontWeight: 900 }}>
                {formatCHF(quote.financials.totalInclVat || 0)}
              </span>
            </div>

          </div>
        </div>

        {/* FOOTER & SIGNATURE BLOCK */}
        <div style={{ marginTop: 'auto', paddingTop: '10mm', borderTop: '2px solid #F1F5F9', position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
            {/* Legal Terms */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#1A365D', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Conditions d'acceptation
              </h4>
              <p style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.6', textAlign: 'justify' }}>
                Ce devis est valable 30 jours à compter de sa date d'émission. Les travaux débuteront après réception 
                du devis signé et versement d'un acompte de 30%. En signant ce document, le client accepte les conditions 
                générales de vente de AstraQuote (by Green AI Groupe). Tout travail supplémentaire non inclus dans ce devis fera l'objet 
                d'un avenant séparé. Le délai d'exécution estimé sera confirmé à la signature.
              </p>
            </div>
            
            {/* Signatures */}
            <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, background: '#FAFAFA', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '15px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date et Signature de l'Entreprise</span>
                <div style={{ height: '60px' }}></div>
              </div>
              <div style={{ flex: 1, background: '#FAFAFA', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '15px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date et Signature du Client</span>
                <div style={{ height: '60px' }}></div>
                <span style={{ fontSize: '8px', color: '#94A3B8', fontStyle: 'italic' }}>Précédé de la mention "Bon pour accord"</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15mm', fontSize: '9px', color: '#94A3B8' }}>
            AstraQuote (by Green AI Groupe) Sàrl • CHE-123.456.789 TVA • IBAN: CH93 0000 0000 0000 0000 0 • contact@AstraQuote-ai.ch
          </div>
        </div>

      </div>
    </div>
  );
});

PremiumPDFTemplate.displayName = 'PremiumPDFTemplate';
