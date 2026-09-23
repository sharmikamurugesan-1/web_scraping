import re
from typing import List, Set

# Comprehensive English stopwords excluding critical negations
STANDARD_STOPWORDS: Set[str] = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
    "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "own",
    "same", "so", "than", "too", "very", "s", "t", "can", "will", "just",
    "don", "should", "now", "product", "item", "amazon", "flipkart", "bought",
    "buy", "one", "get", "use", "using", "used", "day", "days", "month", "time"
}

# Negation words that must NOT be removed during preprocessing
NEGATION_WORDS: Set[str] = {
    "not", "no", "never", "none", "neither", "nor", "hardly", "barely",
    "scarcely", "cannot", "cant", "can't", "wont", "won't", "dont", "don't",
    "didnt", "didn't", "isnt", "isn't", "arent", "aren't", "wasnt", "wasn't",
    "werent", "weren't", "hasnt", "hasn't", "havent", "haven't", "hadnt",
    "hadn't", "wouldnt", "wouldn't", "couldnt", "couldn't", "shouldnt", "shouldn't"
}

class TextPreprocessor:
    @staticmethod
    def clean_text_for_vader(text: str) -> str:
        """
        Cleans text for VADER analysis.
        Preserves exclamation marks, question marks, capital letters (which indicate intensity in VADER),
        emojis, and negation words.
        """
        if not text or not isinstance(text, str):
            return ""

        # Remove HTML tags
        cleaned = re.sub(r'<[^>]+>', ' ', text)
        # Remove URLs
        cleaned = re.sub(r'https?://\S+|www\.\S+', ' ', cleaned)
        # Remove email addresses
        cleaned = re.sub(r'\S+@\S+', ' ', cleaned)
        # Remove multiple whitespaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @staticmethod
    def extract_keywords(text: str, min_len: int = 3, top_n: int = 20) -> List[str]:
        """
        Extracts clean meaningful keywords for word frequency / clouds.
        Lowercases, strips punctuation, and removes stopwords.
        """
        if not text:
            return []

        # Convert to lowercase and find words
        words = re.findall(r'[a-zA-Z]{' + str(min_len) + r',}', text.lower())
        
        filtered = [
            w for w in words
            if w not in STANDARD_STOPWORDS and w not in NEGATION_WORDS
        ]
        return filtered

    @staticmethod
    def normalize_for_aspects(text: str) -> str:
        """
        Basic normalization for aspect/topic matching.
        """
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()
