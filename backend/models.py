from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    encryption_salt = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(10), default="📁")
    color = Column(String(50), default="#667eea")
    is_system = Column(Boolean, default=False)
    display_order = Column(Integer, default=0, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship("User", back_populates="categories")
    bookmarks = relationship("Bookmark", back_populates="category")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    url = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(500), nullable=True)
    tags = Column(String(200), nullable=True)
    visit_count = Column(Integer, default=0, index=True)
    last_visit_at = Column(TIMESTAMP, nullable=True)
    is_favorite = Column(Boolean, default=False, index=True)
    pinned_position = Column(Integer, nullable=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship("User", back_populates="bookmarks")
    category = relationship("Category", back_populates="bookmarks")