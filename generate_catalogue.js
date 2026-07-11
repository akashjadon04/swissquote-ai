const fs = require('fs');

const SUPPLIERS = {
  NSB: { code: 'NSB', name: 'Nussbaum' },
  ST: { code: 'ST', name: 'Sanitas Troesch' },
  GM: { code: 'GM', name: 'Getaz Miauton' },
};

const items = [];

const materials = [
  'Tuyau acier inox 1:4521 Optipress',
  'Tuyau de distribution',
  'Coude à sertir 90° inox',
  'Coude à sertir 45° inox',
  'Manchon coulissant à sertir inox',
  'Té à sertir inox',
  'Pièce de transition à sertir inox fileté',
  'Collier de fixation isophonique pour tube',
  'Isolation PIR + finition PVC',
  'Vanne à bille',
  'Clapet anti-retour',
  'Raccords de raccordement'
];

const diameters = ['12', '15', '18', '22', '28', '35', '42', '54', '76.1', '88.9', '108'];

let stCount = 1;
let nsbCount = 1;
let gmCount = 1;

for (let i = 0; i < materials.length; i++) {
  for (let d = 0; d < diameters.length; d++) {
    // Nussbaum
    items.push({
      id: `nsb-${nsbCount++}`,
      supplier: SUPPLIERS.NSB,
      reference: `NSB-${Math.floor(1000 + Math.random() * 9000)}-${diameters[d]}`,
      name: `${materials[i]} Ø ${diameters[d]} mm`,
      unit: materials[i].includes('Tuyau') || materials[i].includes('Isolation') ? 'm' : 'p',
      base_price: parseFloat((Math.random() * 50 + 5).toFixed(2))
    });
    // Sanitas
    items.push({
      id: `st-${stCount++}`,
      supplier: SUPPLIERS.ST,
      reference: `SAN.${Math.floor(100000 + Math.random() * 900000)}`,
      name: `${materials[i]} Ø ${diameters[d]} mm`,
      unit: materials[i].includes('Tuyau') || materials[i].includes('Isolation') ? 'm' : 'p',
      base_price: parseFloat((Math.random() * 50 + 5).toFixed(2))
    });
    // Getaz
    items.push({
      id: `gm-${gmCount++}`,
      supplier: SUPPLIERS.GM,
      reference: `GM/${Math.floor(10 + Math.random() * 90)}/${Math.floor(1000 + Math.random() * 9000)}`,
      name: `${materials[i]} Ø ${diameters[d]} mm`,
      unit: materials[i].includes('Tuyau') || materials[i].includes('Isolation') ? 'm' : 'p',
      base_price: parseFloat((Math.random() * 50 + 5).toFixed(2))
    });
  }
}

// Add some more variations to reach 1000+
const generic = ['Pompe de circulation', 'Vase d\'expansion', 'Soupape de sécurité', 'Manomètre', 'Thermomètre', 'Filtre à impuretés', 'Désemboueur', 'Purgeur automatique'];
const sizes = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', 'DN 15', 'DN 20', 'DN 25', 'DN 32', 'DN 40', 'DN 50'];

for (let i = 0; i < generic.length; i++) {
  for (let s = 0; s < sizes.length; s++) {
    for (let j = 0; j < 5; j++) { // 5 variants per size
      items.push({
        id: `nsb-${nsbCount++}`,
        supplier: SUPPLIERS.NSB,
        reference: `NSB-GEN-${Math.floor(1000 + Math.random() * 9000)}`,
        name: `${generic[i]} ${sizes[s]} type ${j}`,
        unit: 'p',
        base_price: parseFloat((Math.random() * 200 + 20).toFixed(2))
      });
      items.push({
        id: `st-${stCount++}`,
        supplier: SUPPLIERS.ST,
        reference: `SAN.GEN.${Math.floor(100000 + Math.random() * 900000)}`,
        name: `${generic[i]} ${sizes[s]} modèle ${j}`,
        unit: 'p',
        base_price: parseFloat((Math.random() * 200 + 20).toFixed(2))
      });
      items.push({
        id: `gm-${gmCount++}`,
        supplier: SUPPLIERS.GM,
        reference: `GM/GN/${Math.floor(1000 + Math.random() * 9000)}`,
        name: `${generic[i]} ${sizes[s]} variante ${j}`,
        unit: 'p',
        base_price: parseFloat((Math.random() * 200 + 20).toFixed(2))
      });
    }
  }
}

const fileContent = `export const SUPPLIERS = {
  NSB: { code: 'NSB', name: 'Nussbaum' },
  ST: { code: 'ST', name: 'Sanitas Troesch' },
  GM: { code: 'GM', name: 'Getaz Miauton' },
};

export const MOCK_CATALOGUE = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync('src/lib/catalogueData.ts', fileContent);
console.log('Generated ' + items.length + ' items');
