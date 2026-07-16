# QA Test Report: Extraction and Matching

## Prompt 1: M. Berthoud - Villa (Full Renovation)

**Input:** Client : M. Berthoud, Chemin de la Gradelle 42, 1224 Chêne-Bougeries. Visite technique du 14.07, devis attendu pour le 22.07. Villa mitoyenne années 70, 190 m² sur 3 niveaux. Installation d’origine, distribution acier galvanisé entartrée, deux fuites constatées au sous-sol. Le client refait les 2 salles d’eau + le WC visiteurs et veut un adoucisseur. Le chauffage est repris par un autre corps de métier, mais on chiffre la reprise des raccordements ECS sur le nouveau ballon.
Sous-sol : Dépose de la distribution acier galvanisé, env. 35 m, plus les colonnes montantes. Nouvelle distribution en multicouche 20x2 depuis le compteur, collecteur 6 départs avec vannes. Pose d’un adoucisseur au sel sur l’arrivée générale, avec by-pass et vannes d’arrêt. Raccordement du ballon ECS 300 L (fourni par le client) sur la nouvelle distribution.
Salle de bain étage : Dépose baignoire fonte et évacuation de l’ancien matériel, casse par le maçon. Douche à l’italienne 120x90, receveur à carreler, écoulement extra-plat. Mitigeur thermostatique douche encastré avec barre de douche et douchette. Lavabo 80 cm avec meuble sous-lavabo 80 cm 2 tiroirs et miroir. WC suspendu avec bâti-support et plaque de commande. Reprise de l’évacuation en PE 50 pour la douche, l’ancienne sort au mauvais end.

### AI Extracted Articles (19)
- **Douche à l'italienne 120x90** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Receveur à carreler** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Mitigeur thermostatique douche encastré** (Cat: robinetterie, Qty: 1 pce)
- **Barre de douche et douchette** (Cat: robinetterie, Qty: 1 pce)
- **Lavabo 80 cm** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Meuble sous-lavabo 80 cm 2 tiroirs** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Miroir** (Cat: autre, Qty: 1 pce)
- **WC suspendu** (Cat: appareil_sanitaire, Qty: 1 pce)
- **Bâti-support WC** (Cat: geberit_duofix, Qty: 1 pce)
- **Plaque de commande** (Cat: robinetterie, Qty: 1 pce)
- **Tuyau d'évacuation PE 50** (Cat: evacuation_pe, Qty: null m)
- **Tuyau multicouche 20x2** (Cat: tuyau_inox, Qty: 35 m)
- **Collecteur 6 départs avec vannes** (Cat: nourrice, Qty: 1 pce)
- **Adoucisseur au sel** (Cat: autre, Qty: 1 pce)
- **By-pass** (Cat: coude_sertir, Qty: 1 pce)
- **Vanne d'arrêt** (Cat: robinetterie, Qty: 2 pce)
- **Raccordement ballon ECS 300 L** (Cat: autre, Qty: 1 pce)
- **Dépose distribution acier galvanisé** (Cat: depose, Qty: null forfait)
- **Dépose baignoire fonte** (Cat: depose, Qty: 1 pce)

### Matched Items (1)
- ✅ Bâti-support WC -> **Geberit Duofix Fussverlängerungsset für Fussbodenaufbau 25-45 cm (2 St.) Eigenschaften: - Baureihe 2025 - Fussverlängerungen auf C-Fussprofile der Geberit Duofix Elemente aufsteckbar - Kompatibel mit Geberit Duofix Installationssystem der Baureihe 2025 und älterer Baureihen - Fussverlängerung korrosionsgeschützt - Fussplatten der Geberit Duofix Elemente an Fussverlängerungen wieder montierbar Verwendungszweck: - Nicht geeignet für Geberit Duofix Elemente mit angeschweisster Fussplatte an den Fussstützen - Zum Verlängern der Fussstützen um 20 cm bei hohem Fussbodenaufbau - Nicht geeignet für Geberit Duofix Elemente für Wand-WC, Ecklösung - Nicht geeignet für Geberit Duofix Elemente mit Breite > 50 cm bei raumhohen Trennwänden Lieferumgang: - 2 Fussverlängerungen - Befestigungsmaterial** (111.848.00.2) [Confidence: 84.9%]

