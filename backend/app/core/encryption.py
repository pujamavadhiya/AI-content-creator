from cryptography.fernet import Fernet
from app.config import settings
import base64

def _get_fernet() -> Fernet:
    """Get Fernet instance using configured CREDENTIAL_ENCRYPTION_KEY."""
    key = settings.CREDENTIAL_ENCRYPTION_KEY
    # Ensure key is valid bytes
    if isinstance(key, str):
        key_bytes = key.encode("utf-8")
    else:
        key_bytes = key
    return Fernet(key_bytes)

def encrypt_credential(plain_text: str) -> str:
    """Encrypt a sensitive secret or API key."""
    if not plain_text:
        return ""
    fernet = _get_fernet()
    encrypted = fernet.encrypt(plain_text.encode("utf-8"))
    return encrypted.decode("utf-8")

def decrypt_credential(encrypted_text: str) -> str:
    """Decrypt an encrypted credential."""
    if not encrypted_text:
        return ""
    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(encrypted_text.encode("utf-8"))
        return decrypted.decode("utf-8")
    except Exception:
        # If decryption fails (e.g. key changed or corrupt), return empty or log
        return ""
