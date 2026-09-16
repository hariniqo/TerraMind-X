from sqlalchemy import Column, Integer, String, Float, JSON, Text, DateTime, Date, func, UniqueConstraint
from app.db.base import Base

class MarketPriceRecord(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=True, index=True)
    market = Column(String(100), nullable=False, index=True)
    commodity = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=True)
    grade = Column(String(50), nullable=True)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    unit = Column(String(50), default="₹/quintal")
    arrival_quantity = Column(Float, nullable=True)
    source = Column(String(100), default="AGMARKNET / data.gov.in")
    source_record_id = Column(String(100), nullable=True)
    source_timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('state', 'district', 'market', 'commodity', 'variety', 'date', name='uq_market_price_record'),
    )

class CropProductionRecord(Base):
    __tablename__ = "crop_production"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    season = Column(String(100), nullable=False)
    crop = Column(String(100), nullable=False, index=True)
    area_hectare = Column(Float, nullable=False)
    production_tonne = Column(Float, nullable=True)
    yield_val = Column(Float, nullable=True) # renamed from yield to avoid keyword conflict
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WeatherObservationRecord(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    solar_radiation = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SoilObservationRecord(Base):
    __tablename__ = "soil_observations"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    ph = Column(Float, nullable=True)
    nitrogen = Column(Float, nullable=True)
    phosphorus = Column(Float, nullable=True)
    potassium = Column(Float, nullable=True)
    organic_carbon = Column(Float, nullable=True)
    electrical_conductivity = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClimateDataset(Base):
    __tablename__ = "climate_datasets"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(100), nullable=False)
    source = Column(String(100), nullable=False)
    doi = Column(String(100), nullable=False, index=True)
    version = Column(String(50), nullable=False)
    license = Column(String(100), nullable=True)
    resolution = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ClimateModel(Base):
    __tablename__ = "climate_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False, index=True)
    institution = Column(String(150), nullable=True)

class ClimateProjection(Base):
    __tablename__ = "climate_projections"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), nullable=False, index=True)
    model_id = Column(String(100), nullable=False, index=True)
    scenario = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    precipitation_mm = Column(Float, nullable=False)
    tmax_c = Column(Float, nullable=False)
    tmin_c = Column(Float, nullable=False)
    source = Column(String(100), nullable=True)
    dataset_version = Column(String(50), nullable=True)

class ClimateAggregate(Base):
    __tablename__ = "climate_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=True, index=True)
    season = Column(String(50), nullable=True, index=True)
    scenario = Column(String(50), nullable=False, index=True)
    model_id = Column(String(100), nullable=False, index=True)
    rainfall_mm = Column(Float, nullable=False)
    tmax_mean_c = Column(Float, nullable=False)
    tmin_mean_c = Column(Float, nullable=False)
    rainfall_anomaly = Column(Float, nullable=True)
    temperature_anomaly = Column(Float, nullable=True)

class ClimateRisk(Base):
    __tablename__ = "climate_risks"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), nullable=False, index=True)
    period = Column(String(50), nullable=False, index=True)
    scenario = Column(String(50), nullable=False, index=True)
    heat_risk = Column(Float, nullable=True)
    drought_risk = Column(Float, nullable=True)
    rainfall_risk = Column(Float, nullable=True)
    water_stress = Column(Float, nullable=True)
    climate_suitability = Column(JSON, nullable=True)
    climate_risk_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CurrentCultivationRecord(Base):
    __tablename__ = "current_cultivation"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    season = Column(String(50), nullable=False)
    agricultural_year = Column(String(50), nullable=False)
    crop = Column(String(100), nullable=False, index=True)
    crop_group = Column(String(100), nullable=True)
    sown_area_ha = Column(Float, nullable=False)
    report_date = Column(Date, nullable=False)
    source = Column(String(255), nullable=True)
    source_url = Column(String(255), nullable=True)
    source_document = Column(String(255), nullable=True)
    source_page = Column(Integer, nullable=True)
    data_status = Column(String(50), nullable=False, default="VERIFIED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FestivalDemandRecord(Base):
    __tablename__ = "festival_demand"

    id = Column(Integer, primary_key=True, index=True)
    festival = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)
    peak_demand_start = Column(Date, nullable=False)
    peak_demand_end = Column(Date, nullable=False)
    price_per_unit = Column(Float, nullable=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    price_arrival_change = Column(Float, nullable=True)
    verification_status = Column(String(50), nullable=False, default="UNVERIFIED")
    confidence_score = Column(Float, nullable=False)
    evidence_type = Column(String(100), nullable=False)
    demand_reason = Column(Text, nullable=False)
    demand_category = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FestivalSourceRegistryRecord(Base):
    __tablename__ = "festival_source_registry"

    source_id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    publisher = Column(String(255), nullable=False)
    tier = Column(Integer, nullable=False)
    year_published = Column(Integer, nullable=True)
    url_or_reference = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DataSourceRecord(Base):
    __tablename__ = "data_sources"

    source_id = Column(String(100), primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False)
    url = Column(String(500), nullable=True)
    access_method = Column(String(100), nullable=True)
    coverage_start = Column(String(50), nullable=True)
    coverage_end = Column(String(50), nullable=True)
    geographic_level = Column(String(100), nullable=True)
    update_frequency = Column(String(100), nullable=True)
    unit = Column(String(100), nullable=True)
    retrieved_at = Column(DateTime(timezone=True), server_default=func.now())
    license = Column(String(100), nullable=True)
    reliability_tier = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)

