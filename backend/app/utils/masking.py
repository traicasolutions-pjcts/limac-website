import re

from app.utils.serials import normalize_serial


def normalize_mobile(mobile_number: str) -> str:
    return re.sub(r"\D+", "", mobile_number)


def mask_mobile(mobile_number: str) -> str:
    digits = normalize_mobile(mobile_number)
    if len(digits) <= 4:
        return digits
    return f"{'*' * (len(digits) - 4)}{digits[-4:]}"


def mask_serial(serial_number: str) -> str:
    normalized = normalize_serial(serial_number)
    if len(normalized) <= 4:
        return normalized
    return f"{normalized[:2]}{'*' * max(2, len(normalized) - 6)}{normalized[-4:]}"
