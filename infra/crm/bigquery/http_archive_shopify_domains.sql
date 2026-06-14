WITH shopify_pages AS (
  SELECT
    @crawl_date AS crawl_date,
    @client AS client,
    page,
    root_page,
    NET.REG_DOMAIN(root_page) AS canonical_domain,
    rank,
    t.technology AS technology,
    t.categories AS technology_categories,
    t.info AS technology_info
  FROM
    `httparchive.crawl.pages`,
    UNNEST(technologies) AS t
  WHERE
    date = @crawl_date
    AND client = @client
    AND t.technology IN ('Shopify', 'Shopify Plus')
    AND NET.REG_DOMAIN(root_page) IS NOT NULL
),
domain_rollup AS (
  SELECT
    crawl_date,
    client,
    canonical_domain,
    ARRAY_AGG(DISTINCT root_page ORDER BY root_page LIMIT 5) AS sample_root_pages,
    ARRAY_AGG(DISTINCT page ORDER BY page LIMIT 10) AS sample_pages,
    MIN(rank) AS best_rank,
    COUNT(DISTINCT root_page) AS detected_origins,
    COUNT(DISTINCT page) AS detected_pages,
    ARRAY_AGG(DISTINCT technology ORDER BY technology) AS technologies,
    TO_JSON_STRING(ARRAY_AGG(DISTINCT technology_categories IGNORE NULLS LIMIT 20)) AS technology_categories_json,
    TO_JSON_STRING(ARRAY_AGG(DISTINCT technology_info IGNORE NULLS LIMIT 20)) AS technology_info_json,
    TO_JSON_STRING(
      ARRAY_AGG(
        STRUCT(
          page,
          root_page,
          rank,
          technology,
          technology_categories,
          technology_info
        )
        ORDER BY rank NULLS LAST, root_page
        LIMIT 10
      )
    ) AS evidence_json
  FROM shopify_pages
  GROUP BY crawl_date, client, canonical_domain
)
SELECT
  crawl_date,
  client,
  canonical_domain,
  sample_root_pages[SAFE_OFFSET(0)] AS primary_root_page_url,
  best_rank,
  detected_origins,
  detected_pages,
  technologies,
  TO_JSON_STRING(sample_root_pages) AS sample_root_pages_json,
  TO_JSON_STRING(sample_pages) AS sample_pages_json,
  technology_categories_json,
  technology_info_json,
  evidence_json
FROM domain_rollup
ORDER BY best_rank NULLS LAST, canonical_domain
LIMIT @max_rows;