### Missing Items (18)
- ❌ Douche à l'italienne 120x90 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Douche à l'italienne 120x90".)
  - Suggestion 1: Geberit Duofix Elementbefestigungstraverse für Ständerabstand ab 60 cm: B=120 cm Eigenschaften: - Nennbreiten 75 cm bis 120 cm passend für Waschtischelemente mit Breite 50 cm - Nennbreite 60 cm passend für Waschtischelemente mit Breite 44 cm oder 50 cm (bei 50 cm eingeschränkte Möbelbefestigung) - Nennbreiten 120 cm bis 135 cm passend für Doppelwaschtische - Verzinkt - Nennbreiten 120 cm bis 135 cm passend für Waschtischelemente mit Breite 44 cm oder 50 cm (bei 50 cm eingeschränkte Möbelbefestigung) Verwendungszweck: - Zum Erstellen von Nischen für z. B. Unterputzspiegelschränke - Zur Montage zwischen raumhohen Ständern für Nennbreiten 60, 75, 90, 105, 120 oder 135 cm - Zum Einbau in raumhohe Installationswände - Zum Befestigen von Geberit Duofix Waschtischelementen zwischen zwei Ständern - Zum Einbau in raumhohe Vorwandinstallationen - Zum Einbau in raumhohe Geberit Duofix Systemwände - Nötig, wenn eine Befestigung des Waschtischelements an die Rückwand mit Wandankern nicht möglich ist - Für Trockenbau Lieferumgang: - Befestigungsmaterial - Befestigungsmaterial für Element für Waschtisch - 2 Befestigungswinkel (111.045.00.1)
- ❌ Receveur à carreler -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Receveur à carreler".)
- ❌ Mitigeur thermostatique douche encastré -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Mitigeur thermostatique douche encastré".)
- ❌ Barre de douche et douchette -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Barre de douche et douchette".)
- ❌ Lavabo 80 cm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Lavabo 80 cm".)
  - Suggestion 1: Geberit Duofix Ständer raumhoch: H220-280cm Eigenschaften: - Keine Anbindung an rückwärtiger Wand oder Installationswand erforderlich - Teleskopisch höhenverstellbar um maximal 60 cm - Baureihe 2025 - Korrosionsbeständig - Werkzeuglos montierbar - Befestigung der Geberit Duofix Elemente am Ständer ohne Zusatzteile - Verzinkt Verwendungszweck: - Für Deckenabsenkungen bis 25 mm - Für Decken mit einer Neigung bis 50° - Zum Einbau als Zwischenständer oder seitlicher Abschlussständer - Zum Befestigen von Geberit Duofix Installationselementen und Traversen - Für Wandhöhen bis 4 m - Zum Erstellen von Geberit Duofix Systemwänden (111.871.00.2)
- ❌ Meuble sous-lavabo 80 cm 2 tiroirs -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Meuble sous-lavabo 80 cm 2 tiroirs".)
- ❌ Miroir -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Miroir".)
- ❌ WC suspendu -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "WC suspendu".)
  - Suggestion 1: Geberit Duofix Installationselement für Duschtrennwand für Walk-in Dusche Eigenschaften: - Für Plattenaufbauten von 4–30 mm geeignet - Dichtvlies umlaufend 10 cm, zur Anbindung von Abdichtsystemen - Dichtvlies vormontiert - Beplankungsdicke 10–30 mm - Passend zu Geberit ONE Verwendungszweck: - Zum Einbau in raumhohe Geberit Duofix Systemwände - Zur Aufnahme von Geberit Walk-in-Duschwänden Lieferumgang: - 2 Bauschutze - 2 Befestigungswinkel für Ständer - 4 Halteklammern (111.596.00.1)
