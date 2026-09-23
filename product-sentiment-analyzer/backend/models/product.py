import re
import uuid
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any

@dataclass
class Product:
    name: str
    source: str
    url: Optional[str] = ""
    rating: float = 0.0
    review_count: int = 0
    image_url: Optional[str] = ""
    is_demo: bool = False
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:12])
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @classmethod
    def generate_id_from_title(cls, title: str, source: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9]', '_', title.lower())[:24].strip('_')
        return f"{source.lower()}_{clean}"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
