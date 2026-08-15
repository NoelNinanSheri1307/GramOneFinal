"""Small shared response models and pagination constants."""
from pydantic import BaseModel

MAX_LIMIT = 100
DEFAULT_LIMIT = 20

#: A translated dynamic string: language code -> text. The original language
#: text is always included, so original content remains recoverable.
LocalizedString = dict[str, str]


class VillageBrief(BaseModel):
    id: int
    name: str | LocalizedString
    district: str
    state: str


class UserBrief(BaseModel):
    id: int
    name: str


class IssueBrief(BaseModel):
    id: int
    reference: str | None
    title: str | LocalizedString
    category: str
    status: str


class ImpactCaseBrief(BaseModel):
    id: int
    reference: str | None
    title: str | LocalizedString