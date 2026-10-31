import contextlib
import io
import json
import tempfile
import unittest
import os
from unittest import mock
from pathlib import Path
from scripts.collect import export, load_curated, student_requirements, transform, ROOT
from scripts.refresh import refresh, PUBLIC_FILES


def row(**changes):
    return {"title": "Data Analyst", "referencenumber": "fixture-msi",
            "country": "France", "jobtype": "Stage", "description": "Stage data SQL.",
            "url": "https://example.com/job", "lastmodifieddate": "2026-10-30", **changes}


class ReliabilityTests(unittest.TestCase):
    def test_published_mirrors_and_metadata_match(self):
        output = ROOT / "site/data"
        payload = json.loads((output / "jobs.json").read_text())
        self.assertEqual(payload["meta"], json.loads((output / "meta.json").read_text()))
        for name in ("jobs.json", "jobs.csv", "meta.json"):
            self.assertEqual((output/name).read_bytes(), (output/f"msi-{name}").read_bytes())
        self.assertEqual(payload["meta"]["scope_id"], "msi-international")
        self.assertTrue(all(job["pathways"] for job in payload["jobs"]))

    def test_write_failure_restores_previous_files(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "data"
            export([row()], output, "2026-10-30", scope="msi-international")
            before = {name: (output/name).read_bytes() for name in PUBLIC_FILES}
            real_replace = os.replace
            failed = False
            def fail_once(src, dst):
                nonlocal failed
                if Path(dst) == output / "jobs.csv" and not failed:
                    failed = True
                    raise OSError("simulated write failure")
                return real_replace(src, dst)
            with mock.patch("scripts.collect.os.replace", side_effect=fail_once):
                with self.assertRaises(OSError):
                    export([row(title="Data Engineer")], output, "2026-10-31", scope="msi-international")
            self.assertTrue(failed)
            self.assertEqual(before, {name: (output/name).read_bytes() for name in PUBLIC_FILES})

    def test_final_year_variants(self):
        for text in ("niveau Bac+5 / Fin d’études", "stage de fin d’étude",
                     "Stage de fin d'etudes", "Fin d’études : Master 2.",
                     "Vous recherchez une alternance de fin d’études."):
            with self.subTest(text=text):
                self.assertEqual(student_requirements(row(description=text))["study_stage"], "Fin d’études")

    def test_final_year_past_experience_not_requirement(self):
        for text in ("Vous avez effectué votre stage de fin d’études.",
                     "Une expérience en stage de fin d’études est souhaitée.",
                     "Un stage de fin d’étude déjà réalisé.",
                     "Votre précédent stage de fin d'études."):
            with self.subTest(text=text):
                self.assertIsNone(student_requirements(row(description=text))["study_stage"])
        self.assertIsNone(student_requirements(row(jobtype="CDI", description="Stage de fin d’études."))["study_stage"])

    def test_missing_curated_is_explicit(self):
        with self.assertRaisesRegex(ValueError, "introuvable"):
            load_curated(Path("/missing-elan-file.json"))

    def test_closed_examples_preserve_review_origin(self):
        jobs = load_curated(ROOT / "data/curated.json")
        closed = [j for j in jobs if j["status"] == "closed"]
        self.assertEqual(len(closed), 2)
        self.assertEqual({j["status_origin"] for j in closed}, {"owner_review"})
        self.assertTrue(all("indépendamment" in j["status_note"] for j in closed))

    def test_msi_international_excludes_unrelated_jobs(self):
        jobs, _ = transform([row(), row(title="Chargé de recrutement", referencenumber="HR"),
                            row(title="Data Analyst", country="International", state="Chine", referencenumber="CN")],
                           "2026-10-31", scope="msi-international")
        self.assertEqual({j["id"] for j in jobs}, {"fixture-msi", "CN"})
        self.assertTrue(all(j["pathways"] for j in jobs))

    def test_invalid_input_never_changes_previous_files(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "data"
            export([row()], output, "2026-10-30", scope="msi-international")
            before = {name: (output/name).read_bytes() for name in PUBLIC_FILES}
            variants = [
                {"url": ""}, {"description": ""}, {"lastmodifieddate": "not-a-date"},
                {"title": ""}, {"referencenumber": ""}, {"url": "javascript:alert(1)"},
                {"url": "https://user:secret@example.com/private"}, {"url": "https://example.com:bad/job"},
                {"country": {"unexpected": "schema"}}
            ]
            for variant in variants:
                with self.subTest(variant=variant), self.assertRaises(ValueError):
                    export([row(**variant)], output, "2026-10-31", scope="msi-international")
                self.assertEqual(before, {name: (output/name).read_bytes() for name in PUBLIC_FILES})
            incomplete = row()
            del incomplete["url"]
            with self.assertRaises(ValueError):
                export([incomplete], output, "2026-10-31")
            with self.assertRaises(ValueError):
                export([row()], output, "invalid")

    def test_refresh_failure_keeps_bytes_and_success_date(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "data"
            export([row()], output, "2026-10-30", scope="msi-international")
            before = {name: (output/name).read_bytes() for name in PUBLIC_FILES}
            with contextlib.redirect_stderr(io.StringIO()):
                success = refresh(output, loader=lambda:[row(lastmodifieddate="broken")],
                                  attempted_at="2026-10-31")
            self.assertFalse(success)
            self.assertEqual(before, {name: (output/name).read_bytes() for name in PUBLIC_FILES})
            status = json.loads((output/"update-status.json").read_text())
            self.assertEqual((status["status"], status["last_success_at"]), ("failed", "2026-10-30"))

    def test_refresh_success_synchronizes_both_views(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "data"
            export([row()], output, "2026-10-30", scope="msi-international")
            self.assertTrue(refresh(output, loader=lambda:[row()], attempted_at="2026-10-31"))
            self.assertEqual((output/"jobs.json").read_bytes(), (output/"msi-jobs.json").read_bytes())
            status = json.loads((output/"update-status.json").read_text())
            self.assertEqual(status["last_success_at"], "2026-10-31")

    def test_large_unexplained_drop_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "data"
            export([row(referencenumber=str(i)) for i in range(12)], output, "2026-10-30", scope="msi-international")
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertFalse(refresh(output, loader=lambda:[row()], attempted_at="2026-10-31"))
            self.assertEqual(json.loads((output/"meta.json").read_text())["bpce_unique_offers"], 12)
