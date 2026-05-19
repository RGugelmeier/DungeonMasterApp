from sqlalchemy import Integer, VARCHAR, Enum, TIMESTAMP, TEXT, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
import datetime, enum
from server.database import db

class UserTypes(enum.Enum):
    STANDARD = "standard"
    ADMIN = "admin"

class Users(db.Model):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(VARCHAR(60))
    email: Mapped[str] = mapped_column(VARCHAR(255))
    password_hashed: Mapped[str] = mapped_column(VARCHAR(60))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now(), onupdate=func.now())
    user_type: Mapped[UserTypes] = mapped_column(Enum(UserTypes), default=UserTypes.STANDARD)
    reset_token: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    reset_token_expiry: Mapped[datetime.datetime | None] = mapped_column(TIMESTAMP, nullable=True)

class Campaigns(db.Model):
    __tablename__ = "campaigns"
    campaign_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id"))
    campaign_name: Mapped[str] = mapped_column(VARCHAR(255))
    campaign_description: Mapped[str] = mapped_column(TEXT)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, onupdate=func.now())

class Tags(db.Model):
    __tablename__ = "tags"
    tag_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.campaign_id"))
    tag: Mapped[str] = mapped_column(VARCHAR(50))

class Notebooks(db.Model):
    __tablename__ = "notebooks"
    notebook_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.campaign_id"))
    notebook_name: Mapped[str] = mapped_column(VARCHAR(255))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, onupdate=func.now())

class ChapterCategories(enum.Enum):
    CHARACTER = "character"
    SESSION = "session"
    PLACE = "place"
    OTHER = "other"

class Chapters(db.Model):
    __tablename__ = "chapters"
    chapter_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    notebook_id: Mapped[int] = mapped_column(Integer, ForeignKey("notebooks.notebook_id"))
    chapter_name: Mapped[str] = mapped_column(VARCHAR(80))
    chapter_category: Mapped[ChapterCategories] = mapped_column(Enum(ChapterCategories))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, onupdate=func.now())

class Pages(db.Model):
    __tablename__ = "pages"
    page_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chapter_id: Mapped[int] = mapped_column(Integer, ForeignKey("chapters.chapter_id"))
    page_name: Mapped[str] = mapped_column(VARCHAR(80))
    page_content: Mapped[str] = mapped_column(TEXT)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, onupdate=func.now())

class PlayerCharacters(db.Model):
    __tablename__ = "player_characters"
    character_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.campaign_id"))
    owning_player: Mapped[str] = mapped_column(VARCHAR(50))
    character_name: Mapped[str] = mapped_column(VARCHAR(50))
    hp: Mapped[int] = mapped_column(Integer, default=0)
    ac: Mapped[int] = mapped_column(Integer, default=0)
    strength: Mapped[int] = mapped_column(Integer)
    dexterity: Mapped[int] = mapped_column(Integer)
    constitution: Mapped[int] = mapped_column(Integer)
    wisdom: Mapped[int] = mapped_column(Integer)
    intelligence: Mapped[int] = mapped_column(Integer)
    charisma: Mapped[int] = mapped_column(Integer)
    inventory: Mapped[dict] = mapped_column(JSON)
    abilities: Mapped[dict] = mapped_column(JSON)
    spells: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now(), onupdate=func.now())

class NonPlayerCharacters(db.Model):
    __tablename__ = "non_player_characters"
    character_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.campaign_id"))
    owning_player: Mapped[str] = mapped_column(VARCHAR(50))
    character_name: Mapped[str] = mapped_column(VARCHAR(50))
    hp: Mapped[int] = mapped_column(Integer, default=0)
    ac: Mapped[int] = mapped_column(Integer, default=0)
    strength: Mapped[int] = mapped_column(Integer)
    dexterity: Mapped[int] = mapped_column(Integer)
    constitution: Mapped[int] = mapped_column(Integer)
    wisdom: Mapped[int] = mapped_column(Integer)
    intelligence: Mapped[int] = mapped_column(Integer)
    charisma: Mapped[int] = mapped_column(Integer)
    inventory: Mapped[dict] = mapped_column(JSON)
    abilities: Mapped[dict] = mapped_column(JSON)
    spells: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, default=func.now(), onupdate=func.now())

class CharacterPageLinks(db.Model):
    __tablename__ = "character_page_links"
    link_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    character_id: Mapped[int] = mapped_column(Integer)
    character_type: Mapped[str] = mapped_column(VARCHAR(10))  # 'pc' or 'npc'
    page_id: Mapped[int] = mapped_column(Integer, ForeignKey("pages.page_id", ondelete="CASCADE"))

