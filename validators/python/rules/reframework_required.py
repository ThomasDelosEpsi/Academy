from __future__ import annotations

from .base import BaseRule, ValidationContext, xaml_files

REQUIRED_MARKERS = [
    "InitAllApplications",
    "GetTransactionData",
    "Process",
    "SetTransactionStatus",
]


class Rule(BaseRule):
    key = "reframework_required"
    script_name = "reframework_required.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        haystack = "\n".join(f"{file.relative_path}\n{file.text}" for file in xaml_files(context))
        found = [marker for marker in REQUIRED_MARKERS if marker.lower() in haystack.lower()]
        missing = [marker for marker in REQUIRED_MARKERS if marker not in found]

        return self.result(
            passed=len(found) >= 3,
            severity=rule_config.get("severity", "blocking"),
            message="Les marqueurs principaux du REFramework sont presents."
            if len(found) >= 3
            else "Le projet ne ressemble pas suffisamment a une structure REFramework.",
            details={"found": found, "missing": missing},
        )
