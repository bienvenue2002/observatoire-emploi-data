"""Generate dated no-JS offers, initial preview and RSS from the validated snapshot."""
import json
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET
try:
    from .collect import ROOT, valid_url, validate_date
except ImportError:
    from collect import ROOT, valid_url, validate_date

SITE_URL = "https://bienvenue2002.github.io/observatoire-emploi-data/"


def eligible(payload):
    jobs = [j for j in payload["jobs"] if j["status"] != "closed" and j["contract"] in {"Stage", "Alternance"}]
    for job in jobs:
        if not valid_url(job["source_url"]):
            raise ValueError("Lien recruteur invalide.")
    return sorted(jobs, key=lambda j: j.get("modified_at") or j.get("published_at") or "", reverse=True)


def item_html(job):
    places = " · ".join(", ".join(filter(None, (x["city"], x.get("country")))) for x in job["locations"])
    values = (job["contract"], job.get("duration") or "Durée non précisée",
              job.get("education_level") or "Études non précisées", places)
    return (f'<article class="snapshot-offer"><p>{escape(job["company"])} · {escape(job["source"])}</p>'
            f'<h3><a href="{escape(job["source_url"], quote=True)}" target="_blank" rel="noopener noreferrer">{escape(job["title"])}</a></h3>'
            f'<p>{escape(" · ".join(values))}</p>'
            f'<p>Présence relevée le {escape(job["observed_at"][:10])}. Disponibilité à confirmer auprès du recruteur.</p></article>')


def rss(payload):
    validate_date(payload["meta"]["observed_at"], "Date du flux")
    root = ET.Element("rss", version="2.0")
    channel = ET.SubElement(root, "channel")
    for tag, value in (("title", "Élan MSI · Stages et alternances"), ("link", SITE_URL),
                       ("description", "Sélection MSI hors archives. Vérifier la disponibilité sur la fiche recruteur."),
                       ("language", "fr")):
        ET.SubElement(channel, tag).text = value
    for job in eligible(payload)[:100]:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = f'{job["company"]} : {job["title"]}'
        ET.SubElement(item, "link").text = job["source_url"]
        ET.SubElement(item, "guid", isPermaLink="false").text = "elan-msi:" + job["id"]
        ET.SubElement(item, "description").text = " | ".join((job["contract"], job.get("duration") or "Durée non précisée",
            job.get("education_level") or "Études non précisées", job["source"],
            "Disponibilité à confirmer auprès du recruteur."))
        stamp = job.get("modified_at") or job.get("published_at") or job["observed_at"]
        validate_date(stamp, "Date de l'entrée RSS")
        date = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        ET.SubElement(item, "pubDate").text = format_datetime(date.replace(tzinfo=date.tzinfo or timezone.utc))
    return ET.tostring(root, encoding="unicode", xml_declaration=True)


def build(site):
    site = Path(site)
    payload = json.loads((site / "data/jobs.json").read_text(encoding="utf-8"))
    jobs = eligible(payload)
    date = escape(payload["meta"]["observed_at"][:10])
    preview = (f'<section id="offer-preview" class="offer-preview" aria-labelledby="preview-title">'
        f'<h2 id="preview-title">Déjà quelques pistes à explorer</h2><p>Instantané du {date} : '
        f'{len(jobs)} stages et alternances hors archives. Ces offres restent à vérifier sur le site du recruteur.</p>'
        + "".join(item_html(j) for j in jobs[:3])
        + '<a href="./offres.html">Toutes les offres sans JavaScript</a></section>')
    index_path = site / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index, replacements = re.subn(r"<!-- OFFER_PREVIEW_START -->.*?<!-- OFFER_PREVIEW_END -->",
        lambda _: f"<!-- OFFER_PREVIEW_START -->{preview}<!-- OFFER_PREVIEW_END -->", index, flags=re.S)
    if replacements != 1:
        raise ValueError("Emplacement de l'aperçu absent ou ambigu.")
    page = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Élan MSI · Offres sans JavaScript</title><link rel="stylesheet" href="./base.css"><link rel="stylesheet" href="./style.css?v=4.2.0">'
        '<link rel="stylesheet" href="./global.css?v=4.2.0"><link rel="alternate" type="application/rss+xml" href="./feed.xml" title="Élan MSI"></head>'
        '<body class="global-app"><main class="global-main snapshot-page"><a href="./#offers">Retour à la recherche Élan MSI</a>'
        f'<h1>Stages et alternances MSI</h1><p>{len(jobs)} fiches hors archives, instantané du {date}. '
        'Présence dans une source ne signifie pas poste garanti ouvert. Vérifie les dates, les missions et ton éligibilité sur la fiche recruteur.</p>'
        '<p><a href="./feed.xml">Flux RSS public des 100 entrées les plus récentes</a> · <a href="./data/jobs.csv">Corpus CSV complet, archives identifiées incluses</a></p>'
        + "".join(item_html(j) for j in jobs) + "</main></body></html>")
    # Compute and validate all outputs before writing any generated content.
    feed = rss(payload)
    ET.fromstring(feed)
    index_path.write_text(index, encoding="utf-8")
    (site / "offres.html").write_text(page, encoding="utf-8")
    (site / "feed.xml").write_text(feed, encoding="utf-8")


if __name__ == "__main__":
    build(ROOT / "site")
