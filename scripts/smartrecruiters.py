"""Public Posting API only. Bounded selection, facts, no private access or full-text republication."""
import json
import re
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

try:
    from .collect import clean, norm, role, skills_in, student_requirements, validate_date, valid_url, region
    from .taxonomy import pathways
except ImportError:
    from collect import clean, norm, role, skills_in, student_requirements, validate_date, valid_url, region
    from taxonomy import pathways

BOARDS = {"SopraSteria1": "Sopra Steria", "BoschGroup": "Bosch"}
BASE = "https://api.smartrecruiters.com/v1/companies/"
QUERIES = ("data", "cyber", "business analyst", "product owner", "stage", "alternance")
PAGE_SIZE, MAX_PAGES, MAX_DETAILS = 100, 12, 40


def get_json(url):
    request = Request(url, headers={"User-Agent": "ElanMSI-Educational/4.2", "Accept": "application/json"})
    with urlopen(request, timeout=45) as response:
        return json.load(response)


def student_contract(title):
    text = norm(title)
    if re.search(r"\balternan|\bapprentice(?:ship)?\b", text):
        return "Alternance"
    if re.search(r"\bstage\b|\bintern(?:ship)?\b|\bpraktikum\b", text):
        return "Stage"
    return None


def posting_job(posting, board, observed_at):
    if board not in BOARDS or not isinstance(posting, dict):
        raise ValueError("Source SmartRecruiters non admise.")
    ident, title = posting.get("id"), posting.get("name")
    if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9-]{1,80}", ident) or not isinstance(title, str) or not title.strip():
        raise ValueError("Identité SmartRecruiters invalide.")
    validate_date(observed_at, "Collecte")
    validate_date(posting.get("releasedDate"), "Publication SmartRecruiters")
    url = posting.get("applyUrl")
    if not isinstance(url, str) or not valid_url(url):
        raise ValueError("URL SmartRecruiters absente.")
    parsed = urlparse(url)
    expected = f"/{board}/{ident}"
    if parsed.hostname != "jobs.smartrecruiters.com" or not (parsed.path == expected or parsed.path.startswith(expected + "-")):
        raise ValueError("Destination SmartRecruiters non admise.")
    location = posting.get("location")
    if not isinstance(location, dict) or not re.fullmatch(r"[a-zA-Z]{2}", str(location.get("country", ""))):
        raise ValueError("Pays explicite SmartRecruiters manquant.")
    sections = posting.get("jobAd", {}).get("sections")
    if not isinstance(sections, dict):
        raise ValueError("Sections SmartRecruiters manquantes.")
    texts = {}
    for key in ("jobDescription", "qualifications", "additionalInformation"):
        section = sections.get(key, {})
        if not isinstance(section, dict) or not isinstance(section.get("text", ""), str):
            raise ValueError("Schéma descriptif SmartRecruiters invalide.")
        texts[key] = clean(section.get("text", ""))
    if not texts["jobDescription"]:
        raise ValueError("Description SmartRecruiters vide.")
    family, contract = role(title), student_contract(title)
    if not family or not contract:
        return None
    text = " ".join(texts.values())
    requirements = student_requirements({"title": title, "description": text, "jobtype": contract})
    if not requirements["education_level"]:
        match = re.search(r"\b(?:Bac\s*\+\s*\d(?:\s*(?:à|/|ou|-)\s*\+?\d)?|Master\s*[12])\b", texts["qualifications"], re.I)
        if match:
            requirements.update(education_level=re.sub(r"\s*\+\s*", "+", match.group()),
                                education_note="Niveau explicite dans la rubrique Qualifications, sans équivalence déduite.")
    if not requirements["duration"]:
        match = re.search(r"\b(?:durée|duration)\s*:\s*(\d{1,2})\s*(mois|months?)\b", text, re.I)
        if match:
            requirements.update(duration=f"{match.group(1)} {match.group(2)}", duration_note="Durée explicitement indiquée ; à confirmer auprès du recruteur.")
    if not requirements["duration"]:
        match = re.search(r"(?:internship|placement)[^.]{0,30}?(?:lasting|of|for)\s+(\d{1,2})\s+months?\b|(\d{1,2})[- ]month\s+(?:internship|placement)", text, re.I)
        if match:
            requirements.update(duration=f"{match.group(1) or match.group(2)} months", duration_note="Durée explicite de stage ; à confirmer auprès du recruteur.")
    if not requirements["education_level"]:
        match = re.search(r"\b(?:master[’']?s?|bachelor[’']?s?)\s+(?:degree|student)\b", texts["qualifications"], re.I)
        if match:
            requirements.update(education_level=match.group(), education_note="Libellé source, sans équivalence internationale déduite.")
    # Evidence retains short factual values, never complete recruiter paragraphs.
    requirements.update(duration_evidence=requirements["duration"],
                        education_evidence=requirements["education_level"],
                        study_stage_evidence=requirements["study_stage"],
                        requirements_method="public_posting_facts")
    detected = skills_in(title + " " + text)
    city = clean(location.get("city")) or "Non renseignée"
    code = location["country"].upper()
    source_contract = clean(posting.get("typeOfEmployment", {}).get("label")) or "Non précisé"
    return {
        "id": f"sr-{board.lower()}-{ident}", "title": clean(title), "company": BOARDS[board],
        "family": family, "domain": family, "contract": contract,
        "source_contract": f"{source_contract} ; catégorie issue de l’intitulé : {contract}",
        **requirements,
        "locations": [{"city": city, "region": region(location.get("region", "")) if code == "FR" else clean(location.get("region")),
                       "country_code": code, "country": code,
                       "country_evidence": {"country": location["country"]}}],
        "skills": detected,
        "description": f"Poste : {clean(title)}. Entreprise : {BOARDS[board]}. Localisation : {city} ({code}). "
                       + ("Outils et compétences repérés : " + ", ".join(detected) + ". " if detected else "")
                       + "Cette fiche reprend des faits structurés, pas le descriptif intégral. Consulte la fiche du recruteur pour les missions, les exigences et la disponibilité.",
        "source": f"{BOARDS[board]} · SmartRecruiters", "source_key": f"sr-{board.lower()}",
        "source_url": url.split("?")[0], "collection_method": "public_api", "pathways": pathways(family),
        "observed_at": observed_at, "status": "source_present", "status_origin": "public_posting_api",
        "status_checked_at": observed_at, "modified_at": posting["releasedDate"],
        "published_at": posting["releasedDate"], "salary_min": None, "salary_max": None,
        "remote_source": None, "status_note": "Présente dans l’API publique au moment de la collecte ; disponibilité à confirmer sur la fiche recruteur.",
    }


