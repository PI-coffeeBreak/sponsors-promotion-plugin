from pydantic import BaseModel, Field
from typing import Optional, List

class Sponsor(BaseModel):
    id: Optional[int] = Field(None, title="Sponsor ID")
    name: str = Field(..., title="Sponsor Name", max_length=255)
    logo_url: Optional[str] = Field(None, title="Logo URL", max_length=255)
    website_url: Optional[str] = Field(None, title="Website URL", max_length=255)
    description: Optional[str] = Field(None, title="Description", max_length=1000)
    level_id: Optional[int] = Field(None, title="Level ID")

    class Config:
        from_attributes = True

class Level(BaseModel):
    id: Optional[int] = Field(None, title="Level ID")
    name: str = Field(..., title="Level Name", max_length=255)
    sponsors: List[Sponsor] = []

    class Config:
        from_attributes = True

class SponsorCreate(BaseModel):
    name: str = Field(..., title="Sponsor Name", max_length=255)
    logo_url: Optional[str] = Field(None, title="Logo URL", max_length=255)
    website_url: Optional[str] = Field(None, title="Website URL", max_length=255)
    description: Optional[str] = Field(None, title="Description", max_length=1000)
    level_id: int = Field(..., title="Level ID")

    class Config:
        from_attributes = True

class SponsorUpdate(BaseModel):
    name: Optional[str] = Field(None, title="Sponsor Name", max_length=255)
    logo_url: Optional[str] = Field(None, title="Logo URL", max_length=255)
    website_url: Optional[str] = Field(None, title="Website URL", max_length=255)
    description: Optional[str] = Field(None, title="Description", max_length=1000)
    level_id: Optional[int] = Field(None, title="Level ID")

    class Config:
        from_attributes = True

