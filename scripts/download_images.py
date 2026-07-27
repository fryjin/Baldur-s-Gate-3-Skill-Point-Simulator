#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
import json
import ssl
import sys
import time
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
REMOTE_MANIFEST = ROOT / "data" / "vgbaike_remote_manifest.json"
LOCAL_MANIFEST = ROOT / "data" / "local_image_manifest.json"
FAILURE_LOG = ROOT / "data" / "download_failures.json"
OUTPUT_DIR = ROOT / "assets" / "spells"

# Only this exact host may use the expired-certificate fallback.
TLS_FALLBACK_HOSTS = {"media.vgbaike.com"}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/124 Safari/537.36"
    ),
    "Referer": "https://www.vgbaike.com/baldurs_gate_3",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
}

MIN_IMAGE_SIZE = 100
MAX_IMAGE_SIZE = 20 * 1024 * 1024
REQUEST_TIMEOUT = 30
RETRY_COUNT = 3
REQUEST_DELAY = 0.35


def looks_like_image(data: bytes) -> bool:
    """Validate common image magic bytes instead of trusting the extension."""
    return (
        data.startswith(b"\x89PNG\r\n\x1a\n")
        or data.startswith(b"\xff\xd8\xff")
        or (len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP")
        or data.startswith((b"GIF87a", b"GIF89a"))
    )


def is_certificate_error(exc: BaseException) -> bool:
    if isinstance(exc, ssl.SSLCertVerificationError):
        return True
    if isinstance(exc, urllib.error.URLError):
        reason = exc.reason
        if isinstance(reason, ssl.SSLCertVerificationError):
            return True
    return "CERTIFICATE_VERIFY_FAILED" in str(exc)


def request_bytes(url: str, *, insecure_tls: bool = False) -> tuple[bytes, str]:
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise RuntimeError(f"Only HTTPS URLs are allowed: {url}")

    if insecure_tls and parsed.hostname not in TLS_FALLBACK_HOSTS:
        raise RuntimeError(
            f"TLS fallback is not permitted for host: {parsed.hostname}"
        )

    context = (
        ssl._create_unverified_context()
        if insecure_tls
        else ssl.create_default_context()
    )

    request = urllib.request.Request(url, headers=HEADERS)

    with urllib.request.urlopen(
        request,
        timeout=REQUEST_TIMEOUT,
        context=context,
    ) as response:
        content_type = response.headers.get("Content-Type", "")
        data = response.read(MAX_IMAGE_SIZE + 1)

    if len(data) > MAX_IMAGE_SIZE:
        raise RuntimeError("downloaded file exceeds 20 MB")

    if len(data) < MIN_IMAGE_SIZE:
        raise RuntimeError("downloaded file is too small")

    if not looks_like_image(data):
        preview = data[:80].decode("utf-8", errors="replace")
        raise RuntimeError(
            f"response is not a supported image; "
            f"Content-Type={content_type!r}; preview={preview!r}"
        )

    return data, content_type


def download_image(url: str) -> tuple[bytes, bool]:
    """
    Use normal certificate verification first.

    media.vgbaike.com currently presents an expired certificate. If and only if
    the normal request fails for that certificate reason, retry without TLS
    verification for this allowlisted image host. The downloaded bytes are
    still checked using image signatures.
    """
    try:
        data, _ = request_bytes(url, insecure_tls=False)
        return data, False
    except Exception as exc:
        host = urlparse(url).hostname
        if not (is_certificate_error(exc) and host in TLS_FALLBACK_HOSTS):
            raise

        data, _ = request_bytes(url, insecure_tls=True)
        return data, True


def main() -> int:
    if not REMOTE_MANIFEST.exists():
        print(f"ERROR: manifest not found: {REMOTE_MANIFEST}")
        return 2

    manifest = json.loads(REMOTE_MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        print("ERROR: remote manifest must be a JSON object.")
        return 2

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    local_manifest: dict[str, str] = {}
    failures: list[dict[str, str]] = []
    success_count = 0
    fallback_count = 0
    total = len(manifest)

    for index, (key, url) in enumerate(manifest.items(), start=1):
        target = OUTPUT_DIR / f"{key}.png"

        if target.exists() and target.stat().st_size >= MIN_IMAGE_SIZE:
            existing = target.read_bytes()
            if looks_like_image(existing):
                local_manifest[key] = f"assets/spells/{target.name}"
                success_count += 1
                print(f"[{index}/{total}] SKIP {key}")
                continue

        last_error: Exception | None = None

        for attempt in range(1, RETRY_COUNT + 1):
            try:
                data, used_fallback = download_image(url)
                target.write_bytes(data)
                local_manifest[key] = f"assets/spells/{target.name}"
                success_count += 1

                if used_fallback:
                    fallback_count += 1
                    print(
                        f"[{index}/{total}] OK   {key} "
                        f"({len(data)} bytes, expired-cert fallback)"
                    )
                else:
                    print(
                        f"[{index}/{total}] OK   {key} "
                        f"({len(data)} bytes)"
                    )
                last_error = None
                break
            except Exception as exc:
                last_error = exc
                if attempt < RETRY_COUNT:
                    wait_seconds = 1.0 * attempt
                    print(
                        f"[{index}/{total}] RETRY {key} "
                        f"({attempt}/{RETRY_COUNT}): {exc}"
                    )
                    time.sleep(wait_seconds)

        if last_error is not None:
            failures.append(
                {
                    "key": key,
                    "url": url,
                    "error": str(last_error),
                }
            )
            print(f"[{index}/{total}] FAIL {key}: {last_error}")

        time.sleep(REQUEST_DELAY)

    LOCAL_MANIFEST.write_text(
        json.dumps(local_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    FAILURE_LOG.write_text(
        json.dumps(failures, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print()
    print(
        f"Finished: {success_count} succeeded, "
        f"{len(failures)} failed, "
        f"{fallback_count} used expired-cert fallback"
    )
    print(f"Images:   {OUTPUT_DIR}")
    print(f"Manifest: {LOCAL_MANIFEST}")

    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
