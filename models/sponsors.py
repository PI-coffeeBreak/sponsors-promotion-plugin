from coffeebreak.dependencies.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

class Sponsor(Base):
    __tablename__ = "sponsors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    logo_url = Column(String)
    website_url = Column(String)
    description = Column(String)
    level_id = Column(Integer, ForeignKey("levels.id"))
    level = relationship("Level", back_populates="sponsors")

class Level(Base):
    __tablename__ = "levels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sponsors = relationship("Sponsor", back_populates="level")