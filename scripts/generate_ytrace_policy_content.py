from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from docx import Document


def policy_markdown(document: Document, start_title: str, end_title: str, page_title: str) -> str:
    paragraphs = document.paragraphs
    start = next(index for index, paragraph in enumerate(paragraphs) if paragraph.text.strip() == start_title)
    end = next(index for index, paragraph in enumerate(paragraphs) if paragraph.text.strip() == end_title)
    lines = [f"# {page_title}", ""]

    for paragraph in paragraphs[start + 1 : end]:
        text = paragraph.text.strip()
        if text.startswith("Version: Draft 1.0"):
            text = "Version: 1.0  |  Last updated: June 30, 2026  |  Effective date: June 30, 2026"
        if not text:
            continue
        style = paragraph.style.name
        if style == "Heading 2":
            lines.extend([f"## {text}", ""])
        elif style.startswith("List Bullet"):
            lines.append(f"- {text}")
        else:
            lines.extend([text, ""])

    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def sql_literal(value: str) -> str:
    delimiter = "$ytrace_policy$"
    if delimiter in value:
        raise ValueError("Unexpected SQL delimiter in policy content.")
    return f"{delimiter}{value}{delimiter}"


def policy_insert(terms: str, privacy: str) -> str:
    return f"""update public.policy_versions
set
  is_active = false,
  updated_at = now()
where is_active = true
  and version <> '1.0';

create unique index if not exists uq_policy_versions_one_active
  on public.policy_versions ((is_active))
  where is_active = true;

insert into public.policy_versions (
  version,
  title,
  terms_content,
  privacy_content,
  is_active,
  effective_date
)
values (
  '1.0',
  'Y-TRACE Privacy Policy and Terms of Service',
  {sql_literal(terms)},
  {sql_literal(privacy)},
  true,
  date '2026-06-30'
)
on conflict (version) do update
  set title = excluded.title,
      terms_content = excluded.terms_content,
      privacy_content = excluded.privacy_content,
      is_active = true,
      effective_date = date '2026-06-30';
"""


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate_ytrace_policy_content.py <policy.docx>")

    root = Path(__file__).resolve().parents[1]
    document = Document(Path(sys.argv[1]))
    privacy = policy_markdown(
        document,
        "Part I - Y‑TRACE Privacy Policy",
        "Part II - Y‑TRACE Terms of Service",
        "Y‑TRACE Privacy Policy",
    )
    terms = policy_markdown(
        document,
        "Part II - Y‑TRACE Terms of Service",
        "Part III - Pre-Publication Checklist",
        "Y‑TRACE Terms of Service",
    )

    generated_source = (
        "// Generated from Y-TRACE_Privacy_Policy_and_Terms_of_Service_Draft_v1.0.docx.\n"
        "// Do not hand-edit legal wording; regenerate it from the reviewed source document.\n\n"
        'export const YTRACE_POLICY_VERSION = "1.0";\n'
        'export const YTRACE_POLICY_TITLE = "Y-TRACE Privacy Policy and Terms of Service";\n'
        'export const YTRACE_POLICY_UPDATED_AT = "June 30, 2026";\n'
        'export const YTRACE_POLICY_EFFECTIVE_DATE = "June 30, 2026";\n\n'
        f"export const YTRACE_PRIVACY_POLICY = {json.dumps(privacy, ensure_ascii=False)};\n\n"
        f"export const YTRACE_TERMS_OF_SERVICE = {json.dumps(terms, ensure_ascii=False)};\n\n"
        "export const hasPublishablePolicyContent = (terms: string, privacy: string) =>\n"
        "  terms.trim().length > 500 && privacy.trim().length > 500;\n"
    )
    source_path = root / "src" / "lib" / "ytrace-policy-content.generated.ts"
    source_path.write_text(generated_source, encoding="utf-8", newline="\n")

    insert_sql = policy_insert(terms, privacy)
    repair_sql = f"""-- Activates the approved Y-TRACE Privacy Policy and Terms of Service
-- as Version 1.0 while retaining every previous version and acceptance record.

begin;

{insert_sql}
commit;
"""
    (root / "supabase" / "repair_ytrace_policy_v1.sql").write_text(
        repair_sql,
        encoding="utf-8",
        newline="\n",
    )

    all_in_one_path = root / "supabase" / "supabase_all_in_one.sql"
    all_in_one = all_in_one_path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"-- Store the reviewed policy draft without activating mandatory acceptance\.\r?\n"
        r"-- Activate it only after City Legal and DPO approval and an effective date\.\r?\n"
        r".*?(?=insert into public\.admin_accounts)",
        re.DOTALL,
    )
    replacement = (
        "-- Keep exactly one approved policy active while preserving policy history.\n"
        + insert_sql
        + "\n"
    )
    updated, count = pattern.subn(replacement, all_in_one, count=1)
    if count != 1:
        raise RuntimeError("Could not locate the existing policy seed block.")
    all_in_one_path.write_text(updated, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
