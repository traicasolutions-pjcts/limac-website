import pytest

from app.services.serial_import import checksum_bytes, parse_import_file, validate_headers


def test_parse_csv_import_file() -> None:
    content = (
        "serial_number,product_model,product_category,warranty_months\n"
        " lmc1 ,LM150,SOLAR,60\n"
    ).encode()

    rows = parse_import_file("serials.csv", content)

    assert rows == [
        {
            "serial_number": " lmc1 ",
            "product_model": "LM150",
            "product_category": "SOLAR",
            "warranty_months": "60",
        }
    ]


def test_validate_headers_rejects_missing_required_columns() -> None:
    with pytest.raises(ValueError, match="Missing required columns"):
        validate_headers([{"serial_number": "LMC1"}])


def test_checksum_bytes_is_stable_sha256() -> None:
    assert checksum_bytes(b"limac") == checksum_bytes(b"limac")
    assert checksum_bytes(b"limac") != checksum_bytes(b"limac2")
