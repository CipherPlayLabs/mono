import json
import uuid
from typing import Any, Iterable


CURRENT_COLLECTION_TABLE_KEYS = {
    "source_threads": ["source_thread_id"],
    "thread_nodes": ["thread_node_id"],
}


class BigQueryResearchStore:
    def __init__(self, *, project_id: str, dataset_id: str):
        from google.cloud import bigquery  # type: ignore

        self.bigquery = bigquery
        self.client = bigquery.Client(project=project_id)
        self.project_id = project_id
        self.dataset_id = dataset_id

    def get_latest_checkpoint(self, collection_run_id: str, query_mode: str) -> dict[str, Any] | None:
        query = f"""
            SELECT checkpoint_json
            FROM `{self.project_id}.{self.dataset_id}.collection_checkpoints`
            WHERE collection_run_id = @collection_run_id
              AND query_mode = @query_mode
            ORDER BY recorded_at DESC
            LIMIT 1
        """
        job_config = self.bigquery.QueryJobConfig(
            query_parameters=[
                self.bigquery.ScalarQueryParameter("collection_run_id", "STRING", collection_run_id),
                self.bigquery.ScalarQueryParameter("query_mode", "STRING", query_mode),
            ]
        )
        rows = list(self.client.query(query, job_config=job_config).result())
        return dict(rows[0]["checkpoint_json"]) if rows else None

    def write_collection_rows(self, rows_by_table: dict[str, list[dict[str, Any]]]) -> None:
        for table, rows in rows_by_table.items():
            if table in CURRENT_COLLECTION_TABLE_KEYS:
                delete_missing_for = None
                if table == "thread_nodes":
                    delete_missing_for = {
                        "field": "source_thread_id",
                        "values": sorted({row["source_thread_id"] for row in rows if row.get("source_thread_id")}),
                    }
                self._merge_rows(
                    table,
                    rows,
                    match_keys=CURRENT_COLLECTION_TABLE_KEYS[table],
                    delete_missing_for=delete_missing_for,
                )
            else:
                self._insert_rows(table, rows)

    def write_checkpoint(self, row: dict[str, Any]) -> None:
        self._insert_rows("collection_checkpoints", [row])

    def write_triage_rows(self, rows: list[dict[str, Any]]) -> None:
        self._merge_rows("source_thread_triage", rows, match_keys=["source_thread_id"])

    def write_analysis_rows(self, output: dict[str, Any]) -> None:
        rows_by_table = {
            "analysis_batches": [output["analysis_batch"]],
            "source_quality_notes": output["source_quality_notes"],
            "source_passages": output["source_passages"],
            "evidence_claims": output["evidence_claims"],
            "thread_level_jtbd_records": [output["thread_level_jtbd_record"]],
        }
        for table, rows in rows_by_table.items():
            self._insert_rows(table, rows)

    def write_normalization_rows(self, output: dict[str, Any]) -> None:
        rows_by_table = {
            "normalization_runs": [output["normalization_run"]],
            "normalized_jtbd_entities": output["normalized_jtbd_entities"],
            "evidence_relationships": output["evidence_relationships"],
        }
        for table, rows in rows_by_table.items():
            self._insert_rows(table, rows)

    def iter_threads_for_triage(self, limit: int) -> Iterable[dict[str, Any]]:
        query = f"""
            WITH latest_triage AS (
              SELECT source_thread_id, MAX(observed_at) AS observed_at
              FROM `{self.project_id}.{self.dataset_id}.source_thread_triage`
              GROUP BY source_thread_id
            )
            SELECT s.source_thread_id, s.source_thread_json
            FROM `{self.project_id}.{self.dataset_id}.source_threads` s
            LEFT JOIN latest_triage t
              ON s.source_thread_id = t.source_thread_id
            WHERE t.source_thread_id IS NULL
               OR s.latest_fetched_at > t.observed_at
            ORDER BY s.created_at DESC
            LIMIT @limit
        """
        yield from self._query_thread_refs(query, limit)

    def iter_threads_for_analysis(self, limit: int) -> Iterable[dict[str, Any]]:
        query = f"""
            WITH eligible_source_threads AS (
              SELECT t.source_thread_id
              FROM `{self.project_id}.{self.dataset_id}.source_thread_triage` t
              LEFT JOIN `{self.project_id}.{self.dataset_id}.thread_level_jtbd_records` r
                ON t.source_thread_id = r.source_thread_id
              WHERE t.triage_status = 'jtbd_eligible'
                AND r.source_thread_id IS NULL
              GROUP BY t.source_thread_id
            ),
            SELECT s.source_thread_id, s.source_thread_json
            FROM `{self.project_id}.{self.dataset_id}.source_threads` s
            JOIN eligible_source_threads e
              ON s.source_thread_id = e.source_thread_id
            ORDER BY s.created_at DESC
            LIMIT @limit
        """
        yield from self._query_thread_refs(query, limit)

    def _query_thread_refs(self, query: str, limit: int) -> Iterable[dict[str, Any]]:
        job_config = self.bigquery.QueryJobConfig(
            query_parameters=[self.bigquery.ScalarQueryParameter("limit", "INT64", limit)]
        )
        for row in self.client.query(query, job_config=job_config).result():
            yield dict(row)

    def _insert_rows(self, table: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        table_id = f"{self.project_id}.{self.dataset_id}.{table}"
        row_ids = [_row_insert_id(row) for row in rows]
        insert_rows = [_prepare_row_for_insert(row) for row in rows]
        errors = self.client.insert_rows_json(table_id, insert_rows, row_ids=row_ids)
        if errors:
            raise RuntimeError(f"BigQuery insert failed for {table_id}: {errors}")

    def _merge_rows(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        match_keys: list[str],
        delete_missing_for: dict[str, Any] | None = None,
    ) -> None:
        if not rows:
            return

        rows = _dedupe_rows(rows, match_keys)
        columns = _row_columns(rows)
        target_table_id = f"{self.project_id}.{self.dataset_id}.{table}"
        staging_table_id = f"{self.project_id}.{self.dataset_id}._staging_{table}_{uuid.uuid4().hex}"
        target = self.client.get_table(target_table_id)
        prepared_rows = [_prepare_row_for_insert(row) for row in rows]
        load_job_config = self.bigquery.LoadJobConfig(
            schema=target.schema,
            source_format=self.bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=self.bigquery.WriteDisposition.WRITE_TRUNCATE,
        )

        try:
            self.client.load_table_from_json(prepared_rows, staging_table_id, job_config=load_job_config).result()
            merge_sql = _merge_sql(
                target_table_id=target_table_id,
                staging_table_id=staging_table_id,
                columns=columns,
                match_keys=match_keys,
                delete_missing_for=delete_missing_for,
            )
            job_config = None
            if delete_missing_for:
                job_config = self.bigquery.QueryJobConfig(
                    query_parameters=[
                        self.bigquery.ArrayQueryParameter(
                            "delete_missing_values",
                            "STRING",
                            delete_missing_for["values"],
                        )
                    ]
                )
            self.client.query(merge_sql, job_config=job_config).result()
        finally:
            self.client.delete_table(staging_table_id, not_found_ok=True)


def _row_insert_id(row: dict[str, Any]) -> str | None:
    for key, value in row.items():
        if key.endswith("_id") and value:
            return str(value)
    return None


def _prepare_row_for_insert(row: dict[str, Any]) -> dict[str, Any]:
    prepared = dict(row)
    for key, value in row.items():
        if key.endswith("_json") and value is not None and not isinstance(value, str):
            prepared[key] = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return prepared


def _row_columns(rows: list[dict[str, Any]]) -> list[str]:
    columns = list(rows[0].keys())
    seen = set(columns)
    for row in rows[1:]:
        for column in row:
            if column not in seen:
                columns.append(column)
                seen.add(column)
    return columns


def _dedupe_rows(rows: list[dict[str, Any]], match_keys: list[str]) -> list[dict[str, Any]]:
    by_key: dict[tuple[Any, ...], dict[str, Any]] = {}
    for row in rows:
        by_key[tuple(row.get(key) for key in match_keys)] = row
    return list(by_key.values())


def _merge_sql(
    *,
    target_table_id: str,
    staging_table_id: str,
    columns: list[str],
    match_keys: list[str],
    delete_missing_for: dict[str, Any] | None,
) -> str:
    match_expression = " AND ".join(
        f"target.{_quote_identifier(column)} = source.{_quote_identifier(column)}" for column in match_keys
    )
    update_columns = [column for column in columns if column not in match_keys]
    update_clause = ",\n  ".join(
        f"{_quote_identifier(column)} = source.{_quote_identifier(column)}" for column in update_columns
    )
    insert_columns = ", ".join(_quote_identifier(column) for column in columns)
    insert_values = ", ".join(f"source.{_quote_identifier(column)}" for column in columns)

    clauses = [
        f"MERGE `{target_table_id}` AS target",
        f"USING `{staging_table_id}` AS source",
        f"ON {match_expression}",
    ]
    if update_clause:
        clauses.append(f"WHEN MATCHED THEN UPDATE SET\n  {update_clause}")
    clauses.append(f"WHEN NOT MATCHED THEN INSERT ({insert_columns}) VALUES ({insert_values})")
    if delete_missing_for:
        field = _quote_identifier(delete_missing_for["field"])
        clauses.append(f"WHEN NOT MATCHED BY SOURCE AND target.{field} IN UNNEST(@delete_missing_values) THEN DELETE")
    return "\n".join(clauses)


def _quote_identifier(identifier: str) -> str:
    return f"`{identifier}`"
