import unittest
import json
import csv
import tempfile
from pathlib import Path
from scripts import collect
from scripts.collect import clean, contract, role, skills_in, transform, redact, load_curated, export, ROOT
from scripts.taxonomy import pathways


def base(**changes):
    return {"title": "Data Analyst", "country": "France", "referencenumber": "profile-test",
            "organization": "BPCE", "description": "Description de test.", "jobtype": "CDI",
            "lastmodifieddate": "30/10/2026 6:10:12 PM",
            "url": "https://example.com/profile-test", **changes}


class PipelineTests(unittest.TestCase):
    def test_student_profile_structured_degree_and_duration(self):
        row = base(jobtype="Stage", degree="Bac+5", description="Stage de fin d’études de 6 mois.")
        result = collect.student_requirements(row)
        self.assertEqual(result["duration"], "6 mois")
        self.assertEqual(result["education_level"], "Bac+5")
        self.assertEqual(result["study_stage"], "Fin d’études")
        self.assertIn("stage", result["duration_evidence"].lower())
        titled = collect.student_requirements(base(jobtype="CDD", title="Data Scientist - CDD 6 mois"))
        self.assertEqual(titled["duration"], "6 mois")
        fallback = collect.student_requirements(base(description="Étudiant de niveau Bac +4/5, vous cherchez un stage."))
        self.assertEqual(fallback["education_level"], "Bac+4/5")
        self.assertIn("automatiquement", fallback["education_note"])

    def test_duration_ranges_and_qualifiers(self):
        for text, expected in [
            ("Durée du stage souhaitée : 4 à 6 mois", "4 à 6 mois"),
            ("Durée du stage souhaitée : Idéalement 6 mois", "6 mois"),
            ("Durée du stage souhaitée : 6 mois ou plus", "6 mois ou plus"),
            ("La durée du stage est entre 4 et 6 mois", "4 et 6 mois"),
            ("Poste à pourvoir en janvier pour une durée de 6 mois.", "6 mois"),
        ]:
            with self.subTest(text=text):
                self.assertEqual(collect.student_requirements(base(jobtype="Stage", description=text))["duration"], expected)

    def test_experience_is_not_contract_duration(self):
        for text in ("Vous avez 6 mois d’expérience.", "Une expérience de six mois en analyse est attendue.",
                     "Formation de 12 mois, avec une expérience de 6 mois.",
                     "Vous avez effectué un stage de 6 mois en analyse.",
                     "Une première expérience en stage de 6 mois est souhaitée.", ""):
            self.assertIsNone(collect.student_requirements(base(jobtype="Stage", description=text))["duration"])
        self.assertIsNone(collect.student_requirements(base(jobtype="CDI", description="Après un stage de 6 mois."))["duration"])
        self.assertIsNone(collect.student_requirements(base(jobtype="CDI", description="Après votre stage de fin d’études."))["study_stage"])

    def test_unknown_student_profile_is_null(self):
        profile = collect.student_requirements(base(description="Un poste pour vous."))
        self.assertIsNone(profile["duration"])
        self.assertIsNone(profile["education_level"])
        self.assertIsNone(profile["study_stage"])

    def test_editorial_student_profiles_and_discrepancy(self):
        jobs = {j["id"]: j for j in collect.load_curated(ROOT / "data/curated.json")}
        cio = jobs["editorial-jobteaser-cio-advisory"]
        self.assertEqual((cio["duration"], cio["education_level"], cio["study_stage"]),
                         ("6 mois", "Master ou équivalent", "Fin d’études"))
        self.assertEqual(cio["requirements_method"], "editorial_verified")
        self.assertIn("4 à 6 mois", jobs["editorial-jobteaser-business-analyst"]["duration_note"])
        self.assertIsNone(jobs["editorial-capgemini-plm-549022"]["duration"])
        self.assertEqual(jobs["editorial-wttj-wiremind-po"]["study_stage"], "En cours de Master")

    def test_student_profile_in_pipeline_exports(self):
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder)
            collect.export([base(jobtype="Stage", degree="Bac+5", description="Un stage de 6 mois.")], out, "2026-10-31")
            job = json.loads((out / "jobs.json").read_text())["jobs"][0]
            self.assertEqual(job["duration"], "6 mois")
            with (out / "jobs.csv").open(encoding="utf-8-sig", newline="") as file:
                row = next(csv.DictReader(file))
            self.assertEqual((row["duration"], row["education_level"]), ("6 mois", "Bac+5"))
            self.assertTrue(row["duration_evidence"])

    def test_elan_brand_consistency(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertIn("<title>Élan MSI | Débouchés et opportunités</title>", html)
        self.assertIn('aria-label="Élan MSI"', html)
        legacy = (ROOT / "site/msi.html").read_text(encoding="utf-8")
        self.assertIn("<title>Élan MSI | Comprendre les parcours et les métiers</title>", legacy)
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
            "Chief Data Officer": "Gouvernance et qualité des données",
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
            meta = export([base(title="Product Owner", referencenumber="X")],
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
