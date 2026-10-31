# Méthodologie · Élan MSI

Élan MSI sert à explorer les débouchés du Master MSI, pas à estimer le marché national. Les décisions d’orientation et de candidature restent soumises au programme officiel et au profil demandé par chaque employeur.

## Périmètre académique

Le catalogue couvre CMSI, Intelligence des données et ARAMIS. Références publiques, consultées le 31 octobre 2026 : Grenoble IAE – INP, UGA, [Master 2 Conseil et Management des Systèmes d’Information, rubrique Débouchés professionnels](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation), [Master 2 Intelligence des Données, rubrique Débouchés professionnels](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees) et [Master 2 Advanced ReseArch in Management of Information Systems, rubrique Careers](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system). Data Scientist et Data Engineer restent signalés comme métiers connexes, et non comme intitulés directement cités par ces pages.

Les [pages CMSI](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation), [ID](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees) et [ARAMIS](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system) permettent de consulter les références officielles. Le site ne reprend pas leurs chiffres d’insertion ou salaires : il ne les confond pas avec ceux de son corpus.

`scripts/taxonomy.py` rattache des familles à un ou plusieurs parcours. Ces rattachements sont indicatifs : ils n’établissent ni une équivalence de diplôme ni l’éligibilité à un poste. ARAMIS comprend aussi le conseil et l’audit ; ses offres rattachées ne sont pas des offres doctorales.

## Sources et droits

- **BPCE :** [catalogue public](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques), [export JSON](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json), Licence Ouverte 2.0 avec attribution.
- **Autres plateformes :** sélection éditoriale de pages publiques, détaillée dans [SOURCES.md](SOURCES.md). Aucune licence ouverte n’est présumée. Les fiches contiennent des faits structurés, un lien et une synthèse originale, sans reproduction de la description complète.
- **Accès privés :** pas de compte candidat, d’espace école, d’authentification contournée ni d’API non autorisée.

## Transformation BPCE

Le script vérifie le schéma, conserve les lignes France, nettoie le HTML, normalise contrats/régions et classe les intitulés par règles ordonnées. Audit, cybersécurité, produit et business analysis précèdent les règles génériques data. Les domaines voisins ERP/PLM sont regroupés sous « solutions métier », sans assimiler PLM à ERP.

La référence est la clé de regroupement ; à défaut, une empreinte du titre et du lien sert de secours. Les localisations et compétences des variantes sont réunies, la description la plus longue conservée et la date de modification la plus récente retenue.

Les intitulés contenant « data » sans correspondance précise restent dans « Autres métiers data », jamais assimilés automatiquement à un Chief Data Officer. Les tests vérifient notamment qu’un chef de projet événementiel ou un auditeur financier n’entre pas dans les familles SI.

## Sélection éditoriale

`data/curated.json` conserve les faits vérifiés et la date de consultation de chaque page. `load_curated()` valide le schéma, les doublons et les domaines HTTPS admis. La famille est choisie par lecture de l’annonce ; les parcours sont ajoutés via la même taxonomie que BPCE.

La sélection n’est ni exhaustive ni un échantillon aléatoire. Relancer le pipeline importe le fichier local, mais ne revérifie pas les pages. Les fiches anciennes comportent un avertissement ; une page affichant explicitement « poste pourvu » est écartée.

Les identifiants/URLs sont uniques dans cette sélection. Le dédoublonnage entre plateformes n’est pas garanti lorsqu’une offre existe sous des URLs différentes ; aucun chevauchement identifié n’est volontairement ajouté.

## Indicateurs et dénominateurs

- **Annonces, stages, régions :** calculés sur toutes les sources après application des filtres.
- **Compétence dominante et graphique :** seulement sur les offres `collection_method = open_data` de la sélection. Une compétence compte au plus une fois par annonce ; le dénominateur est le nombre d’offres BPCE sélectionnées, pas le total incluant les fiches éditoriales.
- **Tags éditoriaux :** issus de la lecture de la page d’origine ; filtrables, mais exclus des comparaisons de fréquence.
- **Régions :** chaque annonce compte au plus une fois par région. Une offre multi-régions peut contribuer à plusieurs barres.
- **Parcours :** plusieurs rattachements sont possibles ; leurs comptes ne s’additionnent pas au total du corpus.
- **Sept premières catégories :** seuls les sept premiers mots-clés ou régions sont tracés ; les listes de filtres gardent toutes les valeurs.

