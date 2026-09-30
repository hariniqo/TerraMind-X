"""Schemas for farmer analysis input — POST /api/v1/analyze"""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SoilInput(BaseModel):
    ph: Optional[float] = Field(None, ge=0.0, le=14.0)
    nitrogen: Optional[float] = Field(None, ge=0.0, le=2000.0, description="kg/ha")
    phosphorus: Optional[float] = Field(None, ge=0.0, le=200.0, description="kg/ha")
    potassium: Optional[float] = Field(None, ge=0.0, le=2000.0, description="kg/ha")
    organic_carbon: Optional[float] = Field(None, ge=0.0, le=10.0, description="%")
    moisture: Optional[float] = Field(None, ge=0.0, le=100.0, description="%")
    electrical_conductivity: Optional[float] = Field(None, ge=0.0, le=20.0, description="dS/m")
    soil_type: Optional[str] = None


class FarmerAnalysisRequest(BaseModel):
    state: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    taluk: Optional[str] = Field(None, max_length=100)
    village: Optional[str] = Field(None, max_length=200)
    farm_area_acres: Optional[float] = Field(None, ge=0.01, le=10000.0)
    latitude: Optional[float] = Field(None, ge=6.0, le=38.0)   # India bounding box
    longitude: Optional[float] = Field(None, ge=68.0, le=98.0)
    soil: Optional[SoilInput] = None
    water_availability: Optional[str] = Field(None, description="rainfed/irrigated/both")
    current_crop: Optional[str] = None
    preferred_crops: List[str] = Field(default_factory=list)
    target_planting_date: Optional[str] = None   # YYYY-MM-DD
    target_harvest_date: Optional[str] = None
    language: str = Field("en", pattern="^(en|ta|mr|hi)$")

    @field_validator("water_availability")
    @classmethod
    def validate_water(cls, v):
        if v and v.lower() not in {"rainfed", "irrigated", "both", "drip", "borewell", "canal"}:
            raise ValueError("water_availability must be rainfed/irrigated/both/drip/borewell/canal")
        return v
