from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Kafka Configuration
    KAFKA_BROKER: str = "localhost:9092"
    
    # Database Configuration
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_USER: str = "admin"
    DB_PASSWORD: str = "adminpassword"
    DB_NAME: str = "metrics_db"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
