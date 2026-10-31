# Sources · Élan MSI

Ce document distingue références académiques, source principale automatisée et fiches éditoriales. Les dates propres à chaque fiche figurent dans les données et l’interface ; une importation quotidienne ne remplace pas une consultation de la page d’origine.

## Références académiques consultables

- **CMSI :** [Master 2 Conseil et management des systèmes d’information, Grenoble IAE](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation).
- **Intelligence des données :** [Master 2 Intelligence des données, Grenoble IAE](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees).
- **ARAMIS :** [Master 2 Advanced Research in Management of Information Systems, Grenoble IAE](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system).

Ces pages publiques sont les références consultables pour les parcours. La brochure MSI fournie a aidé à cadrer le projet, mais une mention isolée de « page 3 » n’est pas utilisée comme justification publique.

## BPCE, source principale

Le [catalogue data.gouv.fr](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques) décrit le jeu d’offres publiques du Groupe BPCE. Le pipeline utilise son [export JSON public](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json), filtre le périmètre MSI et regroupe les localisations.

Le poids de BPCE est calculé dans `bpce_share_percent` et présenté comme celui de la source principale, non d’un complément marginal. La licence du jeu ouvert ne s’étend pas aux annonces des autres plateformes.

## Fiches éditoriales

- **Deloitte :** deux synthèses issues des [offres Deloitte sur Welcome to the Jungle](https://www.welcometothejungle.com/fr/companies/deloitte/jobs), consacrées à l’audit IT et à l’AMOA/transformation ; aucun flux Deloitte automatique.
- **Capgemini :** fiches issues du [site carrières Capgemini](https://www.capgemini.com/careers/join-capgemini/job-search/), notamment [Intern Application Consultant, référence 506269, Pologne](https://careers.capgemini.com/job/Wroc%C5%82aw-Intern-Application-Consultant-(with-German)/1406556233/). L’allemand demandé ne signifie pas une localisation en Allemagne.
- **JobTeaser :** deux fiches de conseil et recrutement fonctionnel SAP ; les URL exactes, preuves de profil et dates sont conservées dans `data/curated.json`. Le [portail JobTeaser](https://www.jobteaser.com/en/job-offers) reste un service externe, pas un flux connecté.
- **Archives Welcome to the Jungle :** [Wiremind, Product Owner Data](https://www.welcometothejungle.com/fr/companies/wiremind/jobs/product-owner-data-m-f-internship-paris_paris) et [Navigacom, Consultant junior cybersécurité](https://www.welcometothejungle.com/en/companies/navigacom/jobs/consultant-junior-cybersecurite_puteaux).

Pour ces deux archives, la fermeture a été signalée dans la revue transmise par la propriétaire le 31 octobre 2026. L’extraction des pages n’a pas fourni de confirmation indépendante ; le contrôle navigateur de Wiremind a rencontré un refus de chargement. Le statut archivé est une mesure prudente fondée sur ce signalement, pas une prétendue vérification indépendante.

Les fiches éditoriales sont des résumés originaux abrégés et ne constituent pas une republication intégrale. Leurs conditions d’utilisation et l’offre d’origine priment ; aucun partenariat avec les plateformes ou employeurs n’est revendiqué.

## Actualisation et preuves techniques

La [documentation GitHub sur les événements](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) explique les contraintes des tâches programmées : branche par défaut, délais possibles et désactivation après inactivité d’un dépôt public. Le [workflow du projet](https://github.com/bienvenue2002/observatoire-emploi-data/actions/workflows/pages.yml) permet de contrôler chaque tentative et son résultat.

Les rapports navigateur sont des artefacts temporaires associés au commit testé. La suite et les commandes de reproduction restent versionnées dans le dépôt ; consulter [QA.md](../QA.md) pour distinguer tests exécutables et observations manuelles.
