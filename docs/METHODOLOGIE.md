# Méthodologie · Élan MSI

La version 4 publie uniquement les débouchés liés au Master MSI, en France et à l’international. Les rattachements aux parcours sont indicatifs et n’établissent ni équivalence de diplôme ni éligibilité individuelle.

## Acquisition et provenance

- **BPCE :** téléchargement unique de l’[export JSON public](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json), sans scraping des pages de recrutement. Son poids est calculé dans les métadonnées et visible dans l’interface.
- **SmartRecruiters :** sélections bornées Sopra Steria/Bosch, six requêtes de douze pages de 100 au maximum et 40 détails étudiants MSI par employeur via l’[API publique documentée](https://developers.smartrecruiters.com/docs/endpoints). Données factuelles, dates de publication/republication explicites, pays source et liens recruteurs ; pas de description intégrale republiée.
- **Éditorial :** `data/curated.json` et `data/international.json` contiennent huit fiches normalisées, dont deux archives. Les dates de consultation et de statut ne sont pas remplacées par la date de collecte BPCE.
- **Limites :** une présence dans l’export n’atteste pas l’ouverture du poste. Les sources ne sont ni exhaustives ni représentatives du marché ; les annonces éditoriales ne sont pas actualisées automatiquement.

## Validation avant écriture

Chaque ligne source doit avoir un titre, une référence, une URL HTTPS exploitable, une description, un type de contrat et une date de modification valide. Le champ pays doit être présent, mais une valeur inconnue reste inconnue ; la date de collecte est également validée.

Un fichier éditorial explicitement demandé mais introuvable est une erreur. Les URL, descriptions, dates éditoriales et statuts reconnus sont contrôlés avant de remplacer les fichiers publics.

L’actualisation est préparée dans un dossier temporaire. Pour chaque source établie comportant au moins dix fiches, une baisse supérieure à 50 % est refusée, sauf revue humaine explicite. L’absence d’une source SmartRecruiters déjà présente et une sélection SmartRecruiters totalement vide sont refusées ; les anciens fichiers sont sauvegardés avant remplacement et restaurés si une opération échoue. Une panne d’une source suspend donc toute la collecte, plutôt que publier un succès partiel trompeur.

## Normalisation et classification

- **Déduplication :** regroupement des lignes par référence source, conservation des localisations distinctes ; le nombre de lignes n’est pas le nombre d’annonces uniques.
- **Périmètre :** reconnaissance de familles MSI via les règles documentées de `taxonomy.py`, puis rattachement à CMSI, ID ou ARAMIS. Le mode public est `msi-international` ; un intitulé RH sans lien MSI n’est pas conservé.
- **Pays :** utilisation des champs explicitement disponibles, sans déduction par langue exigée. VIE, CDI, CDD, stages et alternances gardent des catégories distinctes.
- **Gouvernance :** Data Quality, Data Steward et gouvernance sont regroupés sous « Gouvernance et qualité des données », pas sous l’intitulé de poste CDO.

## Profils étudiants

Le niveau d’études privilégie le champ structuré, avec repli textuel documenté. Les durées sont extraites des formulations explicites ; une durée d’expérience passée ne devient pas une durée de contrat.

« Fin d’études », « fin d’étude » et les variantes d’apostrophe ou d’accent sont reconnues pour les stages et alternances. Des gardes de contexte écartent les formulations telles que « votre précédent stage de fin d’études » ; les extraits justificatifs restent visibles et les valeurs absentes ne sont pas estimées.

## Disponibilité et fraîcheur

- **`source_present` :** référence présente dans l’export BPCE ou l’API publique lors de la dernière collecte réussie ; aucune garantie d’ouverture.
- **`unverified` :** fiche éditoriale dont la disponibilité doit être vérifiée sur la page d’origine.
- **`closed` :** exemple archivé, exclu des résultats par défaut ; origine et date du signalement conservées.

Les deux archives Wiremind et Navigacom ont pour origine `owner_review`, en référence à la revue transmise par la propriétaire du projet. Une vérification automatisée indépendante n’a pas confirmé leur fermeture ; l’interface ne prétend pas le contraire.

`update-status.json` distingue la dernière tentative de la dernière collecte réussie. Une erreur de source ou de validation ne remplace pas le corpus ; le workflow publie l’avertissement avec les anciennes données puis signale l’échec dans GitHub.

## Publication et contrôles

Le workflow quotidien se lance à 04 h 17 UTC et assure lui-même collecte, tests, commit des données et déploiement. Un commit créé avec `GITHUB_TOKEN` ne déclenche pas normalement un autre workflow : la publication n’en dépend donc pas ([documentation GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)).

Les deux pages utilisent des exports miroirs identiques, mais n’offrent plus deux moteurs concurrents. `index.html` porte la recherche, les détails et les exports ; `msi.html` porte l’orientation, les fiches métiers et les références. Les parcours, familles et sources renvoient au moteur avec des critères préremplis validés contre ses options.

Le graphique de compétences est un atelier BPCE replié par défaut, pas un indicateur du marché. Les barres donnent des nombres absolus de mentions « n / N descriptions BPCE ». Les synthèses API et éditoriales restent exclues ; aucune comparaison artificielle entre textes de natures différentes n’est ajoutée. Le clic maintient le périmètre BPCE dans la recherche ; le graphique des localisations est séparément étiqueté « toutes les sources du corpus ».

Le générateur produit également un contenu HTML de repli sur chaque page. Les trois parcours et trois offres datées restent lisibles dans l’espace pédagogique sans JavaScript, pendant le chargement ou après un échec réseau. Ce contenu est régénéré à partir de l’instantané validé lors des publications quotidiennes.

Les commandes, scénarios navigateur, captures produites et limites de la recette sont décrits dans [QA.md](../QA.md). Une recette automatisée ne prouve ni la disponibilité actuelle de chaque annonce ni une conformité d’accessibilité complète.
