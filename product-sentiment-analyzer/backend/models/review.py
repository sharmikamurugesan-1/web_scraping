import uuid
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any

@dataclass
class Review:
    product_id: str
    review_text: str
    rating: float
    sentiment: str = "Neutral"
    sentiment_score: float = 0.0
    pos_score: float = 0.0
    neu_score: float = 0.0
    neg_score: float = 0.0
    reviewer: str = "Customer"
    review_date: str = ""
    verified_purchase: bool = True
    source: str = "Amazon"
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:16])
    created_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