- ❌ Plaque de commande -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Plaque de commande".)
- ❌ Tuyau d'évacuation PE 50 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau d'évacuation PE 50".)
  - Suggestion 1: Geberit GEBUS-Kabel: L=500 m Eigenschaften: - Litzenpaar 1, weiss / braun, G1 / G2 - Litzenpaar 2, grün / gelb, G3 / G4 - Litzenkabel 4 x 0.35 mm² - Leiter aus Kupfer - Ummantelung feuerhemmend und halogenfrei (LSZH) - Paarweise verdrillt, ohne Isolation - Aderisolation aus PE - Leiterwiderstand pro Ader = 58 O/km Verwendungszweck: - Zur drahtgebundenen Vernetzung von Geberit Connect Endgeräten mit dem Geberit Gateway - Zur drahtgebundenen Vernetzung von GEBUS Konvertern mit dem Geberit Gateway (116.493.00.5)
- ❌ Tuyau multicouche 20x2 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau multicouche 20x2".)
- ❌ Collecteur 6 départs avec vannes -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Collecteur 6 départs avec vannes".)
- ❌ Adoucisseur au sel -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Adoucisseur au sel".)
  - Suggestion 1: Geberit Urinalsteuerung mit pneumatischer Spülauslösung, Typ 40 Betätigungsplatte, rund, kundenspezifisches Finish: galvanisiert und lackiert Eigenschaften: - Spülzeiteinstellung mit Luftdüsen (pneumatisch) - Spülmenge über Drosselschraube des Rohbausets bis auf 0.5 l pro Spülung reduzierbar - Trinkwasserberührende Komponenten bleifrei - Geringe Hubbewegung - Betätigungsplatte mit Sicherungsriegel - Armaturengruppe II nach DIN 4109 - Geringe Auslösekraft - Spülauslösung beim Loslassen der Betätigungstaste Verwendungszweck: - Zur manuellen Spülauslösung von Urinalen - Für Geberit Installationselemente für Urinal mit Betätigung von vorne - Für Geberit Installationselemente für Urinal mit Betätigung von oben - Zum Einbau in Rohbausets für Geberit Urinalsteuerungen (ab Baujahr 2009) Lieferumgang: - Befestigungsmaterial - Typ 40 Betätigungsplatte, rund - Pneumatische Spülauslösung, vormontiert auf Befestigungsrahmen - Pneumatikventil (004.780.00.3)
- ❌ By-pass -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "By-pass".)
- ❌ Vanne d'arrêt -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Vanne d'arrêt".)
- ❌ Raccordement ballon ECS 300 L -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Raccordement ballon ECS 300 L".)
- ❌ Dépose distribution acier galvanisé -> No match found (Reason: Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue)
- ❌ Dépose baignoire fonte -> No match found (Reason: Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue)

---

## Prompt 2: Boiler Replacement

**Input:** Remplacement d'un chauffe-eau électrique de 150L par un ballon thermodynamique 200L. Raccordement sur l'existant en cuivre. Pose d'un groupe de sécurité neuf. Mise en service et évacuation de l'ancien chauffe-eau.

### AI Extracted Articles (5)
- **Ballon thermodynamique 200L** (Cat: ballon_ecs, Qty: 1 pce)
- **Tuyau en cuivre pour raccordement** (Cat: autre, Qty: null m)
- **Groupe de sécurité** (Cat: robinetterie, Qty: 1 pce)
- **Mise en service du nouveau ballon thermodynamique** (Cat: autre, Qty: 1 forfait)
- **Évacuation de l'ancien chauffe-eau** (Cat: depose, Qty: 1 forfait)

### Matched Items (0)

### Missing Items (5)
- ❌ Ballon thermodynamique 200L -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Ballon thermodynamique 200L".)
- ❌ Tuyau en cuivre pour raccordement -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau en cuivre pour raccordement".)
- ❌ Groupe de sécurité -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Groupe de sécurité".)
- ❌ Mise en service du nouveau ballon thermodynamique -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Mise en service du nouveau ballon thermodynamique".)
- ❌ Évacuation de l'ancien chauffe-eau -> No match found (Reason: Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue)

