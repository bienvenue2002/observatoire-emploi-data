# Parcours à préserver et évolution MSI

## Renommage Élan MSI
- Avant modification : site public chargé sans connexion, titre Horizon MSI, deux signatures horizonmsi., 81 annonces.
- Vérifier Élan MSI dans le titre du navigateur, la description, le libellé accessible et les deux signatures visuelles, la page Sources, les métadonnées des exports et le générateur Python.
- Exports CSV et JSON : noms de fichiers commençant par elan-msi ; aucune ancienne marque dans les métadonnées.
- Conserver le dépôt et son adresse publique ; ne pas modifier les descriptions d’annonces contenant le mot courant « horizons ».
- Rejouer les cinq vues, les cartes parcours, filtres, recherche, tri, pagination, graphiques, détails, liens, exports, état vide et réinitialisation.
- Contrôler le rendu desktop/mobile, l’absence d’erreur JavaScript et la nouvelle identité dans un contexte neuf après publication.

## État initial observé
- L’accueil DataScope charge 52 annonces uniques et ses indicateurs.
- Recherche sans accent ; filtres métier, région, contrat, compétence ; raccourcis stage/alternance et Auvergne-Rhône-Alpes.
- Graphiques cliquables, réinitialisation, tri et pagination.
- Détail avec localisations, provenance et lien externe ; fermeture par bouton et Échap.
- Exports CSV/JSON de la sélection ; état vide et erreur de chargement sans données inventées.
- Méthodologie et audit accessibles ; rendu desktop et mobile.

## Modification demandée
- Le périmètre ne doit plus être limité aux métiers data, y compris dans le titre, les métadonnées, les exports et la documentation.
- Les trois parcours CMSI, ID et ARAMIS de la brochure sont visibles ; leurs débouchés sont documentés.
- Distinguer premier emploi, fonctions évolutives et carrière académique après doctorat.
- Ajouter des offres vérifiées provenant de Deloitte, Capgemini, Welcome to the Jungle et JobTeaser, sans annoncer de connecteur inexistant.
- Ajouter les filtres parcours et source, une page métiers, une page sources et des liens externes utilisables.
- Préserver les annonces et les localisations ; reclasser le corpus BPCE, ne pas supprimer de données utilisateur.
- Distinguer la collecte BPCE reproductible et la sélection éditoriale non exhaustive.
- Les statistiques de compétences utilisent seulement les descriptions complètes BPCE, pas des résumés éditoriaux.

## Recette V2
- Accueil : trois cartes de parcours ; sélectionner CMSI, revenir à tous les parcours.
- Métiers : filtrer chaque parcours ; chaque fiche renvoie à une source académique et aux offres de sa famille ; état vide explicite si aucune offre.
- Offres : combinaison parcours/source/métier ; raccourcis ; recherche ; tri ; pagination ; détail automatique et éditorial ; liens externes et URL de secours.
- Exports : sélection uniquement, avec parcours, source, mode de collecte et date ; CSV protégé contre les formules.
- Sources : les quatre plateformes demandées sont représentées par des liens vérifiés et des modes d’intégration honnêtes.
- Méthodologie : limites du corpus multi-source, déduplication, absence de salaire estimé, ARAMIS sans faux postes de recherche.
- Mobile 375px et 320px ; desktop ; fermeture des dialogues ; absence d’erreur JS.
- Cas limites : filtres contradictoires ; réseau en erreur ; fiche au titre malveillant ; URI non HTTPS refusée.
- Après déploiement : nouveau contexte, identité Élan MSI, filtre de source, fiche et export vérifiés.
