"""
SQLAlchemy ORM models — TerraMind-X database schema.

Design principles:
- Every table that stores real agricultural observations has:
    provenance (REAL/DERIVED/REFERENCE/ESTIMATED/DEMO/UNKNOWN)
    source_name, source_url, retrieved_at, verification_status
- No fake/synthetic data enters tables where provenance = REAL
- Geographic hierarchy: state → district → taluk → village → farm
- All prices stored as FLOAT in ₹/quintal (normalized at ingestion)
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry as GEOMETRY, Geography as GEOGRAPHY
from sqlalchemy.orm import relationship

from app.db.database import Base

POINT = "POINT"
POLYGON = "POLYGON"
MULTIPOLYGON = "MULTIPOLYGON"
LINESTRING = "LINESTRING"

# ── Shared ENUM types ─────────────────────────────────────────────────────────
PROVENANCE_ENUM = Enum(
    "REAL", "DERIVED", "REFERENCE", "ESTIMATED", "DEMO", "UNKNOWN",
    name="provenance_type",
)
VERIFICATION_ENUM = Enum(
    "verified", "source_available", "source_unavailable",
    "pending_verification", "error",
    name="verification_status",
)
ADMIN_LEVEL_ENUM = Enum(
    "village", "taluk", "district", "state", name="admin_level"
)


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


# ── Geographic hierarchy ───────────────────────────────────────────────────────

class State(Base):
    __tablename__ = "states"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(10))
    created_at = Column(DateTime, default=_now)


class District(Base):
    __tablename__ = "districts"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False)
    state_id = Column(String, ForeignKey("states.id"), nullable=False)
    state_name = Column(String(100))  # denormalized for query convenience
    # PostGIS geometry for administrative boundaries
    boundary = Column(GEOMETRY(MULTIPOLYGON, 4326), nullable=True)
    centroid = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    created_at = Column(DateTime, default=_now)
    __table_args__ = (UniqueConstraint("name", "state_id", name="uq_district_state"),)


class Taluk(Base):
    __tablename__ = "taluks"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False)
    district_id = Column(String, ForeignKey("districts.id"), nullable=False)
    state_name = Column(String(100))
    district_name = Column(String(100))
    # PostGIS geometry for administrative boundaries
    boundary = Column(GEOMETRY(MULTIPOLYGON, 4326), nullable=True)
    centroid = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    created_at = Column(DateTime, default=_now)


class Village(Base):
    __tablename__ = "villages"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String(200), nullable=False)
    taluk_id = Column(String, ForeignKey("taluks.id"))
    district_id = Column(String, ForeignKey("districts.id"))
    state_name = Column(String(100))
    district_name = Column(String(100))
    taluk_name = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    # PostGIS geometry for spatial queries
    location = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    boundary = Column(GEOMETRY(MULTIPOLYGON, 4326), nullable=True)
    created_at = Column(DateTime, default=_now)


# ── GIS-specific tables ───────────────────────────────────────────────────────

class GisFarm(Base):
    """
    Farm locations with GPS coordinates and boundaries.
    Central to GIS-based decision making.
    """
    __tablename__ = "gis_farms"
    id = Column(String, primary_key=True, default=_uuid)
    farmer_id = Column(String(200))  # Link to farmer record
    village_id = Column(String, ForeignKey("villages.id"))
    district_id = Column(String, ForeignKey("districts.id"))
    state_id = Column(String, ForeignKey("states.id"))
    farm_name = Column(String(300))
    # PostGIS geometry for farm boundary
    farm_boundary = Column(GEOMETRY(POLYGON, 4326), nullable=True)
    farm_location = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    farm_area_m2 = Column(Float)  # Calculated from geometry
    farm_area_acres = Column(Float)
    farm_area_hectares = Column(Float)
    # Geometry source information
    geometry_source = Column(String(200))  # GPS / survey / deed
    geometry_confidence = Column(String(50))  # high / medium / low
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        Index("ix_gis_farm_location", "farm_location", postgresql_using="gist"),
        Index("ix_gis_farm_village", "village_id"),
    )


class GisMarketLocation(Base):
    """
    Market locations with GPS coordinates for spatial analysis.
    Enables distance calculations and nearest-market queries.
    """
    __tablename__ = "gis_market_locations"
    id = Column(String, primary_key=True, default=_uuid)
    market_name = Column(String(300), nullable=False)
    market_code = Column(String(50))
    district_id = Column(String, ForeignKey("districts.id"))
    state_id = Column(String, ForeignKey("states.id"))
    market_type = Column(String(50))  # mandi / regulated_market / private
    # PostGIS geometry
    market_location = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    # Market characteristics
    commission_rate = Column(Float)  # % commission
    transportation_cost_per_km = Column(Float)  # ₹/km
    operational_days = Column(String(100))  # JSON array of days
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    verification_status = Column(String(50), default="unverified")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        Index("ix_gis_market_location", "market_location", postgresql_using="gist"),
        Index("ix_gis_market_district", "district_id"),
    )


class GisSatelliteObservation(Base):
    """
    Satellite observations (NDVI, NDWI, EVI) with spatial reference.
    Links farm geometry to satellite data for vegetation monitoring.
    """
    __tablename__ = "gis_satellite_observations"
    id = Column(String, primary_key=True, default=_uuid)
    farm_id = Column(String, ForeignKey("gis_farms.id"), nullable=True)
    village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    district_id = Column(String, ForeignKey("districts.id"), nullable=True)
    # Satellite metadata
    satellite = Column(String(50), nullable=False)  # sentinel-2 / landsat-8 / modis
    acquisition_date = Column(Date, nullable=False)
    # Vegetation indices
    ndvi_mean = Column(Float)  # Normalized Difference Vegetation Index
    ndwi_mean = Column(Float)  # Normalized Difference Water Index
    evi_mean = Column(Float)  # Enhanced Vegetation Index
    ndvi_median = Column(Float)
    ndvi_min = Column(Float)
    ndvi_max = Column(Float)
    # Quality metrics
    cloud_cover_percentage = Column(Float)
    spatial_resolution = Column(Float)  # meters
    # Geometry for clipping
    observation_geometry = Column(GEOMETRY(POLYGON, 4326), nullable=True)
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    retrieval_method = Column(String(100))  # gee_api / downloaded / processed
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_gis_satellite_farm_date", "farm_id", "acquisition_date"),
        Index("ix_gis_satellite_village_date", "village_id", "acquisition_date"),
        Index("ix_gis_satellite_date", "acquisition_date"),
    )


class GisWaterFeature(Base):
    """
    Water bodies (rivers, canals, reservoirs, lakes) for irrigation proximity analysis.
    """
    __tablename__ = "gis_water_features"
    id = Column(String, primary_key=True, default=_uuid)
    water_body_name = Column(String(300), nullable=False)
    water_type = Column(String(50))  # river / canal / reservoir / lake / pond / well
    district_id = Column(String, ForeignKey("districts.id"), nullable=True)
    state_id = Column(String, ForeignKey("states.id"), nullable=True)
    # PostGIS geometry
    water_geometry = Column(GEOMETRY(POLYGON, 4326), nullable=True)
    water_centroid = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    irrigation_potential = Column(String(50))  # high / medium / low / unknown
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_gis_water_geometry", "water_geometry", postgresql_using="gist"),
        Index("ix_gis_water_district", "district_id"),
    )


class GisRoadNetwork(Base):
    """
    Road network data for transport distance estimation.
    Enables realistic travel time calculations to markets.
    """
    __tablename__ = "gis_road_network"
    id = Column(String, primary_key=True, default=_uuid)
    road_type = Column(String(50))  # highway / major_road / village_road / track
    district_id = Column(String, ForeignKey("districts.id"), nullable=True)
    state_id = Column(String, ForeignKey("states.id"), nullable=True)
    # PostGIS geometry
    road_geometry = Column(GEOMETRY(LINESTRING, 4326), nullable=True)
    road_condition = Column(String(50))  # paved / unpaved / seasonal
    road_capacity = Column(String(50))  # high / medium / low
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_gis_road_geometry", "road_geometry", postgresql_using="gist"),
    Index("ix_gis_road_district", "district_id"),
    )


class GisCropCluster(Base):
    """
    Spatial crop cultivation clusters for competition analysis.
    Aggregates cultivation by crop at village/taluk/district level.
    """
    __tablename__ = "gis_crop_clusters"
    id = Column(String, primary_key=True, default=_uuid)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    taluk = Column(String(100))
    village = Column(String(200))
    commodity = Column(String(200), nullable=False)
    season = Column(String(50))
    year = Column(Integer, nullable=False)
    total_area_hectares = Column(Float, nullable=False)
    number_of_farms = Column(Integer, nullable=False)
    crop_share = Column(Float)  # share of total cultivated area
    cluster_type = Column(String(50))  # LOW / MEDIUM / HIGH concentration
    # Geometry for cluster visualization
    cluster_geometry = Column(GEOMETRY(MULTIPOLYGON, 4326), nullable=True)
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_gis_crop_commodity_district_year", "commodity", "district", "year"),
        Index("ix_gis_crop_cluster_geometry", "cluster_geometry", postgresql_using="gist"),
    )


# ── Crop reference knowledge ───────────────────────────────────────────────────

class CropReference(Base):
    """
    Agronomic reference data.
    provenance = REFERENCE — sourced from ICAR / State Agricultural University
    handbooks, NOT real field observations.
    """
    __tablename__ = "crop_reference"
    id = Column(String, primary_key=True, default=_uuid)
    crop_name = Column(String(200), nullable=False, unique=True)
    crop_name_hindi = Column(String(200))
    crop_name_marathi = Column(String(200))
    crop_name_tamil = Column(String(200))
    scientific_name = Column(String(200))
    family = Column(String(100))
    season = Column(String(50))          # kharif / rabi / summer / perennial

    # Agronomy ranges (REFERENCE provenance)
    temp_opt_min = Column(Float)         # °C
    temp_opt_max = Column(Float)         # °C
    rain_opt_min = Column(Float)         # mm/season
    rain_opt_max = Column(Float)         # mm/season
    ph_opt_min = Column(Float)
    ph_opt_max = Column(Float)
    water_req_mm = Column(Float)         # mm/season
    harvest_days = Column(Integer)       # days from sowing
    sowing_months = Column(String(100))  # JSON array as string e.g. "[6,7]"
    soil_types = Column(String(300))     # JSON array e.g. '["loam","black"]'
    irrigation_type = Column(String(20)) # irrigated / rainfed / either
    npk_n_req = Column(Float)            # kg/ha
    npk_p_req = Column(Float)
    npk_k_req = Column(Float)

    # MSP (Minimum Support Price) — REFERENCE, updated by admin
    msp_price = Column(Float)
    msp_unit = Column(String(20))
    msp_season = Column(String(20))
    msp_year = Column(String(10))

    provenance = Column(String(20), default="REFERENCE")
    source_name = Column(String(500))
    source_url = Column(String(1000))
    source_document = Column(String(500))
    publication_year = Column(Integer)
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


# ── Market data ───────────────────────────────────────────────────────────────

class MarketAlias(Base):
    """Canonical market and commodity names shared across source feeds."""
    __tablename__ = "market_aliases"
    id = Column(String, primary_key=True, default=_uuid)
    alias_type = Column(String(30), nullable=False)
    state = Column(String(100), nullable=False, default="*")
    alias = Column(String(200), nullable=False)
    canonical_name = Column(String(200), nullable=False)
    source_name = Column(String(200))
    created_at = Column(DateTime, default=_now)
    __table_args__ = (
        UniqueConstraint("alias_type", "state", "alias", name="uq_market_alias"),
        Index("ix_market_alias_lookup", "alias_type", "state", "alias"),
    )


class MarketPrice(Base):
    """
    Daily mandi prices from AGMARKNET / data.gov.in.
    provenance = REAL
    Prices stored in original unit AND normalized to ₹/quintal.
    source_record_id is the AGMARKNET record ID for deduplication.
    """
    __tablename__ = "market_prices"
    id = Column(String, primary_key=True, default=_uuid)

    # Geographic
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    taluk = Column(String(100))
    market_name = Column(String(200), nullable=False)
    market_code = Column(String(50))

    # Commodity
    commodity = Column(String(200), nullable=False)
    variety = Column(String(200))
    grade = Column(String(50))

    # Prices — original values as received from source
    min_price = Column(Float)
    max_price = Column(Float)
    modal_price = Column(Float, nullable=True)
    original_unit = Column(String(50))   # e.g. "Quintal", "Kg", "100 Kg"

    # Normalized prices (₹/quintal)
    min_price_qtl = Column(Float)
    max_price_qtl = Column(Float)
    modal_price_qtl = Column(Float)
    normalized_unit = Column(String(20), default="quintal")
    conversion_formula = Column(String(200))  # e.g. "×100 (from per kg)"

    # Arrivals
    arrival_quantity = Column(Float)
    arrival_unit = Column(String(50))

    # Dates
    trading_date = Column(Date, nullable=False)
    data_timestamp = Column(DateTime)
    retrieved_at = Column(DateTime, default=_now)
    fetched_at = Column(DateTime, default=_now)

    # Provenance
    provenance = Column(String(20), default="REAL")
    source = Column(String(500), nullable=False)
    source_url = Column(String(1000))
    source_record_id = Column(String(200))  # AGMARKNET record ID
    verification_status = Column(String(50), default="verified")
    quality_flags = Column(Text)
    needs_review = Column(Boolean, default=False, nullable=False)
    rolling_30d_avg = Column(Float)
    day_over_day_pct_change = Column(Float)
    mandi_price_spread = Column(Float)
    festival_proximity = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "state", "district", "market_name", "commodity", "variety",
            "trading_date", "source_record_id",
            name="uq_market_price_record",
        ),
        Index("ix_mp_commodity_district_date", "commodity", "district", "trading_date"),
        Index("ix_mp_trading_date", "trading_date"),
    )


class MarketArrival(Base):
    """Daily arrival quantities at mandis."""
    __tablename__ = "market_arrivals"
    id = Column(String, primary_key=True, default=_uuid)
    market_name = Column(String(200), nullable=False)
    market_code = Column(String(50))
    state = Column(String(100))
    district = Column(String(100))
    commodity = Column(String(200), nullable=False)
    variety = Column(String(200))
    arrival_quantity = Column(Float, nullable=False)
    arrival_unit = Column(String(50))
    arrival_date = Column(Date, nullable=False)
    provenance = Column(String(20), default="REAL")
    source = Column(String(500), nullable=False)
    source_url = Column(String(1000))
    source_record_id = Column(String(200))
    retrieved_at = Column(DateTime, default=_now)
    verification_status = Column(String(50), default="verified")

    __table_args__ = (
        UniqueConstraint(
            "market_name", "commodity", "arrival_date", "source_record_id",
            name="uq_market_arrival_record",
        ),
        Index("ix_ma_commodity_date", "commodity", "arrival_date"),
    )


# ── Weather data ───────────────────────────────────────────────────────────────

class WeatherObservation(Base):
    """
    Weather data stored from Open-Meteo API responses.
    provenance = REAL (Open-Meteo provides ERA5 reanalysis + forecasts)
    """
    __tablename__ = "weather_observations"
    id = Column(String, primary_key=True, default=_uuid)
    state = Column(String(100))
    district = Column(String(100))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    observation_time = Column(DateTime, nullable=False)
    data_type = Column(String(30))  # forecast / historical_reanalysis / ensemble
    temperature = Column(Float)            # °C
    temperature_max = Column(Float)
    temperature_min = Column(Float)
    rainfall = Column(Float)              # mm
    humidity = Column(Float)             # %
    wind_speed = Column(Float)           # km/h
    soil_moisture = Column(Float)        # m³/m³
    evapotranspiration = Column(Float)   # mm/day
    solar_radiation = Column(Float)      # W/m²
    weather_source = Column(String(200), nullable=False)
    model_name = Column(String(100))
    source_url = Column(String(1000))
    provenance = Column(String(20), default="REAL")
    retrieved_at = Column(DateTime, default=_now)
    verification_status = Column(String(50), default="source_available")

    __table_args__ = (
        Index("ix_weather_lat_lon_time", "latitude", "longitude", "observation_time"),
        Index("ix_weather_district", "district", "observation_time"),
    )


# ── Soil data ─────────────────────────────────────────────────────────────────

class SoilObservation(Base):
    """
    Soil Health Card observations.
    provenance = REAL (government-issued SHC) or ESTIMATED (farmer measurement).
    Never fabricated.
    """
    __tablename__ = "soil_observations"
    id = Column(String, primary_key=True, default=_uuid)
    state = Column(String(100))
    district = Column(String(100))
    taluk = Column(String(100))
    village = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    # PostGIS geometry for spatial soil data
    sample_location = Column(GEOGRAPHY(POINT, 4326), nullable=True)
    soil_polygon = Column(GEOMETRY(POLYGON, 4326), nullable=True)
    ph = Column(Float)
    nitrogen = Column(Float)             # kg/ha
    phosphorus = Column(Float)           # kg/ha
    potassium = Column(Float)            # kg/ha
    organic_carbon = Column(Float)       # %
    electrical_conductivity = Column(Float)  # dS/m
    moisture = Column(Float)             # %
    zinc = Column(Float)                 # ppm
    iron = Column(Float)
    manganese = Column(Float)
    copper = Column(Float)
    boron = Column(Float)
    sulphur = Column(Float)
    soil_type = Column(String(100))
    test_date = Column(Date)
    source_type = Column(String(50))     # government / farmer_measurement / sensor
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    verification_status = Column(String(50), default="pending_verification")
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_soil_village_date", "village", "test_date"),
        Index("ix_soil_location", "sample_location", postgresql_using="gist"),
    )


# ── Cultivation data ───────────────────────────────────────────────────────────

class CultivationRecord(Base):
    """
    Area under cultivation by crop, location, and season.
    Sourced from state agriculture dept / ICAR / farmer declarations.
    admin_level determines geographic resolution.
    """
    __tablename__ = "cultivation_records"
    id = Column(String, primary_key=True, default=_uuid)
    state = Column(String(100), nullable=False)
    district = Column(String(100))
    taluk = Column(String(100))
    village = Column(String(200))
    admin_level = Column(String(20), nullable=False)  # village/taluk/district/state
    commodity = Column(String(200), nullable=False)
    variety = Column(String(200))
    cultivated_area = Column(Float, nullable=False)
    area_unit = Column(String(20), default="hectare")
    cultivation_year = Column(Integer)
    season = Column(String(50))          # kharif / rabi / summer
    provenance = Column(String(20), default="REAL")
    source = Column(String(500), nullable=False)
    source_url = Column(String(1000))
    source_record_id = Column(String(200))
    verification_status = Column(String(50), default="source_available")
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        Index("ix_cult_commodity_district_year", "commodity", "district", "cultivation_year"),
    )


# ── Buyer data ────────────────────────────────────────────────────────────────

class Buyer(Base):
    """
    Verified buyer registry.
    verification_status tracks whether buyer identity is confirmed.
    Never invent buyers.
    """
    __tablename__ = "buyers"
    id = Column(String, primary_key=True, default=_uuid)
    buyer_name = Column(String(300), nullable=False)
    buyer_type = Column(String(50))   # processor/exporter/wholesaler/institutional/fpo/mandi_buyer
    location = Column(String(300))
    state = Column(String(100))
    district = Column(String(100))
    crops_supported = Column(Text)    # JSON array
    contact_information = Column(String(500))
    registration_number = Column(String(200))
    gst_number = Column(String(20))
    verification_source = Column(String(500))
    verification_status = Column(String(50), default="unverified")
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    retrieved_at = Column(DateTime, default=_now)
    last_verified_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)


class BuyerDemand(Base):
    """Buyer procurement requirements."""
    __tablename__ = "buyer_demand"
    id = Column(String, primary_key=True, default=_uuid)
    buyer_id = Column(String, ForeignKey("buyers.id"), nullable=False)
    commodity = Column(String(200), nullable=False)
    variety = Column(String(200))
    grade_required = Column(String(10))  # A/B/C/ANY
    required_quantity = Column(Float)
    quantity_unit = Column(String(30))
    expected_price = Column(Float)       # ₹/quintal
    demand_date = Column(Date)
    delivery_location = Column(String(300))
    payment_days = Column(Integer)
    quality_requirements = Column(Text)
    provenance = Column(String(20), default="REAL")
    source = Column(String(500))
    source_url = Column(String(1000))
    verification_status = Column(String(50), default="pending_verification")
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)


# ── Festival calendar ─────────────────────────────────────────────────────────

class FestivalCalendar(Base):
    """
    Festival dates and associated crop demand signals.
    Demand signal = ESTIMATED (historical pattern) unless backed by verified buyer records.
    """
    __tablename__ = "festival_calendar"
    id = Column(String, primary_key=True, default=_uuid)
    festival_name = Column(String(200), nullable=False)
    state = Column(String(100))
    district = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    associated_crops = Column(Text)          # JSON array
    historical_demand_signal = Column(String(50))  # INCREASED_DEMAND / STABLE / DECREASED
    signal_evidence_type = Column(String(50))      # HISTORICAL / INFERENCE / VERIFIED
    uplift_pct_estimate = Column(Float)     # % demand uplift — ESTIMATED only
    provenance = Column(String(20), default="REFERENCE")
    source = Column(String(500), nullable=False)
    source_url = Column(String(1000))
    verification_status = Column(String(50), default="source_available")
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)


# ── Government policy / MSP ───────────────────────────────────────────────────

class GovernmentPolicy(Base):
    __tablename__ = "government_policies"
    id = Column(String, primary_key=True, default=_uuid)
    policy_name = Column(String(300), nullable=False)
    policy_type = Column(String(50))     # MSP / subsidy / insurance / procurement
    crop = Column(String(200))
    applicable_state = Column(String(100))
    applicable_district = Column(String(100))
    price = Column(Float)                # numeric policy value (e.g. MSP ₹/quintal)
    price_unit = Column(String(30))
    effective_date = Column(Date)
    expiry_date = Column(Date)
    description = Column(Text)
    provenance = Column(String(20), default="REAL")
    source = Column(String(500), nullable=False)
    source_url = Column(String(1000))
    verification_status = Column(String(50), default="source_available")
    retrieved_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)


# ── ML models registry ────────────────────────────────────────────────────────

class MLModel(Base):
    """
    Registry of trained ML model artifacts.
    Every prediction references a model_id from this table.
    If artifact_path is missing: MODEL_UNAVAILABLE.
    """
    __tablename__ = "ml_models"
    id = Column(String, primary_key=True, default=_uuid)
    model_name = Column(String(200), nullable=False)
    model_version = Column(String(50), nullable=False)
    model_type = Column(String(100))     # XGBoost / RandomForest / BaselineMA / etc.
    target = Column(String(100))         # modal_price / suitability_score / etc.
    features = Column(Text)              # JSON array of feature names
    training_data_sources = Column(Text) # JSON array
    training_period_start = Column(Date)
    training_period_end = Column(Date)
    training_rows = Column(Integer)
    test_rows = Column(Integer)
    mae = Column(Float)
    rmse = Column(Float)
    mape = Column(Float)
    r2 = Column(Float)
    baseline_mae = Column(Float)         # always compare against baseline
    outperforms_baseline = Column(Boolean)
    artifact_path = Column(String(1000))
    status = Column(String(50), default="active")  # active / retired / failed
    notes = Column(Text)
    trained_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        UniqueConstraint("model_name", "model_version", name="uq_model_version"),
    )


# ── Predictions log ───────────────────────────────────────────────────────────

class PredictionLog(Base):
    """
    Every prediction the system makes is logged here for traceability.
    Judges can trace: request → model → data → prediction.
    """
    __tablename__ = "prediction_logs"
    id = Column(String, primary_key=True, default=_uuid)
    request_id = Column(String(100))
    prediction_type = Column(String(100))  # market_price / crop_suitability / etc.
    commodity = Column(String(200))
    state = Column(String(100))
    district = Column(String(100))
    model_id = Column(String, ForeignKey("ml_models.id"))
    model_name = Column(String(200))
    model_version = Column(String(50))
    predicted_value = Column(Float)
    predicted_low = Column(Float)
    predicted_high = Column(Float)
    confidence = Column(Float)
    data_quality = Column(String(20))   # HIGH / MEDIUM / LOW / INSUFFICIENT
    training_rows_used = Column(Integer)
    data_source_count = Column(Integer)
    observation_period = Column(String(100))
    generated_at = Column(DateTime, default=_now)
    # Actual outcome for backtesting (filled in later)
    actual_value = Column(Float)
    actual_date = Column(Date)
    error_abs = Column(Float)


# ── Agent results ─────────────────────────────────────────────────────────────

class AgentResult(Base):
    """Persisted output from each of the 4 AI agents per request."""
    __tablename__ = "agent_results"
    id = Column(String, primary_key=True, default=_uuid)
    request_id = Column(String(100), nullable=False)
    agent_name = Column(String(100), nullable=False)  # crop_suitability / market_risk / soil_health / sustainability
    commodity = Column(String(200))
    state = Column(String(100))
    district = Column(String(100))
    score = Column(Float)
    verdict = Column(String(100))
    confidence = Column(Float)
    data_quality = Column(String(20))
    result_json = Column(Text)           # full structured JSON result
    evidence_count = Column(Integer)
    unavailable_inputs_count = Column(Integer)
    generated_at = Column(DateTime, default=_now)


# ── Decision log ──────────────────────────────────────────────────────────────

class DecisionLog(Base):
    """Final decision engine output — traceable from input to recommendation."""
    __tablename__ = "decision_logs"
    id = Column(String, primary_key=True, default=_uuid)
    request_id = Column(String(100), nullable=False)
    state = Column(String(100))
    district = Column(String(100))
    taluk = Column(String(100))
    village = Column(String(200))
    commodity = Column(String(200))
    decision_score = Column(Float)
    recommendation = Column(Text)  # JSON
    data_quality_overall = Column(String(20))
    confidence = Column(Float)
    weights_used = Column(Text)    # JSON — weights applied in scoring
    evidence_summary = Column(Text)
    missing_data = Column(Text)    # JSON list
    language = Column(String(10), default="en")
    explanation_en = Column(Text)
    explanation_ta = Column(Text)
    explanation_mr = Column(Text)
    explanation_hi = Column(Text)
    generated_at = Column(DateTime, default=_now)


# ── Data provenance ───────────────────────────────────────────────────────────

class DataProvenance(Base):
    """
    Provenance record for every important data item.
    Enables: "Where did this number come from?"
    """
    __tablename__ = "data_provenance"
    id = Column(String, primary_key=True, default=_uuid)
    dataset_name = Column(String(200), nullable=False)
    source_name = Column(String(500))
    source_url = Column(String(1000))
    collection_date = Column(Date)
    observation_start = Column(Date)
    observation_end = Column(Date)
    geography = Column(String(200))
    state = Column(String(100))
    district = Column(String(100))
    unit = Column(String(50))
    row_count = Column(Integer)
    quality_status = Column(String(50))  # HIGH / MEDIUM / LOW / UNKNOWN
    missing_percentage = Column(Float)
    provenance = Column(String(20))      # REAL / DERIVED / REFERENCE / ESTIMATED / DEMO / UNKNOWN
    synthetic = Column(Boolean, default=False)
    notes = Column(Text)
    last_updated = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)


# ── Data ingestion audit ──────────────────────────────────────────────────────

class IngestionRun(Base):
    """Audit log for every data ingestion attempt."""
    __tablename__ = "ingestion_runs"
    id = Column(String, primary_key=True, default=_uuid)
    source_name = Column(String(200), nullable=False)
    source_url = Column(String(1000))
    run_type = Column(String(50))         # scheduled / manual / backfill
    status = Column(String(50))           # success / error / partial
    http_status = Column(String(20))
    records_requested = Column(Integer)
    records_received = Column(Integer)
    records_accepted = Column(Integer)
    records_rejected = Column(Integer)
    duplicates_removed = Column(Integer)
    error_message = Column(Text)
    validation_status = Column(String(50))
    started_at = Column(DateTime, default=_now)
    completed_at = Column(DateTime)

    __table_args__ = (
        Index("ix_ingestion_source_started", "source_name", "started_at"),
    )


class RawIngestion(Base):
    """Verbatim source payloads captured before validation or transformation."""
    __tablename__ = "raw_ingestion"
    id = Column(String, primary_key=True, default=_uuid)
    source = Column(String(200), nullable=False, index=True)
    retrieved_at = Column(DateTime, default=_now, nullable=False)
    payload = Column(JSON)
    status = Column(String(50), nullable=False)
    http_status = Column(Integer)
    error_message = Column(Text)


# ── Data source registry ──────────────────────────────────────────────────────

class DataSource(Base):
    """Registry of all external data sources used by the system."""
    __tablename__ = "data_sources"
    id = Column(String, primary_key=True, default=_uuid)
    source_name = Column(String(200), nullable=False, unique=True)
    source_type = Column(String(100))     # government_api / open_data / reference / satellite
    base_url = Column(String(1000))
    dataset_name = Column(String(300))
    description = Column(Text)
    update_frequency = Column(String(50)) # daily / weekly / monthly / on_demand
    requires_api_key = Column(Boolean, default=False)
    api_key_env_var = Column(String(100)) # env var name that holds the key (never the key itself)
    status = Column(String(50), default="active")
    last_successful_fetch = Column(DateTime)
    last_attempted_fetch = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)
