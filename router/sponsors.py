from utils.api import Router, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException
from dependencies.database import get_db
from dependencies.auth import check_role
from ..models.sponsors import Sponsor, Level
from ..schemas.sponsors import (
    SponsorCreate, SponsorUpdate, SponsorResponse,
    LevelCreate, LevelUpdate, LevelResponse
)
from ..schemas.sponsors_component import SponsorsComponent
from typing import List
from services.media import MediaService
from uuid import uuid4, UUID
import re

# Error message constants
SPONSOR_NOT_FOUND = "Sponsor not found"
LEVEL_NOT_FOUND = "Level not found"

def is_valid_url(url: str) -> bool:
    """Check if a string is a valid URL or UUID"""
    if not url:
        return False
    
    # Check if it's a UUID
    try:
        UUID(url)
        return True
    except ValueError:
        pass
    
    # Check if it's a URL
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return bool(url_pattern.match(url))

def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug"""
    # Convert to lowercase
    text = text.lower()
    # Replace spaces with hyphens
    text = text.replace(' ', '-')
    # Remove special characters
    text = re.sub(r'[^a-z0-9-]', '', text)
    # Remove multiple hyphens
    text = re.sub(r'-+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text

router = Router()

@router.get("/component/", response_model=SponsorsComponent)
def get_sponsors_component(db: Session = Depends(get_db)):
    """
    Get all sponsors with their levels.
    """
    sponsors = db.query(Sponsor).all()
    levels = db.query(Level).all()
    sponsors_component = SponsorsComponent(sponsors=sponsors, levels=levels)
    return sponsors_component

@router.get("/", response_model=List[SponsorResponse])
def get_sponsors(db: Session = Depends(get_db)):
    """
    Get all sponsors.
    """
    sponsors = db.query(Sponsor).all()
    return sponsors

@router.post("/", response_model=SponsorResponse)
def create_sponsor(
    sponsor: SponsorCreate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Create a new sponsor.
    """
    # Handle logo_url
    logo_url = sponsor.logo_url
    if not logo_url or not is_valid_url(logo_url):
        alias = f"{slugify(sponsor.name)}-{uuid4()}"
        media = MediaService.register(
            db=db,
            max_size=10 * 1024 * 1024,  # 10MB max size
            allows_rewrite=True,
            valid_extensions=['.jpg', '.jpeg', '.png', '.webp'],
            alias=alias
        )
        logo_url = media.uuid

    db_sponsor = Sponsor(**sponsor.model_dump(exclude={"logo_url"}), logo_url=logo_url)
    db.add(db_sponsor)
    db.commit()
    db.refresh(db_sponsor)
    return db_sponsor

@router.put("/{sponsor_id}", response_model=SponsorResponse)
def update_sponsor(
    sponsor_id: int,
    sponsor: SponsorUpdate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Update an existing sponsor.
    """
    db_sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not db_sponsor:
        raise HTTPException(status_code=404, detail=SPONSOR_NOT_FOUND)
    
    # Handle logo_url update
    if sponsor.logo_url is not None:
        logo_url = sponsor.logo_url
        if not is_valid_url(logo_url):
            alias = f"{slugify(db_sponsor.name)}-{uuid4()}"
            media = MediaService.register(
                db=db,
                max_size=10 * 1024 * 1024,  # 10MB max size
                allows_rewrite=True,
                valid_extensions=['.jpg', '.jpeg', '.png', '.webp'],
                alias=alias
            )
            logo_url = media.uuid
        setattr(db_sponsor, 'logo_url', logo_url)
    
    # Update other fields
    for key, value in sponsor.model_dump(exclude={"logo_url"}, exclude_unset=True).items():
        setattr(db_sponsor, key, value)
    
    db.commit()
    db.refresh(db_sponsor)
    return db_sponsor

@router.delete("/{sponsor_id}", response_model=SponsorResponse)
def delete_sponsor(
    sponsor_id: int,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Delete a sponsor.
    """
    db_sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not db_sponsor:
        raise HTTPException(status_code=404, detail=SPONSOR_NOT_FOUND)
    
    db.delete(db_sponsor)
    db.commit()
    return db_sponsor

@router.post("/levels/", response_model=LevelResponse)
def create_level(
    level: LevelCreate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Create a new sponsor level.
    """
    db_level = Level(**level.model_dump())
    db.add(db_level)
    db.commit()
    db.refresh(db_level)
    return db_level

@router.put("/levels/{level_id}", response_model=LevelResponse)
def update_level(
    level_id: int,
    level: LevelUpdate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Update an existing sponsor level.
    """
    db_level = db.query(Level).filter(Level.id == level_id).first()
    if not db_level:
        raise HTTPException(status_code=404, detail=LEVEL_NOT_FOUND)
    
    for key, value in level.model_dump(exclude_unset=True).items():
        setattr(db_level, key, value)
    
    db.commit()
    db.refresh(db_level)
    return db_level

@router.delete("/levels/{level_id}", response_model=LevelResponse)
def delete_level(
    level_id: int,
    db: Session = Depends(get_db),
    user_info: dict = Depends(check_role(["manage_sponsors"]))
):
    """
    Delete a sponsor level.
    """
    db_level = db.query(Level).filter(Level.id == level_id).first()
    if not db_level:
        raise HTTPException(status_code=404, detail=LEVEL_NOT_FOUND)
    
    db.delete(db_level)
    db.commit()
    return db_level

@router.get("/levels/", response_model=List[LevelResponse]) 
def get_levels(db: Session = Depends(get_db)):
    """
    Get all sponsor levels.
    """
    levels = db.query(Level).all()
    return levels

@router.get("/levels/{level_id}", response_model=LevelResponse)
def get_level(level_id: int, db: Session = Depends(get_db)):
    """
    Get a specific sponsor level by ID.
    """
    db_level = db.query(Level).filter(Level.id == level_id).first()
    if not db_level:
        raise HTTPException(status_code=404, detail=LEVEL_NOT_FOUND)
    
    return db_level