import { extractFromDescription } from './src/lib/gemini';
import { matchArticles } from './src/lib/catalogue-matcher';
import { getServerSupabase } from './src/lib/supabase';
import fs from 'fs';

const prompts = [
  {
    id: 1,
    name: "M. Berthoud - Villa (Full Renovation)",
    text: "Client : M. Berthoud, Chemin de la Gradelle 42, 1224 Chêne-Bougeries. Visite technique du 14.07, devis attendu pour le 22.07. Villa mitoyenne années 70, 190 m² sur 3 niveaux. Installation d’origine, distribution acier galvanisé entartrée, deux fuites constatées au sous-sol. Le client refait les 2 salles d’eau + le WC visiteurs et veut un adoucisseur. Le chauffage est repris par un autre corps de métier, mais on chiffre la reprise des raccordements ECS sur le nouveau ballon.\nSous-sol : Dépose de la distribution acier galvanisé, env. 35 m, plus les colonnes montantes. Nouvelle distribution en multicouche 20x2 depuis le compteur, collecteur 6 départs avec vannes. Pose d’un adoucisseur au sel sur l’arrivée générale, avec by-pass et vannes d’arrêt. Raccordement du ballon ECS 300 L (fourni par le client) sur la nouvelle distribution.\nSalle de bain étage : Dépose baignoire fonte et évacuation de l’ancien matériel, casse par le maçon. Douche à l’italienne 120x90, receveur à carreler, écoulement extra-plat. Mitigeur thermostatique douche encastré avec barre de douche et douchette. Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir. WC suspendu avec bâti-support et plaque de commande. Reprise de l’évacuation en PE 50 pour la douche, l’ancienne sort au mauvais end."
  },
  {
    id: 2,
    name: "Boiler Replacement",
    text: "Remplacement d'un chauffe-eau électrique de 150L par un ballon thermodynamique 200L. Raccordement sur l'existant en cuivre. Pose d'un groupe de sécurité neuf. Mise en service et évacuation de l'ancien chauffe-eau."
  },
  {
    id: 3,
    name: "Kitchen Sink Leak",
    text: "Fuite sur tuyau d'évacuation sous l'évier de la cuisine. Remplacement du siphon en PE 40 et de 2 mètres de tube PE 40 avec deux coudes à 90°. Dépose de l'existant."
  },
  {
    id: 4,
    name: "Outdoor Garden Tap",
    text: "Création d'un point d'eau extérieur pour arrosage. Reprise sur nourrice existante au garage. 15 mètres de tuyau multicouche 16x2. Traversée de mur en béton. Pose d'un robinet de puisage double sortie anti-gel. Fixations par colliers isophoniques."
  },
  {
    id: 5,
    name: "Visitor WC Renovation",
    text: "Rénovation WC visiteurs. Dépose WC au sol. Installation d'un Geberit Duofix avec plaque Sigma20 blanche. Cuvette suspendue sans bride et abattant frein de chute. Lave-mains 40 cm avec mitigeur simple (eau froide) et siphon chromé."
  },
  {
    id: 6,
    name: "Industrial Boiler Circulator",
    text: "Chaufferie industrielle. Remplacement de la pompe de circulation pour le circuit radiateurs. Installation d'un circulateur Grundfos Magna3. Modification des brides de raccordement DN 65. Remplacement de 2 vannes d'arrêt à bille DN 65 en laiton. Vidange et remplissage du circuit."
  },
  {
    id: 7,
    name: "Apartment Radiators",
    text: "Remplacement de tous les radiateurs d'un appartement (5 pièces). Dépose de 6 radiateurs acier type 21. Pose de 6 nouveaux radiateurs type 22, avec vannes thermostatiques et coudes de réglage. Raccordement sur tubes acier existants. Purge et essai de fonctionnement."
  }
];

async function runTests() {
  const supabase = getServerSupabase();
  console.log("Fetching catalogue...");
  const { data: catalogue, error } = await supabase.from('sq_catalogue_articles').select('*');
  if (error || !catalogue) {
    console.error("Failed to fetch catalogue:", error);
    return;
  }
  console.log("Catalogue loaded with " + catalogue.length + " items.");

  let report = "# QA Test Report: Extraction and Matching\n\n";

  const testPrompts = prompts.slice(0, 1);
  for (const prompt of testPrompts) {
    console.log("Running Prompt " + prompt.id + ": " + prompt.name + "...");
    report += "## Prompt " + prompt.id + ": " + prompt.name + "\n\n";
    report += "**Input:** " + prompt.text + "\n\n";

    try {
      const result = await extractFromDescription(prompt.text);
      console.log("Raw Metadata from LLM:", JSON.stringify(result.metadata, null, 2));
      if (result.metadata) {
        report += `**Extracted Client:** ${result.metadata.clientName || 'N/A'}\n`;
        report += `**Extracted Address:** ${result.metadata.clientAddress || 'N/A'}\n`;
        report += `**Extracted Project:** ${result.metadata.projectDescription || 'N/A'}\n\n`;
      }
      
      let articles: any[] = [];
      if (result.extraction?.sections) {
        articles = result.extraction.sections.flatMap(s => s.articles);
      } else if ((result as any).articles) {
        articles = (result as any).articles;
      }
      if (!articles || articles.length === 0) {
        throw new Error("Invalid extraction result or no articles: " + JSON.stringify(result));
      }
      report += "### AI Extracted Articles (" + articles.length + ")\n";
      articles.forEach(a => {
        report += "- **" + a.label + "** (Cat: " + a.category + ", Qty: " + (a.quantity || 'null') + " " + (a.unit || '') + ")\n";
      });
      report += "\n";

      const matchResult = matchArticles(articles, catalogue as any, 'NSB', prompt.text);
      
      report += "### Matched Items (" + matchResult.matched.length + ")\n";
      matchResult.matched.forEach(m => {
        report += "- ✅ " + m.aiArticle.label + " -> **" + m.catalogueArticle.description + "** (" + m.catalogueArticle.reference + ") [Confidence: " + (m.matchConfidence*100).toFixed(1) + "%]\n";
      });
      report += "\n";

      report += "### Missing Items (" + matchResult.missing.length + ")\n";
      matchResult.missing.forEach(m => {
        report += "- ❌ " + m.aiArticle.label + " -> No match found (Reason: " + m.reason + ")\n";
        if (m.suggestions && m.suggestions.length > 0) {
          report += "  - Suggestion 1: " + m.suggestions[0].description + " (" + m.suggestions[0].reference + ")\n";
        }
      });
      report += "\n---\n\n";
    } catch (e: any) {
      console.error("Error on prompt " + prompt.id + ":", e);
      report += "**ERROR:** " + e.message + "\n\n---\n\n";
    }
  }

  fs.writeFileSync('test_report.md', report);
  console.log("Report generated: test_report.md");
}

runTests().catch(console.error);
