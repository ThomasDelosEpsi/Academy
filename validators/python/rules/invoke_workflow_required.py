from __future__ import annotations

import re

from .base import BaseRule, ValidationContext, xaml_files


class Rule(BaseRule):
    key = "invoke_workflow_required"
    script_name = "invoke_workflow_required.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        files = xaml_files(context)
        invoke_count = 0
        for file in files:
            invoke_count += len(re.findall(r"invoke[\s_-]*workflow", file.text, flags=re.IGNORECASE))

        passed = invoke_count > 0 or len(files) > 1
        return self.result(
            passed=passed,
            severity=rule_config.get("severity", "warning"),
            message="Le projet semble decoupe en sous-workflows."
            if passed
            else "Aucun indice de decomposition en sous-workflows n'a ete detecte.",
            details={"invoke_count": invoke_count, "xaml_files": len(files)},
        )
