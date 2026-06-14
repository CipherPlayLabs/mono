import json
import unittest

from infra.crm.importers.founder_institute import (
    FounderInstituteEntry,
    build_import_sql,
    parse_directory_entries,
)


SAMPLE_ENTRIES_HTML = """
<div>
  <div class="pt-4 grid grid-cols-1 gap-y-2" tabindex="-1">
    <div class= "flex items-start space-x-2.5 px-5 py-4">
      <img class="h-16 w-16 flex-shrink-0 rounded-full" src="https://s3.example/users/292.jpg" loading="lazy" />
      <span class="flex flex-col">
        <span class="flex items-stretch gap-x-1">
          <span>Adeo Ressi</span>
          <a data-tooltip-content-value="View LinkedIn profile" data-turbo="false" target="_blank" href="https://www.linkedin.com/in/adeoressi/"><i class="fi-icon-linkedin"></i></a>
        </span>
        <span class="font-normal mb-1 text-sm">CEO, Decile Group / VC Lab</span>
        <span class="text-[13px] leading-5 text-gray-700/75 font-normal pr-4">Helps founders with fundraising and launch strategy.</span>
        <a class="text-acai-700 hover:cursor-pointer">Show more</a>
      </span>
    </div>
    <div class= "flex items-start space-x-2.5 px-5 py-4">
      <img class="h-16 w-16 flex-shrink-0 rounded-full" src="/images/blank_person.png" loading="lazy" />
      <span class="flex flex-col">
        <span class="flex items-stretch gap-x-1">
          <span>Janet Van Pelt</span>
        </span>
        <span class="font-normal mb-1 text-sm">CEO, DualEnroll.com</span>
        <a class="text-acai-700 hover:cursor-pointer">Show more</a>
      </span>
    </div>
  </div>
</div>
"""


class FounderInstituteImporterTests(unittest.TestCase):
    def test_parse_directory_entries_extracts_card_fields(self):
        entries = parse_directory_entries(
            entries_html=SAMPLE_ENTRIES_HTML,
            specialization_name="Fundraising: SAFEs / Equity / Venture Capital",
            city_name="All",
            source_url="https://fi.co/network?specialization_search=Fundraising&page=2",
            source_page=2,
        )

        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0].display_name, "Adeo Ressi")
        self.assertEqual(entries[0].first_name, "Adeo")
        self.assertEqual(entries[0].last_name, "Ressi")
        self.assertEqual(entries[0].role_title, "CEO")
        self.assertEqual(entries[0].organization, "Decile Group / VC Lab")
        self.assertEqual(entries[0].linkedin_url, "https://www.linkedin.com/in/adeoressi")
        self.assertEqual(entries[0].identity_key, "https://www.linkedin.com/in/adeoressi")
        self.assertEqual(entries[0].identity_key_type, "linkedin_url")
        self.assertEqual(entries[0].source_confidence, "private-sourced")
        self.assertIn("fundraising", entries[0].mentor_notes.lower())

        self.assertEqual(entries[1].display_name, "Janet Van Pelt")
        self.assertIsNone(entries[1].linkedin_url)
        self.assertEqual(entries[1].identity_key_type, "name_organization_role")
        self.assertEqual(entries[1].source_confidence, "needs-verification")

    def test_build_import_sql_upserts_fi_entries_without_contact_promotion(self):
        entry = FounderInstituteEntry(
            identity_key="https://www.linkedin.com/in/example",
            identity_key_type="linkedin_url",
            display_name="Example Person",
            first_name="Example",
            last_name="Person",
            organization="Example Co",
            role_title="CEO",
            linkedin_url="https://www.linkedin.com/in/example",
            profile_image_url="https://s3.example/users/1.jpg",
            specialization_name="Growth: Product-Led Growth / KPIs / Unit Economics",
            city_name="All",
            source_url="https://fi.co/network?page=1",
            source_page=1,
            source_position=1,
            card_text="Example Person CEO, Example Co Show more",
            mentor_notes="Useful note with 'quote'",
            raw_card={"hrefs": ["https://www.linkedin.com/in/example"]},
            source_confidence="private-sourced",
        )

        sql = build_import_sql([entry])

        self.assertIn("INSERT INTO private_sources.founder_institute_directory_entries", sql)
        self.assertIn("ON CONFLICT (lower(identity_key), lower(specialization_name), lower(city_name))", sql)
        self.assertIn("DO UPDATE SET", sql)
        self.assertIn("'Useful note with ''quote'''", sql)
        self.assertIn(json.dumps(entry.raw_card, sort_keys=True), sql)


if __name__ == "__main__":
    unittest.main()
