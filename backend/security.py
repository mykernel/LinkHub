import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


class DataEncryption:
    """数据加密解密工具类（AES-256-GCM）"""

    @staticmethod
    def generate_salt() -> str:
        """生成随机盐值"""
        return base64.b64encode(os.urandom(32)).decode('utf-8')

    @staticmethod
    def derive_key(salt: str, password: str = "default_key") -> bytes:
        """从盐值派生加密密钥"""
        salt_bytes = base64.b64decode(salt.encode('utf-8'))
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt_bytes,
            iterations=100000,
            backend=default_backend()
        )
        return kdf.derive(password.encode('utf-8'))

    @staticmethod
    def encrypt(plaintext: str, salt: str) -> str:
        """
        加密文本
        :param plaintext: 明文
        :param salt: 盐值
        :return: Base64 编码的密文（包含 nonce）
        """
        if not plaintext:
            return ""

        key = DataEncryption.derive_key(salt)
        aesgcm = AESGCM(key)

        # 生成随机 nonce
        nonce = os.urandom(12)

        # 加密数据
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)

        # 将 nonce 和 ciphertext 组合
        encrypted_data = nonce + ciphertext

        # Base64 编码
        return base64.b64encode(encrypted_data).decode('utf-8')

    @staticmethod
    def decrypt(encrypted_data: str, salt: str) -> str:
        """
        解密文本
        :param encrypted_data: Base64 编码的密文
        :param salt: 盐值
        :return: 明文
        """
        if not encrypted_data:
            return ""

        try:
            key = DataEncryption.derive_key(salt)
            aesgcm = AESGCM(key)

            # Base64 解码
            data = base64.b64decode(encrypted_data.encode('utf-8'))

            # 提取 nonce 和 ciphertext
            nonce = data[:12]
            ciphertext = data[12:]

            # 解密
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"解密失败: {str(e)}")


# 全局加密工具实例
encryption = DataEncryption()