"""
Global Configuration & Environment Settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # App Server Configuration
    app_env: str = Field(default="development", alias="NODE_ENV")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8080, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Search APIs
    brave_api_key: str = Field(default="", alias="BRAVE_SEARCH_API_KEY")
    search_cache_ttl_seconds: int = Field(default=300, alias="SEARCH_CACHE_TTL")

    # BAWSAQ Stocks
    stocks_cache_ttl_seconds: int = Field(default=30, alias="STOCKS_CACHE_TTL")
    volatility_multiplier: float = Field(default=1.0, alias="STOCKS_VOLATILITY_MULTIPLIER")

    # Trending News
    news_cache_ttl_seconds: int = Field(default=180, alias="NEWS_CACHE_TTL")

    # Satire LLM Engine
    satire_provider: str = Field(default="heuristic", alias="SATIRE_LLM_PROVIDER")
    satire_model: str = Field(default="gpt-4o-mini", alias="SATIRE_LLM_MODEL")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    ollama_host: str = Field(default="http://127.0.0.1:11434", alias="OLLAMA_HOST")
    ollama_model: str = Field(default="llama3", alias="OLLAMA_MODEL")

    # In-Game Radio Broadcast
    radio_broadcast_interval_ms: int = Field(default=20000, alias="RADIO_BROADCAST_INTERVAL_MS")
    audio_cdn_url: str = Field(default="https://cdn.weazelnews.vicecity/audio", alias="AUDIO_CDN_URL")

    # Unreal Engine Safety Limits
    max_title_length: int = Field(default=128, alias="SAFETY_MAX_TITLE_LENGTH")
    max_snippet_length: int = Field(default=512, alias="SAFETY_MAX_SNIPPET_LENGTH")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
