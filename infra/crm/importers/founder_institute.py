from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import urlencode, urlsplit, urlunsplit


FI_NETWORK_URL = "https://fi.co/network"

DEFAULT_SPECIALIZATIONS = [
    "Academic: Tech Transfer / IP Licensing",
    "Accounting and Bookkeeping",
    "Advertising / Social Media / Influencers",
    "B2B Sales: Direct / Enterprise / Sales Enablement / Operations",
    "B2C Sales: Customer Acquisition / Funnel Management / eCommerce / Loyalty",
    "Business Development / Partnerships / Account Management",
    "Corporate Social Responsibility: DEI / ESG / UN SDGs",
    "Crowdfunding: Equity / Reward-Based Crowdfunding",
    "Customer Development: Discovery / Validation / Archetypes / Interviews",
    "Customer Success: NPS / Support / Reviews / Satisfaction / Relationship Management",
    "Design: Branding / UI / UX / Logos",
    "Finance / Business Models / Revenue Projections",
    "Fundraising: SAFEs / Equity / Venture Capital",
    "Go-to-Market: Launch Strategy / Pricing / Value Proposition Design",
    "Grants: Non-dilutive Funding / Government Contracts / Grant Writing",
    "Growth: Product-Led Growth / KPIs / Unit Economics",
    "Hardware Development / Prototyping / Industrial Design",
    "Human Resources: Hiring / Co-Founders / Early Team / Outsourcing / Recruiting",
    "Legal: Incorporation / IP / Equity / Agreements & Contracts",
    "Market Research: Competition / Segmentation / TAM-SAM-SOM",
    "Marketing: Digital / Email / SEO / Content",
    "Mission / Vision / Values",
    "Pitching: Investor Pitches / Decks / Public Speaking",
    "Product Management / Strategy / Roadmaps",
    "Public Relations and Corporate Communications",
    "Software Development / Product Engineering / MVPs",
]


@dataclass(frozen=True)
class FounderInstituteEntry:
    identity_key: str
    identity_key_type: str
    display_name: str
    first_name: str | None
    last_name: str | None
    organization: str | None
    role_title: str | None
    linkedin_url: str | None
    profile_image_url: str | None
    specialization_name: str
    city_name: str
    source_url: str
    source_page: int
    source_position: int | None
    card_text: str | None
    mentor_notes: str | None
    raw_card: dict
    source_confidence: str


class _CardParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.image_url: str | None = None
        self.links: list[str] = []
        self.tooltips: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {key: value for key, value in attrs}
        if tag == "img" and not self.image_url:
            self.image_url = attr.get("src")
        if tag == "a" and attr.get("href"):
            self.links.append(attr["href"] or "")
        if attr.get("data-tooltip-content-value"):
            self.tooltips.append(attr["data-tooltip-content-value"] or "")

    def handle_data(self, data: str) -> None:
        text = _clean_text(data)
        if text:
            self.text_parts.append(text)


def parse_directory_entries(
    *,
    entries_html: str,
    specialization_name: str,
    city_name: str,
    source_url: str,
    source_page: int,
) -> list[FounderInstituteEntry]:
    cards = _split_cards(entries_html)
    entries: list[FounderInstituteEntry] = []

    for index, card_html in enumerate(cards, start=1):
        parser = _CardParser()
        parser.feed(card_html)
        texts = _collapse_repeated_text(parser.text_parts)
        if not texts:
            continue

        display_name = texts[0]
        role_line = _first_role_line(texts[1:])
        role_title, organization = _split_role_line(role_line)
        linkedin_url = _find_linkedin_url(parser.links)
        image_url = _absolute_fi_url(parser.image_url)
        first_name, last_name = _split_name(display_name)
        mentor_notes = _mentor_notes(texts, display_name, role_line)
        card_text = " ".join(texts)

        if linkedin_url:
            identity_key = linkedin_url
            identity_key_type = "linkedin_url"
            source_confidence = "private-sourced"
        else:
            identity_key = _fallback_identity(display_name, organization, role_title)
            identity_key_type = "name_organization_role"
            source_confidence = "needs-verification"

        entries.append(
            FounderInstituteEntry(
                identity_key=identity_key,
                identity_key_type=identity_key_type,
                display_name=display_name,
                first_name=first_name,
                last_name=last_name,
                organization=organization,
                role_title=role_title,
                linkedin_url=linkedin_url,
                profile_image_url=image_url,
                specialization_name=specialization_name,
                city_name=city_name,
                source_url=source_url,
                source_page=source_page,
                source_position=index,
                card_text=card_text,
                mentor_notes=mentor_notes,
                raw_card={
                    "links": parser.links,
                    "tooltips": parser.tooltips,
                    "text": texts,
                },
                source_confidence=source_confidence,
            )
        )

    return entries


