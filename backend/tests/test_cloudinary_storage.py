from app.storage import cloudinary_storage


def test_signed_pdf_url_does_not_duplicate_existing_public_id_extension(monkeypatch) -> None:
    captured = {}

    def fake_cloudinary_url(public_id, **options):
        captured["public_id"] = public_id
        captured["options"] = options
        suffix = f".{options['format']}" if "format" in options else ""
        return f"https://example.test/{public_id}{suffix}", {}

    monkeypatch.setattr(cloudinary_storage, "utc_now", lambda: type("Now", (), {"timestamp": lambda _self: 1})())
    monkeypatch.setitem(__import__("sys").modules, "cloudinary", type("Cloudinary", (), {"config": lambda **_kw: None}))
    monkeypatch.setitem(
        __import__("sys").modules,
        "cloudinary.utils",
        type("Utils", (), {"cloudinary_url": fake_cloudinary_url}),
    )

    settings = type(
        "Settings",
        (),
        {
            "cloudinary_configured": True,
            "cloudinary_cloud_name": "demo",
            "cloudinary_api_key": "key",
            "cloudinary_api_secret": "secret",
        },
    )()
    asset = {
        "public_id": "limac/warranty-bills/2026/08/LIMAC-REG-2026-000011-100920.pdf",
        "resource_type": "raw",
        "content_type": "application/pdf",
        "format": "pdf",
        "filename": "bill.pdf",
    }

    result = cloudinary_storage.build_cloudinary_bill_access(settings, asset)

    assert result["url"].endswith("100920.pdf")
    assert "format" not in captured["options"]


def test_signed_pdf_url_adds_missing_public_id_extension(monkeypatch) -> None:
    captured = {}

    def fake_cloudinary_url(public_id, **options):
        captured["options"] = options
        suffix = f".{options['format']}" if "format" in options else ""
        return f"https://example.test/{public_id}{suffix}", {}

    monkeypatch.setattr(cloudinary_storage, "utc_now", lambda: type("Now", (), {"timestamp": lambda _self: 1})())
    monkeypatch.setitem(__import__("sys").modules, "cloudinary", type("Cloudinary", (), {"config": lambda **_kw: None}))
    monkeypatch.setitem(
        __import__("sys").modules,
        "cloudinary.utils",
        type("Utils", (), {"cloudinary_url": fake_cloudinary_url}),
    )

    settings = type(
        "Settings",
        (),
        {
            "cloudinary_configured": True,
            "cloudinary_cloud_name": "demo",
            "cloudinary_api_key": "key",
            "cloudinary_api_secret": "secret",
        },
    )()
    asset = {
        "public_id": "limac/warranty-bills/2026/08/LIMAC-REG-2026-000011-100920",
        "resource_type": "raw",
        "content_type": "application/pdf",
        "format": "pdf",
        "filename": "bill.pdf",
    }

    result = cloudinary_storage.build_cloudinary_bill_access(settings, asset)

    assert result["url"].endswith("100920.pdf")
    assert captured["options"]["format"] == "pdf"
