from __future__ import annotations

import re

from .base import BaseRule, ValidationContext, xaml_files

BAD_PATTERNS = [
    r"idx\s*=\s*[\"']\d+[\"']",
    r"aaname\s*=\s*[\"']\*[\"']",
    r"title\s*=\s*[\"']\*[\"']",
    r"<webctrl[^>]+tag\s*=\s*[\"']DIV[\"']",
]


class Rule(BaseRule):
    key = "selector_quality"
    script_name = "selector_quality.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        findings = []
        for file in xaml_files(context):
            for pattern in BAD_PATTERNS:
                matches = len(re.findall(pattern, file.text, flags=re.IGNORECASE))
                if matches:
                    findings.append({"file": file.relative_path, "pattern": pattern, "matches": matches})

        return self.result(
            passed=len(findings) == 0,
            severity=rule_config.get("severity", "warning"),
            message="Aucun selecteur fragile evident n'a ete detecte."
            if not findings
            else "Des selecteurs semblent trop fragiles ou trop generiques.",
            details={"findings": findings},
        )
