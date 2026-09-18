"""
Phase 4 real evaluation skeleton — run this against your actual pipeline,
don't invent numbers. See the roadmap doc: judges explicitly ask "where
did this number come from," and this script is your answer.

STUB: test_cases below need to be replaced with real claims from your own
Synthea data where you know the ground-truth answer (because you generated
it). Metric calculation logic is left for you to build once you know what
your pipeline actually returns.

Run with: python run_benchmark.py
"""
import json
import time
from pathlib import Path

# TODO (build live): replace with real claims + known correct answers from
# your own Synthea-generated data.
TEST_CASES = [
    {
        "claim_id": "CLM-1001",
        "expected_policy_id": "POL-UHC-KNEE-01",
        "expected_step_therapy_met": False,  # ground truth you set when generating data
    },
    # Add 15-30 more before the real run.
]


def run_retrieval_recall_test(test_cases: list[dict]) -> float:
    """
    TODO: call your actual match_payer_coverage_policy() for each case,
    check whether expected_policy_id appears in top-5 results.
    """
    raise NotImplementedError("Wire this up to app.tools.policy_matcher_tool")


def run_trajectory_accuracy_test(test_cases: list[dict]) -> float:
    """
    TODO: call your actual query_patient_clinical_trajectory() for each
    case, compare against expected_step_therapy_met.
    """
    raise NotImplementedError("Wire this up to app.tools.trajectory_tool")


def measure_p95_latency(test_cases: list[dict], fn) -> float:
    """Generic latency harness — pass any tool function to time it."""
    durations = []
    for case in test_cases:
        start = time.perf_counter()
        fn(case)
        durations.append(time.perf_counter() - start)
    durations.sort()
    idx = int(len(durations) * 0.95)
    return durations[idx] * 1000  # ms


def main():
    print(f"Running benchmark against {len(TEST_CASES)} test cases...")
    print("NOTE: this is a skeleton. Implement the TODOs above before")
    print("trusting any number that comes out of this script.\n")

    results = {
        "test_case_count": len(TEST_CASES),
        "policy_recall_at_5": None,   # TODO
        "trajectory_accuracy": None,  # TODO
        "p95_latency_ms": None,       # TODO
    }

    Path("benchmark_results.json").write_text(json.dumps(results, indent=2))
    print("Results written to benchmark_results.json")


if __name__ == "__main__":
    main()
