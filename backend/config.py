from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 数据库配置
    DB_HOST: str = "172.16.63.222"
    DB_PORT: int = 3307
    DB_USER: str = "root"
    DB_PASSWORD: str = "1234567"
    DB_NAME: str = "linkhub"

    # JWT 配置
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # 应用配置
    DEBUG: bool = True
    CORS_ORIGINS: str = "*"

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    class Config:
        env_file = ".env"


settings = Settings()