from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backend/data/results.db")
if DATABASE_URL.startswith("sqlite:///"):
	Path(DATABASE_URL.removeprefix("sqlite:///" )).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
	DATABASE_URL,
	connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
	pass


def init_db() -> None:
	from .repositories import RunRecord, ResultRecord, ModelRecord, FeedbackRecord
	Base.metadata.create_all(engine)


def get_session():
	session = SessionLocal()
	try:
		yield session
	finally:
		session.close()