class DataQualityReportRecord(Base):
    __tablename__ = "data_quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False, index=True)
    row_count = Column(Integer, nullable=False)
    missing_percentage = Column(Float, nullable=False)
    duplicate_percentage = Column(Float, nullable=False)
    outlier_percentage = Column(Float, nullable=False)
    date_coverage = Column(String(100), nullable=True)
    geographic_coverage = Column(String(255), nullable=True)
    quality_score = Column(Float, nullable=False)
    report_details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CropCalendarRecord(Base):
    __tablename__ = "crop_calendar"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=True)
    season = Column(String(50), nullable=False, index=True)
    sowing_start_month = Column(Integer, nullable=False)
    sowing_end_month = Column(Integer, nullable=False)
    harvest_start_month = Column(Integer, nullable=False)
    harvest_end_month = Column(Integer, nullable=False)
    typical_duration_days = Column(Integer, nullable=False)
    expected_yield_q_per_acre = Column(Float, nullable=True)
    notes = Column(String(255), nullable=True)

class TransportCostRecord(Base):
    __tablename__ = "transport_costs"

    id = Column(Integer, primary_key=True, index=True)
    origin_district = Column(String(100), nullable=False, index=True)
    destination_market = Column(String(100), nullable=False, index=True)
    distance_km = Column(Float, nullable=False)
    transport_mode = Column(String(50), nullable=False, default="Mini Truck")
    cost_per_quintal_inr = Column(Float, nullable=False)
    source = Column(String(255), nullable=True)
    is_estimate = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

class StorageDataRecord(Base):
    __tablename__ = "storage_data"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), nullable=False, index=True)
    crop = Column(String(100), nullable=False, index=True)
    storage_type = Column(String(100), nullable=False)
    capacity_tonnes = Column(Float, nullable=True)
    monthly_cost_per_quintal_inr = Column(Float, nullable=False)
    availability_status = Column(String(50), nullable=False, default="AVAILABLE")
    source = Column(String(255), nullable=True)

class GovernmentPolicyRecord(Base):
    __tablename__ = "government_policies"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    msp_inr_per_quintal = Column(Float, nullable=True)
    export_policy = Column(String(100), nullable=True)
    import_duty_pct = Column(Float, nullable=True)
    procurement_active = Column(Integer, nullable=False, default=0)
    source = Column(String(255), nullable=True)
    policy_notes = Column(Text, nullable=True)

