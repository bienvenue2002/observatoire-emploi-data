#!/usr/bin/env python3
"""Horizon MSI : BPCE Open Data + références éditoriales -> annonces -> JSON/CSV.

Python 3.10+, bibliothèque standard uniquement. Aucune clé API nécessaire.
Les données nominatives des recruteurs ne sont jamais exportées.
"""
import argparse
import csv
import hashlib
import html
import json
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
try:
    from .taxonomy import pathways
except ImportError:
    from taxonomy import pathways

ROOT = Path(__file__).resolve().parents[1]
API_URL = "https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets/groupe-bpce-offres-emploi/exports/json"
SOURCE_URL = "https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques"
SKILLS = {
    "SQL": r"\b(sql|mysql|postgresql|tsql|t-sql|pl/sql)\b",
    "Python": r"\bpython\b",
    "Power BI": r"\bpower\s*bi\b",
    "Excel": r"\bexcel\b",
    "R": r"\blangage\s+r\b|\br\s*(?:/|,|et)\s*python\b|\bpython\s*(?:/|,|et)\s*r\b|\brstudio\b|\bshiny\b",
    "SAS": r"\bsas\b",
    "Tableau": r"\btableau\s+(?:software|desktop|server|prep)\b",
    "Spark": r"\b(?:pyspark|spark)\b",
    "Cloud": r"\b(?:azure|aws|gcp|google cloud)\b",
    "Git": r"\b(?:git|github|gitlab)\b",
    "Agile": r"\b(?:agile|scrum)\b",
    "Machine learning": r"\b(?:machine learning|apprentissage automatique|scikit.learn|xgboost)\b",
    "Databricks": r"\bdatabricks\b",
    "Dataiku": r"\bdataiku\b",
    "ERP / SAP": r"\b(?:erp|sap|s/4hana|s4hana)\b",
    "Jira": r"\bjira\b",
    "Conduite du changement": r"\b(?:conduite du changement|change management)\b",
    "Gestion de projet": r"\b(?:gestion de projet|pilotage de projet|project management)\b",
    "Recette / tests": r"\b(?:recette|tests? fonctionnels?|user acceptance)\b",
    "Cybersécurité": r"\b(?:cybersecurite|cybersecurity|securite informatique)\b",
    "IAM": r"\b(?:iam|identity and access)\b",
    "ITIL": r"\bitil\b",
    "BPMN / UML": r"\b(?:bpmn|uml)\b",
}


