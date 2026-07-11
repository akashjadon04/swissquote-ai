export const SUPPLIERS = {
  NSB: { code: 'NSB', name: 'Nussbaum' },
  ST: { code: 'ST', name: 'Sanitas Troesch' },
  GM: { code: 'GM', name: 'Getaz Miauton' },
};

export const MOCK_CATALOGUE = [
  // ─── NUSSBAUM (Optipress & Tubes) — Format: NSB-XXXX-XX ───
  { id: 'nsb-1', supplier: SUPPLIERS.NSB, reference: 'NSB-5291-12', name: 'Tuyau acier inox 1.4521 Optipress Ø 12 mm', category: 'tuyau_inox', specification: 'Ø 12 mm', active: true, unit: 'm', base_price: 31.39 },
  { id: 'nsb-2', supplier: SUPPLIERS.NSB, reference: 'NSB-5291-15', name: 'Tuyau acier inox 1.4521 Optipress Ø 15 mm', category: 'tuyau_inox', specification: 'Ø 15 mm', active: true, unit: 'm', base_price: 34.50 },
  { id: 'nsb-3', supplier: SUPPLIERS.NSB, reference: 'NSB-5291-22', name: 'Tuyau acier inox 1.4521 Optipress Ø 22 mm', category: 'tuyau_inox', specification: 'Ø 22 mm', active: true, unit: 'm', base_price: 42.10 },
  { id: 'nsb-4', supplier: SUPPLIERS.NSB, reference: 'NSB-5291-28', name: 'Tuyau acier inox 1.4521 Optipress Ø 28 mm', category: 'tuyau_inox', specification: 'Ø 28 mm', active: true, unit: 'm', base_price: 55.20 },
  { id: 'nsb-5', supplier: SUPPLIERS.NSB, reference: 'NSB-5291-54', name: 'Tuyau acier inox 1.4521 Optipress Ø 54 mm', category: 'tuyau_inox', specification: 'Ø 54 mm', active: true, unit: 'm', base_price: 112.40 },
  
  { id: 'nsb-6', supplier: SUPPLIERS.NSB, reference: 'NSB-4503-12', name: 'Coude à sertir 90° inox Optipress Ø 12 mm', category: 'coude_sertir', specification: 'Ø 12 mm', active: true, unit: 'p', base_price: 15.60 },
  { id: 'nsb-7', supplier: SUPPLIERS.NSB, reference: 'NSB-4503-15', name: 'Coude à sertir 90° inox Optipress Ø 15 mm', category: 'coude_sertir', specification: 'Ø 15 mm', active: true, unit: 'p', base_price: 18.20 },
  { id: 'nsb-8', supplier: SUPPLIERS.NSB, reference: 'NSB-4503-28', name: 'Coude à sertir 90° inox Optipress Ø 28 mm', category: 'coude_sertir', specification: 'Ø 28 mm', active: true, unit: 'p', base_price: 26.50 },
  { id: 'nsb-9', supplier: SUPPLIERS.NSB, reference: 'NSB-4503-54', name: 'Coude à sertir 90° inox Optipress Ø 54 mm', category: 'coude_sertir', specification: 'Ø 54 mm', active: true, unit: 'p', base_price: 58.90 },

  { id: 'nsb-10', supplier: SUPPLIERS.NSB, reference: 'NSB-9472-15', name: 'Manchon coulissant à sertir inox Ø 15 mm', category: 'manchon', specification: 'Ø 15 mm', active: true, unit: 'p', base_price: 12.80 },
  { id: 'nsb-11', supplier: SUPPLIERS.NSB, reference: 'NSB-9472-28', name: 'Manchon coulissant à sertir inox Ø 28 mm', category: 'manchon', specification: 'Ø 28 mm', active: true, unit: 'p', base_price: 21.40 },
  { id: 'nsb-12', supplier: SUPPLIERS.NSB, reference: 'NSB-9472-54', name: 'Manchon coulissant à sertir inox Ø 54 mm', category: 'manchon', specification: 'Ø 54 mm', active: true, unit: 'p', base_price: 49.30 },

  { id: 'nsb-13', supplier: SUPPLIERS.NSB, reference: 'NSB-8307-15', name: 'Collier de fixation isophonique Ø 15 mm avec garniture', category: 'collier', specification: 'Ø 15 mm', active: true, unit: 'p', base_price: 4.50 },
  { id: 'nsb-14', supplier: SUPPLIERS.NSB, reference: 'NSB-8307-28', name: 'Collier de fixation isophonique Ø 28 mm avec garniture', category: 'collier', specification: 'Ø 28 mm', active: true, unit: 'p', base_price: 6.20 },
  { id: 'nsb-15', supplier: SUPPLIERS.NSB, reference: 'NSB-8307-54', name: 'Collier de fixation isophonique Ø 54 mm avec garniture', category: 'collier', specification: 'Ø 54 mm', active: true, unit: 'p', base_price: 11.80 },

  // ─── SANITAS TROESCH (Robinetterie & Sanitaire) — Format: SAN.XXXXXX ───
  { id: 'st-1', supplier: SUPPLIERS.ST, reference: 'SAN.832075', name: 'Vanne de sectionnement à bille laiton filetage femelle 1/2"', category: 'robinet_vanne', specification: '1/2"', active: true, unit: 'p', base_price: 28.50 },
  { id: 'st-2', supplier: SUPPLIERS.ST, reference: 'SAN.832080', name: 'Vanne de sectionnement à bille laiton filetage femelle 3/4"', category: 'robinet_vanne', specification: '3/4"', active: true, unit: 'p', base_price: 35.20 },
  { id: 'st-3', supplier: SUPPLIERS.ST, reference: 'SAN.832095', name: 'Vanne de sectionnement à bille laiton filetage femelle 1 1/4"', category: 'robinet_vanne', specification: '1 1/4"', active: true, unit: 'p', base_price: 62.40 },
  { id: 'st-4', supplier: SUPPLIERS.ST, reference: 'SAN.114502', name: 'Robinet d\'arrêt à potence bronze filetage 3/4"', category: 'robinet_arret', specification: '3/4"', active: true, unit: 'p', base_price: 85.00 },
  { id: 'st-5', supplier: SUPPLIERS.ST, reference: 'SAN.500210', name: 'Nourrice de distribution sanitaire 4 départs 3/4" x 1/2"', category: 'nourrice', specification: '4 départs', active: true, unit: 'p', base_price: 145.00 },
  { id: 'st-6', supplier: SUPPLIERS.ST, reference: 'SAN.500215', name: 'Nourrice de distribution sanitaire 6 départs 3/4" x 1/2"', category: 'nourrice', specification: '6 départs', active: true, unit: 'p', base_price: 210.00 },
  { id: 'st-7', supplier: SUPPLIERS.ST, reference: 'SAN.900100', name: 'Siphon d\'évacuation lavabo laiton chromé 1 1/4"', category: 'siphon', specification: '1 1/4"', active: true, unit: 'p', base_price: 42.00 },

  // ─── GETAZ MIAUTON (Isolation & Divers) — Format: GM/XX/XXXX ───
  { id: 'gm-1', supplier: SUPPLIERS.GM, reference: 'GM/24/4654', name: 'Coquille isolante PIR épaisseur 30mm pour tube Ø 15 mm', category: 'isolation_coquille', specification: 'Ø 15 mm / 30mm', active: true, unit: 'm', base_price: 12.50 },
  { id: 'gm-2', supplier: SUPPLIERS.GM, reference: 'GM/24/4656', name: 'Coquille isolante PIR épaisseur 30mm pour tube Ø 22 mm', category: 'isolation_coquille', specification: 'Ø 22 mm / 30mm', active: true, unit: 'm', base_price: 15.80 },
  { id: 'gm-3', supplier: SUPPLIERS.GM, reference: 'GM/24/4658', name: 'Coquille isolante PIR épaisseur 30mm pour tube Ø 28 mm', category: 'isolation_coquille', specification: 'Ø 28 mm / 30mm', active: true, unit: 'm', base_price: 18.90 },
  { id: 'gm-4', supplier: SUPPLIERS.GM, reference: 'GM/24/4665', name: 'Coquille isolante PIR épaisseur 40mm pour tube Ø 54 mm', category: 'isolation_coquille', specification: 'Ø 54 mm / 40mm', active: true, unit: 'm', base_price: 32.40 },
  { id: 'gm-5', supplier: SUPPLIERS.GM, reference: 'GM/12/1005', name: 'Revêtement PVC gris pour isolation en rouleau', category: 'isolation_coquille', specification: 'Rouleau 25m', active: true, unit: 'm', base_price: 4.20 },
  { id: 'gm-6', supplier: SUPPLIERS.GM, reference: 'GM/88/2040', name: 'Mamelon double laiton fileté 1/2"', category: 'mamelon', specification: '1/2"', active: true, unit: 'p', base_price: 6.80 },
  { id: 'gm-7', supplier: SUPPLIERS.GM, reference: 'GM/88/2050', name: 'Bouchon laiton fileté mâle 3/4"', category: 'bouchon', specification: '3/4"', active: true, unit: 'p', base_price: 5.40 },
];
