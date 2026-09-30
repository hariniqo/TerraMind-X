"""Add market ETL features and raw ingestion audit.

Revision ID: 0002
Revises: 0001
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geography, Geometry

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.alter_column("market_prices", "modal_price", existing_type=sa.Float(), nullable=True)
    op.add_column("market_prices", sa.Column("quality_flags", sa.Text(), nullable=True))
    op.add_column("market_prices", sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("market_prices", sa.Column("rolling_30d_avg", sa.Float(), nullable=True))
    op.add_column("market_prices", sa.Column("day_over_day_pct_change", sa.Float(), nullable=True))
    op.add_column("market_prices", sa.Column("mandi_price_spread", sa.Float(), nullable=True))
    op.add_column("market_prices", sa.Column("festival_proximity", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_table(
        "market_aliases",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("alias_type", sa.String(30), nullable=False),
        sa.Column("state", sa.String(100), nullable=False, server_default="*"),
        sa.Column("alias", sa.String(200), nullable=False),
        sa.Column("canonical_name", sa.String(200), nullable=False),
        sa.Column("source_name", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("alias_type", "state", "alias", name="uq_market_alias"),
    )
    op.create_index("ix_market_alias_lookup", "market_aliases", ["alias_type", "state", "alias"])
    op.create_table(
        "gis_market_locations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("market_name", sa.String(300), nullable=False),
        sa.Column("market_code", sa.String(50), nullable=True),
        sa.Column("district_id", sa.String(), sa.ForeignKey("districts.id"), nullable=True),
        sa.Column("state_id", sa.String(), sa.ForeignKey("states.id"), nullable=True),
        sa.Column("market_type", sa.String(50), nullable=True),
        sa.Column("market_location", Geography(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("commission_rate", sa.Float(), nullable=True),
        sa.Column("transportation_cost_per_km", sa.Float(), nullable=True),
        sa.Column("operational_days", sa.String(100), nullable=True),
        sa.Column("provenance", sa.String(20), nullable=True, server_default="REAL"),
        sa.Column("source", sa.String(500), nullable=True),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("verification_status", sa.String(50), nullable=True, server_default="unverified"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_gis_market_location", "gis_market_locations", ["market_location"], postgresql_using="gist")
    op.create_index("ix_gis_market_district", "gis_market_locations", ["district_id"])
    op.create_table(
        "gis_satellite_observations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("farm_id", sa.String(), nullable=True),
        sa.Column("village_id", sa.String(), nullable=True),
        sa.Column("district_id", sa.String(), sa.ForeignKey("districts.id"), nullable=True),
        sa.Column("satellite", sa.String(50), nullable=False),
        sa.Column("acquisition_date", sa.Date(), nullable=False),
        sa.Column("ndvi_mean", sa.Float(), nullable=True),
        sa.Column("ndwi_mean", sa.Float(), nullable=True),
        sa.Column("evi_mean", sa.Float(), nullable=True),
        sa.Column("ndvi_median", sa.Float(), nullable=True),
        sa.Column("ndvi_min", sa.Float(), nullable=True),
        sa.Column("ndvi_max", sa.Float(), nullable=True),
        sa.Column("cloud_cover_percentage", sa.Float(), nullable=True),
        sa.Column("spatial_resolution", sa.Float(), nullable=True),
        sa.Column("observation_geometry", Geometry(geometry_type="POLYGON", srid=4326), nullable=True),
        sa.Column("provenance", sa.String(20), nullable=True, server_default="REAL"),
        sa.Column("source", sa.String(500), nullable=True),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("retrieval_method", sa.String(100), nullable=True),
        sa.Column("retrieved_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_gis_satellite_farm_date", "gis_satellite_observations", ["farm_id", "acquisition_date"])
    op.create_index("ix_gis_satellite_village_date", "gis_satellite_observations", ["village_id", "acquisition_date"])
    op.create_index("ix_gis_satellite_date", "gis_satellite_observations", ["acquisition_date"])
    op.create_table(
        "raw_ingestion",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("source", sa.String(200), nullable=False),
        sa.Column("retrieved_at", sa.DateTime(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
    )
    op.create_index("ix_raw_ingestion_source", "raw_ingestion", ["source"])


def downgrade() -> None:
    op.drop_index("ix_raw_ingestion_source", table_name="raw_ingestion")
    op.drop_table("raw_ingestion")
    op.drop_index("ix_gis_satellite_date", table_name="gis_satellite_observations")
    op.drop_index("ix_gis_satellite_village_date", table_name="gis_satellite_observations")
    op.drop_index("ix_gis_satellite_farm_date", table_name="gis_satellite_observations")
    op.drop_table("gis_satellite_observations")
    op.drop_index("ix_gis_market_district", table_name="gis_market_locations")
    op.drop_index("ix_gis_market_location", table_name="gis_market_locations")
    op.drop_table("gis_market_locations")
    op.drop_index("ix_market_alias_lookup", table_name="market_aliases")
    op.drop_table("market_aliases")
    op.drop_column("market_prices", "festival_proximity")
    op.drop_column("market_prices", "mandi_price_spread")
    op.drop_column("market_prices", "day_over_day_pct_change")
    op.drop_column("market_prices", "rolling_30d_avg")
    op.drop_column("market_prices", "needs_review")
    op.drop_column("market_prices", "quality_flags")
    op.alter_column("market_prices", "modal_price", existing_type=sa.Float(), nullable=False)
