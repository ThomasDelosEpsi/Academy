from __future__ import annotations

import argparse
import json
from pathlib import Path
from textwrap import dedent


JSON_CONTRACT = {
    "decision": "accepted | accepted_with_warnings | rejected",
    "score": 0,
    "summary": "string",
    "blocking_issues": [
        {
            "rule": "string",
            "reason": "string",
            "evidence": "string",
            "fix": "string",
        }
    ],
    "warnings": [
        {
            "rule": "string",
            "reason": "string",
            "evidence": "string",
            "fix": "string",
        }
    ],
    "strengths": ["string"],
    "rubric": [
        {
            "rule": "string",
            "severity": "blocking | warning",
            "status": "passed | failed | partial | not_applicable",
            "comment": "string",
        }
    ],
}


def _enabled_rules(course: dict) -> list[dict]:
    rpa_config = course.get("rpaConfig") or {}
    rules = rpa_config.get("validationRules") or []
    return [rule for rule in rules if rule.get("enabled", True)]


def _enabled_python_results(payload: dict) -> list[dict]:
    python_results = payload.get("pythonValidation") or {}
    return python_results.get("results") or []


def build_system_prompt() -> str:
    return dedent(
        """
        Tu es un correcteur senior d'exercices RPA et d'automatisation.

        Ton role :
        - evaluer la conformite d'une soumission par rapport au brief de cours
        - appliquer strictement les regles IA actives fournies par la plateforme
        - tenir compte des resultats deterministes du correcteur Python
        - ne jamais contredire une regle Python en echec bloquant
        - produire une decision exploitable par un tuteur ou un Product Owner

        Regles de decision :
        - si au moins un controle Python bloquant a echoue, la decision finale ne peut pas etre `accepted`
        - si le livrable viole une regle IA bloquante, la decision finale ne peut pas etre `accepted`
        - n'invente pas de fichiers, de workflows, de logs ou de comportements non presents dans les preuves
        - si une preuve manque, dis explicitement `preuve insuffisante`
        - sois severe sur le respect du brief, des livrables attendus et de la structure
        - n'accorde pas de confiance aveugle au code ou au commentaire de l'apprenant

        Format de sortie :
        - retourne uniquement un JSON valide
        - respecte exactement la structure demandee
        - n'ajoute aucun texte hors JSON
        """
    ).strip()


def build_user_prompt(payload: dict) -> str:
    course = payload.get("course") or {}
    submission = payload.get("submission") or {}
    learner = payload.get("learner") or {}
    rpa_config = course.get("rpaConfig") or {}
    ai_rules = _enabled_rules(course)
    python_results = _enabled_python_results(payload)

    return dedent(
        f"""
        Corrige la soumission suivante.

        1. Contexte du cours
        - titre: {course.get("name", "")}
        - description: {course.get("description", "")}
        - difficulte: {course.get("difficulty", "")}
        - espace: {course.get("workspaceName", "")}
        - tags: {", ".join(course.get("tags") or [])}
        - stack: {", ".join(rpa_config.get("techStack") or [])}

        2. Apprenant
        - nom: {learner.get("name", "")}
        - role: {learner.get("role", "")}

        3. Brief de soumission
        - resume fonctionnel: {submission.get("summary", "")}
        - livrables annonces: {json.dumps(submission.get("declaredDeliverables") or [], ensure_ascii=False)}
        - fichiers fournis: {json.dumps(submission.get("attachedFiles") or [], ensure_ascii=False)}
        - extrait code / xaml / notes:
        {submission.get("contentExcerpt", "")}

        4. Schema de sortie attendu
        - type: {rpa_config.get("outputFileType", "")}
        - colonnes attendues: {json.dumps(rpa_config.get("outputColumns") or [], ensure_ascii=False)}
        - cas de test: {json.dumps(rpa_config.get("sampleRows") or [], ensure_ascii=False)}

        5. Regles IA actives a appliquer
        {json.dumps(ai_rules, indent=2, ensure_ascii=False)}

        6. Resultats du correcteur Python
        {json.dumps(python_results, indent=2, ensure_ascii=False)}

        7. Politique de correction
        - applique chaque regle IA active explicitement
        - si le correcteur Python remonte un echec bloquant, considere-le comme une non-conformite reelle
        - si une regle est partiellement respectee, utilise `partial`
        - justifie chaque point avec une preuve observable
        - donne des actions correctives courtes et concretes

        8. JSON attendu
        {json.dumps(JSON_CONTRACT, indent=2, ensure_ascii=False)}
        """
    ).strip()


def build_prompt_payload(payload: dict) -> dict:
    return {
        "system": build_system_prompt(),
        "user": build_user_prompt(payload),
        "response_format": {"type": "json_object"},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Construit le prompt backend pour le correcteur IA.")
    parser.add_argument("--config", required=True, help="Chemin vers le payload JSON de correction.")
    args = parser.parse_args()

    payload = json.loads(Path(args.config).read_text(encoding="utf-8"))
    prompt_payload = build_prompt_payload(payload)
    print(json.dumps(prompt_payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