def clean(value):
    """Décodage des entités HTML, suppression des balises et espaces multiples."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(str(value or "")))).strip()


def norm(value):
    return "".join(c for c in unicodedata.normalize("NFKD", clean(value).lower())
                   if not unicodedata.combining(c))


def role(title):
    """Classification du seul intitulé, règles lisibles, sans modèle opaque."""
    t = norm(title)
    if re.search(r"\bdatacent(?:er|re)\b|\bacheteur\b", t):
        return None
    if re.search(r"\b(?:auditeur|audit).*(?:systemes? d.information|\bsi\b|\bit\b|informatique)", t):
        return "Auditeur SI"
    if re.search(r"\b(?:cybersecurite|cybersecurity|cyber|securite (?:des )?(?:systemes|informatique|data))\b", t):
        return "Consultant cybersécurité"
    if re.search(r"\bproduct\s*owner\b", t):
        return "Product Owner"
    if re.search(r"\bscrum\s*master\b", t):
        return "Scrum Master"
    if re.search(r"\bbusiness\s+analyst", t):
        return "Business Analyst"
    if re.search(r"\b(?:erp|sap|plm|salesforce)\b", t) and re.search(r"consult|fonctionnel|chef.*projet", t):
        return "Consultant ERP / solutions métier"
    if re.search(r"(?:chef|cheffe|directeur|directrice|charge|chargee|responsable).*projet.*(?:informatique|\bsi\b|\bit\b|digital|numerique|data)", t):
        return "Chef de projet SI"
    if re.search(r"\b(?:amoa|assistance a maitrise d.ouvrage|transformation digitale|consultant.*(?:transformation|systeme.*information|digital|\bsi\b))\b", t):
        return "Conseil & transformation SI"
    if re.search(r"chief data officer|\bcdo\b|data (?:governance|gouvernance|steward)|data quality|gouvernance.*donnee", t):
        return "Chief Data Officer / gouvernance"
    if re.search(r"(?:responsable|head of).*analytics", t):
        return "Responsable Analytics"
    if re.search(r"web\s*analytics|webanalyst|digital analyst", t):
        return "Webanalytics"
    if re.search(r"data\s*scien|machine learning", t):
        return "Data Scientist"
    if re.search(r"data\s*analyst|analyste\s+(?:de\s+)?donnees", t):
        return "Data Analyst"
    if re.search(r"business intelligence|decisionnel|\bconsultant.*\bbi\b", t):
        return "Consultant BI / décisionnel"
    if re.search(r"data\s*(?:engineer|architect)|(?:ingenieur|developpeur).*data|big data", t):
        return "Data Engineer / Architecture"
    if re.search(r"\bdata\b", t):
        return "Autres métiers data"
    return None


def contract(value):
    t = norm(value)
    if "stage" in t:
        return "Stage"
    if any(w in t for w in ("altern", "apprent", "professionnalisation")):
        return "Alternance"
    if t == "cdi":
        return "CDI"
    if t == "cdd":
        return "CDD"
    return clean(value) or "Non renseigné"


def region(value):
    s = clean(value)
    aliases = {"ile de france": "Île-de-France", "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes"}
    return aliases.get(norm(s), s or "Non renseignée")


def skills_in(text):
    t = norm(text)
    return [name for name, pattern in SKILLS.items() if re.search(pattern, t)]


def redact(text):
    """Supprime emails et numéros français éventuels des descriptions publiques."""
    text = clean(text)
    text = re.sub(r"[\w.+-]+@[\w.-]+\.\w+", "[email retiré]", text)
    return re.sub(r"(?<!\d)(?:(?:\+33|0033)\s*|0)[1-9](?:[\s.\-]?\d{2}){4}(?!\d)", "[téléphone retiré]", text)


def modified(value):
    value = clean(value)
    for fmt in ("%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).isoformat()
        except ValueError:
            pass
    return None


def transform(records, observed_at):
    """Une annonce par référence ; les localisations sont conservées en liste."""
    groups = {}
    matched_rows = 0
    for row in records:
        if norm(row.get("country")) != "france":
            continue
        family = role(row.get("title"))
        if not family:
            continue
        matched_rows += 1
        ref = clean(row.get("referencenumber"))
        source_link = clean(row.get("url"))
        # Déduplication par référence, sinon empreinte du lien et du titre.
        key = ref or hashlib.sha256((source_link + clean(row.get("title"))).encode()).hexdigest()[:16]
        location = {"city": clean(row.get("city")) or "Non renseignée", "region": region(row.get("state"))}
        desc = redact(row.get("description"))
        detected = skills_in(clean(row.get("title")) + " " + desc)
        if key not in groups:
            groups[key] = {
                "id": key, "title": clean(row.get("title")), "company": clean(row.get("organization")) or "Groupe BPCE",
                "family": family, "contract": contract(row.get("jobtype")),
                "locations": [], "skills": [], "description": desc,
                "source": "Groupe BPCE · Open Data", "source_url": source_link,
                "source_key": "bpce", "collection_method": "open_data",
                "pathways": pathways(family),
                "observed_at": observed_at, "status": "snapshot",
                "modified_at": modified(row.get("lastmodifieddate")),
                "salary_min": row.get("salary_min"), "salary_max": row.get("salary_max"),
                "remote_source": clean(row.get("teletravail")) or None,
            }
        job = groups[key]
        if location not in job["locations"]:
            job["locations"].append(location)
        job["skills"] = sorted(set(job["skills"]) | set(detected))
        # Conserver la variante descriptive la plus complète des lignes regroupées.
        if len(desc) > len(job["description"]):
            job["description"] = desc
        new_date = modified(row.get("lastmodifieddate"))
        if new_date and (not job["modified_at"] or new_date > job["modified_at"]):
            job["modified_at"] = new_date
    jobs = sorted(groups.values(), key=lambda j: j["modified_at"] or "", reverse=True)
    return jobs, matched_rows


def load_curated(path):
    """Import éditorial local ; pas de scraping non autorisé ni de faux connecteur."""
    records = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    if not isinstance(records, list):
        raise ValueError("Sélection éditoriale : liste attendue.")
    ids, urls = set(), set()
    result = []
    for row in records:
        required = {"id", "title", "company", "family", "contract", "locations", "source",
                    "source_key", "source_url", "observed_at", "description", "skills"}
        if not isinstance(row, dict) or not required.issubset(row):
            raise ValueError("Fiche éditoriale incomplète.")
        if row["id"] in ids or row["source_url"].rstrip("/") in urls:
            raise ValueError("Doublon dans la sélection éditoriale.")
        host = urlparse(row["source_url"])
        allowed = {"www.capgemini.com", "careers.capgemini.com", "www.welcometothejungle.com", "www.jobteaser.com"}
        if host.scheme != "https" or host.hostname not in allowed or not pathways(row["family"]):
            raise ValueError("Source ou famille éditoriale non admise.")
        if not row["locations"] or any(not {"city", "region"}.issubset(x) for x in row["locations"]):
            raise ValueError("Localisation éditoriale manquante.")
        ids.add(row["id"]); urls.add(row["source_url"].rstrip("/"))
        result.append({**row, "description": redact(row["description"]),
                       "pathways": pathways(row["family"]), "collection_method": "editorial",
                       "status": "snapshot", "modified_at": None,
                       "salary_min": None, "salary_max": None, "remote_source": None})
    return result


def export(records, output, observed_at, curated_path=None):
    jobs, matched = transform(records, observed_at)
    bpce_count = len(jobs)
    editorial = load_curated(curated_path) if curated_path else []
    jobs.extend(editorial)
    output.mkdir(parents=True, exist_ok=True)
    meta = {
        "title": "Horizon MSI · Débouchés et opportunités",
        "edition": "Corpus MSI : Open Data BPCE + sélection éditoriale multi-source",
        "observed_at": observed_at,
        "source_url": SOURCE_URL, "api_url": API_URL,
        "license": "BPCE : Licence Ouverte 2.0 ; autres plateformes : liens factuels et synthèses originales, pas de licence ouverte présumée",
        "license_url": "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
        "raw_rows": len(records),
        "france_rows": sum(norm(r.get("country")) == "france" for r in records),
        "matched_location_rows": matched, "unique_offers": len(jobs),
        "bpce_unique_offers": bpce_count, "editorial_offers": len(editorial),
        "sources": dict(Counter(j["source"] for j in jobs)),
        "competency_statistics": "Descriptions intégrales BPCE uniquement ; les fiches éditoriales sont exclues du dénominateur.",
        "salary_available": sum(j["salary_min"] is not None or j["salary_max"] is not None for j in jobs),
        "scope": "Offres France sélectionnées par métiers MSI. Corpus non exhaustif et non représentatif ; accès aux postes soumis au profil demandé.",
        "deduplication": "Une annonce par référence source ; les villes multiples sont regroupées.",
        "families": dict(Counter(j["family"] for j in jobs)),
        "pipeline_version": "2.0.0",
    }
    payload = {"meta": meta, "jobs": jobs}
    (output / "jobs.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (output / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    with (output / "jobs.csv").open("w", encoding="utf-8-sig", newline="") as f:
        fields = ["id", "title", "company", "family", "pathways", "contract", "cities", "regions", "skills", "source", "collection_method", "modified_at", "observed_at", "source_url"]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for j in jobs:
            row = {k: j.get(k, "") for k in fields}
            row.update(cities=" | ".join(sorted(set(x["city"] for x in j["locations"]))),
                       regions=" | ".join(sorted(set(x["region"] for x in j["locations"]))),
                       skills=" | ".join(j["skills"]))
            row["pathways"] = " | ".join(j["pathways"])
            # Empêche l'interprétation de formules lors d'une ouverture dans Excel.
            writer.writerow({k: "'" + str(v) if str(v).lstrip().startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
    return meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="JSON BPCE local, sans appel réseau")
    parser.add_argument("--output", type=Path, default=ROOT / "site" / "data")
    parser.add_argument("--observed-at", help="Date ISO du téléchargement local (reproductibilité)")
    parser.add_argument("--curated", type=Path, default=ROOT / "data" / "curated.json",
                        help="Sélection éditoriale vérifiée, importée sans appel aux plateformes")
    args = parser.parse_args()
    observed = args.observed_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    if args.input:
        records = json.loads(args.input.read_text(encoding="utf-8"))
    else:
        request = Request(API_URL, headers={"User-Agent": "HorizonMSI-Educational/2.0", "Accept": "application/json"})
        # Un export public documenté, pas de scraping de pages ni de contournement.
        with urlopen(request, timeout=90) as response:
            records = json.load(response)
    if not isinstance(records, list) or not records:
        raise ValueError("La source doit être une liste JSON non vide ; ancien instantané conservé.")
    required = {"title", "country", "referencenumber"}
    if any(not isinstance(r, dict) or not required.issubset(r) for r in records):
        raise ValueError("Schéma source modifié ; ancien instantané conservé.")
    jobs, _ = transform(records, observed)
    if not jobs:
        raise ValueError("Aucune offre pertinente ; ancien instantané conservé.")
    print(json.dumps(export(records, args.output, observed, args.curated), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
