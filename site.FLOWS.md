# Parcours à préserver et évolution MSI

## Diversification, démarrage et suivi personnel
- Baseline publique observée avant édition : 28 stages/alternances, disponibilité `current`, aucune carte archivée par défaut.
- Conserver les six langues, le périmètre MSI, les filtres, parcours, ressources, détails, tri, pagination, exports existants et la protection des données.
- Ajouter des collectes publiques SmartRecruiters Sopra Steria et Bosch, bornées et attribuées ; aucune assimilation du flux public à une licence ouverte.
- Valider schémas/dates/URL avant publication ; toute panne de collecte conserve l'instantané précédent. Afficher les volumes réels par source.
- Démarrage : aperçu HTML daté visible avant JavaScript, page complète sans JavaScript, liens recruteurs et flux RSS excluant les archives.
- Afficher seulement métier/pays/contrat au premier niveau ; déplacer études et statut dans les filtres avancés.
- Mode archives explicite, avertissement et retour à la recherche hors archives ; le lien canonique reste sans filtre d'archives.
- Favoris de session en mémoire, filtre favoris, exports CSV/JSON de tous les favoris indépendants des filtres ; annoncer explicitement leur effacement au rechargement. Aucun nouveau stockage navigateur ou compte.
- RSS public sans compte : abonnements dans un lecteur externe, pas de promesse d'alerte e-mail/push.
- Recette : favoris aller/retour/rechargement, exports réels et anti-formules, absence de stockage, six langues, erreur réseau, entrée archives, no-JS, mobile 320/375, sources et RSS XML valide.
- Rejouer la suite existante et les nouveaux tests ; vérifier le déploiement GitHub et l'aperçu hébergé dans des contextes neufs.

## Typography and readability
- Baseline observed in the public app before editing: Manrope; body 16.96 px, metadata 12.8 px, offer titles 14.72 px at a 1440 px viewport.
- Use locally hosted Source Sans 3 on the search page and French resources, retaining the existing colours, content, data, controls and layout structure.
- Increase secondary text to at least 14 px, controls/copy to at least 16 px and offer titles to at least 17 px; preserve browser zoom and responsive font sizing.
- Check both pages at 1440, 768, 375 and 320 px, six interface languages, populated details, long German labels and simulated 200% text scaling.
- Re-run the full browser suite: filters, sorting, pagination, profiles, archives, pathways, international, languages, resources, CSV/JSON downloads, degraded loading, blocked storage and injection protection.
- Verify that the self-hosted font loads, capture desktop/mobile screenshots, and check the public deployment and hosted preview in fresh contexts.
- Use a descriptive English commit message for these changes. Do not rewrite previously published history without explicit approval.

