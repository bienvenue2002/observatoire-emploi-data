import copy
import json
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET
from scripts.smartrecruiters import posting_job, collect, BOARDS, student_contract
from scripts.build_public import rss, build
from scripts.collect import ROOT, export
from scripts.refresh import refresh, PUBLIC_FILES
from test_reliability import row


def posting(board="SopraSteria1"):
    return {"id": "123", "name": "Stage - Data Analyst",
            "releasedDate": "2026-10-30T10:00:00Z",
            "applyUrl": f"https://jobs.smartrecruiters.com/{board}/123-data-analyst?oga=true",
            "location": {"city": "Paris", "region": "Ile-de-France", "country": "fr"},
            "typeOfEmployment": {"label": "Full-time"},
            "jobAd": {"sections": {
                "jobDescription": {"text": "Stage data analyst avec Python et SQL. Durée : 6 mois."},
                "qualifications": {"text": "Vous êtes en fin d’études Bac+5."}}}}


class FollowTests(unittest.TestCase):
    def test_contract_from_explicit_title_not_full_time(self):
        job = posting_job(posting(), "SopraSteria1", "2026-10-31")
        self.assertEqual(job["contract"], "Stage")
        self.assertIn("Full-time", job["source_contract"])
        self.assertEqual(job["education_level"], "Bac+5")
        self.assertEqual(job["duration"], "6 mois")
        self.assertEqual(job["study_stage"], "Fin d’études")
        self.assertEqual(job["locations"][0]["country_code"], "FR")
        self.assertEqual(job["status"], "source_present")
        self.assertNotIn("?oga", job["source_url"])
        self.assertNotIn("Vous êtes", job["description"])

    def test_internal_is_not_internship_and_non_msi_excluded(self):
        self.assertIsNone(student_contract("Internal Data Analyst"))
        source = posting()
        source["name"] = "Stage - Commercial"
        self.assertIsNone(posting_job(source, "SopraSteria1", "2026-10-31"))

    def test_invalid_source_schema_dates_and_links_rejected(self):
        variants = [
            {"releasedDate": "broken"}, {"applyUrl": "javascript:alert(1)"},
            {"applyUrl": "https://jobs.smartrecruiters.com.evil.test/SopraSteria1/123"},
            {"applyUrl": "https://jobs.smartrecruiters.com/BoschGroup/123"},
            {"applyUrl": "https://jobs.smartrecruiters.com/SopraSteria1/1234-wrong-reference"},
            {"location": {"city": "Paris"}}, {"jobAd": {"sections": {}}},
            {"id": "../private"}, {"name": ""}]
        for changes in variants:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                posting_job({**posting(), **changes}, "SopraSteria1", "2026-10-31")

    def test_public_collection_deduplicates_queries_and_never_uses_ref_url(self):
        calls = []
        def fake(url):
            calls.append(url)
            board = next(b for b in BOARDS if f"/{b}/" in url)
            detail = posting(board)
            if "?" not in url:
                return detail
            return {"totalFound": 1, "content": [{
                "id": detail["id"], "name": detail["name"],
                "releasedDate": detail["releasedDate"], "ref": "https://evil.test/private"}]}
        jobs, reports = collect("2026-10-31", fake)
        self.assertEqual(len(jobs), 2)
        self.assertEqual(len({j["id"] for j in jobs}), 2)
        self.assertTrue(all(s["offers"] == 1 and s["bounded_selection"] for s in reports))
        self.assertTrue(all(url.startswith("https://api.smartrecruiters.com/v1/companies/") for url in calls))

    def test_source_failure_keeps_entire_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "data"
            export([row()], target, "2026-10-30", scope="msi-international")
            before = {name: (target / name).read_bytes() for name in PUBLIC_FILES}
            def broken(_):
                raise ValueError("bad schema")
            self.assertFalse(refresh(target, loader=lambda: [row()], attempted_at="2026-10-31", extra_loader=broken))
            self.assertEqual(before, {name: (target / name).read_bytes() for name in PUBLIC_FILES})

    def test_candidates_beyond_first_two_pages_are_not_missed(self):
        offsets = []
        def fake(url):
            from urllib.parse import parse_qs, urlparse
            board = next(b for b in BOARDS if f"/{b}/" in url)
            source = posting(board)
            if "?" not in url:
                return source
            offset = int(parse_qs(urlparse(url).query)["offset"][0])
            offsets.append(offset)
            name = source["name"] if offset == 200 else "Stage - Commercial"
            return {"totalFound": 201, "content": [{"id": "123", "name": name, "releasedDate": source["releasedDate"]}]}
        jobs, _ = collect("2026-10-31", fake)
        self.assertEqual(len(jobs), 2)
        self.assertIn(200, offsets)

    def test_source_missing_after_previous_success_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "data"
            export([row()], target, "2026-10-30", scope="msi-international",
                   additional_sources=[{"key": "sr-test", "offers": 12}])
            before = (target / "jobs.json").read_bytes()
            self.assertFalse(refresh(target, loader=lambda: [row()], attempted_at="2026-10-31"))
            self.assertEqual(before, (target / "jobs.json").read_bytes())

    def test_feed_excludes_archives_and_has_stable_ids(self):
        payload = json.loads((ROOT / "site/data/jobs.json").read_text())
        root = ET.fromstring(rss(payload))
        items = root.findall("./channel/item")
        self.assertGreater(len(items), 0)
        self.assertLessEqual(len(items), 100)
        closed = {j["source_url"] for j in payload["jobs"] if j["status"] == "closed"}
        self.assertFalse(closed.intersection(i.findtext("link") for i in items))
        ids = [i.findtext("guid") for i in items]
        newer = copy.deepcopy(payload)
        newer["meta"]["observed_at"] = "2026-11-01"
        self.assertEqual(ids, [i.findtext("guid") for i in ET.fromstring(rss(newer)).findall("./channel/item")])
        self.assertEqual(len(ids), len(set(ids)))

    def test_build_no_js_is_dated_escaped_and_repeatable(self):
        with tempfile.TemporaryDirectory() as folder:
            site = Path(folder)
            (site / "data").mkdir()
            payload = json.loads((ROOT / "site/data/jobs.json").read_text())
            job = next(j for j in payload["jobs"] if j["status"] != "closed" and j["contract"] == "Stage")
            job["title"] = "<img src=x onerror=alert(1)>"
            payload["jobs"] = [job]
            (site / "data/jobs.json").write_text(json.dumps(payload))
            (site / "index.html").write_text("<!-- OFFER_PREVIEW_START --><!-- OFFER_PREVIEW_END -->")
            build(site)
            before = (site / "index.html").read_text()
            build(site)
            self.assertEqual(before, (site / "index.html").read_text())
            self.assertIn("&lt;img", before)
            self.assertNotIn("<img", before)
            self.assertIn(job["observed_at"][:10], before)
            self.assertIn("sans JavaScript", (site / "offres.html").read_text())
            ET.parse(site / "feed.xml")
