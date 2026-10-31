# Contrôles d’acceptation

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
