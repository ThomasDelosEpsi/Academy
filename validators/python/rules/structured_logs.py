from __future__ import annotations

import re

from .base import BaseRule, ValidationContext, xaml_files


class Rule(BaseRule):
    key = "structured_logs"
    script_name = "structured_logs.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        files = xaml_files(context)
        log_count = 0
        contextual_count = 0
        for file in files:
            log_count += len(re.findall(r"log[\s_-]*message", file.text, flags=re.IGNORECASE))
            contextual_count += len(re.findall(r"transaction|status|reference|queue", file.text, flags=re.IGNORECASE))

        passed = log_count >= 2 and contextual_count >= 2
        return self.result(
            passed=passed,
            severity=rule_config.get("severity", "warning"),
            message="La journalisation semble suffisamment structuree."
            if passed
            else "Les logs sont absents ou trop pauvres pour un suivi exploitable.",
            details={"log_count": log_count, "contextual_tokens": contextual_count},
        )
