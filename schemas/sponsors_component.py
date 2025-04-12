from pydantic import Field
from schemas.ui.page import BaseComponentSchema
from .sponsors import SponsorResponse, LevelResponse

class SponsorsComponent(BaseComponentSchema):
    """
    Schema for the Sponsors component.
    """
    name: str = Field("SponsorsComponent", title="Component Name", description="Name of the component.")
    sponsors: list = Field([SponsorResponse], title="Sponsors List", description="List of sponsors with their details.")
    levels: list = Field([LevelResponse], title="Levels List", description="List of sponsor levels.")
    display_sponsor_level: bool = Field(False, title="Display Sponsor Level", description="Flag to display sponsor level.")
    display_sponsor_website: bool = Field(False, title="Display Sponsor Website", description="Flag to display sponsor website.")
    display_sponsor_description: bool = Field(False, title="Display Sponsor Description", description="Flag to display sponsor description.")

    class Config:
        from_attributes = True