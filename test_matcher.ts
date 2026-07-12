import { MOCK_CATALOGUE } from './src/lib/catalogueData';
import Fuse from 'fuse.js';

const CATALOGUE_ADAPTED = (MOCK_CATALOGUE as any[]).map((a) => ({
  ...a,
  description: a.description ?? a.name ?? '',
  unit_price: typeof a.unit_price === 'number' ? a.unit_price : (a.base_price ?? 0),
  supplier_id: a.supplier_id ?? a.supplier?.code ?? '',
}));

const options = {
  keys: ['description', 'specification', 'category', 'supplier_id', 'reference'],
  includeScore: true,
  threshold: 0.7,
  ignoreLocation: true,
  useExtendedSearch: true
};

const fuse = new Fuse(CATALOGUE_ADAPTED.filter(a => a.active), options);
const results = fuse.search("Coupure d'eau, vidange");
console.log("Coupure d'eau, vidange:");
console.dir(results.map(r => ({ description: r.item.description, score: r.score })));

const results2 = fuse.search("Démontage, dépose et é...");
console.log("Démontage, dépose et é...");
console.dir(results2.map(r => ({ description: r.item.description, score: r.score })));

const results3 = fuse.search("Tuyau acier inox 1:4521 Optipress Ø 54 mm");
console.log("Tuyau acier inox 1:4521 Optipress Ø 54 mm:");
console.dir(results3.map(r => ({ description: r.item.description, score: r.score })));
