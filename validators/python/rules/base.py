from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

TEXT_EXTENSIONS = {".xaml", ".xml", ".json", ".txt", ".log", ".config", ".yaml", ".yml"}
MAX_FILE_SIZE = 1_500_000


@dataclass
class ExtractedFile:
    path: Path
    relative_path: str
    suffix: str
    text: str


@dataclass
class ValidationContext:
    package_path: Path
    extracted_files: list[ExtractedFile]
    output_columns: list[dict[str, Any]] = field(default_factory=list)
    output_file_type: str | None = None
    output_file: Path | None = None


@dataclass
class ValidationResult:
    rule: str
    script: str
    passed: bool
    severity: str
    message: str
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule": self.rule,
            "script": self.script,
            "passed": self.passed,
            "severity": self.severity,
            "message": self.message,
            "details": self.details,
        }


class BaseRule:
    key = ""
    script_name = ""

    def run(self, context: ValidationContext, rule_config: dict[str, Any]) -> ValidationResult:
        raise NotImplementedError

    def result(
        self,
        *,
        passed: bool,
        severity: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> ValidationResult:
        return ValidationResult(
            rule=self.key,
            script=self.script_name,
            passed=passed,
            severity=severity,
            message=message,
            details=details or {},
        )


def safe_read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="latin-1", errors="ignore")


def load_extracted_files(package_path: Path) -> list[ExtractedFile]:
    if not package_path.exists():
        return []

    files: list[ExtractedFile] = []
    for path in package_path.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if path.stat().st_size > MAX_FILE_SIZE:
            continue
        files.append(
            ExtractedFile(
                path=path,
                relative_path=path.relative_to(package_path).as_posix(),
                suffix=path.suffix.lower(),
                text=safe_read_text(path),
            )
        )
    return files


def xaml_files(context: ValidationContext) -> list[ExtractedFile]:
    return [file for file in context.extracted_files if file.suffix == ".xaml"]


def infer_scalar_type(value: Any) -> str:
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int) and not isinstance(value, bool):
        return "integer"
    if isinstance(value, float):
        return "float"

    text = str(value or "").strip()
    if not text:
        return "string"
    if text.lower() in {"true", "false"}:
        return "boolean"
    try:
        int(text)
        return "integer"
    except ValueError:
        pass
    try:
        float(text)
        return "float"
    except ValueError:
        pass
    if len(text) >= 10 and text[4] == "-" and text[7] == "-":
        return "date"
    return "string"
