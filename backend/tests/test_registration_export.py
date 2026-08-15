from datetime import UTC, datetime

from app.repositories.registrations import RegistrationRepository


class FakeCursor:
    def __init__(self, rows: list[dict]) -> None:
        self.rows = rows

    def sort(self, *_args):
        return self

    def __aiter__(self):
        self.index = 0
        return self

    async def __anext__(self):
        if self.index >= len(self.rows):
            raise StopAsyncIteration
        row = self.rows[self.index]
        self.index += 1
        return row


class FakeCollection:
    def __init__(self, rows: list[dict]) -> None:
        self.rows = rows
        self.queries: list[dict] = []

    def find(self, query: dict):
        self.queries.append(query)
        return FakeCursor(self.rows)


class FakeDb:
    def __init__(self, live_rows: list[dict], backup_rows: list[dict]) -> None:
        self.warranty_registrations = FakeCollection(live_rows)
        self.warranty_registration_backups = FakeCollection(backup_rows)


async def test_export_includes_deleted_backup_snapshots_with_deleted_status() -> None:
    live_row = {
        "registration_number": "LIMAC-REG-2026-000001",
        "status": "PENDING",
        "submitted_at": datetime(2026, 8, 15, 5, 0, tzinfo=UTC),
    }
    deleted_snapshot = {
        "registration_number": "LIMAC-REG-2026-000002",
        "status": "APPROVED",
        "submitted_at": datetime(2026, 8, 15, 6, 0, tzinfo=UTC),
    }
    db = FakeDb(
        live_rows=[live_row],
        backup_rows=[{"action": "DELETED", "snapshot": deleted_snapshot}],
    )

    rows = await RegistrationRepository(db).list_export_documents()

    assert [row["registration_number"] for row in rows] == [
        "LIMAC-REG-2026-000002",
        "LIMAC-REG-2026-000001",
    ]
    assert rows[0]["status"] == "DELETED"
    assert rows[1]["status"] == "PENDING"


async def test_deleted_export_status_reads_only_deleted_backups() -> None:
    db = FakeDb(
        live_rows=[{"registration_number": "LIVE", "status": "PENDING"}],
        backup_rows=[{"action": "DELETED", "snapshot": {"registration_number": "DELETED"}}],
    )

    rows = await RegistrationRepository(db).list_export_documents(status="DELETED")

    assert [row["registration_number"] for row in rows] == ["DELETED"]
    assert db.warranty_registrations.queries == []
    assert db.warranty_registration_backups.queries == [{"action": "DELETED"}]
