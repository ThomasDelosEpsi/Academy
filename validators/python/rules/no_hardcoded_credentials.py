from __future__ import annotations

import re

from .base import BaseRule, ValidationContext

SUSPICIOUS_PATTERNS = [
    r"password\s*[:=]\s*[\"'][^\"']+[\"']",
    r"token\s*[:=]\s*[\"'][^\"']+[\"']",
    r"api[_-]?key\s*[:=]\s*[\"'][^\"']+[\"']",
    r"client[_-]?secret\s*[:=]\s*[\"'][^\"']+[\"']",
]


class Rule(BaseRule):
    key = "no_hardcoded_credentials"
    script_name = "no_hardcoded_credentials.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        findings = []
        for file in context.extracted_files:
            lowered = file.text.lower()
            for pattern in SUSPICIOUS_PATTERNS:
                if re.search(pattern, lowered, flags=re.IGNORECASE):
                    findings.append({"file": file.relative_path, "pattern": pattern})

        return self.result(
            passed=len(findings) == 0,
            severity=rule_config.get("severity", "blocking"),
            message="Aucun credential en dur detecte." if not findings else "Des secrets ou credentials semblent codes en dur.",
            details={"findings": findings},
        )