def collect(observed_at, fetcher=get_json):
    jobs, reports = [], []
    for board, name in BOARDS.items():
        candidates, truncated = {}, False
        for query in QUERIES:
            for page in range(MAX_PAGES):
                response = fetcher(f"{BASE}{board}/postings?{urlencode({'q':query,'limit':PAGE_SIZE,'offset':page*PAGE_SIZE})}")
                if not isinstance(response, dict) or not isinstance(response.get("content"), list) or not isinstance(response.get("totalFound"), int):
                    raise ValueError("Liste SmartRecruiters invalide.")
                rows, total = response["content"], response["totalFound"]
                if total < 0 or (not rows and total > page * PAGE_SIZE):
                    raise ValueError("Pagination SmartRecruiters incohérente.")
                for row in rows:
                    if not isinstance(row, dict) or not isinstance(row.get("name"), str) or not isinstance(row.get("id"), str):
                        raise ValueError("Ligne SmartRecruiters incomplète.")
                    if not re.fullmatch(r"[A-Za-z0-9-]{1,80}", row["id"]):
                        raise ValueError("Référence SmartRecruiters invalide.")
                    validate_date(row.get("releasedDate"), "Publication listée")
                    if role(row["name"]) and student_contract(row["name"]):
                        candidates[row["id"]] = row
                if (page + 1) * PAGE_SIZE >= total:
                    break
                if page == MAX_PAGES - 1:
                    truncated = True
        ordered = sorted(candidates.values(), key=lambda x: x["releasedDate"], reverse=True)
        retained = []
        for row in ordered[:MAX_DETAILS]:
            try:
                posting = fetcher(f"{BASE}{board}/postings/{row['id']}")
            except HTTPError as error:
                if error.code in (404, 410):
                    continue  # Removed between listing and details, never published.
                raise
            if posting.get("id") != row["id"]:
                raise ValueError("Identité du détail différente de la liste.")
            job = posting_job(posting, board, observed_at)
            if job:
                retained.append(job)
        # Empty source can signal changed schema/query behaviour; require manual review.
        if not retained:
            raise ValueError(f"Sélection SmartRecruiters vide ({board}) ; revue nécessaire.")
        jobs.extend(retained)
        reports.append({"key": f"sr-{board.lower()}", "name": name, "offers": len(retained),
                        "observed_at": observed_at, "bounded_selection": True,
                        "truncated": truncated or len(ordered) > MAX_DETAILS,
                        "max_pages_per_query": MAX_PAGES, "max_details": MAX_DETAILS,
                        "url": f"https://jobs.smartrecruiters.com/?company={board}"})
    return jobs, reports
