import re
from typing import Tuple, Optional

class InputValidator:
    AMAZON_DOMAINS = ["amazon.com", "amazon.in", "amazon.co.uk", "amazon.ca", "amazon.de", "amazon.fr", "amzn.to", "amzn.in"]
    FLIPKART_DOMAINS = ["flipkart.com"]

    @classmethod
    def validate_input(cls, query_or_url: str, source: str = "Amazon", max_reviews: int = 50) -> Tuple[bool, str, dict]:
        """
        Validates user input and detects whether it is a direct product URL or a search query.
        Returns: (is_valid, error_message, parsed_metadata)
        """
        if not query_or_url or not query_or_url.strip():
            return False, "Input query or product URL cannot be empty.", {}

        text = query_or_url.strip()
        is_url = bool(re.match(r'^https?://', text, re.IGNORECASE))
        
        # Clamp review count
        try:
            count = int(max_reviews)
            count = max(5, min(count, 150))
        except (ValueError, TypeError):
            count = 30

        detected_source = source.capitalize() if source else "Amazon"

        if is_url:
            lower_url = text.lower()
            if any(domain in lower_url for domain in cls.AMAZON_DOMAINS):
                detected_source = "Amazon"
            elif any(domain in lower_url for domain in cls.FLIPKART_DOMAINS):
                detected_source = "Flipkart"
            else:
                # If unspecified URL, allow with detected or provided source
                pass

        return True, "", {
            "query_or_url": text,
            "is_url": is_url,
            "source": detected_source,
            "max_reviews": count
        }
