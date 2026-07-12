
const fs = require("fs");
const suppliers = [
  { code: "NSB", name: "Nussbaum" },
  { code: "ST", name: "Sanitas Troesch" },
  { code: "GM", name: "Getaz Miauton" },
  { code: "GEB", name: "Geberit" },
  { code: "HVL", name: "Hoval" },
  { code: "SRV", name: "Service Interne" }
];

const categories = [
  "tuyau_inox", "coude_sertir", "te_sertir", "reduction", "vanne", 
  "pompe_chaleur", "radiateur", "thermostat", "lavabo", "wc",
  "douche", "robinetterie", "chauffe_eau", "chaudiere", "service",
  "isolant", "fixation", "ventilation_gaine", "grille_aération"
];

const items = [];
let idCounter = 1;

function generateCategory(catName, num, priceRange, materials, sizes) {
  for (let i = 0; i < num; i++) {
    const supplier = suppliers[Math.floor(Math.random() * (suppliers.length - 1))];
    const size = sizes ? sizes[Math.floor(Math.random() * sizes.length)] : null;
    const material = materials ? materials[Math.floor(Math.random() * materials.length)] : null;
    const unit = catName === "service" ? "h" : (["tuyau_inox", "isolant", "ventilation_gaine"].includes(catName) ? "m" : "pce");
    
    let spec = "";
    if (size) spec += `${size} `;
    if (material) spec += `${material}`;
    
    let name = `${catName.replace("_", " ")} ${spec}`.trim();
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    const price = priceRange[0] + Math.random() * (priceRange[1] - priceRange[0]);
    
    const attr = {};
    if (size && typeof size === "number") attr.diameter_mm = size;
    if (material) attr.material = material;
    
    items.push({
      id: `${supplier.code.toLowerCase()}-${catName}-${idCounter++}`,
      supplier: { code: supplier.code, name: supplier.name },
      reference: `${supplier.code}-${Math.floor(1000 + Math.random()*9000)}-${size || "X"}`,
      name: name,
      category: catName,
      specification: spec || null,
      active: true,
      unit: unit,
      base_price: parseFloat(price.toFixed(2)),
      attributes: attr
    });
  }
}

// Generate realistic items
generateCategory("tuyau_inox", 200, [10, 80], ["1.4401", "1.4521"], [12, 15, 18, 22, 28, 35, 42, 54, 76, 89, 108]);
generateCategory("coude_sertir", 200, [5, 40], ["Inox", "Cuivre", "Bronze"], [12, 15, 18, 22, 28, 35, 42, 54, 76, 89, 108]);
generateCategory("te_sertir", 200, [8, 50], ["Inox", "Cuivre", "Bronze"], [12, 15, 18, 22, 28, 35, 42, 54, 76, 89, 108]);
generateCategory("vanne", 150, [20, 150], ["Laiton", "Bronze"], [15, 20, 25, 32, 40, 50, 65, 80]);
generateCategory("pompe_chaleur", 100, [5000, 25000], null, [5, 8, 12, 16, 20, 24]);
generateCategory("radiateur", 150, [100, 800], ["Acier", "Aluminium"], [500, 600, 900, 1200]);
generateCategory("thermostat", 100, [30, 250], ["Analogique", "Digital", "Connecté"], null);
generateCategory("lavabo", 150, [80, 600], ["Céramique", "Composite"], [50, 60, 80, 100, 120]);
generateCategory("wc", 100, [150, 1200], ["Suspendu", "Posé"], null);
generateCategory("douche", 150, [200, 1500], ["Receveur", "Cabine"], [80, 90, 100, 120]);
generateCategory("robinetterie", 200, [50, 800], ["Chromé", "Inox", "Noir"], null);
generateCategory("chauffe_eau", 100, [800, 3500], ["Émail", "Inox"], [100, 150, 200, 300, 400, 500]);
generateCategory("chaudiere", 50, [3000, 15000], ["Gaz", "Mazout", "Pellets"], [15, 20, 25, 30, 40]);
generateCategory("isolant", 150, [2, 25], ["PIR", "Laine Minérale", "Caoutchouc"], [15, 20, 30, 40, 50]);
generateCategory("fixation", 200, [0.5, 15], ["Acier Zingué", "Inox"], null);
generateCategory("ventilation_gaine", 100, [10, 100], ["Galva", "Alu"], [100, 125, 150, 160, 200, 250]);
generateCategory("grille_aération", 100, [15, 120], ["Alu", "Plastique"], [100, 125, 150, 160, 200]);

// Add Services
items.push({
  id: "srv-gen-999",
  supplier: { code: "SRV", "name": "Service Interne" },
  reference: "SRV-GEN-999",
  name: "Main d\x27oeuvre générique",
  category: "service",
  specification: "Tarif horaire standard",
  active: true,
  unit: "h",
  base_price: 110.00
});
items.push({
  id: "srv-gen-998",
  supplier: { code: "SRV", "name": "Service Interne" },
  reference: "SRV-GEN-998",
  name: "Déplacement",
  category: "service",
  specification: "Forfait par zone",
  active: true,
  unit: "forfait",
  base_price: 60.00
});

const content = `export const SUPPLIERS = {
  NSB: { code: "NSB", name: "Nussbaum" },
  ST: { code: "ST", name: "Sanitas Troesch" },
  GM: { code: "GM", name: "Getaz Miauton" },
  GEB: { code: "GEB", name: "Geberit" },
  HVL: { code: "HVL", name: "Hoval" },
  SRV: { code: "SRV", name: "Service Interne" }
};

export const MOCK_CATALOGUE = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync("src/lib/catalogueData.ts", content, "utf8");
console.log("Successfully generated", items.length, "items.");
