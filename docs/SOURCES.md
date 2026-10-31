# Journal des sources · Élan MSI

Pages consultées le 31 octobre 2026. La consultation confirme le contenu visible de la page, pas l’ouverture garantie du poste ni la compatibilité de tous les profils MSI.

## Formation

La brochure utilisateur MSI-20WEB, page 3, est la référence principale. Les compléments officiels sont [CMSI](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-conseil-et-management-des-systemes-dinformation), [ID](https://iae.grenoble-inp.fr/fr/nos-formations/master-2-intelligence-des-donnees) et [ARAMIS](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system).

Le programme ARAMIS distingue la poursuite en doctorat et l’accès ultérieur aux carrières académiques ; les fiches du site conservent cette distinction, conformément à la [page officielle ARAMIS](https://iae.grenoble-inp.fr/en/our-programs/master-2-advanced-research-in-management-of-information-system).

## Sept références éditoriales

| Employeur | Intitulé et page consultée | Lieu / contrat relevés |
|---|---|---|
| Deloitte | [Consultant junior audit IT](https://www.welcometothejungle.com/fr/companies/deloitte/jobs/consultant-junior-audit-it-f-h_paris) | Paris / CDI, selon cette même page |
| Deloitte | [Consultant Junior AMOA Transformation & Technologie IA/Data](https://www.welcometothejungle.com/fr/companies/deloitte/jobs/consultant-junior-amoa-transformation-technologie-ia-data-f-h_toulouse) | Toulouse / CDI, selon cette même page |
| Capgemini Engineering | [Consultante / Consultant fonctionnel PLM - Stage](https://www.capgemini.com/fr-fr/jobs/549022-fr_FR+sap_btp/) | Toulouse / stage, selon cette même page |
| Wiremind | [Product Owner Data - Internship - Paris](https://www.welcometothejungle.com/fr/companies/wiremind/jobs/product-owner-data-m-f-internship-paris_paris) | Paris / stage, selon cette même page |
| Navigacom | [Consultant(e) Junior(e) Cybersécurité](https://www.welcometothejungle.com/en/companies/navigacom/jobs/consultant-junior-cybersecurite_puteaux) | Paris / CDI, selon cette même page ; le lieu affiché prévaut sur l’ancien segment « puteaux » de l’URL |
| Capgemini Invent | [Consultante / Consultant CIO Advisory - Stage, sur JobTeaser](https://www.jobteaser.com/en/job-offers/3e24e59b-a298-48a0-b3da-2cbca1c6fa34-capgemini-invent-consultante-consultant-cio-advisory-stage) | Issy-les-Moulineaux / stage, selon cette même page |
| Capgemini | [Business Analyst Supply Chain - Stage, sur JobTeaser](https://www.jobteaser.com/en/job-offers/0f85b343-1448-464a-a59b-f8ea406dfa47-capgemini-business-analyst-supply-chain-stage) | Toulouse / stage, selon cette même page |

Les faits détaillés sont enregistrés dans `data/curated.json` avec l’URL exacte. Les descriptions du site sont des synthèses originales ; les tags sont des mots-clés lus dans les annonces, pas une liste exhaustive des exigences.

Les pages Wiremind et Navigacom indiquent une publication ancienne ; les fiches affichent ce point de vigilance et ne prétendent pas qu’une nouvelle offre vient d’être publiée ([Wiremind](https://www.welcometothejungle.com/fr/companies/wiremind/jobs/product-owner-data-m-f-internship-paris_paris), [Navigacom](https://www.welcometothejungle.com/en/companies/navigacom/jobs/consultant-junior-cybersecurite_puteaux)).

## Contrôles et exclusions

- **Poste pourvu :** l’annonce [Stage SAP Supply chain, careers.capgemini.com](https://careers.capgemini.com/job/Issy-les-Moulineaux-Stage-Consultante-Consultant-SAP-Supply-chain/1253828901/) affiche explicitement « Désolé, ce poste est déjà pourvu » ; elle n’est pas intégrée.
- **Deloitte dynamique :** le [site carrières officiel](https://www.deloitte.com/fr/fr/careers/content/job/results.html) fournit une enveloppe dynamique insuffisante pour vérifier les champs par lecture texte. Les deux fiches incluses sont donc attribuées à « Deloitte · via Welcome to the Jungle », pas à un connecteur officiel Deloitte.
- **Rémunération ambiguë :** le champ de la [fiche Business Analyst Supply Chain](https://www.jobteaser.com/en/job-offers/0f85b343-1448-464a-a59b-f8ea406dfa47-capgemini-business-analyst-supply-chain-stage) n’est ni converti en zéro ni exploité dans une moyenne.
- **Espace école :** la [page officielle Grenoble INP sur le Career Center](https://www.grenoble-inp.fr/fr/entreprises/informations-prealables-sur-vos-donnees-personnelles-depot-career-center-by-jobteaser) présente le service JobTeaser ; aucun espace authentifié n’a été consulté ni importé.

## Complément BPCE

Le [catalogue BPCE data.gouv.fr](https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques) décrit la source sous Licence Ouverte 2.0. L’export utilisé est [le JSON public documenté](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json).

Le corpus V2 réutilise le téléchargement initial du 31 octobre 2026 à 01:48:12 UTC : pas de changement artificiel de sa date après reclassement. Les volumes 1 888 → 1 785 → 192 → 74 sont des résultats du pipeline local, pas des volumes annoncés par les plateformes.
