from app.utils.serials import is_serial_present, normalize_serial


def test_normalize_serial_trims_uppercases_and_removes_inner_whitespace() -> None:
    assert normalize_serial(" lmc26 ab 123456 ") == "LMC26AB123456"


def test_is_serial_present_rejects_blank_values() -> None:
    assert is_serial_present("  ") is False
    assert is_serial_present(None) is False
    assert is_serial_present("abc") is True
