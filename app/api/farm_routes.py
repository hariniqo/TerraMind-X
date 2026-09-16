"""
Farm Profile Management API.
Supports farm registration, multi-farm switching, geographic parameters, and farm metadata.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_session
from app.db.models import FarmProfileRecord

logger = logging.getLogger(__name__)
router = APIRouter()


class FarmCreateRequest(BaseModel):
    farm_id: str = Field(..., json_schema_extra={"example": "farm-01"})
    farmer_name: str = Field(..., json_schema_extra={"example": "Ramasamy K"})
    farm_name: str = Field(..., json_schema_extra={"example": "Madurai Precision Farm"})
    district: str = Field(..., json_schema_extra={"example": "Madurai"})
    state: str = Field("Tamil Nadu", json_schema_extra={"example": "Tamil Nadu"})
    taluka: Optional[str] = Field(None, json_schema_extra={"example": "Melur"})
    village: Optional[str] = Field("Melur", json_schema_extra={"example": "Melur"})
    latitude: float = Field(..., json_schema_extra={"example": 9.9252})
    longitude: float = Field(..., json_schema_extra={"example": 78.1198})
    area_acres: float = Field(2.4, json_schema_extra={"example": 2.4})
    soil_type: str = Field("Red Loam", json_schema_extra={"example": "Red Loam"})
    ph: Optional[float] = Field(None, json_schema_extra={"example": 6.8})
    moisture: Optional[float] = Field(None, json_schema_extra={"example": 28.5})
    nitrogen_n: Optional[float] = Field(None, json_schema_extra={"example": 140.0})
    phosphorus_p: Optional[float] = Field(None, json_schema_extra={"example": 24.0})
    potassium_k: Optional[float] = Field(None, json_schema_extra={"example": 180.0})
    organic_carbon: Optional[float] = Field(None, json_schema_extra={"example": 0.65})
    current_crop: str = Field("Groundnut", json_schema_extra={"example": "Groundnut"})
    irrigation_type: str = Field("DRIP", json_schema_extra={"example": "DRIP"})
    water_source: str = Field("Borewell", json_schema_extra={"example": "Borewell"})


class FarmUpdateRequest(BaseModel):
    farmer_name: Optional[str] = None
    farm_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area_acres: Optional[float] = None
    soil_type: Optional[str] = None
    ph: Optional[float] = None
    moisture: Optional[float] = None
    nitrogen_n: Optional[float] = None
    phosphorus_p: Optional[float] = None
    potassium_k: Optional[float] = None
    organic_carbon: Optional[float] = None
    current_crop: Optional[str] = None
    irrigation_type: Optional[str] = None
    water_source: Optional[str] = None


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def list_farms(
    session: AsyncSession = Depends(get_session)
) -> List[Dict[str, Any]]:
    """
    Lists all registered farm profiles.
    """
    stmt = select(FarmProfileRecord)
    res = await session.execute(stmt)
    records = res.scalars().all()

    if not records:
        # Provide default pilot farms if database has no custom entries yet
        return [
            {
                "farm_id": "farm-01",
                "farmer_name": "Ramasamy K",
                "farm_name": "Madurai Precision Farm",
                "district": "Madurai",
                "state": "Tamil Nadu",
                "village": "Melur",
                "latitude": 9.9252,
                "longitude": 78.1198,
                "area_acres": 2.4,
                "soil_type": "Red Loam",
                "current_crop": "Groundnut",
                "irrigation_type": "DRIP",
                "water_source": "Borewell"
            },
            {
                "farm_id": "farm-maha-01",
                "farmer_name": "Suresh Patil",
                "farm_name": "Pune Smart Agriculture Plot",
                "district": "Pune",
                "state": "Maharashtra",
                "village": "Baramati",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "area_acres": 4.5,
                "soil_type": "Black Cotton (Vertisol)",
                "current_crop": "Soybean",
                "irrigation_type": "DRIP",
                "water_source": "Canal + Well"
            }
        ]

    return [
        {
            "farm_id": r.farm_id,
            "farmer_name": r.farmer_name,
            "farm_name": r.farm_name,
            "district": r.district,
            "state": r.state,
            "village": r.village,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "area_acres": r.area_acres,
            "soil_type": r.soil_type,
            "current_crop": r.current_crop,
            "irrigation_type": r.irrigation_type,
            "water_source": r.water_source
        }
        for r in records
    ]


@router.get("/{farm_id}", response_model=Dict[str, Any])
async def get_farm(
    farm_id: str,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves specific farm profile by farm_id.
    """
    stmt = select(FarmProfileRecord).where(FarmProfileRecord.farm_id == farm_id)
    res = await session.execute(stmt)
    rec = res.scalars().first()

    if not rec:
        if farm_id == "farm-01":
            return {
                "farm_id": "farm-01",
                "farmer_name": "Ramasamy K",
                "farm_name": "Madurai Precision Farm",
                "district": "Madurai",
                "state": "Tamil Nadu",
                "village": "Melur",
                "latitude": 9.9252,
                "longitude": 78.1198,
                "area_acres": 2.4,
                "soil_type": "Red Loam",
                "current_crop": "Groundnut",
                "irrigation_type": "DRIP",
                "water_source": "Borewell"
            }
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm '{farm_id}' not found.")

    return {
        "farm_id": rec.farm_id,
        "farmer_name": rec.farmer_name,
        "farm_name": rec.farm_name,
        "district": rec.district,
        "state": rec.state,
        "village": rec.village,
        "latitude": rec.latitude,
        "longitude": rec.longitude,
        "area_acres": rec.area_acres,
        "soil_type": rec.soil_type,
        "current_crop": rec.current_crop,
        "irrigation_type": rec.irrigation_type,
        "water_source": rec.water_source
    }


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_or_update_farm(
    payload: FarmCreateRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Creates or updates a farm profile.
    """
    stmt = select(FarmProfileRecord).where(FarmProfileRecord.farm_id == payload.farm_id)
    res = await session.execute(stmt)
    rec = res.scalars().first()

    if not rec:
        rec = FarmProfileRecord(
            farm_id=payload.farm_id,
            farmer_name=payload.farmer_name,
            farm_name=payload.farm_name,
            district=payload.district,
            state=payload.state,
            village=payload.village,
            latitude=payload.latitude,
            longitude=payload.longitude,
            area_acres=payload.area_acres,
            soil_type=payload.soil_type,
            current_crop=payload.current_crop,
            irrigation_type=payload.irrigation_type,
            water_source=payload.water_source
        )
        session.add(rec)
    else:
        rec.farmer_name = payload.farmer_name
        rec.farm_name = payload.farm_name
        rec.district = payload.district
        rec.state = payload.state
        rec.village = payload.village
        rec.latitude = payload.latitude
        rec.longitude = payload.longitude
        rec.area_acres = payload.area_acres
        rec.soil_type = payload.soil_type
        rec.current_crop = payload.current_crop
        rec.irrigation_type = payload.irrigation_type
        rec.water_source = payload.water_source

    await session.commit()
    await session.refresh(rec)

    return {
        "farm_id": rec.farm_id,
        "farmer_name": rec.farmer_name,
        "farm_name": rec.farm_name,
        "district": rec.district,
        "state": rec.state,
        "status": "SAVED"
    }


@router.put("/{farm_id}", response_model=Dict[str, Any])
async def update_farm(
    farm_id: str,
    payload: FarmUpdateRequest,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Updates an existing farm profile by farm_id.
    """
    stmt = select(FarmProfileRecord).where(FarmProfileRecord.farm_id == farm_id)
    res = await session.execute(stmt)
    rec = res.scalars().first()

    if not rec:
        # If default mock farm, create it
        rec = FarmProfileRecord(
            farm_id=farm_id,
            farmer_name=payload.farmer_name or "Ramasamy K",
            farm_name=payload.farm_name or "Precision Plot",
            district=payload.district or "Madurai",
            state=payload.state or "Tamil Nadu",
            village=payload.village or "Melur",
            latitude=payload.latitude or 9.9252,
            longitude=payload.longitude or 78.1198,
            area_acres=payload.area_acres or 2.4,
            soil_type=payload.soil_type or "Red Loam",
            current_crop=payload.current_crop or "Groundnut",
            irrigation_type=payload.irrigation_type or "DRIP",
            water_source=payload.water_source or "Borewell"
        )
        session.add(rec)
    else:
        for field, value in payload.model_dump(exclude_unset=True).items():
            if hasattr(rec, field) and value is not None:
                setattr(rec, field, value)

    await session.commit()
    await session.refresh(rec)

    return {
        "farm_id": rec.farm_id,
        "farmer_name": rec.farmer_name,
        "farm_name": rec.farm_name,
        "district": rec.district,
        "state": rec.state,
        "status": "UPDATED"
    }

