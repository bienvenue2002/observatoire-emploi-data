import unittest
import json
import tempfile
from pathlib import Path
from scripts.collect import clean, contract, role, skills_in, transform, redact, load_curated, export, ROOT
from scripts.taxonomy import pathways


class PipelineTests(unittest.TestCase):
    def test_elan_brand_consistency(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertIn("<title>Élan MSI | Du master aux métiers</title>", html)
        self.assertIn('aria-label="Élan MSI accueil"', html)
        self.assertEqual(html.count("élan<span>msi</span>"), 2)
        self.assertNotIn("Horizon MSI", html)
        app = (ROOT / "site/app.js").read_text(encoding="utf-8")
        self.assertIn("elan-msi-offres-", app)
        for filename in ("jobs.json", "meta.json"):
            payload = json.loads((ROOT / "site/data" / filename).read_text(encoding="utf-8"))
            meta = payload["meta"] if filename == "jobs.json" else payload
            self.assertEqual(meta["title"], "Élan MSI · Débouchés et opportunités")

    def test_entities(self):
        self.assertEqual(clean("<p>Data &amp; IA</p>"), "Data & IA")

    def test_exclusions(self):
        self.assertIsNone(role("Ingénieur Datacenter"))
        self.assertIsNone(role("Acheteur Market Data"))
        self.assertIsNone(role("Conseiller clientèle"))

    def test_classification(self):
        self.assertEqual(role("Business Analyste technique F/H"), "Business Analyst")
        self.assertEqual(role("Ingénieur Data F/H"), "Data Engineer / Architecture")
        self.assertEqual(role("Développeur Big Data"), "Data Engineer / Architecture")
        self.assertEqual(role("Data Scientist junior"), "Data Scientist")
        self.assertEqual(role("Data Analyst"), "Data Analyst")

    def test_msi_roles(self):
        examples = {
            "Consultant junior audit IT": "Auditeur SI",
            "Consultant cybersécurité": "Consultant cybersécurité",
            "Product Owner Data": "Product Owner",
            "Scrum Master": "Scrum Master",
            "Consultant fonctionnel SAP": "Consultant ERP / solutions métier",
            "Chef de projet SI": "Chef de projet SI",
            "Consultant AMOA Transformation": "Conseil & transformation SI",
            "Consultant Business Intelligence": "Consultant BI / décisionnel",
            "Chief Data Officer": "Chief Data Officer / gouvernance",
            "Responsable Analytics": "Responsable Analytics",
            "Webanalytics": "Webanalytics",
        }
        for title, expected in examples.items():
            with self.subTest(title=title):
                self.assertEqual(role(title), expected)
                self.assertTrue(pathways(expected))

    def test_non_it_project_excluded(self):
        self.assertIsNone(role("Chef de projet événementiel"))
        self.assertIsNone(role("Auditeur financier"))
        self.assertNotEqual(role("Analyste Risque Data & Innovation"), "Chief Data Officer / gouvernance")

    def test_career_catalog(self):
        catalog = json.loads((ROOT / "site/data/catalog.json").read_text())
        self.assertEqual({x["id"] for x in catalog["pathways"]}, {"CMSI", "ID", "ARAMIS"})
        self.assertEqual(len(catalog["careers"]), 17)
        for c in catalog["careers"]:
            self.assertEqual(c["pathways"], pathways(c["family"]))
        self.assertIn("après", next(c for c in catalog["careers"] if c["family"] == "Enseignement-recherche en SI")["level"].lower())

    def test_curated_sources(self):
        rows = load_curated(ROOT / "data/curated.json")
        self.assertEqual(len(rows), 7)
        self.assertEqual({j["source_key"] for j in rows}, {"deloitte", "capgemini", "wttj", "jobteaser"})
        self.assertTrue(all(j["collection_method"] == "editorial" for j in rows))
        self.assertTrue(all(j["salary_min"] is None for j in rows))
        self.assertTrue(all(j["pathways"] for j in rows))

    def test_bad_curated_url_and_duplicate(self):
        good = json.loads((ROOT / "data/curated.json").read_text())[0]
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "curated.json"
            p.write_text(json.dumps([{**good, "source_url": "javascript:alert(1)"}]))
            with self.assertRaises(ValueError):
                load_curated(p)
            p.write_text(json.dumps([good, good]))
            with self.assertRaises(ValueError):
                load_curated(p)

    def test_multisource_export(self):
        with tempfile.TemporaryDirectory() as td:
            meta = export([dict(title="Product Owner", country="France", referencenumber="X")],
                          Path(td), "2026-10-31", ROOT / "data/curated.json")
            self.assertEqual(meta["bpce_unique_offers"], 1)
            self.assertEqual(meta["editorial_offers"], 7)
            self.assertEqual(meta["unique_offers"], 8)
            self.assertEqual(meta["title"], "Élan MSI · Débouchés et opportunités")
            payload = json.loads((Path(td) / "jobs.json").read_text())
            self.assertEqual(len({j["id"] for j in payload["jobs"]}), 8)
            self.assertEqual(payload["jobs"][0]["collection_method"], "open_data")

    def test_contract(self):
        self.assertEqual(contract("Stage sup à 2 mois"), "Stage")
        self.assertEqual(contract("Contrat d'apprentissage"), "Alternance")

    def test_ambiguous_keywords(self):
        self.assertNotIn("R", skills_in("Vous êtes rigoureux et aimez les données"))
        self.assertNotIn("Tableau", skills_in("Création de tableaux de bord"))
        self.assertIn("Power BI", skills_in("PowerBI et SQL"))
        self.assertIn("Python", skills_in("Notre outil est Python"))
        self.assertIn("R", skills_in("Python, R et SQL"))

    def test_independent_records(self):
        self.assertIn("SQL", skills_in("Une longue introduction SQL"))
        self.assertIn("SQL", skills_in("SQL dès le début"))

    def test_multilocation_dedup(self):
        common = dict(title="Data Analyst", referencenumber="X", country="France", jobtype="CDI", state="Ile de France")
        rows = [dict(common, city="Paris", description="SQL"), dict(common, city="Lyon", description="Python")]
        jobs, matched = transform(rows, "2026-10-31T12:00:00Z")
        self.assertEqual(matched, 2)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(len(jobs[0]["locations"]), 2)
        self.assertEqual(jobs[0]["skills"], ["Python", "SQL"])

    def test_exclude_international(self):
        jobs, _ = transform([dict(title="Data Analyst", country="International")], "test")
        self.assertEqual(jobs, [])

    def test_no_recruiter_fields(self):
        jobs, _ = transform([dict(title="Data Analyst", country="France", nom_recruteur_principal="Secret", email_recruteur_principal="p@example.com")], "test")
        self.assertNotIn("nom_recruteur_principal", jobs[0])
        self.assertNotIn("email_recruteur_principal", jobs[0])
        self.assertNotIn("p@example.com", redact("Contacter p@example.com ou 06 12 34 56 78"))


if __name__ == "__main__":
    unittest.main()
