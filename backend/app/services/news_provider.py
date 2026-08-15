import time
import urllib.parse
import urllib.request
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import Settings

logger = logging.getLogger(__name__)

# Lightweight in-memory cache
# Key: cache_key (string)
# Value: {"timestamp": float, "data": List[Dict[str, Any]]}
_news_cache: Dict[str, Dict[str, Any]] = {}
CACHE_EXPIRATION_SECONDS = 900  # 15 minutes


class NewsProviderService:
    def __init__(self, settings: Settings) -> None:
        self.api_key = settings.newsdata_api_key
        self.base_url = "https://newsdata.io/api/1/latest"

    def fetch_latest_news(
        self,
        *,
        q: Optional[str] = None,
        language: str = "en",
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch latest news from NewsData.io and normalize them, with in-memory cache fallback."""
        if not self.api_key:
            logger.warning("NEWSDATA_API_KEY is not configured. Returning empty news list.")
            return []

        # Map UI languages to NewsData.io supported languages
        # English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu
        supported_langs = {"en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu", "pa", "or", "as", "ur"}
        lang_code = language.lower()
        if lang_code not in supported_langs:
            lang_code = "en"

        # Construct cache key
        cache_key = f"{q}_{lang_code}_{category}"
        now = time.time()

        if cache_key in _news_cache:
            entry = _news_cache[cache_key]
            if now - entry["timestamp"] < CACHE_EXPIRATION_SECONDS:
                logger.info(f"Returning cached news for key: {cache_key}")
                return entry["data"]

        # Build query parameters
        params = {
            "apikey": self.api_key,
            "country": "in",  # Filter by India
            "language": lang_code,
        }
        if q:
            params["q"] = q
        if category:
            params["category"] = category

        query_string = urllib.parse.urlencode(params)
        url = f"{self.base_url}?{query_string}"

        try:
            logger.info(f"Requesting NewsData.io: {url.replace(self.api_key, '***')}")
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "GramOne-Community-Portal"},
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
                
            if payload.get("status") != "success":
                logger.error(f"NewsData.io returned error status: {payload}")
                return []

            results = payload.get("results", [])
            normalized = self._normalize_articles(results)
            
            # Cache the normalized results
            _news_cache[cache_key] = {
                "timestamp": now,
                "data": normalized
            }
            return normalized

        except Exception as e:
            logger.exception(f"Error fetching news from NewsData.io: {e}")
            if cache_key in _news_cache:
                logger.warning("Returning expired cache due to provider error.")
                return _news_cache[cache_key]["data"]
            return []

    def _normalize_articles(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for idx, art in enumerate(articles):
            pub_date = art.get("pubDate")
            article_id = art.get("article_id") or f"ext_{hash(art.get('link', ''))}"
            
            normalized.append({
                "id": article_id,
                "title": art.get("title") or "Local News",
                "summary": art.get("description") or art.get("content") or "",
                "image_url": art.get("image_url") or None,
                "source_type": "external",
                "notice_type": "news",
                "source": art.get("source_id") or "External Publisher",
                "url": art.get("link") or "",
                "published_at": pub_date,
                "language": art.get("language") or "en",
                "category": art.get("category", [None])[0] if art.get("category") else None,
                "region": art.get("country", [None])[0] if art.get("country") else None,
            })
        return normalized