---

## Prompt 3: Kitchen Sink Leak

**Input:** Fuite sur tuyau d'évacuation sous l'évier de la cuisine. Remplacement du siphon en PE 40 et de 2 mètres de tube PE 40 avec deux coudes à 90°. Dépose de l'existant.

### AI Extracted Articles (4)
- **Tuyau d'évacuation PE 40** (Cat: evacuation_pe, Qty: 2 m)
- **Siphon en PE 40** (Cat: coude_sertir, Qty: 1 pce)
- **Coudes à 90° en PE 40** (Cat: coude_sertir, Qty: 2 pce)
- **Dépose de l'existant** (Cat: autre, Qty: null forfait)

### Matched Items (0)

### Missing Items (4)
- ❌ Tuyau d'évacuation PE 40 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau d'évacuation PE 40".)
  - Suggestion 1: Rohbauset, zu Geberit Urinalsteuerung mit elektronischer Spülauslösung, Anschlusswinkel G 1" Eigenschaften: - Wasseranschluss oben mittig - Bauschutz für Serviceöffnung werkzeuglos ablängbar - Elektroanschluss vorbereitet - Trinkwasserberührende Komponenten bleifrei - Mit Nippel aus Kunststoff - Leerrohr zum Spülen der Leitung vormontiert - Absperrventil mit Drossel, vormontiert - Bauschutz für Serviceöffnung schützt vor Feuchtigkeit und Schmutz Verwendungszweck: - Zum Anschliessen von Laufen Tamaro Urinalkeramiken - Zum Aufnehmen von Geberit Urinalsteuerungen (ab Baujahr 2009) - Zur Unterputzmontage im Massivbau Lieferumgang: - Leerrohr - Absperrventil mit Drossel - Anschlussklemme - Anschlusswinkel 90° mit Innengewinde G 1" - Unterputzgehäuse - Spülrohr aus PE-HD, ø 32 mm - Wasseranschluss R 1/2" - Bauschutz mit Deckel (116.002.00.1)
- ❌ Siphon en PE 40 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Siphon en PE 40".)
  - Suggestion 1: Geberit Urinal Preda, für Unterputzurinalsteuerung Eigenschaften: - Ausspülen der Urinalkeramik mit 0.5 l pro Spülung gewährleistet, unter Einhaltung der EN 13407 - Siphonaufnahme werkzeuglos höhenverstellbar - Wartungs- und reinigungsfreundlich - Reinigung des Entwässerungssystems ohne Abnehmen der Keramik - Wasserloser Betrieb möglich - Wandhängend - Spülrandlos - Sprühkopf von vorne austauschbar, ohne Abnehmen der Keramik - Siphon von oben austauschbar, ohne Abnehmen der Keramik Verwendungszweck: - Für Geberit Installationselemente für Urinal für Sprühkopf - Für Rohbausets für Urinalsteuerung, für Preda und Selva Urinale - Zum Betrieb mit automatischer, wassersparender Spülung - Zum Anschliessen an Unterputzurinalsteuerungen Lieferumgang: - Ablaufsieb - Anschlusswinkel 90° R 1/2" - Urinalsiphon mit Absaugfunktion - Rückflussverhinderer - Befestigungsmaterial - Ablaufgarnitur (116.070.00.1)
- ❌ Coudes à 90° en PE 40 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Coudes à 90° en PE 40".)
- ❌ Dépose de l'existant -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Dépose de l'existant".)

---

## Prompt 4: Outdoor Garden Tap

**Input:** Création d'un point d'eau extérieur pour arrosage. Reprise sur nourrice existante au garage. 15 mètres de tuyau multicouche 16x2. Traversée de mur en béton. Pose d'un robinet de puisage double sortie anti-gel. Fixations par colliers isophoniques.