Une mention n’est pas nécessairement une exigence. L’absence de détection n’établit pas l’absence d’une compétence ; les regex prudentes pour R/Tableau créent aussi des faux négatifs.

## Champs additionnels de la V2

Le schéma initial est enrichi sans retrait de champ : `pathways`, `source_key`, `collection_method`, et éventuellement `published_at` / `eligibility_note`. Toutes les 52 références initiales sont conservées dans les 81 annonces de la V2 ; les familles peuvent être reclassées.

`observed_at` est le moment du téléchargement BPCE ou la date de consultation éditoriale. `published_at` est une date de publication disponible sur certaines pages ; `modified_at` est une modification source, non une publication. Le champ BPCE ne fournit pas son fuseau ; le site n’en tire aucune analyse horaire.

Le CSV complet et l’export filtré ont des colonnes adaptées à leur usage. Tous deux conservent provenance, parcours et date. Le JSON filtré contient des lignes aplaties et un bloc de métadonnées dont `filtered_count` est propre à l’export ; les autres volumes décrivent le corpus complet.

## Profil étudiant

`education_level` reprend le champ BPCE `degree`, ou à défaut une mention explicite de type niveau/formation Bac+N ou Master 1/2 dans le texte ; la preuve et le mode d’extraction sont conservés. Pour les fiches éditoriales, le niveau est vérifié sur la page d’origine. `duration` conserve une durée explicite de stage, CDD ou alternance ; une ancienneté ou une expérience exigée n’est pas une durée de contrat. Le pipeline ne calcule pas de durée pour un CDI. Les valeurs inconnues restent nulles et s’affichent « Non précisé ». Un champ `study_stage` distingue, si la source le dit, un Master en cours d’un stage de fin d’études.

Les champs `duration_evidence`, `education_evidence` et `study_stage_evidence` conservent de courts extraits justificatifs. `requirements_method` distingue `bpce_structured_and_text` et `editorial_verified`. Les champs de notes gardent les réserves, dont la divergence quatre à six mois / six mois de l’offre Business Analyst Supply Chain. La détection automatique BPCE n’est pas exhaustive ; la description d’origine reste à vérifier.

Le schéma 2.1 est additif : les champs et références historiques restent inchangés. Les valeurs nouvelles et leurs preuves sont présentes dans les résultats, détails et exports ; les anciens lecteurs JSON peuvent ignorer ces champs.

## Salaires, vie privée et limites

Aucun salaire n’est annualisé, aucun télétravail n’est inféré d’un champ manquant. Les chiffres salariaux de certains textes ou plateformes ne sont pas repris sans unité et période fiables ; il n’y a pas de moyenne salariale.

Les champs recruteurs BPCE sont exclus. Emails et numéros français repérés dans le texte sont masqués, sans garantie exhaustive d’anonymisation. Aucun CV, compte, mot de passe ou candidature n’est stocké.

BPCE reste majoritaire : les chiffres ne décrivent pas la demande des recruteurs en général. Un instantané ne mesure pas une tendance ; une annonce n’est pas nécessairement un poste unique ou encore ouvert. Les parcours doctoraux et les familles absentes du corpus restent visibles sans fausses offres.

## Reproductibilité et tests

Quinze tests unitaires couvrent règles de classification, familles/parcours, faux positifs de compétences, déduplication, sélection éditoriale, URLs et export multi-source. Ils ne certifient ni toutes les classifications ni la disponibilité d’une annonce.

Le brut BPCE initial n’est pas partagé ; une reproduction exacte nécessite le même export et sa date. Les fichiers nettoyés sont versionnés, de même que les sept fiches éditoriales et leurs dates. Les contrôles navigateur sont consignés dans `QA.md`.
