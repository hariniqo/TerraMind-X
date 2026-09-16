import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from app.db.models import ClimateAggregate, ClimateRisk
from app.config.geography import resolve_state_district_from_coords, get_district_coordinates
from app.services.gis_service import normalize_district_name
from app.services.climate_projections_service import ClimateProjectionsService
from app.services.climate_risk import ClimateRiskEngine
from app.services.climate_agriculture import ClimateAgricultureEngine

logger = logging.getLogger(__name__)

class FutureClimateService:
    def __init__(self) -> None:
        self.projections_service = ClimateProjectionsService()

    @staticmethod
    def calculate_median(values: List[float]) -> float:
        if not values:
            return 0.0
        sorted_vals = sorted(values)
        n = len(sorted_vals)
        mid = n // 2
        if n % 2 == 0:
            return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0
        return sorted_vals[mid]

    async def get_future_projections(
        self,
        latitude: float,
        longitude: float,
        start_year: int,
        end_year: int,
        scenario: str,
        model: Optional[str] = None,
        session: Any = None
    ) -> Dict[str, Any]:
        """
        Retrieves climate projection records from PostgreSQL.
        Groups by year and returns model-specific data or multi-model ensemble summaries.
        """
        state, district = resolve_state_district_from_coords(latitude, longitude)
        district_norm = normalize_district_name(district)

        # Caching check
        from app.services.climate_cache import ClimateCache
        climate_cache = ClimateCache()
        cache_hit = True
        cached_yearly_results = []
        variables = ["precipitation", "temperature_max", "temperature_min", "precipitation_anomaly", "temperature_anomaly"]
        
        for year in range(start_year, end_year + 1):
            model_key = model if model else "ensemble"
            cached_vals = {}
            for var in variables:
                val = climate_cache.get_projection(state, district_norm, var, scenario, model_key, str(year))
                if val is None:
                    cache_hit = False
                    break
                cached_vals[var] = val
                
            if not cache_hit:
                break
                
            if model:
                cached_yearly_results.append({
                    "year": year,
                    "model": model,
                    "precipitation_mm": cached_vals["precipitation"],
                    "temperature_max_c": cached_vals["temperature_max"],
                    "temperature_min_c": cached_vals["temperature_min"],
                    "precipitation_anomaly_mm": cached_vals["precipitation_anomaly"],
                    "temperature_anomaly_c": cached_vals["temperature_anomaly"]
                })
            else:
                ensemble_data = climate_cache.get_projection(state, district_norm, "ensemble_stats", scenario, "ensemble", str(year))
                if ensemble_data is None:
                    cache_hit = False
                    break
                cached_yearly_results.append(ensemble_data)

        if cache_hit and cached_yearly_results:
            logger.info(f"FutureClimateService CACHE HIT for {state}:{district_norm} ({start_year}-{end_year})")
            return {
                "status": "success",
                "location": {
                    "state": state,
                    "district": district_norm,
                    "latitude": latitude,
                    "longitude": longitude
                },
                "scenario": scenario,
                "projections": cached_yearly_results,
                "baseline_period": "1981-2010"
            }

        lat_center, lng_center = get_district_coordinates(state, district_norm)

        # Trigger ingestion if not loaded
        await self.projections_service.ingest_if_needed(state, district_norm, lat_center, lng_center, session)

        location_id = f"{state}:{district_norm}"
        stmt = select(ClimateAggregate).where(
            ClimateAggregate.location_id == location_id,
            ClimateAggregate.scenario == scenario,
            ClimateAggregate.year >= start_year,
            ClimateAggregate.year <= end_year
        )
        if model:
            stmt = stmt.where(ClimateAggregate.model_id == model)

        res = await session.execute(stmt)
        aggregates = res.scalars().all()

        if not aggregates:
            return {
                "status": "unavailable",
                "location": {"state": state, "district": district_norm, "latitude": latitude, "longitude": longitude},
                "scenario": scenario,
                "message": "Future climate projection data is temporarily unavailable for this range."
            }

        # Group by year
        by_year: Dict[int, List[ClimateAggregate]] = {}
        for agg in aggregates:
            by_year.setdefault(agg.year, []).append(agg)

        yearly_results = []
        for year in sorted(by_year.keys()):
            aggs = by_year[year]
            
            rain_vals = [a.rainfall_mm for a in aggs]
            tmax_vals = [a.tmax_mean_c for a in aggs]
            tmin_vals = [a.tmin_mean_c for a in aggs]
            rain_anom_vals = [a.rainfall_anomaly or 0.0 for a in aggs]
            temp_anom_vals = [a.temperature_anomaly or 0.0 for a in aggs]

            if model:
                # Model-specific single values
                yearly_results.append({
                    "year": year,
                    "model": model,
                    "precipitation_mm": round(rain_vals[0], 2),
                    "temperature_max_c": round(tmax_vals[0], 2),
                    "temperature_min_c": round(tmin_vals[0], 2),
                    "precipitation_anomaly_mm": round(rain_anom_vals[0], 2),
                    "temperature_anomaly_c": round(temp_anom_vals[0], 2)
                })
            else:
                # Multi-model ensemble statistics
                yearly_results.append({
                    "year": year,
                    "ensemble_mean": {
                        "precipitation_mm": round(sum(rain_vals) / len(rain_vals), 2),
                        "temperature_max_c": round(sum(tmax_vals) / len(tmax_vals), 2),
                        "temperature_min_c": round(sum(tmin_mean_c) / len(tmin_vals), 2) if 'tmin_mean_c' in locals() else round(sum(tmin_vals) / len(tmin_vals), 2),
                        "precipitation_anomaly_mm": round(sum(rain_anom_vals) / len(rain_anom_vals), 2),
                        "temperature_anomaly_c": round(sum(temp_anom_vals) / len(temp_anom_vals), 2)
                    },
                    "ensemble_min": {
                        "precipitation_mm": round(min(rain_vals), 2),
                        "temperature_max_c": round(min(tmax_vals), 2),
                        "temperature_min_c": round(min(tmin_vals), 2)
                    },
                    "ensemble_max": {
                        "precipitation_mm": round(max(rain_vals), 2),
                        "temperature_max_c": round(max(tmax_vals), 2),
                        "temperature_min_c": round(max(tmin_vals), 2)
                    },
                    "ensemble_median": {
                        "precipitation_mm": round(self.calculate_median(rain_vals), 2),
                        "temperature_max_c": round(self.calculate_median(tmax_vals), 2),
                        "temperature_min_c": round(self.calculate_median(tmin_vals), 2)
                    }
                })

        # Populate cache
        for yr_res in yearly_results:
            year_val = yr_res["year"]
            model_key = model if model else "ensemble"
            if model:
                climate_cache.set_projection(state, district_norm, "precipitation", scenario, model_key, str(year_val), yr_res["precipitation_mm"])
                climate_cache.set_projection(state, district_norm, "temperature_max", scenario, model_key, str(year_val), yr_res["temperature_max_c"])
                climate_cache.set_projection(state, district_norm, "temperature_min", scenario, model_key, str(year_val), yr_res["temperature_min_c"])
                climate_cache.set_projection(state, district_norm, "precipitation_anomaly", scenario, model_key, str(year_val), yr_res["precipitation_anomaly_mm"])
                climate_cache.set_projection(state, district_norm, "temperature_anomaly", scenario, model_key, str(year_val), yr_res["temperature_anomaly_c"])
            else:
                mean_stats = yr_res["ensemble_mean"]
                climate_cache.set_projection(state, district_norm, "precipitation", scenario, "ensemble", str(year_val), mean_stats["precipitation_mm"])
                climate_cache.set_projection(state, district_norm, "temperature_max", scenario, "ensemble", str(year_val), mean_stats["temperature_max_c"])
                climate_cache.set_projection(state, district_norm, "temperature_min", scenario, "ensemble", str(year_val), mean_stats["temperature_min_c"])
                climate_cache.set_projection(state, district_norm, "precipitation_anomaly", scenario, "ensemble", str(year_val), mean_stats["precipitation_anomaly_mm"])
                climate_cache.set_projection(state, district_norm, "temperature_anomaly", scenario, "ensemble", str(year_val), mean_stats["temperature_anomaly_c"])
                climate_cache.set_projection(state, district_norm, "ensemble_stats", scenario, "ensemble", str(year_val), yr_res)

        return {
            "status": "success",
            "location": {
                "state": state,
                "district": district_norm,
                "latitude": latitude,
                "longitude": longitude
            },
            "scenario": scenario,
            "projections": yearly_results,
            "baseline_period": "1981-2010"
        }

    async def get_location_projection(
        self,
        latitude: float,
        longitude: float,
        scenario: str,
        year: int,
        session: Any = None
    ) -> Dict[str, Any]:
        """
        Processes coordinates into state/district levels, evaluates climate hazards, 
        and extracts potential agricultural implications.
        """
        state, district = resolve_state_district_from_coords(latitude, longitude)
        district_norm = normalize_district_name(district)
        
        # Pull anomalies
        proj_data = await self.get_future_projections(
            latitude=latitude,
            longitude=longitude,
            start_year=year,
            end_year=year,
            scenario=scenario,
            session=session
        )

        if proj_data.get("status") == "unavailable":
            return proj_data

        # Get averages from projections list
        proj_node = proj_data["projections"][0]
        if "ensemble_mean" in proj_node:
            stats = proj_node["ensemble_mean"]
            tmax = stats["temperature_max_c"]
            tmin = stats["temperature_min_c"]
            temp_anom = stats["temperature_anomaly_c"]
            precip = stats["precipitation_mm"]
            precip_anom = stats["precipitation_anomaly_mm"]
        else:
            tmax = proj_node["temperature_max_c"]
            tmin = proj_node["temperature_min_c"]
            temp_anom = proj_node["temperature_anomaly_c"]
            precip = proj_node["precipitation_mm"]
            precip_anom = proj_node["precipitation_anomaly_mm"]

        precip_change_pct = (precip_anom / (precip - precip_anom)) * 100.0 if (precip - precip_anom) > 0 else 0.0

        # Run risk engine
        risks = ClimateRiskEngine.calculate_risks(
            temp_anomaly_c=temp_anom,
            precip_change_pct=precip_change_pct,
            heavy_rain_days_per_year=int(temp_anom * 4),
            dry_days_offset=int(temp_anom * 6),
            base_annual_precip_mm=precip - precip_anom
        )

        # Implication mapping
        agri = ClimateAgricultureEngine.get_agricultural_implications(risks)

        scenarios_desc = {
            "ssp126": "Low-emission sustainability-oriented pathway (1.5C target compatible).",
            "ssp245": "Intermediate pathway (stabilization near 2C limits).",
            "ssp370": "Higher-emission pathway (unmitigated carbon trends).",
            "ssp585": "Very high-emission pathway (fossil-fueled development cycle)."
        }

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "district": district_norm,
                "state": state
            },
            "scenario": {
                "name": scenario,
                "description": scenarios_desc.get(scenario.lower(), "Standard emission trajectory.")
            },
            "temperature": {
                "tmax_mean_c": tmax,
                "tmin_mean_c": tmin,
                "anomaly": temp_anom
            },
            "precipitation": {
                "annual_mm": precip,
                "anomaly_mm": precip_anom
            },
            "climate_risk": {
                "heat_risk": risks["heat_risk"]["level"],
                "drought_risk": risks["drought_risk"]["level"],
                "rainfall_risk": risks["heavy_rainfall_risk"]["level"],
                "water_stress": risks["water_stress_risk"]["level"],
                "overall_score": risks["overall_risk_score"]
            },
            "agricultural_implications": agri["implications"] + agri["precautions"] + agri["adaptation_options"]
        }