class MarketForecastRecord(Base):
    __tablename__ = "market_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    forecast_date = Column(Date, nullable=False, index=True)
    target_harvest_date = Column(Date, nullable=False, index=True)
    horizon_days = Column(Integer, nullable=False)
    predicted_price = Column(Float, nullable=False)
    lower_bound_80 = Column(Float, nullable=False)
    upper_bound_80 = Column(Float, nullable=False)
    lower_bound_95 = Column(Float, nullable=False)
    upper_bound_95 = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    model_version = Column(String(100), nullable=False)
    data_sources_used = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OversupplyPredictionRecord(Base):
    __tablename__ = "oversupply_predictions"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False, index=True)
    oversupply_probability = Column(Float, nullable=False)
    oversupply_class = Column(String(50), nullable=False)
    r_critical = Column(Float, nullable=False)
    current_supply_ratio = Column(Float, nullable=False)
    evidence = Column(Text, nullable=True)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DiffusionPredictionRecord(Base):
    __tablename__ = "diffusion_predictions"

    id = Column(Integer, primary_key=True, index=True)
    crop = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    current_adoption = Column(Float, nullable=False)
    predicted_adoption_at_harvest = Column(Float, nullable=False)
    critical_adoption = Column(Float, nullable=False)
    weeks_to_threshold = Column(Integer, nullable=True)
    is_early_mover = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    parameters = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarketModelMetricsRecord(Base):
    __tablename__ = "market_model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(100), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    crop = Column(String(100), nullable=False, index=True)
    horizon_days = Column(Integer, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)
    smape = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    wape = Column(Float, nullable=False)
    coverage_80 = Column(Float, nullable=True)
    coverage_95 = Column(Float, nullable=True)
    backtest_window = Column(String(100), nullable=True)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())

class MarketRecommendationRecord(Base):
    __tablename__ = "market_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    crop = Column(String(100), nullable=False, index=True)
    recommended_action = Column(String(100), nullable=False)
    recommended_crop = Column(String(100), nullable=False)
    expected_profit_inr = Column(Float, nullable=False)
    oversupply_risk_pct = Column(Float, nullable=False)
    opportunity_score = Column(Float, nullable=False)
    best_selling_window = Column(String(100), nullable=True)
    confidence_score = Column(Float, nullable=False)
    evidence_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

from app.models.recommendation import Recommendation as RecommendationRecord


