import json
from typing import Any

from .jtbd import extract_thread_level_jtbd
from .reddit_mapping import flatten_reddit_thread_nodes
from .triage import triage_source_thread


def run_triage_batch(*, research_store: Any, limit: int = 25) -> dict[str, Any]:
    rows = []
    for ref in research_store.iter_threads_for_triage(limit):
        envelope = _source_thread_envelope(ref)
        nodes, gaps = flatten_reddit_thread_nodes(envelope)
        result = triage_source_thread(envelope, nodes)
        if gaps:
            result["triage_json"]["coverage_gaps_seen"] = gaps
        rows.append(result)
    research_store.write_triage_rows(rows)
    return {"threads_triaged": len(rows)}


def run_analysis_batch(
    *,
    research_store: Any,
    limit: int = 10,
    max_chunk_chars: int = 12000,
) -> dict[str, Any]:
    analyzed = 0
    for ref in research_store.iter_threads_for_analysis(limit):
        envelope = _source_thread_envelope(ref)
        nodes, gaps = flatten_reddit_thread_nodes(envelope)
        output = extract_thread_level_jtbd(envelope, nodes, max_chunk_chars=max_chunk_chars)
        if gaps:
            output["thread_level_jtbd_record"]["record_json"]["coverage_gaps_seen"] = gaps
        research_store.write_analysis_rows(output)
        analyzed += 1
    return {"threads_analyzed": analyzed}


def _source_thread_envelope(ref: dict[str, Any]) -> dict[str, Any]:
    envelope = ref["source_thread_json"]
    if isinstance(envelope, str):
        return json.loads(envelope)
    return envelope
