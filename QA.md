# Contrôles d’acceptation

## Profil étudiant et références publiques, version 2.1

- 22 tests Python : degré structuré et repli textuel, durées explicites et intervalles, cas d’expérience à exclure, valeur inconnue, fiches éditoriales et colonnes CSV.
- 81 annonces et tous leurs champs historiques comparés à la version précédente et conservés. Nouveaux champs : durée pour 30 annonces, niveau pour 73, avancement des études pour 4 ; les autres valeurs restent inconnues.
- Recette navigateur locale : cinq vues, cartes parcours réversibles, graphiques, raccourcis, recherche et filtres, tri, pagination, fiches, fermeture et réinitialisation.
- Recherche étendue : `Bac +4` donne 15 résultats, `6 mois` en donne 29, `fin d'études` en donne 3 ; l’apostrophe typographique et les espaces du niveau sont normalisés.
- JobTeaser : six mois et fin d’études visibles dans les résultats et les détails ; Master ou équivalent pour CIO Advisory, Bac+5 en cours pour Business Analyst. Divergence 4 à 6 / 6 mois conservée dans la preuve dépliable.
- Exports CSV et JSON téléchargés et relus : durée, niveau, fin d’études et preuves présents pour les deux résultats filtrés.
- PLM sans durée : « Non précisée », aucun chiffre substitué. État vide : export désactivé puis réinitialisation réussie.
- Titre « D’où viennent les offres ? » vérifié ; lien des références puis page officielle CMSI ouverts par de vrais clics.
- Écran 1440 px et dialogue 375 px inspectés ; preuve dépliée à 320 px sans débordement. Aucun nouvel échec JavaScript nominal.
- Scénarios défavorables : erreur réseau explicite, aucune démonstration substituée ; balises injectées dans les nouveaux champs échappées, pas d’exécution.
- Les résultats de versions antérieures ci-dessous sont conservés comme historique.

## Renommage Élan MSI, 31 octobre 2026

- 16 tests Python réussis, dont un test de cohérence de la marque et des métadonnées ; syntaxe JavaScript et diff vérifiés.
- Corpus comparé à la version précédente : les 81 annonces sont strictement inchangées.
- Contrôle local : titre, description, signatures et nom accessible ; audit et export JSON au nom Élan MSI ; fichiers CSV/JSON préfixés `elan-msi-offres-`.
- Parcours rejoués : cinq vues, cartes CMSI réversibles, graphiques compétence/région, raccourcis, filtres métiers/source, recherche, pagination, tri, détail, fermeture par Échap, état vide, exports désactivés puis réinitialisation.
- Fiches métiers : 17 au total, filtres CMSI/ID/ARAMIS et idées de projets ; cartes sources et renvoi vers les annonces vérifiés.
- Accueil inspecté à 1440 px et 375 px, sans débordement mobile ni erreur JavaScript nominale.
- L’adresse GitHub Pages et le nom technique du dépôt sont conservés pour préserver les liens existants.

## Résultats V2 Horizon MSI, 31 octobre 2026

- 15 tests unitaires Python réussis ; `node --check site/app.js` réussi.
- 81 annonces : 74 BPCE et 7 éditoriales. Les 52 références de la V1 sont toutes présentes après reclassement.
- 17 fiches métiers ; filtres de fiches : 8 CMSI, 8 ID dont deux métiers connexes, 4 ARAMIS. Les catégories se recoupent.
- 52 assertions interactives/exploratoires exécutées sur Chromium : cartes parcours réversibles, parcours/source, recherche avec/sans accent, métiers vers offres, famille doctorale vide, cinq provenances, tri, pagination, raccourcis, graphiques, fiches et fermeture, méthode et audit.
- Vérification des cinq sources : 74 BPCE, 2 Deloitte via WTTJ, 1 Capgemini carrière, 2 WTTJ autres employeurs, 2 JobTeaser.
- Fiche éditoriale : synthèse et vigilance profil visibles ; fiche BPCE : description complète conservée.
- Export JobTeaser filtré : deux lignes JSON avec parcours/mode de collecte, et deux lignes CSV plus en-tête.
- Les statistiques de compétences ne sont pas calculées sur les fiches éditoriales ; l’absence de dénominateur est signalée.
- Liens activés réellement : annonce Deloitte sur WTTJ, plateforme JobTeaser et parcours officiel Grenoble IAE.
- État vide et retour aux offres ; erreur réseau sans données de substitution ; titre HTML malveillant échappé et URL `javascript:` refusée dans une fixture de test non persistée.
- Inspection desktop 1440 px, mobile 375 px, dialogue 320 px et pied de page en fenêtre courte. Les cinq vues à 320 px ne débordent pas horizontalement.
- Contraste calculé sur 28 libellés secondaires du rendu d’accueil : minimum observé 6,13:1.
- Aucune erreur JavaScript nominale observée. Publication publique du dépôt et GitHub Pages non activés.