## Recentrage MSI, fiabilité et actualisation quotidienne
- Avant édition : site public international général, 1 555 annonces ; navigation, six langues et filtres fonctionnels. Ce périmètre général est désormais annulé par le propriétaire.
- Accueil et moteur réservés aux métiers reliés au Master MSI, en France et à l'international ; six langues et liens officiels CMSI/ID/ARAMIS conservés. Pas de catégories d'autres formations.
- Navigation vers les ressources françaises : même corpus MSI vivant, pas d'instantané parallèle divergent.
- Offres Wiremind/Navigacom signalées fermées : statut explicite « Offre fermée — exemple archivé », provenance du signalement documentée, exclusion des résultats par défaut ; archives consultables volontairement et statut dans les exports.
- Profils : variantes fin d'études / fin d'étude / Bac+5 / Fin d'études détectées sans confondre expérience passée ou CDI.
- Validation complète avant écriture : URL HTTPS valide, description non vide, référence, intitulé et dates valides ; erreur explicite si fichier éditorial demandé absent. Échec préserve les fichiers de données précédents.
- GitHub Actions quotidien + déclenchement manuel : collecte BPCE, génération temporaire, tests, publication même workflow (les commits GITHUB_TOKEN ne relancent pas d'autres workflows), date de dernière collecte réussie et état du dernier essai.
- Échec d'actualisation : anciennes données et date réussie inchangées ; message d'échec public sans contenu technique sensible. Les fiches éditoriales ne sont pas présentées comme revérifiées par une collecte BPCE.
- Famille gouvernance correctement nommée, CDO seulement perspective ; BPCE clairement source principale, proportion calculée.
- Preuves reproductibles : suite navigateur versionnée, captures générées par la suite, rapports CI ; pas de nombre de contrôles ou de contraste non étayé.
- README et guide : présentation professionnelle du projet et périmètre actuel, sans inventer un statut de travail évalué.

## International, toutes formations et six langues
- Avant modification : site public Élan MSI chargé dans un navigateur, titre « Du master aux métiers », 81 annonces France et interface française.
- Conserver la marque, les 81 références existantes et l'espace pédagogique MSI avec ses cinq vues, graphiques, filtres, détails et exports dans un accès « Ressources MSI » explicitement en français.
- Ouvrir la recherche principale à tous les domaines du corpus BPCE, sans prétendre couvrir toutes les formations ou tous les pays. Conserver les catégories sans résultat et proposer des portails complémentaires clairement distincts des annonces intégrées.
- Pays/territoires issus des champs explicites de la source ; pays absent = inconnu. Ne jamais déduire un pays de la langue demandée. VIE distinct de stage et d'alternance ; aucune équivalence automatique de contrat ou de diplôme entre pays.
- Recherche libre, domaines, pays/territoires, contrat, études, source, compétence, région, tri, pagination, réinitialisation, raccourcis étudiant/international/ARA, détails et exports filtrés.
- Interface complète en fr/en/es/de/ja/zh : navigation, filtres, compteurs, états vides/erreurs, détails, dates, pagination, accessibilité et messages d'export. Les annonces, preuves source et ressources MSI restent en langue d'origine avec avertissement traduit.
- La langue ne change ni les filtres ni le corpus ; choix porté par le paramètre `lang` du lien, repli en mémoire si l’aperçu bloque la mise à jour de l’URL. Aucun stockage navigateur. Changer de langue pendant un détail ouvert.
- Recette : six langues, conservation de la sélection, véritable stage hors France, alternance et VIE distincts, niveau/durée/preuves, formation sans annonce, recherche avec accents/apostrophes, export réel CSV/JSON et anti-formules, Échap et retour focus, lien externe activé, erreur réseau, texte malveillant échappé, ressources historiques et absence de débordement à 375/320 px.
- Revoir README, sources, méthode, guide et version 3 ; publier sur le même dépôt public et le même lien, puis tester la version hébergée dans un contexte neuf.

## Durée, études et textes pour les étudiants
- État observé : Élan MSI, 81 annonces ; CIO Advisory mentionne six mois seulement dans le point de vigilance ; la page Sources affiche encore « Pas de connexion imaginaire ».
- Ajouter durée, niveau d’études et fin d’études aux résultats, détails et exports CSV/JSON ; afficher « Non précisé » en l’absence de donnée, sans durée estimée pour un CDI.
- BPCE : reprendre le champ degree et les durées de contrat explicitement détectables, jamais une durée d’expérience ; garder la preuve textuelle et signaler l’extraction automatique.
- Sept fiches éditoriales : vérifier les pages, distinguer Master en cours et fin d’études ; conserver toute divergence entre encart et description.
- CIO Advisory : six mois, Master ou équivalent et fin d’études ; Business Analyst Supply Chain : six mois dans le descriptif, encart plateforme 4 à 6 mois.
- Sources : titre « D’où viennent les offres ? » ; aucune référence à un document « fourni » inaccessible ; liens académiques officiels consultables dans les vues Métiers et Méthode.
- README et documentation : Élan MSI, 81 annonces, 17 métiers, périmètre MSI et champs nouveaux ; version courte actuelle à fournir sans renvoyer une ancienne pièce jointe.
- Rejouer tous les parcours de la recette V2 ; contrôler les nouveaux champs sur desktop/mobile, leur échappement HTML, les champs absents et les exports réels.

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
