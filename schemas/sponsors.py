from pydantic import BaseModel, Field
from typing import Optional, List
from coffeebreak.schemas.media import Media
# Constants for field titles to avoid duplication
WEBSITE_URL_TITLE = "Website URL"
SPONSOR_NAME_TITLE = "Sponsor Name"
LOGO_URL_TITLE = "Logo URL"
DESCRIPTION_TITLE = "Description"
LEVEL_ID_TITLE = "Level ID"
LEVEL_NAME_TITLE = "Level Name"
SPONSOR_ID_TITLE = "Sponsor ID"

class Sponsor(BaseModel):
    id: Optional[int] = Field(None, title=SPONSOR_ID_TITLE)
    name: str = Field(..., title=SPONSOR_NAME_TITLE, max_length=255)
    logo_url: Optional[str | Media] = Field(None, title=LOGO_URL_TITLE, max_length=255)
    website_url: Optional[str] = Field(None, title=WEBSITE_URL_TITLE, max_length=255)
    description: Optional[str] = Field(None, title=DESCRIPTION_TITLE, max_length=1000)
    level_id: Optional[int] = Field(None, title=LEVEL_ID_TITLE)

    class Config:
        from_attributes = True

class Level(BaseModel):
    id: Optional[int] = Field(None, title=LEVEL_ID_TITLE)
    name: str = Field(..., title=LEVEL_NAME_TITLE, max_length=255)
    sponsors: List[Sponsor] = []

    class Config:
        from_attributes = True

class SponsorCreate(BaseModel):
    name: str = Field(..., title=SPONSOR_NAME_TITLE, max_length=255)
    logo_url: Optional[str | Media] = Field(None, title=LOGO_URL_TITLE, max_length=255)
    website_url: Optional[str] = Field(None, title=WEBSITE_URL_TITLE, max_length=255)
    description: Optional[str] = Field(None, title=DESCRIPTION_TITLE, max_length=1000)
    level_id: int = Field(..., title=LEVEL_ID_TITLE)

    class Config:
        from_attributes = True

class SponsorUpdate(BaseModel):
    name: Optional[str] = Field(None, title=SPONSOR_NAME_TITLE, max_length=255)
    logo_url: Optional[str | Media] = Field(None, title=LOGO_URL_TITLE, max_length=255)
    website_url: Optional[str] = Field(None, title=WEBSITE_URL_TITLE, max_length=255)
    description: Optional[str] = Field(None, title=DESCRIPTION_TITLE, max_length=1000)
    level_id: Optional[int] = Field(None, title=LEVEL_ID_TITLE)

    class Config:
        from_attributes = True

class SponsorResponse(BaseModel):
    id: int
    name: str
    logo_url: str | Media
    website_url: str
    level_id: int
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class LevelCreate(BaseModel):
    name: str = Field(..., title=LEVEL_NAME_TITLE, max_length=255)

    class Config:
        from_attributes = True

class LevelUpdate(BaseModel):
    name: Optional[str] = Field(None, title=LEVEL_NAME_TITLE, max_length=255)

    class Config:
        from_attributes = True

class LevelResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True