### AI Extracted Articles (6)
- **Tuyau multicouche 16x2 Ø 20 mm** (Cat: evacuation_pe, Qty: 15 m)
- **Tuyau multicouche 16x2 Ø 20 mm pour traversée de mur en béton** (Cat: evacuation_pe, Qty: null pce)
- **Coude sertir pour tuyau multicouche 16x2 Ø 20 mm** (Cat: coude_sertir, Qty: null pce)
- **Manchon pour tuyau multicouche 16x2 Ø 20 mm** (Cat: manchon, Qty: null pce)
- **Collier isophonique pour robinet de puisage** (Cat: collier, Qty: null pce)
- **Robinnet de puisage double sortie anti-gel** (Cat: robinetterie, Qty: null pce)

### Matched Items (0)

### Missing Items (6)
- ❌ Tuyau multicouche 16x2 Ø 20 mm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau multicouche 16x2 Ø 20 mm".)
  - Suggestion 1: Geberit Anschlussbogen 90° mit Überwurfmutter: d50mm G2" schwarz Lieferumgang: - Dichtung (152.120.16.1)
- ❌ Tuyau multicouche 16x2 Ø 20 mm pour traversée de mur en béton -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau multicouche 16x2 Ø 20 mm pour traversée de mur en béton".)
  - Suggestion 1: Geberit Anschlussbogen 90° mit Überwurfmutter: d50mm G2" schwarz Lieferumgang: - Dichtung (152.120.16.1)
- ❌ Coude sertir pour tuyau multicouche 16x2 Ø 20 mm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Coude sertir pour tuyau multicouche 16x2 Ø 20 mm".)
  - Suggestion 1: Geberit Anschlussbogen 90° mit Überwurfmutter: d50mm G2" schwarz Lieferumgang: - Dichtung (152.120.16.1)
- ❌ Manchon pour tuyau multicouche 16x2 Ø 20 mm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Manchon pour tuyau multicouche 16x2 Ø 20 mm".)
  - Suggestion 1: Geberit Anschlussbogen 90° mit Überwurfmutter: d50mm G2" schwarz Lieferumgang: - Dichtung (152.120.16.1)
- ❌ Collier isophonique pour robinet de puisage -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Collier isophonique pour robinet de puisage".)
- ❌ Robinnet de puisage double sortie anti-gel -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Robinnet de puisage double sortie anti-gel".)

---

## Prompt 5: Visitor WC Renovation

**Input:** Rénovation WC visiteurs. Dépose WC au sol. Installation d'un Geberit Duofix avec plaque Sigma20 blanche. Cuvette suspendue sans bride et abattant frein de chute. Lave-mains 40 cm avec mitigeur simple (eau froide) et siphon chromé.

### AI Extracted Articles (7)
- **Cuvette suspendue Geberit sans bride** (Cat: appareil_sanitaire, Qty: null pce)
- **Abattant frein de chute** (Cat: appareil_sanitaire, Qty: null pce)
- **Lavabo meuble 40 cm** (Cat: appareil_sanitaire, Qty: null pce)
- **Mitigeur simple eau froide** (Cat: robinetterie, Qty: null pce)
- **Siphon chromé** (Cat: robinetterie, Qty: null pce)
- **Geberit Duofix avec plaque Sigma20 blanche** (Cat: geberit_duofix, Qty: null pce)
- **Dépose WC au sol** (Cat: autre, Qty: null forfait)

