"""Initial TerraMind-X schema

Revision ID: 0001
Revises:
Create Date: 2026-09-26

Creates all tables defined in app.db.models.
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # All tables are created via Base.metadata — this migration
    # serves as the canonical baseline. Autogenerate would produce
    # the same DDL; we delegate to SQLAlchemy's create_all for the
    # initial setup in development (see database.py:create_all_tables).
    #
    # For PostgreSQL production, run:
    #   alembic upgrade head
    # which calls this migration and then applies subsequent revisions.

    op.create_table(
        "states",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("code", sa.String(10)),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "districts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("state_id", sa.String(), sa.ForeignKey("states.id"), nullable=False),
        sa.Column("state_name", sa.String(100)),
        sa.Column("created_at", sa.DateTime()),
        sa.UniqueConstraint("name", "state_id", name="uq_district_state"),
    )

    op.create_table(
        "taluks",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("district_id", sa.String(), sa.ForeignKey("districts.id"), nullable=False),
        sa.Column("state_name", sa.String(100)),
        sa.Column("district_name", sa.String(100)),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "villages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("taluk_id", sa.String(), sa.ForeignKey("taluks.id")),
        sa.Column("district_id", sa.String(), sa.ForeignKey("districts.id")),
        sa.Column("state_name", sa.String(100)),
        sa.Column("district_name", sa.String(100)),
        sa.Column("taluk_name", sa.String(100)),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "crop_reference",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("crop_name", sa.String(200), nullable=False, unique=True),
        sa.Column("crop_name_hindi", sa.String(200)),
        sa.Column("crop_name_marathi", sa.String(200)),
        sa.Column("crop_name_tamil", sa.String(200)),
        sa.Column("scientific_name", sa.String(200)),
        sa.Column("family", sa.String(100)),
        sa.Column("season", sa.String(50)),
        sa.Column("temp_opt_min", sa.Float()),
        sa.Column("temp_opt_max", sa.Float()),
        sa.Column("rain_opt_min", sa.Float()),
        sa.Column("rain_opt_max", sa.Float()),
        sa.Column("ph_opt_min", sa.Float()),
        sa.Column("ph_opt_max", sa.Float()),
        sa.Column("water_req_mm", sa.Float()),
        sa.Column("harvest_days", sa.Integer()),
        sa.Column("sowing_months", sa.String(100)),
        sa.Column("soil_types", sa.String(300)),
        sa.Column("irrigation_type", sa.String(20)),
        sa.Column("npk_n_req", sa.Float()),
        sa.Column("npk_p_req", sa.Float()),
        sa.Column("npk_k_req", sa.Float()),
        sa.Column("msp_price", sa.Float()),
        sa.Column("msp_unit", sa.String(20)),
        sa.Column("msp_season", sa.String(20)),
        sa.Column("msp_year", sa.String(10)),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source_name", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("source_document", sa.String(500)),
        sa.Column("publication_year", sa.Integer()),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )

    op.create_table(
        "market_prices",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("taluk", sa.String(100)),
        sa.Column("market_name", sa.String(200), nullable=False),
        sa.Column("market_code", sa.String(50)),
        sa.Column("commodity", sa.String(200), nullable=False),
        sa.Column("variety", sa.String(200)),
        sa.Column("grade", sa.String(50)),
        sa.Column("min_price", sa.Float()),
        sa.Column("max_price", sa.Float()),
        sa.Column("modal_price", sa.Float(), nullable=False),
        sa.Column("original_unit", sa.String(50)),
        sa.Column("min_price_qtl", sa.Float()),
        sa.Column("max_price_qtl", sa.Float()),
        sa.Column("modal_price_qtl", sa.Float()),
        sa.Column("normalized_unit", sa.String(20)),
        sa.Column("conversion_formula", sa.String(200)),
        sa.Column("arrival_quantity", sa.Float()),
        sa.Column("arrival_unit", sa.String(50)),
        sa.Column("trading_date", sa.Date(), nullable=False),
        sa.Column("data_timestamp", sa.DateTime()),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("fetched_at", sa.DateTime()),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("source_record_id", sa.String(200)),
        sa.Column("verification_status", sa.String(50)),
        sa.UniqueConstraint(
            "state", "district", "market_name", "commodity",
            "variety", "trading_date", "source_record_id",
            name="uq_market_price_record",
        ),
    )
    op.create_index("ix_mp_commodity_district_date", "market_prices", ["commodity", "district", "trading_date"])
    op.create_index("ix_mp_trading_date", "market_prices", ["trading_date"])

    op.create_table(
        "market_arrivals",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("market_name", sa.String(200), nullable=False),
        sa.Column("market_code", sa.String(50)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("commodity", sa.String(200), nullable=False),
        sa.Column("variety", sa.String(200)),
        sa.Column("arrival_quantity", sa.Float(), nullable=False),
        sa.Column("arrival_unit", sa.String(50)),
        sa.Column("arrival_date", sa.Date(), nullable=False),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("source_record_id", sa.String(200)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("verification_status", sa.String(50)),
        sa.UniqueConstraint(
            "market_name", "commodity", "arrival_date", "source_record_id",
            name="uq_market_arrival_record",
        ),
    )
    op.create_index("ix_ma_commodity_date", "market_arrivals", ["commodity", "arrival_date"])

    op.create_table(
        "weather_observations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("observation_time", sa.DateTime(), nullable=False),
        sa.Column("data_type", sa.String(30)),
        sa.Column("temperature", sa.Float()),
        sa.Column("temperature_max", sa.Float()),
        sa.Column("temperature_min", sa.Float()),
        sa.Column("rainfall", sa.Float()),
        sa.Column("humidity", sa.Float()),
        sa.Column("wind_speed", sa.Float()),
        sa.Column("soil_moisture", sa.Float()),
        sa.Column("evapotranspiration", sa.Float()),
        sa.Column("solar_radiation", sa.Float()),
        sa.Column("weather_source", sa.String(200), nullable=False),
        sa.Column("model_name", sa.String(100)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("provenance", sa.String(20)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("verification_status", sa.String(50)),
    )
    op.create_index("ix_weather_lat_lon_time", "weather_observations", ["latitude", "longitude", "observation_time"])
    op.create_index("ix_weather_district", "weather_observations", ["district", "observation_time"])

    op.create_table(
        "soil_observations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("taluk", sa.String(100)),
        sa.Column("village", sa.String(200)),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("ph", sa.Float()),
        sa.Column("nitrogen", sa.Float()),
        sa.Column("phosphorus", sa.Float()),
        sa.Column("potassium", sa.Float()),
        sa.Column("organic_carbon", sa.Float()),
        sa.Column("electrical_conductivity", sa.Float()),
        sa.Column("moisture", sa.Float()),
        sa.Column("zinc", sa.Float()),
        sa.Column("iron", sa.Float()),
        sa.Column("manganese", sa.Float()),
        sa.Column("copper", sa.Float()),
        sa.Column("boron", sa.Float()),
        sa.Column("sulphur", sa.Float()),
        sa.Column("soil_type", sa.String(100)),
        sa.Column("test_date", sa.Date()),
        sa.Column("source_type", sa.String(50)),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "cultivation_records",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100)),
        sa.Column("taluk", sa.String(100)),
        sa.Column("village", sa.String(200)),
        sa.Column("admin_level", sa.String(20), nullable=False),
        sa.Column("commodity", sa.String(200), nullable=False),
        sa.Column("variety", sa.String(200)),
        sa.Column("cultivated_area", sa.Float(), nullable=False),
        sa.Column("area_unit", sa.String(20)),
        sa.Column("cultivation_year", sa.Integer()),
        sa.Column("season", sa.String(50)),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("source_record_id", sa.String(200)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_index("ix_cult_commodity_district_year", "cultivation_records", ["commodity", "district", "cultivation_year"])

    op.create_table(
        "buyers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("buyer_name", sa.String(300), nullable=False),
        sa.Column("buyer_type", sa.String(50)),
        sa.Column("location", sa.String(300)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("crops_supported", sa.Text()),
        sa.Column("contact_information", sa.String(500)),
        sa.Column("registration_number", sa.String(200)),
        sa.Column("gst_number", sa.String(20)),
        sa.Column("verification_source", sa.String(500)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("last_verified_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "buyer_demand",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("buyer_id", sa.String(), sa.ForeignKey("buyers.id"), nullable=False),
        sa.Column("commodity", sa.String(200), nullable=False),
        sa.Column("variety", sa.String(200)),
        sa.Column("grade_required", sa.String(10)),
        sa.Column("required_quantity", sa.Float()),
        sa.Column("quantity_unit", sa.String(30)),
        sa.Column("expected_price", sa.Float()),
        sa.Column("demand_date", sa.Date()),
        sa.Column("delivery_location", sa.String(300)),
        sa.Column("payment_days", sa.Integer()),
        sa.Column("quality_requirements", sa.Text()),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "festival_calendar",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("festival_name", sa.String(200), nullable=False),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("associated_crops", sa.Text()),
        sa.Column("historical_demand_signal", sa.String(50)),
        sa.Column("signal_evidence_type", sa.String(50)),
        sa.Column("uplift_pct_estimate", sa.Float()),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "government_policies",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("policy_name", sa.String(300), nullable=False),
        sa.Column("policy_type", sa.String(50)),
        sa.Column("crop", sa.String(200)),
        sa.Column("applicable_state", sa.String(100)),
        sa.Column("applicable_district", sa.String(100)),
        sa.Column("price", sa.Float()),
        sa.Column("price_unit", sa.String(30)),
        sa.Column("effective_date", sa.Date()),
        sa.Column("expiry_date", sa.Date()),
        sa.Column("description", sa.Text()),
        sa.Column("provenance", sa.String(20)),
        sa.Column("source", sa.String(500), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("verification_status", sa.String(50)),
        sa.Column("retrieved_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "ml_models",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("model_name", sa.String(200), nullable=False),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("model_type", sa.String(100)),
        sa.Column("target", sa.String(100)),
        sa.Column("features", sa.Text()),
        sa.Column("training_data_sources", sa.Text()),
        sa.Column("training_period_start", sa.Date()),
        sa.Column("training_period_end", sa.Date()),
        sa.Column("training_rows", sa.Integer()),
        sa.Column("test_rows", sa.Integer()),
        sa.Column("mae", sa.Float()),
        sa.Column("rmse", sa.Float()),
        sa.Column("mape", sa.Float()),
        sa.Column("r2", sa.Float()),
        sa.Column("baseline_mae", sa.Float()),
        sa.Column("outperforms_baseline", sa.Boolean()),
        sa.Column("artifact_path", sa.String(1000)),
        sa.Column("status", sa.String(50)),
        sa.Column("notes", sa.Text()),
        sa.Column("trained_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
        sa.UniqueConstraint("model_name", "model_version", name="uq_model_version"),
    )

    op.create_table(
        "prediction_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("request_id", sa.String(100)),
        sa.Column("prediction_type", sa.String(100)),
        sa.Column("commodity", sa.String(200)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("model_id", sa.String(), sa.ForeignKey("ml_models.id")),
        sa.Column("model_name", sa.String(200)),
        sa.Column("model_version", sa.String(50)),
        sa.Column("predicted_value", sa.Float()),
        sa.Column("predicted_low", sa.Float()),
        sa.Column("predicted_high", sa.Float()),
        sa.Column("confidence", sa.Float()),
        sa.Column("data_quality", sa.String(20)),
        sa.Column("training_rows_used", sa.Integer()),
        sa.Column("data_source_count", sa.Integer()),
        sa.Column("observation_period", sa.String(100)),
        sa.Column("generated_at", sa.DateTime()),
        sa.Column("actual_value", sa.Float()),
        sa.Column("actual_date", sa.Date()),
        sa.Column("error_abs", sa.Float()),
    )

    op.create_table(
        "agent_results",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("request_id", sa.String(100), nullable=False),
        sa.Column("agent_name", sa.String(100), nullable=False),
        sa.Column("commodity", sa.String(200)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("score", sa.Float()),
        sa.Column("verdict", sa.String(100)),
        sa.Column("confidence", sa.Float()),
        sa.Column("data_quality", sa.String(20)),
        sa.Column("result_json", sa.Text()),
        sa.Column("evidence_count", sa.Integer()),
        sa.Column("unavailable_inputs_count", sa.Integer()),
        sa.Column("generated_at", sa.DateTime()),
    )

    op.create_table(
        "decision_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("request_id", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("taluk", sa.String(100)),
        sa.Column("village", sa.String(200)),
        sa.Column("commodity", sa.String(200)),
        sa.Column("decision_score", sa.Float()),
        sa.Column("recommendation", sa.Text()),
        sa.Column("data_quality_overall", sa.String(20)),
        sa.Column("confidence", sa.Float()),
        sa.Column("weights_used", sa.Text()),
        sa.Column("evidence_summary", sa.Text()),
        sa.Column("missing_data", sa.Text()),
        sa.Column("language", sa.String(10)),
        sa.Column("explanation_en", sa.Text()),
        sa.Column("explanation_ta", sa.Text()),
        sa.Column("explanation_mr", sa.Text()),
        sa.Column("explanation_hi", sa.Text()),
        sa.Column("generated_at", sa.DateTime()),
    )

    op.create_table(
        "data_provenance",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("dataset_name", sa.String(200), nullable=False),
        sa.Column("source_name", sa.String(500)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("collection_date", sa.Date()),
        sa.Column("observation_start", sa.Date()),
        sa.Column("observation_end", sa.Date()),
        sa.Column("geography", sa.String(200)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("unit", sa.String(50)),
        sa.Column("row_count", sa.Integer()),
        sa.Column("quality_status", sa.String(50)),
        sa.Column("missing_percentage", sa.Float()),
        sa.Column("provenance", sa.String(20)),
        sa.Column("synthetic", sa.Boolean()),
        sa.Column("notes", sa.Text()),
        sa.Column("last_updated", sa.DateTime()),
        sa.Column("created_at", sa.DateTime()),
    )

    op.create_table(
        "ingestion_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("source_name", sa.String(200), nullable=False),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("run_type", sa.String(50)),
        sa.Column("status", sa.String(50)),
        sa.Column("http_status", sa.String(20)),
        sa.Column("records_requested", sa.Integer()),
        sa.Column("records_received", sa.Integer()),
        sa.Column("records_accepted", sa.Integer()),
        sa.Column("records_rejected", sa.Integer()),
        sa.Column("duplicates_removed", sa.Integer()),
        sa.Column("error_message", sa.Text()),
        sa.Column("validation_status", sa.String(50)),
        sa.Column("started_at", sa.DateTime()),
        sa.Column("completed_at", sa.DateTime()),
    )
    op.create_index("ix_ingestion_source_started", "ingestion_runs", ["source_name", "started_at"])

    op.create_table(
        "data_sources",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("source_name", sa.String(200), nullable=False, unique=True),
        sa.Column("source_type", sa.String(100)),
        sa.Column("base_url", sa.String(1000)),
        sa.Column("dataset_name", sa.String(300)),
        sa.Column("description", sa.Text()),
        sa.Column("update_frequency", sa.String(50)),
        sa.Column("requires_api_key", sa.Boolean()),
        sa.Column("api_key_env_var", sa.String(100)),
        sa.Column("status", sa.String(50)),
        sa.Column("last_successful_fetch", sa.DateTime()),
        sa.Column("last_attempted_fetch", sa.DateTime()),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_at", sa.DateTime()),
        sa.Column("updated_at", sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table("data_sources")
    op.drop_table("ingestion_runs")
    op.drop_table("data_provenance")
    op.drop_table("decision_logs")
    op.drop_table("agent_results")
    op.drop_table("prediction_logs")
    op.drop_table("ml_models")
    op.drop_table("government_policies")
    op.drop_table("festival_calendar")
    op.drop_table("buyer_demand")
    op.drop_table("buyers")
    op.drop_table("cultivation_records")
    op.drop_table("soil_observations")
    op.drop_table("weather_observations")
    op.drop_table("market_arrivals")
    op.drop_table("market_prices")
    op.drop_table("crop_reference")
    op.drop_table("villages")
    op.drop_table("taluks")
    op.drop_table("districts")
    op.drop_table("states")
