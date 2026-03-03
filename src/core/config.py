from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Kafka Configuration
    KAFKA_BROKER: str = "localhost:9092"
    
    # Database Configuration
    DATABASE_URL: str | None = None
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_USER: str = "admin"
    DB_PASSWORD: str = "adminpassword"
    DB_NAME: str = "metrics_db"

    @property
    def get_database_url(self) -> str:
        """Constructs DB URL. Handles cloud sslmode requirements."""
        if self.DATABASE_URL:
            # SQLAlchemy asyncpg requires postgresql+asyncpg:// but asyncpg alone requires postgresql://
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            
            # Aiven / Cloud SQL usually requires sslmode
            if "sslmode=require" not in url and ".aivencloud.com" in url:
                if "?" in url:
                    url += "&sslmode=require"
                else:
                    url += "?sslmode=require"
            return url
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