### Matched Items (2)
- ✅ Cuvette suspendue Geberit sans bride -> **Geberit Duofix Fussverlängerungsset für Fussbodenaufbau 25-45 cm (2 St.) Eigenschaften: - Baureihe 2025 - Fussverlängerungen auf C-Fussprofile der Geberit Duofix Elemente aufsteckbar - Kompatibel mit Geberit Duofix Installationssystem der Baureihe 2025 und älterer Baureihen - Fussverlängerung korrosionsgeschützt - Fussplatten der Geberit Duofix Elemente an Fussverlängerungen wieder montierbar Verwendungszweck: - Nicht geeignet für Geberit Duofix Elemente mit angeschweisster Fussplatte an den Fussstützen - Zum Verlängern der Fussstützen um 20 cm bei hohem Fussbodenaufbau - Nicht geeignet für Geberit Duofix Elemente für Wand-WC, Ecklösung - Nicht geeignet für Geberit Duofix Elemente mit Breite > 50 cm bei raumhohen Trennwänden Lieferumgang: - 2 Fussverlängerungen - Befestigungsmaterial** (111.848.00.2) [Confidence: 62.2%]
- ✅ Geberit Duofix avec plaque Sigma20 blanche -> **Geberit Duofix Flachkopfschraube T25, für Dünnblech Eigenschaften: - Kragenbildung bei der Gewindeausformung für höhere Auszugswerte - Gewindefurchende Schraube, 5.0 x 20 mm - Verzinkt - Flachkopf mit T25 Verwendungszweck: - Für Geberit Duofix Elemente mit Auszugsblech (ab Baureihe 2025), wenn CW-Profile für die Anwendung genügen - Zum Befestigen am seitlichen Auszugsblech des Geberit Duofix Elements - Zum Befestigen von Geberit Duofix Elementen und Systemteilen aus Stahl mit einer Stärke von 0.6 mm - Zum Befestigen an CW-Profilen mit Materialstärke 0.6 mm** (111.926.00.1) [Confidence: 78.0%]

### Missing Items (5)
- ❌ Abattant frein de chute -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Abattant frein de chute".)
- ❌ Lavabo meuble 40 cm -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Lavabo meuble 40 cm".)
  - Suggestion 1: Brandschutzset EI 30 für Geberit Duofix Element für Wand-WC mit Sigma Unterputzspülkasten 12 cm Eigenschaften: - Für Belagdicken von mindestens 25 mm geeignet (35 mm mit Sigma40 Betätigungsplatte) - Verzinkt - Werkzeuglos montierbar - Baureihe 2025 Verwendungszweck: - Zur Montage an Geberit Duofix Elementen für Wand-WC, mit Sigma Unterputzspülkasten 12 cm und einer Elementbreite von 50 cm - Für Wände, die den Feuerwiderstand durch die Beplankung aufnehmen - Zur Montage vor Serviceöffnung, Spülrohr und Anschlussbogen - Für Geberit Duofix Elemente für Wand-WC (ab Baureihe 2025) - Nicht geeignet zum Kombinieren mit Geberit DuoFresh Modul oder Einschub - Nicht geeignet für Sigma60, Sigma80 und Sigma10 IR Betätigungsplatten - Zur Montage an Geberit Duofix Elementen für Wand-WC, mit Delta Unterputzspülkasten 12 cm und einer Elementbreite von 50 cm - Nicht geeignet zum Kombinieren mit Power & Connect Box für Installationselement für Wand-WC - Zum Schutz vor Feuerausbreitung - Nicht geeignet für Geberit Duofix Elemente mit Hygienespülung - Zum Einbau bei Brandschutzanforderungen mit Feuerwiderstand EI 30 Lieferumgang: - Bauschutz für Serviceöffnung - Befestigungsmaterial - Brandverschluss für Spülbogen und Anschlussbogen - Brandverschluss für Serviceöffnung (111.281.00.2)
- ❌ Mitigeur simple eau froide -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Mitigeur simple eau froide".)
- ❌ Siphon chromé -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Siphon chromé".)
  - Suggestion 1: Geberit Siphonadapter für Urinale Preda, Selva und Tamina Eigenschaften: - Abgang vertikal Verwendungszweck: - Zum Aufnehmen von Geberit Hybridsiphons für Urinale - Für Preda Urinale - Für Selva Urinale - Für Tamina Urinale Lieferumgang: - Wartungsschlüssel (116.058.00.1)