def collect_directory_entries(
    *,
    cookie: str,
    specializations: Iterable[str] = DEFAULT_SPECIALIZATIONS,
    city_name: str = "All",
    max_pages: int = 100,
    pause_seconds: float = 0.25,
) -> list[FounderInstituteEntry]:
    collected: list[FounderInstituteEntry] = []
    for specialization in specializations:
        for page in range(1, max_pages + 1):
            url = build_network_url(specialization, city_name, page)
            response = fetch_network_json(url, cookie)
            entries_html = response.get("entries", "")
            entries = parse_directory_entries(
                entries_html=entries_html,
                specialization_name=specialization,
                city_name=city_name,
                source_url=url,
                source_page=page,
            )
            if not entries:
                print(f"{specialization}: stopped at page {page} (0 cards)", file=sys.stderr)
                break

            collected.extend(entries)
            print(f"{specialization}: page {page} -> {len(entries)} cards", file=sys.stderr)
            time.sleep(pause_seconds)

    return collected


def build_network_url(specialization_name: str, city_name: str, page: int) -> str:
    query = urlencode(
        {
            "tab": "search",
            "search": "",
            "specialization_search": specialization_name,
            "city_search": city_name,
            "page": str(page),
        }
    )
    return f"{FI_NETWORK_URL}?{query}"


