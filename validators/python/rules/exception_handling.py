from __future__ import annotations

import re

from .base import BaseRule, ValidationContext, xaml_files


class Rule(BaseRule):
    key = "exception_handling"
    script_name = "exception_handling.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        occurrences = []
        for file in xaml_files(context):
            count = len(re.findall(r"try[\s_-]*catch|TryCatch", file.text, flags=re.IGNORECASE))
            if count:
                occurrences.append({"file": file.relative_path, "count": count})

        return self.result(
            passed=len(occurrences) > 0,
            severity=rule_config.get("severity", "blocking"),
            message="Des blocs Try/Catch ont ete detectes."
            if occurrences
            else "Aucune gestion explicite des exceptions n'a ete detectee.",
            details={"occurrences": occurrences},
        )
