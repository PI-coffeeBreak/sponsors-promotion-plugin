from pydantic import BaseModel, Field
from schemas.ui.page import BaseComponentSchema

class SponsorsComponent(BaseComponentSchema):
    """
    Schema for the Sponsors component.
    """
    sponsors: list = Field([], title="Sponsors List", description="List of sponsors with their details.")
    levels: list = Field([], title="Levels List", description="List of sponsor levels.")
    display_sponsor_level: bool = Field(False, title="Display Sponsor Level", description="Flag to display sponsor level.")
    display_sponsor_website: bool = Field(False, title="Display Sponsor Website", description="Flag to display sponsor website.")
    display_sponsor_description: bool = Field(False, title="Display Sponsor Description", description="Flag to display sponsor description.")

    class Config:
        from_attributes = True