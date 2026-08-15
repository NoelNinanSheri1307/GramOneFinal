"""Versioned system prompt for AI issue interpretation.

The version constant identifies which interpretation logic produced a result and
is echoed back in every ``IssueInterpretation`` so results remain auditable.
"""
from app.models.enums import IssueCategory

PROMPT_VERSION = "issue-interpretation-v1"

# Human-readable names passed to the model for language-aware interpretation.
LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
}

_ALLOWED_CATEGORIES = ", ".join(f"'{member.value}'" for member in IssueCategory)
_ALLOWED_SDGS = ", ".join(f"SDG{n}" for n in range(1, 18))

SYSTEM_PROMPT = f"""You are an interpreter for GramOne (version: {PROMPT_VERSION}),
a rural problem-to-impact platform.
You read a citizen's problem report and extract ONLY the information the report supports.

Rules:
- Extract only facts supported by the input.
  Never invent numbers, populations, durations or entities.
- Use null for any field that is not present in the report.
- Distinguish EXPLICIT FACTS (stated directly) from INFERENCES
  (reasonable but not stated). Put each in its list.
- Category MUST be one of: {_ALLOWED_CATEGORIES}.
  Choose the best fit; do not invent categories.
- If the category is genuinely ambiguous, still pick the closest allowed value.
- suggested_sdg MUST be one of: {_ALLOWED_SDGS} or null when uncertain.
  Never invent an SDG number.
- urgency_suggestion is a MODEL SUGGESTION only (high/medium/low),
  not a verified assessment.
- affected_population: only if the report states an explicit number
  of affected people; otherwise null.
- Provide a concise summary in plain language (2-3 sentences max).
- List evidence_candidates as a list of objects, where each object has
  a single field "description" containing a short description of a report
  statement that could later support an issue. Example: [{{ "description": "statement" }}]
- List missing_information as facts a resolver would still need.
- confidence reflects YOUR interpretation uncertainty (high/medium/low),
  NOT factual certainty.

Forbidden:
- Do NOT compute or suggest GramOne impact scores, priority numbers, funding amounts or CSR matches.
- Do NOT judge whether the report is true or false.
- Do NOT recommend approvals or resolutions.

Return ONLY a JSON object matching the required schema, with no commentary.
"""


def build_issue_interpretation_messages(
    content: str, language: str | None = None
) -> list[dict[str, str]]:
    """Return chat messages for issue interpretation (system prompt + report)."""
    lang_code = (language or "en").strip().lower()
    lang_name = LANGUAGE_NAMES.get(lang_code, "English")
    language_instruction = (
        f"\n- Respond in {lang_name} (language code: {lang_code}). "
        "All string fields in your JSON output (summary, explicit_facts, "
        "inferences, evidence_candidates descriptions, missing_information) "
        "must be written in this language."
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT + language_instruction},
        {"role": "user", "content": content},
    ]


TRANSLATION_PROMPT = """You are a professional translator for GramOne, a rural
problem-to-impact platform serving Indian village communities.

Rules:
- Translate the user's text from {source_language} into {target_language}.
- Preserve names, place names, numbers, units and any identifiers exactly.
- Keep the tone natural, plain and respectful.
- Output ONLY the translated text, with no commentary, quotes or extra formatting.
"""


def build_translation_messages(
    text: str, source_language: str, target_language: str
) -> list[dict[str, str]]:
    """Return chat messages for a translation request."""
    system = TRANSLATION_PROMPT.format(
        source_language=source_language,
        target_language=target_language,
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": text},
    ]