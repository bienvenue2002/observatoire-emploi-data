# Méthodologie · DataScope

L’objectif est de montrer une chaîne de données lisible et reproductible. L’objectif n’est pas de produire une statistique nationale de l’emploi.

## Source et statut des données

- **Producteur :** Groupe BPCE.
- **Catalogue :** https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques
- **Export JSON public :** https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json
- **Licence :** Licence Ouverte / Open Licence 2.0, indiquée dans le catalogue.
- **Unité source :** une ligne d’annonce/localisation.
- **Unité analytique :** une référence d’annonce unique.
- **Statut :** instantané (`snapshot`), pas validation en temps réel d’un poste.

Chaque annonce garde sa source et sa date de collecte. La date de modification source n’est jamais assimilée à la date de publication. Les liens vers les employeurs doivent être consultés pour vérifier l’état actuel d’une offre ; la collecte ne garantit pas qu’elle soit encore ouverte.

## Transformation

1. Vérifier que l’export est une liste de dictionnaires avec les champs attendus.
2. Conserver uniquement `country = France`, après normalisation.
3. Décoder les entités HTML et supprimer les balises.
4. Classifier l’intitulé selon des règles, dans cet ordre :
   - exclure les acheteurs et datacenters ;
   - Business Analyst ;
   - Data Scientist / machine learning ;
   - Data Analyst / business intelligence / décisionnel ;
   - Data Engineer, architecture et Big Data ;
   - autres intitulés contenant le mot entier « data ».
5. Normaliser les contrats de stage et d’alternance, ainsi que certaines variantes de régions.
6. Regrouper par référence source. Si elle manque, utiliser une empreinte du lien et du titre.
7. Réunir les localisations et les mentions de compétences des variantes.
8. Conserver la description la plus longue et la date de modification la plus récente.
9. Exporter JSON, CSV et audit de collecte.

Cette taxonomie peut inclure des métiers connexes ou en manquer. Elle doit être évaluée sur des exemples annotés avant toute affirmation de performance.

## Calcul des indicateurs

- **Nombre d’annonces :** nombre de références distinctes après tous les filtres.
- **Stages et alternance :** annonces dont le contrat normalisé appartient à ces deux valeurs.
- **Régions :** nombre de régions distinctes renseignées dans les annonces sélectionnées.
- **Compétence la plus citée :** mot-clé détecté dans le plus grand nombre d’annonces sélectionnées.
- **Part d’une compétence :** annonces mentionnant ce mot-clé divisées par toutes les annonces sélectionnées. Une annonce peut mentionner plusieurs compétences ; le total des pourcentages peut dépasser 100 %.
- **Répartition régionale :** nombre de références distinctes présentes dans chaque région. Une offre multi-régions compte une fois par région ; la somme des barres peut dépasser le nombre d’annonces.

Les graphiques affichent les sept premières catégories. Les filtres restent disponibles pour toutes les catégories détectées.

## Dictionnaire des champs exportés en JSON

| Champ | Sens |
|---|---|
| `id` | Référence source, sinon empreinte de secours |
| `title` | Intitulé nettoyé |
| `company` | Organisation source, à défaut Groupe BPCE |
| `family` | Famille métier déduite par règle |
| `contract` | Type de contrat normalisé |
| `locations` | Liste de couples ville/région |
| `skills` | Mentions détectées, uniques par annonce |
| `description` | Description nettoyée ; emails et téléphones français masqués |
| `source` / `source_url` | Producteur et lien vers l’annonce |
| `observed_at` | Date UTC du téléchargement de l’export |
| `modified_at` | Dernière modification source, si lisible ; fuseau non précisé par le champ source |
| `status` | `snapshot` |
| `salary_min` / `salary_max` | Valeurs source, éventuellement nulles ; pas annualisées |
| `remote_source` | Champ source télétravail, éventuellement null |

Les champs nom et email du recruteur ne sont pas repris du brut. Le masquage par expressions régulières des descriptions n’est pas une garantie exhaustive d’anonymisation de tout texte libre.

## Limites

Un seul groupe bancaire ne permet pas une inférence sur le marché national, ni une comparaison représentative entre villes. Les décomptes ne mesurent pas le nombre de recrutements : une annonce peut correspondre à plusieurs postes, être multi-localisée, ou ne plus être ouverte.

Un instantané ne mesure pas une tendance. Les descriptions ne distinguent pas automatiquement une compétence exigée d’une compétence souhaitée, d’un outil historique ou d’un outil cité dans la présentation de l’entreprise.

Une absence de détection n’établit pas qu’une compétence est absente. Les règles prudentes pour R et Tableau réduisent certains faux positifs mais peuvent créer des faux négatifs. Aucun taux de précision n’est revendiqué.

Les salaires structurés sont absents de l’instantané initial : aucune moyenne n’est publiée. Une mention de télétravail dans le texte n’est pas interprétée automatiquement.

## Vérification et reproductibilité

Les tests portent sur les règles de transformation, notamment la déduplication, les faux positifs de compétences, les entités HTML et l’exclusion des champs recruteurs. Ils ne valident pas l’exactitude de toutes les annonces.

Le fichier `meta.json` conserve les volumes de chaque étape et la version du pipeline. Le brut n’est pas partagé ; la source peut évoluer. Une reproduction exacte exige le même export brut et sa date de téléchargement, renseignée via `--observed-at`.
