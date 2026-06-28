from __future__ import annotations

import re
import secrets
import string

from passlib.context import CryptContext
from fastapi import HTTPException

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

MIN_PASSWORD_LENGTH = 12


class PasswordPolicy:

    @staticmethod
    def validate(password: str):

        if len(password) < MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Password must contain at least {MIN_PASSWORD_LENGTH} characters."
            )

        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain an uppercase letter."
            )

        if not re.search(r"[a-z]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain a lowercase letter."
            )

        if not re.search(r"[0-9]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain a number."
            )

        if not re.search(r"[!@#$%^&*()_+=\-{}\[\]:;<>,.?/~]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain a special character."
            )

        return True


class PasswordManager:

    @staticmethod
    def hash(password: str):

        PasswordPolicy.validate(password)

        return pwd_context.hash(password)

    @staticmethod
    def verify(password: str, password_hash: str):

        return pwd_context.verify(
            password,
            password_hash
        )

    @staticmethod
    def needs_rehash(password_hash: str):

        return pwd_context.needs_update(
            password_hash
        )

    @staticmethod
    def generate(length: int = 24):

        chars = (
            string.ascii_letters
            + string.digits
            + "!@#$%^&*"
        )

        while True:

            password = "".join(
                secrets.choice(chars)
                for _ in range(length)
            )

            try:
                PasswordPolicy.validate(password)
                return password
            except Exception:
                continue
