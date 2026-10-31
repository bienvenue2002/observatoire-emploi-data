#!/usr/bin/env python3
"""Collecte BPCE Open Data -> nettoyage -> annonces uniques -> JSON et CSV.

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
    if re.search(r"\bbusiness\s+analyst", t):
        return "Business Analyst"
    if re.search(r"data\s*scien|machine learning", t):
        return "Data Scientist"
    if re.search(r"data\s*analyst|analyste\s+(?:de\s+)?donnees|business intelligence|decisionnel", t):
        return "Data Analyst / BI"
    if re.search(r"data\s*(?:engineer|architect)|(?:ingenieur|developpeur).*data|big data", t):
        return "Data Engineer / Architecture"
    if re.search(r"\bdata\b", t):
        return "Gouvernance & autres métiers data"
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


def export(records, output, observed_at):
    jobs, matched = transform(records, observed_at)
    output.mkdir(parents=True, exist_ok=True)
    meta = {
        "title": "Observatoire de l'emploi data en France",
        "edition": "Échantillon Groupe BPCE",
        "observed_at": observed_at,
        "source_url": SOURCE_URL, "api_url": API_URL,
        "license": "Licence Ouverte / Open Licence 2.0",
        "license_url": "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
        "raw_rows": len(records),
        "france_rows": sum(norm(r.get("country")) == "france" for r in records),
        "matched_location_rows": matched, "unique_offers": len(jobs),
        "salary_available": sum(j["salary_min"] is not None or j["salary_max"] is not None for j in jobs),
        "scope": "Offres France d'un seul groupe bancaire, collectées à une date donnée. Non représentatif du marché national.",
        "deduplication": "Une annonce par référence source ; les villes multiples sont regroupées.",
        "families": dict(Counter(j["family"] for j in jobs)),
        "pipeline_version": "1.0.0",
    }
    payload = {"meta": meta, "jobs": jobs}
    (output / "jobs.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (output / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    with (output / "jobs.csv").open("w", encoding="utf-8-sig", newline="") as f:
        fields = ["id", "title", "company", "family", "contract", "cities", "regions", "skills", "modified_at", "observed_at", "source_url"]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for j in jobs:
            row = {k: j.get(k, "") for k in fields}
            row.update(cities=" | ".join(sorted(set(x["city"] for x in j["locations"]))),
                       regions=" | ".join(sorted(set(x["region"] for x in j["locations"]))),
                       skills=" | ".join(j["skills"]))
            # Empêche l'interprétation de formules lors d'une ouverture dans Excel.
            writer.writerow({k: "'" + str(v) if str(v).lstrip().startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
    return meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="JSON BPCE local, sans appel réseau")
    parser.add_argument("--output", type=Path, default=ROOT / "site" / "data")
    parser.add_argument("--observed-at", help="Date ISO du téléchargement local (reproductibilité)")
    args = parser.parse_args()
    observed = args.observed_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    if args.input:
        records = json.loads(args.input.read_text(encoding="utf-8"))
    else:
        request = Request(API_URL, headers={"User-Agent": "ObservatoireEmploiData-Educational/1.0", "Accept": "application/json"})
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
    print(json.dumps(export(records, args.output, observed), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