- ❌ Dépose WC au sol -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Dépose WC au sol".)
  - Suggestion 1: Geberit Duofix Element für Stütz- und Haltegriffe, 112 cm, barrierefrei Eigenschaften: - Montageplatte höhenverstellbar - Statisch selbsttragender Rahmen, mit Pulverbeschichtung korrosionsgeschützt - Fussplatten drehbar, passend zum Einbau in U-Profile UW 50 und UW 75 - Baureihe 2025 - FSC™ C134279 zertifiziert - Mit Auszugsblech für seitliche Befestigung über dem Element an Metall- oder Holzprofilen oder an Geberit Duofix Systemständern - Baustoffklasse B2 nach DIN 4102-1, bzw. Klasse D-s2, d0 nach EN 13501-3 - Montageplatte aus Furnierholz, wasserfest verleimt - Alternative Befestigungsposition für Wandanker - Formaldehydabgabe Klasse A nach EN 1084, bzw. Klasse E 1 entsprechend nach EN 13936 - Fussplatten werkzeuglos in Geberit Duofix Systemschiene montierbar, ohne Zusatzkomponenten - Fussstützen verzinkt korrosionsgeschützt, mit Rutschhemmung Verwendungszweck: - Zum Einbau in raumhohe Trennwände - Zum Befestigen von Stütz- und Haltegriffen - Für Geberit Duofix Systemwände - Zum Einbau in teil- oder raumhohe Vorwände - Zum Befestigen von mittleren und schweren Konsollasten nach DIN 18183-1 - Für Metall- und Holzständerwände - Für Fussbodenaufbauten 0–25 cm - Für barrierefreies Bauen geeignet Lieferumgang: - Befestigungsmaterial (111.790.00.2)

---

## Prompt 6: Industrial Boiler Circulator

**Input:** Chaufferie industrielle. Remplacement de la pompe de circulation pour le circuit radiateurs. Installation d'un circulateur Grundfos Magna3. Modification des brides de raccordement DN 65. Remplacement de 2 vannes d'arrêt à bille DN 65 en laiton. Vidange et remplissage du circuit.

### AI Extracted Articles (4)
- **Circulateur Grundfos Magna3** (Cat: circulateur, Qty: 1 pce)
- **Vanne d'arrêt à bille DN 65 en laiton** (Cat: robinetterie, Qty: 2 pce)
- **Bride de raccordement DN 65** (Cat: coude_sertir, Qty: null pce)
- **Vidange et remplissage du circuit** (Cat: autre, Qty: null forfait)

### Matched Items (0)

### Missing Items (4)
- ❌ Circulateur Grundfos Magna3 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Circulateur Grundfos Magna3".)
- ❌ Vanne d'arrêt à bille DN 65 en laiton -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Vanne d'arrêt à bille DN 65 en laiton".)
- ❌ Bride de raccordement DN 65 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Bride de raccordement DN 65".)
- ❌ Vidange et remplissage du circuit -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Vidange et remplissage du circuit".)

---

## Prompt 7: Apartment Radiators

**Input:** Remplacement de tous les radiateurs d'un appartement (5 pièces). Dépose de 6 radiateurs acier type 21. Pose de 6 nouveaux radiateurs type 22, avec vannes thermostatiques et coudes de réglage. Raccordement sur tubes acier existants. Purge et essai de fonctionnement.

### AI Extracted Articles (6)
- **Radiateur acier type 21** (Cat: radiateur, Qty: 6 pce)
- **Radiateur acier type 22** (Cat: radiateur, Qty: 6 pce)
- **Vanne thermostatique** (Cat: robinetterie, Qty: 6 pce)
- **Coudes de réglage** (Cat: coude_sertir, Qty: 6 pce)
- **Tuyau acier** (Cat: tuyau_inox, Qty: null m)
- **Purge et essai de fonctionnement** (Cat: autre, Qty: null forfait)

### Matched Items (0)

### Missing Items (6)
- ❌ Radiateur acier type 21 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Radiateur acier type 21".)
- ❌ Radiateur acier type 22 -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Radiateur acier type 22".)
- ❌ Vanne thermostatique -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Vanne thermostatique".)
- ❌ Coudes de réglage -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Coudes de réglage".)
- ❌ Tuyau acier -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Tuyau acier".)
- ❌ Purge et essai de fonctionnement -> No match found (Reason: Aucune correspondance trouvée avec les bons attributs pour "Purge et essai de fonctionnement".)

---

