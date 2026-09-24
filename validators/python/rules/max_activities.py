from __future__ import annotations

import re

from .base import BaseRule, ValidationContext, xaml_files


class Rule(BaseRule):
    key = "max_activities"
    script_name = "max_activities.py"

    def run(self, context: ValidationContext, rule_config: dict) -> object:
        limit = int(rule_config.get("param") or 50)
        workflows = []
        for file in xaml_files(context):
            count = len(re.findall(r"<(?!/|\?)(?:[\w.-]+:)?[A-Z][\w.-]+", file.text))
            workflows.append({"file": file.relative_path, "activity_count": count})

        if not workflows:
            return self.result(
                passed=False,
                severity=rule_config.get("severity", "blocking"),
                message="Aucun fichier XAML n'a ete detecte pour verifier la densite des workflows.",
            )

        offenders = [workflow for workflow in workflows if workflow["activity_count"] > limit]
        return self.result(
            passed=len(offenders) == 0,
            severity=rule_config.get("severity", "blocking"),
            message="Le nombre d'activites par workflow respecte la limite."
            if not offenders
            else "Certains workflows sont trop denses et devraient etre decomposes.",
            details={"limit": limit, "offenders": offenders, "workflows": workflows},
        )
