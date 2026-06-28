import base64
import hashlib
import os
from cryptography.fernet import Fernet


def _derive_fernet_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def get_cipher() -> Fernet:
    secret = os.getenv("ADMIN_SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or "toolverse-enterprise-default-secret"
    return Fernet(_derive_fernet_key(secret))


def encrypt_value(value: str) -> str:
    return get_cipher().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str) -> str:
    return get_cipher().decrypt(value.encode("utf-8")).decode("utf-8")
