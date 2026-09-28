"""
Village -> Taluk -> District -> State -> Country, self-referencing via
parent_id. Point geometry uses PostGIS GEOGRAPHY so distance queries
(ST_DWithin, ST_Distance) are correct on a sphere without manual
projection handling.
"""
import enum
import uuid

from geoalchemy2 import Geography
from sqlalchemy import Enum, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LocationLevel(str, enum.Enum):
    COUNTRY = "COUNTRY"
    STATE = "STATE"
    DISTRICT = "DISTRICT"
    TALUK = "TALUK"
    VILLAGE = "VILLAGE"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    level: Mapped[LocationLevel] = mapped_column(Enum(LocationLevel), nullable=False, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True, index=True
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    geometry = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)

    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)

    parent: Mapped["Location | None"] = relationship(
        "Location", remote_side="Location.id", back_populates="children"
    )
    children: Mapped[list["Location"]] = relationship("Location", back_populates="parent")

    __table_args__ = (
        Index("ix_locations_level_parent", "level", "parent_id"),
    )


# Example GIS queries this schema supports (see app/services/gis and app/api/gis.py):
#
#   -- all villages inside a taluk
#   SELECT * FROM locations WHERE level = 'VILLAGE' AND parent_id = :taluk_id;
#
#   -- markets within 50 km of a point
#   SELECT * FROM locations
#   WHERE ST_DWithin(geometry, ST_MakePoint(:lon, :lat)::geography, 50000);
