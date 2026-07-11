
const fs = require("fs");

const nsbMaterials = ["Tuyau acier inox 1.4521 Optipress", "Coude 90° à sertir inox", "Coude 45° à sertir inox", "Manchon à sertir inox", "Manchon de réduction inox", "Té à sertir inox", "Collier de fixation isophonique", "Coquille isolante en PIR avec gaine PVC"];
const stMaterials = ["Tube cuivre en barre écroui", "Coude 90° cuivre à souder", "Manchon cuivre à souder", "Raccord de transition bronze/cuivre", "Té cuivre à souder", "Vanne à bille laiton", "Collier simple M8"];
const gmMaterials = ["Tube multicouche PE-Xc/Al/PE-Xc", "Coude 90° à sertir multicouche", "Té égal à sertir multicouche", "Raccord droit à sertir multicouche", "Distributeur sanitaire laiton", "Vanne de sectionnement", "Isolation tubulaire mousse PE"];

const dims = ["12", "15", "18", "22", "28", "35", "42", "54"];
const gmDims = ["16", "20", "26", "32", "40", "50", "63"];

let catalogue = `export const SUPPLIERS = {
  NSB: { code: "NSB", name: "Nussbaum" },
  ST: { code: "ST", name: "Sanitas Troesch" },
  GM: { code: "GM", name: "Getaz Miauton" },
};

export const MOCK_CATALOGUE = [
`;

let items = [];
let idCount = 1;

// Nussbaum (NSB-XXXX-XX)
nsbMaterials.forEach((mat, i) => {
  dims.forEach((d) => {
    const ref = `NSB-${Math.floor(Math.random() * 9000) + 1000}-${d}`;
    let cat = mat.toLowerCase().includes("tuyau") || mat.toLowerCase().includes("tube") ? "tuyau_inox" : mat.toLowerCase().includes("coude") ? "coude_sertir" : "autre";
    let unit = mat.toLowerCase().includes("tuyau") || mat.toLowerCase().includes("coquille") ? "m" : "p";
    let basePrice = (Math.random() * 30 + 5).toFixed(2);
    
    items.push(`  {
    "id": "nsb-${idCount++}",
    "supplier": { "code": "NSB", "name": "Nussbaum" },
    "reference": "${ref}",
    "name": "${mat} Ø ${d} mm",
    "category": "${cat}",
    "specification": "Ø ${d} mm",
    "active": true,
    "unit": "${unit}",
    "base_price": ${basePrice}
  }`);
  });
});

// Sanitas Troesch (SAN.XXXXXX)
stMaterials.forEach((mat, i) => {
  dims.forEach((d) => {
    const ref = `SAN.${Math.floor(Math.random() * 900000) + 100000}`;
    let cat = "autre";
    let unit = mat.toLowerCase().includes("tube") ? "m" : "p";
    let basePrice = (Math.random() * 20 + 2).toFixed(2);
    
    items.push(`  {
    "id": "st-${idCount++}",
    "supplier": { "code": "ST", "name": "Sanitas Troesch" },
    "reference": "${ref}",
    "name": "${mat} Ø ${d} mm",
    "category": "${cat}",
    "specification": "Ø ${d} mm",
    "active": true,
    "unit": "${unit}",
    "base_price": ${basePrice}
  }`);
  });
});

// Getaz Miauton (GM/XX/XXXX)
gmMaterials.forEach((mat, i) => {
  gmDims.forEach((d) => {
    const ref = `GM/${Math.floor(Math.random() * 90) + 10}/${Math.floor(Math.random() * 9000) + 1000}`;
    let cat = "autre";
    let unit = mat.toLowerCase().includes("tube") || mat.toLowerCase().includes("isolation") ? "m" : "p";
    let basePrice = (Math.random() * 15 + 2).toFixed(2);
    
    items.push(`  {
    "id": "gm-${idCount++}",
    "supplier": { "code": "GM", "name": "Getaz Miauton" },
    "reference": "${ref}",
    "name": "${mat} Ø ${d} mm",
    "category": "${cat}",
    "specification": "Ø ${d} mm",
    "active": true,
    "unit": "${unit}",
    "base_price": ${basePrice}
  }`);
  });
});

catalogue += items.join(",\n") + "\n];\n";

fs.writeFileSync("C:/Users/Akash/Projects/swissquote-ai/src/lib/catalogueData.ts", catalogue);
console.log("Catalogue generated with " + items.length + " items.");

