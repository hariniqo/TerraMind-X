from pydantic import BaseModel
from typing import Optional

class Document(BaseModel):
    document_id: str
    title: str
    content: str
    source: str
    source_type: str
    crop: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    language: str = "en"
    year: Optional[int] = None
    topic: Optional[str] = None
    verified: bool = False