def fetch_network_json(url: str, cookie: str) -> dict:
    args = [
        "curl",
        "--silent",
        "--show-error",
        "--fail",
        "--location",
        url,
        "-H",
        "accept: application/json",
        "-H",
        "accept-language: en-US,en;q=0.9",
        "-H",
        "cache-control: no-cache",
        "-H",
        f"cookie: {cookie}",
        "-H",
        "dnt: 1",
        "-H",
        "pragma: no-cache",
        "-H",
        "priority: u=1, i",
        "-H",
        "sec-fetch-dest: empty",
        "-H",
        "sec-fetch-mode: cors",
        "-H",
        "sec-fetch-site: same-origin",
        "-H",
        "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    ]
    result = subprocess.run(args, check=True, capture_output=True)
    return json.loads(result.stdout.decode("utf-8"))


def build_import_sql(entries: list[FounderInstituteEntry]) -> str:
    lines = [
        "BEGIN;",
        "INSERT INTO public_sources.founder_institute_directory_entries (",
        "  identity_key, identity_key_type, display_name, first_name, last_name,",
        "  organization, role_title, linkedin_url, profile_image_url,",
        "  specialization_name, city_name, source_url, source_page, source_position,",
        "  card_text, mentor_notes, raw_card, source_confidence",
        ") VALUES",
    ]

    values = []
    for entry in entries:
        values.append(
            "("
            + ", ".join(
                [
                    _sql_literal(entry.identity_key),
                    _sql_literal(entry.identity_key_type),
                    _sql_literal(entry.display_name),
                    _sql_literal(entry.first_name),
                    _sql_literal(entry.last_name),
                    _sql_literal(entry.organization),
                    _sql_literal(entry.role_title),
                    _sql_literal(entry.linkedin_url),
                    _sql_literal(entry.profile_image_url),
                    _sql_literal(entry.specialization_name),
                    _sql_literal(entry.city_name),
                    _sql_literal(entry.source_url),
                    str(entry.source_page),
                    _sql_int_literal(entry.source_position),
                    _sql_literal(entry.card_text),
                    _sql_literal(entry.mentor_notes),
                    _sql_literal(json.dumps(entry.raw_card, sort_keys=True)) + "::jsonb",
                    _sql_literal(entry.source_confidence),
                ]
            )
            + ")"
        )

    lines.append(",\n".join(values))
    lines.extend(
        [
            "ON CONFLICT (lower(identity_key), lower(specialization_name), lower(city_name))",
            "DO UPDATE SET",
            "  identity_key_type = EXCLUDED.identity_key_type,",
            "  display_name = EXCLUDED.display_name,",
            "  first_name = EXCLUDED.first_name,",
            "  last_name = EXCLUDED.last_name,",
            "  organization = EXCLUDED.organization,",
            "  role_title = EXCLUDED.role_title,",
            "  linkedin_url = EXCLUDED.linkedin_url,",
            "  profile_image_url = EXCLUDED.profile_image_url,",
            "  source_url = EXCLUDED.source_url,",
            "  source_page = EXCLUDED.source_page,",
            "  source_position = EXCLUDED.source_position,",
            "  card_text = EXCLUDED.card_text,",
            "  mentor_notes = EXCLUDED.mentor_notes,",
            "  raw_card = EXCLUDED.raw_card,",
            "  source_confidence = EXCLUDED.source_confidence,",
            "  collected_at = now();",
            "COMMIT;",
            "",
        ]
    )
    return "\n".join(lines)


def _split_cards(entries_html: str) -> list[str]:
    return [
        match.group(1)
        for match in re.finditer(
            r"(<div class=\s*[\"'][^\"']*flex items-start[\s\S]*?)(?=<div class=\s*[\"'][^\"']*flex items-start|<div class=\"flex justify-center|$)",
            entries_html,
        )
    ]


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def _collapse_repeated_text(values: list[str]) -> list[str]:
    collapsed: list[str] = []
    for value in values:
        if value and (not collapsed or collapsed[-1] != value):
            collapsed.append(value)
    return collapsed


def _first_role_line(values: list[str]) -> str | None:
    for value in values:
        if value.lower() == "show more":
            continue
        return value
    return None


def _split_role_line(role_line: str | None) -> tuple[str | None, str | None]:
    if not role_line:
        return None, None
    if "," not in role_line:
        return role_line, None
    role, organization = role_line.split(",", 1)
    return _empty_to_none(role), _empty_to_none(organization)


def _find_linkedin_url(links: list[str]) -> str | None:
    for link in links:
        if "linkedin." not in link.lower():
            continue
        normalized = html.unescape(link).strip()
        if normalized.startswith("http://linkedin/"):
            normalized = normalized.replace("http://linkedin/", "https://www.linkedin.com/in/", 1)
        parts = urlsplit(normalized)
        path = parts.path.rstrip("/")
        return urlunsplit((parts.scheme.lower() or "https", parts.netloc.lower(), path, "", ""))
    return None


def _absolute_fi_url(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("/"):
        return f"https://fi.co{url}"
    return url


def _split_name(display_name: str) -> tuple[str | None, str | None]:
    parts = display_name.split()
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])


def _mentor_notes(texts: list[str], display_name: str, role_line: str | None) -> str | None:
    notes = [
        text
        for text in texts
        if text not in {display_name, role_line, "Show more"}
    ]
    return _empty_to_none(" ".join(notes))


def _fallback_identity(display_name: str, organization: str | None, role_title: str | None) -> str:
    raw = "|".join([display_name, organization or "", role_title or ""])
    return re.sub(r"\s+", " ", raw).strip().lower()


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def _sql_int_literal(value: int | None) -> str:
    return "NULL" if value is None else str(value)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Collect Founder Institute CRM source data.")
    parser.add_argument("--output-sql", required=True, type=Path)
    parser.add_argument("--cookie-env", default="FI_COOKIE")
    parser.add_argument("--city", default="All")
    parser.add_argument("--max-pages", type=int, default=100)
    parser.add_argument("--pause-seconds", type=float, default=0.25)
    args = parser.parse_args(argv)

    cookie = os.environ.get(args.cookie_env)
    if not cookie:
        raise SystemExit(f"{args.cookie_env} is required")

    entries = collect_directory_entries(
        cookie=cookie,
        city_name=args.city,
        max_pages=args.max_pages,
        pause_seconds=args.pause_seconds,
    )
    args.output_sql.parent.mkdir(parents=True, exist_ok=True)
    args.output_sql.write_text(build_import_sql(entries), encoding="utf-8")
    print(json.dumps({"entries": len(entries), "output_sql": str(args.output_sql)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
