# Contrôles d’acceptation

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
