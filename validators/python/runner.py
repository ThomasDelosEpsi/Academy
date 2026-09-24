from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from rules import RULE_REGISTRY
from rules.base import ValidationContext, load_extracted_files


def _normalize_payload(payload: dict) -> dict:
    rpa_config = payload.get("rpaConfig") or payload.get("rpa_config") or {}
    python_rules = payload.get("pythonRules") or payload.get("enabled_rules") or rpa_config.get("pythonRules") or []
    output_columns = payload.get("outputColumns") or rpa_config.get("outputColumns") or []
    output_file_type = payload.get("outputFileType") or rpa_config.get("outputFileType")

    return {
        "package_path": payload.get("packagePath") or payload.get("package_path") or ".",
        "output_file_path": payload.get("outputFilePath") or payload.get("output_file_path"),
        "output_columns": output_columns,
        "output_file_type": output_file_type,
        "python_rules": [rule for rule in python_rules if rule.get("enabled", True)],
    }


def _build_context(normalized: dict) -> ValidationContext:
    package_path = Path(normalized["package_path"]).resolve()
    output_file_path = normalized.get("output_file_path")
    output_file = Path(output_file_path).resolve() if output_file_path else None

    return ValidationContext(
        package_path=package_path,
        output_file=output_file,
        output_columns=normalized.get("output_columns", []),
        output_file_type=normalized.get("output_file_type"),
        extracted_files=load_extracted_files(package_path),
    )


def run(payload: dict) -> dict:
    normalized = _normalize_payload(payload)
    context = _build_context(normalized)

    results = []
    for rule_config in normalized["python_rules"]:
        rule = RULE_REGISTRY.get(rule_config.get("key"))
        if rule is None:
            results.append(
                {
                    "rule": rule_config.get("key", "unknown"),
                    "script": rule_config.get("scriptName", "unknown"),
                    "passed": False,
                    "severity": rule_config.get("severity", "blocking"),
                    "message": "Regle inconnue dans le runner Python.",
                    "details": {},
                }
            )
            continue

        result = rule.run(context, rule_config)
        results.append(result.to_dict())

    blocking_failed = [result for result in results if not result["passed"] and result["severity"] == "blocking"]
    warning_failed = [result for result in results if not result["passed"] and result["severity"] == "warning"]

    return {
        "passed": len(blocking_failed) == 0,
        "blocking_failed": len(blocking_failed),
        "warning_failed": len(warning_failed),
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Runner des validateurs Python du correcteur RPA.")
    parser.add_argument("--config", required=True, help="Chemin vers le fichier JSON de configuration.")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    payload = json.loads(config_path.read_text(encoding="utf-8"))
    summary = run(payload)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0 if summary["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
