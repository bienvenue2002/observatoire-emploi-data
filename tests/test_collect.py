import unittest
from scripts.collect import clean, contract, role, skills_in, transform, redact


class PipelineTests(unittest.TestCase):
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
        self.assertEqual(role("Data Analyst"), "Data Analyst / BI")

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
