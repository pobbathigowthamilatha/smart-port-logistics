import json

from app import build_analytics_snapshot, create_customer_report_record


def test_build_analytics_snapshot_for_last_7_days():
    snapshot = build_analytics_snapshot("last_7_days")

    assert isinstance(snapshot, dict)
    assert "labels" in snapshot
    assert "cargoVolume" in snapshot
    assert "vesselMovement" in snapshot
    assert len(snapshot["labels"]) > 0
    assert len(snapshot["cargoVolume"]) == len(snapshot["labels"])


def test_create_customer_report_record_has_real_payload():
    report = create_customer_report_record()

    assert isinstance(report, dict)
    assert report["report_id"].startswith("REP-")
    assert report["title"]
    assert report["summary"]
    assert report["generated_date"]
    assert "report_data" in report
    assert isinstance(json.loads(report["report_data"]), dict)
