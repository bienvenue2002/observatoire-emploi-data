#!/usr/bin/env python3
"""Daily MSI refresh. Failed collection keeps data bytes and success date intact."""
import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
try:
    from .collect import API_URL, ROOT, export, commit_files
except ImportError:
    from collect import API_URL, ROOT, export, commit_files

PUBLIC_FILES = ("jobs.json", "jobs.csv", "meta.json",
                "msi-jobs.json", "msi-jobs.csv", "msi-meta.json")


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def download():
    request = Request(API_URL, headers={"User-Agent": "ElanMSI-Educational/4.0", "Accept": "application/json"})
    with urlopen(request, timeout=90) as response:
        return json.load(response)


def write_status(output, status):
    with tempfile.NamedTemporaryFile("w", dir=output, delete=False, encoding="utf-8") as stream:
        json.dump(status, stream, ensure_ascii=False, indent=2)
        temporary = stream.name
    os.replace(temporary, output / "update-status.json")


def refresh(output, loader=download, attempted_at=None, curated=None, allow_large_drop=False):
    output = Path(output)
    previous = json.loads((output / "meta.json").read_text(encoding="utf-8"))
    attempted_at = attempted_at or now_utc()
    status = {"last_attempt_at": attempted_at,
              "last_success_at": previous.get("last_success_at", previous["observed_at"]),
              "schedule_utc": "17 4 * * *",
              "workflow_url": "https://github.com/bienvenue2002/observatoire-emploi-data/actions/workflows/pages.yml"}
    try:
        records = loader()
        # Rendering, validation and mirrors are staged away from the live data.
        with tempfile.TemporaryDirectory(dir=output.parent) as folder:
            staging = Path(folder)
            meta = export(records, staging, attempted_at,
                          curated or ROOT / "data/curated.json", scope="msi-international")
            old_count = previous.get("bpce_unique_offers", 0)
            if not allow_large_drop and old_count >= 10 and meta["bpce_unique_offers"] < old_count * 0.5:
                raise ValueError("Chute de plus de 50 % du corpus BPCE ; contrôle manuel nécessaire.")
            status.update(status="success", last_success_at=attempted_at,
                          bpce_offers=meta["bpce_unique_offers"], reason=None)
            write_status(staging, status)
            commit_files(staging, output, [*PUBLIC_FILES, "update-status.json"])
        return True
    except Exception as error:
        # No remote body, recruiter data, credential or exception message published.
        status.update(status="failed", reason="validation_failed" if isinstance(error, (ValueError, KeyError)) else "source_or_system_unavailable")
        write_status(output, status)
        print(f"Actualisation refusée ({type(error).__name__}) : ancien instantané conservé.", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "site/data")
    parser.add_argument("--allow-large-drop", action="store_true", help="Après revue humaine uniquement")
    args = parser.parse_args()
    return 0 if refresh(args.output, allow_large_drop=args.allow_large_drop) else 1


if __name__ == "__main__":
    raise SystemExit(main())