Contrôle post-déploiement V2 dans un nouveau contexte Chromium : chargement de 81 annonces, navigation vers les 17 fiches métiers, filtre CMSI à 8 fiches, cinq cartes sources, sélection JobTeaser à deux annonces, téléchargement JSON terminé sans erreur, ouverture et fermeture du détail, absence de débordement à 375 px et aucune erreur JavaScript observée. Le conteneur Perplexity partageable a présenté une vérification Cloudflare au navigateur automatisé ; ces contrôles ont donc été réalisés sur le point d’accès hébergé fourni par le déploiement, et non à travers le conteneur.

Les résultats V1 ci-dessous sont historiques, pas les volumes actuels.

## Résultats de la V1, 31 octobre 2026

- 9 tests unitaires Python réussis ; syntaxe JavaScript vérifiée avec `node --check`.
- Parcours navigateur vérifiés sur Chromium : chargement de 52 annonces, raccourcis stage/région, recherche avec et sans accent, combinaison métier/compétence, clic sur le graphique SQL, pagination, tri, détail et fermeture par Échap/bouton, navigation et audit.
- Export filtré Python : 20 annonces dans le JSON ; nombre de lignes CSV identique à la sélection.
- Recherche sans résultat : état vide, export désactivé et réinitialisation opérationnels.
- Interception réseau en erreur : message explicite, aucun chiffre de substitution.
- Inspection visuelle à 1440 px et 375 px : tableaux transformés en cartes, graphiques lisibles, dialogue utilisable, largeur de document identique à la largeur mobile.
- Aucune erreur JavaScript observée pendant les parcours nominaux.
- Correctif mobile : région sur une ligne distincte de la ville.

Ces résultats décrivent le contrôle local de cette version, pas une garantie de compatibilité avec tous les navigateurs. Le contrôle de l’aperçu hébergé est consigné séparément après déploiement.

## Contrôle de l’hébergement

Dans un nouveau contexte navigateur, le site hébergé a chargé 52 annonces. Le filtre SQL en conserve 27, et le téléchargement JSON contient ces mêmes 27 annonces. La navigation vers la méthodologie fonctionne, sans erreur JavaScript observée.

Le conteneur Perplexity partageable a présenté une vérification Cloudflare au navigateur automatisé. Le contrôle ci-dessus a donc été réalisé sur le point d’accès hébergé fourni par le déploiement, pas à travers ce conteneur. Le CSV a été validé localement ; le JSON a également été validé sur l’hébergement.

## Pipeline

- Schéma et sortie non vide.
- France uniquement, familles déterministes, faux positifs Datacenter / acheteur exclus.
- Une référence unique, union des lieux et des compétences.
- Champs recruteurs exclus, emails et téléphones masqués.
- Date de collecte et source sur chaque annonce.
- Données réelles, pas de fallback synthétique.

## Site

- Chargement de l’instantané et du nombre d’annonces.
- Navigation Vue d’ensemble / Les offres / Méthodologie et retour.
- Recherche accent-insensible, filtres combinés et réinitialisation.
- Raccourcis stages et Auvergne-Rhône-Alpes activables et désactivables.
- Clic sur une barre de graphique qui filtre les résultats.
- Pagination et tri.
- Détails d’une annonce, toutes ses villes, lien source copiable à la main.
- Fermeture du dialogue par bouton et touche Échap.
- Export CSV et JSON de la seule sélection.
- État vide, téléchargement désactivé sans résultat, réinitialisation.
- Rendu desktop et mobile 375 px, absence de débordement et de texte masqué.
- Contrôle post-déploiement de chargement, filtre et export.

## Scénarios hors parcours nominal

- Recherche sans résultat, puis réinitialisation.
- Accès direct à la méthodologie via le hash.
- Région avec annonces multi-localisées.
- Chargement JSON en erreur, sans chiffres fictifs.