class FarmGeometryRecord(Base):
    __tablename__ = "farm_geometries"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    farm_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    declared_area_acres = Column(Float, nullable=True)
    calculated_area_acres = Column(Float, nullable=True)
    perimeter_meters = Column(Float, nullable=True)
    boundary_geojson = Column(JSON, nullable=True)
    area_quality = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NDVIObservationRecord(Base):
    __tablename__ = "ndvi_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    observation_date = Column(Date, nullable=False, index=True)
    ndvi_value = Column(Float, nullable=False)
    cloud_cover_pct = Column(Float, nullable=False)
    provider = Column(String(100), nullable=False, default="Sentinel-2 MSI Level-2A")
    quality_status = Column(String(50), nullable=False, default="VALID")
    source_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CropHistoryRecord(Base):
    __tablename__ = "farm_crop_history"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    crop = Column(String(100), nullable=False, index=True)
    season = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False, index=True)
    yield_q_per_acre = Column(Float, nullable=True)
    source = Column(String(100), nullable=False, default="FARMER_DECLARED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LandIntelligenceResultRecord(Base):
    __tablename__ = "land_intelligence_results"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    target_crop = Column(String(100), nullable=True)
    rotation_score = Column(Float, nullable=True)
    current_ndvi = Column(Float, nullable=True)
    ndvi_trend = Column(String(50), nullable=True)
    regional_hhi = Column(Float, nullable=True)
    concentration_level = Column(String(50), nullable=True)
    overall_confidence = Column(Float, nullable=False)
    overall_quality_score = Column(Float, nullable=False)
    full_result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SustainabilityAnalysisRecord(Base):
    __tablename__ = "sustainability_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String(100), nullable=False, unique=True, index=True)
    farm_id = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    data_level_used = Column(String(50), nullable=False)
    sustainability_score = Column(Float, nullable=True)
    sustainability_rating = Column(String(50), nullable=False)
    score_confidence_pct = Column(Float, nullable=False)
    data_quality_score_pct = Column(Float, nullable=False)
    full_result = Column(JSON, nullable=False)
    method_version = Column(String(50), nullable=False, default="v2.0-Maharashtra")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SoilCarbonObservationRecord(Base):
    __tablename__ = "soil_carbon_observations"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, default="Maharashtra")
    observation_date = Column(Date, nullable=False, index=True)
    organic_carbon_pct = Column(Float, nullable=False)
    ph = Column(Float, nullable=True)
    nitrogen_kg_ha = Column(Float, nullable=True)
    phosphorus_kg_ha = Column(Float, nullable=True)
    potassium_kg_ha = Column(Float, nullable=True)
    laboratory = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WaterSustainabilityRecord(Base):
    __tablename__ = "water_sustainability_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=False, index=True)
    crop = Column(String(100), nullable=False)
    irrigation_method = Column(String(50), nullable=False)
    water_used_m3_ha = Column(Float, nullable=True)
    crop_water_req_m3_ha = Column(Float, nullable=False)
    efficiency_pct = Column(Float, nullable=False)
    water_stress_level = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CarbonAssessmentRecord(Base):
    __tablename__ = "carbon_assessments"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=True, index=True)
    district = Column(String(100), nullable=False, index=True)
    emissions_kg_co2e_ha = Column(Float, nullable=True)
    sequestration_t_co2e_ha = Column(Float, nullable=True)
    credit_eligibility_status = Column(String(50), nullable=False)
    methodology = Column(String(100), nullable=False, default="Verra VM0042")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SustainabilitySourceRecord(Base):
    __tablename__ = "sustainability_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String(100), nullable=False, unique=True, index=True)
    organization = Column(String(200), nullable=False)
    dataset = Column(String(200), nullable=False)
    parameter = Column(String(150), nullable=False)
    geographic_level = Column(String(150), nullable=False)
    method = Column(String(150), nullable=False)
    reliability = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SensorDeviceRecord(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, unique=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    device_name = Column(String(150), nullable=False)
    device_type = Column(String(100), nullable=False, default="SOIL_NODE")  # SOIL_NODE, WEATHER_STATION, IRRIGATION_CONTROLLER
    hardware_model = Column(String(100), nullable=False, default="ESP32-AGRI-PRO-V2")
    firmware_version = Column(String(50), nullable=False, default="v2.1.0-prod")
    status = Column(String(50), nullable=False, default="ONLINE")  # ONLINE, OFFLINE, DEGRADED, WAITING_FOR_DEVICE
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    battery_level_pct = Column(Float, nullable=True, default=95.0)
    calibration_metadata = Column(JSON, nullable=True)
    is_simulated = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SensorTelemetryRecord(Base):
    __tablename__ = "sensor_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    sensor_type = Column(String(100), nullable=False, index=True)  # moisture, ph, temperature, nitrogen, phosphorus, potassium, ec
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    source_type = Column(String(50), nullable=False, default="iot_sensor")  # iot_sensor, manual, external, simulation
    is_outlier = Column(Integer, nullable=False, default=0)
    quality_score = Column(Float, nullable=False, default=1.0)
    raw_payload = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class FarmProfileRecord(Base):
    __tablename__ = "farm_profiles"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(100), nullable=False, unique=True, index=True)
    farmer_name = Column(String(150), nullable=False)
    farm_name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    village = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_acres = Column(Float, nullable=False)
    soil_type = Column(String(100), nullable=False, default="Red Loam")
    current_crop = Column(String(100), nullable=False, default="Groundnut")
    irrigation_type = Column(String(50), nullable=False, default="DRIP")
    water_source = Column(String(100), nullable=False, default="Borewell")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class OrchestratorDecisionRecord(Base):
    __tablename__ = "orchestrator_decisions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(String(100), nullable=False, unique=True, index=True)
    farm_id = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    primary_crop = Column(String(100), nullable=False)
    suitability_score = Column(Float, nullable=False)
    market_score = Column(Float, nullable=False)
    sustainability_score = Column(Float, nullable=False)
    soil_score = Column(Float, nullable=False)
    land_score = Column(Float, nullable=False)
    overall_confidence = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    conflicts_detected = Column(JSON, nullable=True)
    immediate_actions = Column(JSON, nullable=True)
    long_term_actions = Column(JSON, nullable=True)
    alternatives = Column(JSON, nullable=True)
    raw_audit_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AgentHealthLogRecord(Base):
    __tablename__ = "agent_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String(100), nullable=False, index=True)  # land, soil, market, sustainability, hardware, orchestrator
    status = Column(String(50), nullable=False)  # CONNECTED, DEGRADED, OFFLINE
    latency_ms = Column(Float, nullable=False)
    data_freshness = Column(String(50), nullable=False)  # LIVE, RECENT, HISTORICAL, STALE, UNAVAILABLE
    error_count = Column(Integer, nullable=False, default=0)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)





