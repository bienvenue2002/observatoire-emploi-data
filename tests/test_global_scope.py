import csv
import json
import tempfile
import unittest
from pathlib import Path
from scripts.collect import transform, export, ROOT, student_requirements
from scripts.global_scope import country_fields, domain_for, DOMAINS


class GlobalScopeTests(unittest.TestCase):
    def row(self, **changes):
        return {"title": "Chargé de recrutement", "country": "France",
                "referencenumber": "test-global", "organization": "BPCE",
                "jobtype": "Stage", "description": "Description de test.",
                "url": "https://example.com/global-test", "lastmodifieddate": "2026-10-30", **changes}

    def test_non_msi_domains_are_included(self):
        jobs, count = transform([self.row()], "2026-10-31", scope="all")
        self.assertEqual(count, 1)
        self.assertEqual(jobs[0]["domain"], "hr")
        self.assertEqual(jobs[0]["pathways"], [])
        self.assertEqual(jobs[0]["locations"][0]["country_code"], "FR")

    def test_country_never_inferred_from_language(self):
        record = self.row(country="International", state="Poland",
                          title="Intern Application Consultant (with German)")
        jobs, _ = transform([record], "test", scope="all")
        self.assertEqual(jobs[0]["locations"][0]["country_code"], "PL")
        self.assertIsNone(country_fields({"country": "", "city": "Paris"})["country_code"])
        self.assertIsNone(country_fields({"country": "International"})["country_code"])
        self.assertEqual(country_fields({"country": "International", "state": "Chine"})["country_code"], "CN")

    def test_international_vie_is_not_internship(self):
        record = self.row(country="International", state="Allemagne",
                          jobtype="VIE", title="V.I.E. - 12 months - Junior Asset Manager")
        jobs, _ = transform([record], "test", scope="all")
        self.assertEqual(jobs[0]["contract"], "VIE")
        self.assertEqual(jobs[0]["duration"], "12 months")
        self.assertEqual(jobs[0]["locations"][0]["country_code"], "DE")

    def test_title_duration_and_experience_guard(self):
        self.assertEqual(student_requirements(self.row(title="Stage Marketing (F/H) / 6 mois"))["duration"], "6 mois")
        self.assertIsNone(student_requirements(self.row(jobtype="CDI", title="Chef de projet / 6 mois"))["duration"])
        self.assertIsNone(student_requirements(self.row(title="Stage : 6 mois d’expérience requis"))["duration"])

    def test_domain_rules_and_zero_domain_preserved(self):
        for title, expected in [("Infirmier", "health"), ("Juriste", "law"),
                                ("Chargé de communication", "marketing"),
                                ("Ingénieur logistique", "engineering"),
                                ("Data Analyst", "it"), ("Designer", "arts")]:
            self.assertEqual(domain_for(title), expected)
        self.assertIn("education", DOMAINS)

    def test_non_listing_placeholder_excluded(self):
        jobs, _ = transform([self.row(title="Background Check - Sterling")], "test", scope="all")
        self.assertEqual(jobs, [])

    def test_global_exports_and_editorial_country(self):
        with tempfile.TemporaryDirectory() as folder:
            meta = export([self.row()], Path(folder), "2026-10-31",
                          ROOT / "data/curated.json", scope="all")
            payload = json.loads((Path(folder) / "jobs.json").read_text())
            self.assertEqual(meta["unique_offers"], 9)
            self.assertEqual(meta["pipeline_version"], "4.0.0")
            international = next(j for j in payload["jobs"] if j["id"] == "editorial-capgemini-pl-506269")
            self.assertEqual(international["locations"][0]["country_code"], "PL")
            self.assertIsNone(international["duration"])
            with (Path(folder) / "jobs.csv").open(encoding="utf-8-sig") as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(len(rows), 9)
            self.assertIn("country_codes", rows[0])
            self.assertIn("source_contract", rows[0])

    def test_public_payload_preserves_old_ids_and_has_no_recruiter_columns(self):
        old = json.loads((ROOT / "site/data/msi-jobs.json").read_text())
        new = json.loads((ROOT / "site/data/jobs.json").read_text())
        self.assertLessEqual({j["id"] for j in old["jobs"]}, {j["id"] for j in new["jobs"]})
        self.assertEqual(len({j["id"] for j in new["jobs"]}), new["meta"]["unique_offers"])
        prohibited = {"email_recruteur_principal", "nom_recruteur_principal", "manager_bpce"}
        self.assertTrue(all(not prohibited.intersection(j) for j in new["jobs"]))
