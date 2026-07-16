# QA Test Report: Extraction and Matching

## Prompt 1: M. Berthoud - Villa (Full Renovation)

**Input:** Client : M. Berthoud, Chemin de la Gradelle 42, 1224 Chêne-Bougeries. Visite technique du 14.07, devis attendu pour le 22.07. Villa mitoyenne années 70, 190 m² sur 3 niveaux. Installation d’origine, distribution acier galvanisé entartrée, deux fuites constatées au sous-sol. Le client refait les 2 salles d’eau + le WC visiteurs et veut un adoucisseur. Le chauffage est repris par un autre corps de métier, mais on chiffre la reprise des raccordements ECS sur le nouveau ballon.
Sous-sol : Dépose de la distribution acier galvanisé, env. 35 m, plus les colonnes montantes. Nouvelle distribution en multicouche 20x2 depuis le compteur, collecteur 6 départs avec vannes. Pose d’un adoucisseur au sel sur l’arrivée générale, avec by-pass et vannes d’arrêt. Raccordement du ballon ECS 300 L (fourni par le client) sur la nouvelle distribution.
Salle de bain étage : Dépose baignoire fonte et évacuation de l’ancien matériel, casse par le maçon. Douche à l’italienne 120x90, receveur à carreler, écoulement extra-plat. Mitigeur thermostatique douche encastré avec barre de douche et douchette. Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir. WC suspendu avec bâti-support et plaque de commande. Reprise de l’évacuation en PE 50 pour la douche, l’ancienne sort au mauvais end.

### AI Extracted Articles (11)
- **Tuyau d'évacuation PE 50** (Cat: evacuation_pe, Qty: null m)
- **Tuyau multicouche Ø 20 mm** (Cat: tuyau_inox, Qty: null m)
- **Collecteur 6 départs avec vannes** (Cat: nourrice, Qty: 1 pce)
- **Adoucisseur au sel** (Cat: autre, Qty: 1 pce)
- **By-pass et vannes d’arrêt pour adoucisseur** (Cat: robinetterie, Qty: 1 pce)
- **Douche à l’italienne 120x90** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir** (Cat: appareil_sanitaire, Qty: 1 pce)
- **WC suspendu avec bâti-support et plaque de commande** (Cat: geberit_duofix, Qty: 1 pce)
- **Mitigeur thermostatique douche encastré avec barre de douche et douchette** (Cat: robinetterie, Qty: 1 pce)
- **Dépose de la distribution acier galvanisé et colonnes montantes** (Cat: depose, Qty: null forfait)
- **Dépose baignoire fonte et évacuation de l’ancien matériel** (Cat: depose, Qty: null forfait)

### Matched Items (1)
- ✅ WC suspendu avec bâti-support et plaque de commande -> **Geberit Duofix Fussverlängerungsset für Fussbodenaufbau 25-45 cm (2 St.) Eigenschaften: - Baureihe 2025 - Fussverlängerungen auf C-Fussprofile der Geberit Duofix Elemente aufsteckbar - Kompatibel mit Geberit Duofix Installationssystem der Baureihe 2025 und älterer Baureihen - Fussverlängerung korrosionsgeschützt - Fussplatten der Geberit Duofix Elemente an Fussverlängerungen wieder montierbar Verwendungszweck: - Nicht geeignet für Geberit Duofix Elemente mit angeschweisster Fussplatte an den Fussstützen - Zum Verlängern der Fussstützen um 20 cm bei hohem Fussbodenaufbau - Nicht geeignet für Geberit Duofix Elemente für Wand-WC, Ecklösung - Nicht geeignet für Geberit Duofix Elemente mit Breite > 50 cm bei raumhohen Trennwänden Lieferumgang: - 2 Fussverlängerungen - Befestigungsmaterial** (111.848.00.2) [Confidence: 70.7%]

### Missing Items (10)
- ❌ Tuyau d'évacuation PE 50 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau d'évacuation PE 50".)
  - Suggestion 1: Geberit GEBUS-Kabel: L=500 m Eigenschaften: - Litzenpaar 1, weiss / braun, G1 / G2 - Litzenpaar 2, grün / gelb, G3 / G4 - Litzenkabel 4 x 0.35 mm² - Leiter aus Kupfer - Ummantelung feuerhemmend und halogenfrei (LSZH) - Paarweise verdrillt, ohne Isolation - Aderisolation aus PE - Leiterwiderstand pro Ader = 58 O/km Verwendungszweck: - Zur drahtgebundenen Vernetzung von Geberit Connect Endgeräten mit dem Geberit Gateway - Zur drahtgebundenen Vernetzung von GEBUS Konvertern mit dem Geberit Gateway (116.493.00.5)
