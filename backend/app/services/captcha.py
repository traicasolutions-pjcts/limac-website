import httpx

from app.config import Settings


class CaptchaVerificationError(RuntimeError):
    pass


async def verify_turnstile_token(settings: Settings, token: str, remote_ip: str | None = None) -> None:
    if not settings.turnstile_required:
        return
    if not settings.turnstile_secret_key:
        raise CaptchaVerificationError("Captcha is not configured. Please contact support.")
    if not token or token == "local-placeholder":
        raise CaptchaVerificationError("Captcha verification is required.")

    payload = {
        "secret": settings.turnstile_secret_key,
        "response": token,
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data=payload,
            )
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as exc:
        raise CaptchaVerificationError("Captcha verification failed. Please try again.") from exc

    if not result.get("success"):
        raise CaptchaVerificationError("Captcha verification failed. Please try again.")
