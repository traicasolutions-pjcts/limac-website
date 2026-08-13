import re


_INNER_WHITESPACE = re.compile(r"\s+")


def normalize_serial(serial_number: str) -> str:
    return _INNER_WHITESPACE.sub("", serial_number.strip()).upper()


def is_serial_present(serial_number: str | None) -> bool:
    return bool(serial_number and normalize_serial(serial_number))