- ❌ Tuyau multicouche Ø 20 mm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau multicouche Ø 20 mm".)
  - Suggestion 1: Geberit Anschlussbogen 90° mit Überwurfmutter: d50mm G2" schwarz Lieferumgang: - Dichtung (152.120.16.1)
- ❌ Collecteur 6 départs avec vannes -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Collecteur 6 départs avec vannes".)
- ❌ Adoucisseur au sel -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Adoucisseur au sel".)
  - Suggestion 1: Geberit Urinalsteuerung mit pneumatischer Spülauslösung, Typ 40 Betätigungsplatte, rund, kundenspezifisches Finish: galvanisiert und lackiert Eigenschaften: - Spülzeiteinstellung mit Luftdüsen (pneumatisch) - Spülmenge über Drosselschraube des Rohbausets bis auf 0.5 l pro Spülung reduzierbar - Trinkwasserberührende Komponenten bleifrei - Geringe Hubbewegung - Betätigungsplatte mit Sicherungsriegel - Armaturengruppe II nach DIN 4109 - Geringe Auslösekraft - Spülauslösung beim Loslassen der Betätigungstaste Verwendungszweck: - Zur manuellen Spülauslösung von Urinalen - Für Geberit Installationselemente für Urinal mit Betätigung von vorne - Für Geberit Installationselemente für Urinal mit Betätigung von oben - Zum Einbau in Rohbausets für Geberit Urinalsteuerungen (ab Baujahr 2009) Lieferumgang: - Befestigungsmaterial - Typ 40 Betätigungsplatte, rund - Pneumatische Spülauslösung, vormontiert auf Befestigungsrahmen - Pneumatikventil (004.780.00.3)
- ❌ By-pass et vannes d’arrêt pour adoucisseur -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "By-pass et vannes d’arrêt pour adoucisseur".)
- ❌ Douche à l’italienne 120x90 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Douche à l’italienne 120x90".)
  - Suggestion 1: Geberit Duofix Elementbefestigungstraverse für Ständerabstand ab 60 cm: B=120 cm Eigenschaften: - Nennbreiten 75 cm bis 120 cm passend für Waschtischelemente mit Breite 50 cm - Nennbreite 60 cm passend für Waschtischelemente mit Breite 44 cm oder 50 cm (bei 50 cm eingeschränkte Möbelbefestigung) - Nennbreiten 120 cm bis 135 cm passend für Doppelwaschtische - Verzinkt - Nennbreiten 120 cm bis 135 cm passend für Waschtischelemente mit Breite 44 cm oder 50 cm (bei 50 cm eingeschränkte Möbelbefestigung) Verwendungszweck: - Zum Erstellen von Nischen für z. B. Unterputzspiegelschränke - Zur Montage zwischen raumhohen Ständern für Nennbreiten 60, 75, 90, 105, 120 oder 135 cm - Zum Einbau in raumhohe Installationswände - Zum Befestigen von Geberit Duofix Waschtischelementen zwischen zwei Ständern - Zum Einbau in raumhohe Vorwandinstallationen - Zum Einbau in raumhohe Geberit Duofix Systemwände - Nötig, wenn eine Befestigung des Waschtischelements an die Rückwand mit Wandankern nicht möglich ist - Für Trockenbau Lieferumgang: - Befestigungsmaterial - Befestigungsmaterial für Element für Waschtisch - 2 Befestigungswinkel (111.045.00.1)
- ❌ Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir".)
- ❌ Mitigeur thermostatique douche encastré avec barre de douche et douchette -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Mitigeur thermostatique douche encastré avec barre de douche et douchette".)
- ❌ Dépose de la distribution acier galvanisé et colonnes montantes -> No match found (Reason: Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue)
- ❌ Dépose baignoire fonte et évacuation de l’ancien matériel -> No match found (Reason: Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue)

---

