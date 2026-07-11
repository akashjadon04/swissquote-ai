export const SUPPLIERS = {
  NSB: { code: 'NSB', name: 'Nussbaum' },
  ST: { code: 'ST', name: 'Sanitas Troesch' },
  GM: { code: 'GM', name: 'Getaz Miauton' },
};

export const MOCK_CATALOGUE = [
  // Nussbaum (format: NSB-XXXX-YY)
  { id: 'nsb-1', supplier: SUPPLIERS.NSB, reference: 'NSB-8108-54', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 24.50 },
  { id: 'nsb-2', supplier: SUPPLIERS.NSB, reference: 'NSB-8108-28', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 12.30 },
  { id: 'nsb-3', supplier: SUPPLIERS.NSB, reference: 'NSB-8108-35', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 16.80 },
  { id: 'nsb-4', supplier: SUPPLIERS.NSB, reference: 'NSB-8002-28', name: 'Manchon coulissant à sertir inox Optipress RN 80022 Ø mm 28', unit: 'p', base_price: 14.10 },
  { id: 'nsb-5', supplier: SUPPLIERS.NSB, reference: 'NSB-8000-54', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 42.00 },
  { id: 'nsb-6', supplier: SUPPLIERS.NSB, reference: 'NSB-8003-54', name: 'Pièce de transition à sertir inox fileté mâle 1/2" à 2" Optipress RN 80035 Ø mm 54', unit: 'p', base_price: 55.20 },
  { id: 'nsb-7', supplier: SUPPLIERS.NSB, reference: 'NSB-5704-28', name: 'Pièce de transition à sertir sur tuyaux acier paroi épaisse 1/2"-2" Optipress RN 57040 Ø mm 28-1"', unit: 'p', base_price: 32.50 },
  { id: 'nsb-8', supplier: SUPPLIERS.NSB, reference: 'NSB-8000-28', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 28', unit: 'p', base_price: 18.50 },
  { id: 'nsb-9', supplier: SUPPLIERS.NSB, reference: 'NSB-9010-00', name: 'Collier de fixation isophonique pour tube Ø 28 mm', unit: 'p', base_price: 4.20 },
  { id: 'nsb-10', supplier: SUPPLIERS.NSB, reference: 'NSB-9010-54', name: 'Collier de fixation isophonique pour tube Ø 54 mm', unit: 'p', base_price: 6.80 },
  { id: 'nsb-11', supplier: SUPPLIERS.NSB, reference: 'NSB-4983-30', name: 'Isolation PIR + finition PVC épaisseur 30 mm', unit: 'm', base_price: 9.80 },
  
  // Sanitas Troesch (format: SAN.XXXXXX)
  { id: 'st-1', supplier: SUPPLIERS.ST, reference: 'SAN.426264', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 26.00 },
  { id: 'st-2', supplier: SUPPLIERS.ST, reference: 'SAN.426228', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 13.00 },
  { id: 'st-3', supplier: SUPPLIERS.ST, reference: 'SAN.426235', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 17.50 },
  { id: 'st-4', supplier: SUPPLIERS.ST, reference: 'SAN.426414', name: 'Manchon coulissant à sertir inox Optipress RN 80022 Ø mm 28', unit: 'p', base_price: 15.00 },
  { id: 'st-5', supplier: SUPPLIERS.ST, reference: 'SAN.426207', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 45.00 },
  { id: 'st-6', supplier: SUPPLIERS.ST, reference: 'SAN.498116', name: 'Isolation PIR + PVC épaisseur 30 mm DN mm 40', unit: 'm', base_price: 9.80 },
  { id: 'st-7', supplier: SUPPLIERS.ST, reference: 'SAN.498115', name: 'Isolation PIR + PVC épaisseur 30 mm DN mm 32', unit: 'm', base_price: 8.50 },
  { id: 'st-8', supplier: SUPPLIERS.ST, reference: 'SAN.101028', name: 'Collier de fixation isophonique pour tube Ø 28 mm', unit: 'p', base_price: 4.50 },

  // Getaz Miauton (format: GM/XX/YYYY)
  { id: 'gm-1', supplier: SUPPLIERS.GM, reference: 'GM/42/6264', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 23.50 },
  { id: 'gm-2', supplier: SUPPLIERS.GM, reference: 'GM/42/6228', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 11.90 },
  { id: 'gm-3', supplier: SUPPLIERS.GM, reference: 'GM/42/6235', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 15.90 },
  { id: 'gm-4', supplier: SUPPLIERS.GM, reference: 'GM/42/0054', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 41.00 },
  { id: 'gm-5', supplier: SUPPLIERS.GM, reference: 'GM/49/8332', name: 'Isolation PIR + PVC épaisseur 30 mm DN mm 40', unit: 'm', base_price: 9.50 },
  { id: 'gm-6', supplier: SUPPLIERS.GM, reference: 'GM/49/8330', name: 'Isolation PIR + PVC épaisseur 30 mm DN mm 32', unit: 'm', base_price: 8.20 },
  { id: 'gm-7', supplier: SUPPLIERS.GM, reference: 'GM/10/1028', name: 'Collier de fixation isophonique pour tube Ø 28 mm', unit: 'p', base_price: 4.00 }
];
