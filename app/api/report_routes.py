"""
Report API Endpoints.
Serves validated, auditable farm intelligence reports with per-domain drilldowns,
confidence metrics, data provenance, and WhatsApp sharing intents.
"""

import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.report_service import ReportService

logger = logging.getLogger(__name__)
router = APIRouter()
report_service = ReportService()


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def get_report_query(
    farm_id: Optional[str] = "farm-01",
    district: Optional[str] = None,
    state: Optional[str] = None,
    crop: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    area_acres: Optional[float] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves full agricultural intelligence report for given farm context or location.
    """
    try:
        return await report_service.generate_farm_report(
            farm_id=farm_id,
            district=district,
            state=state,
            crop=crop,
            latitude=latitude,
            longitude=longitude,
            area_acres=area_acres,
            session=session
        )
    except Exception as e:
        logger.error(f"Report generation query failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate farm report: {str(e)}"
        )


@router.get("/{farm_id}", response_model=Dict[str, Any])
async def get_farm_report_by_id(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    crop: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Retrieves complete farm report by farm_id.
    """
    try:
        return await report_service.generate_farm_report(
            farm_id=farm_id,
            district=district,
            state=state,
            crop=crop,
            latitude=latitude,
            longitude=longitude,
            session=session
        )
    except Exception as e:
        logger.error(f"Farm report retrieval failed for farm {farm_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile report for farm '{farm_id}': {str(e)}"
        )


@router.get("/{farm_id}/soil", response_model=Dict[str, Any])
async def get_soil_report_section(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    full_report = await report_service.generate_farm_report(
        farm_id=farm_id,
        district=district,
        state=state,
        latitude=latitude,
        longitude=longitude,
        session=session
    )
    return {
        "farm_id": farm_id,
        "soil": full_report.get("soil"),
        "confidence": full_report.get("confidence", {}).get("domains", {}).get("soil")
    }


@router.get("/{farm_id}/market", response_model=Dict[str, Any])
async def get_market_report_section(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    crop: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    full_report = await report_service.generate_farm_report(
        farm_id=farm_id,
        district=district,
        state=state,
        crop=crop,
        session=session
    )
    return {
        "farm_id": farm_id,
        "market": full_report.get("market"),
        "confidence": full_report.get("confidence", {}).get("domains", {}).get("market")
    }


@router.get("/{farm_id}/sustainability", response_model=Dict[str, Any])
async def get_sustainability_report_section(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    full_report = await report_service.generate_farm_report(
        farm_id=farm_id,
        district=district,
        state=state,
        session=session
    )
    return {
        "farm_id": farm_id,
        "sustainability": full_report.get("sustainability"),
        "confidence": full_report.get("confidence", {}).get("domains", {}).get("sustainability")
    }


@router.get("/{farm_id}/agronomy", response_model=Dict[str, Any])
async def get_agronomy_report_section(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    crop: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    full_report = await report_service.generate_farm_report(
        farm_id=farm_id,
        district=district,
        state=state,
        crop=crop,
        session=session
    )
    return {
        "farm_id": farm_id,
        "agronomy": full_report.get("agronomy"),
        "confidence": full_report.get("confidence", {}).get("domains", {}).get("agronomy")
    }


@router.get("/{farm_id}/whatsapp-share", response_model=Dict[str, Any])
@router.get("/{farm_id}/whatsapp", response_model=Dict[str, Any])
async def get_whatsapp_share_payload(
    farm_id: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    crop: Optional[str] = None,
    language: str = "en",
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Formats farmer-friendly WhatsApp share intent message in English, Tamil, or Marathi.
    """
    full_report = await report_service.generate_farm_report(
        farm_id=farm_id,
        district=district,
        state=state,
        crop=crop,
        session=session
    )
    
    farm_name = full_report.get("farm", {}).get("farm_name", "TerraMind Farm")
    dist = full_report.get("farm", {}).get("district", "District")
    target_crop = full_report.get("farm", {}).get("current_crop", "Crop")
    soil_status = full_report.get("soil", {}).get("soil_health_status", "Available")
    sust_score = full_report.get("sustainability", {}).get("sustainability_score", 78)
    conf_pct = full_report.get("confidence", {}).get("overall_percentage", 75)
    
    if language == "ta":
        text = (
            f"🌿 *டெர்ராமைண்ட்-எக்ஸ் பண்ணை அறிக்கை (வாட்ஸ்அப்)*\n"
            f"📍 பண்ணை: {farm_name} ({dist})\n"
            f"🌱 மண் ஆரோக்கியம்: {soil_status}\n"
            f"🌾 பரிந்துரைக்கப்பட்ட பயிர்: {target_crop} (நிலக்கடலை)\n"
            f"💧 நீர் பாசனம்: சொட்டு நீர் முறை\n"
            f"🌍 நிலைத்தன்மை குறியீடு: {sust_score}/100\n"
            f"📊 நம்பிக்கை மதிப்பீடு: {conf_pct}%\n\n"
            f"🔗 முழு அறிக்கை: http://localhost:5173/reports/print?farmId={farm_id}"
        )
    elif language == "mr":
        text = (
            f"🌿 *टेरामाइंड-एक्स शेती सल्लागार अहवाल (व्हॉट्सॲप)*\n"
            f"📍 शेत: {farm_name} ({dist})\n"
            f"🌱 जमिनीचे आरोग्य: {soil_status}\n"
            f"🌾 शिफारस केलेले पीक: {target_crop}\n"
            f"💧 पाणी व्यवस्थापन: ठिबक सिंचन\n"
            f"🌍 शाश्वतता गुण: {sust_score}/100\n"
            f"📊 अचूकता विश्वास: {conf_pct}%\n\n"
            f"🔗 संपूर्ण अहवाल: http://localhost:5173/reports/print?farmId={farm_id}"
        )
    else:
        text = (
            f"🌿 *TerraMind-X Farm Intelligence Report (WhatsApp)*\n"
            f"📍 Farm: {farm_name} ({dist})\n"
            f"🌱 Soil Health: {soil_status}\n"
            f"🌾 Crop Recommended: {target_crop}\n"
            f"💧 Water Status: Optimal Drip Scheduling\n"
            f"🌍 Sustainability Score: {sust_score}/100\n"
            f"📊 Reliability Confidence: {conf_pct}%\n\n"
            f"🔗 View Complete Audit: http://localhost:5173/reports/print?farmId={farm_id}"
        )

    import urllib.parse
    encoded_text = urllib.parse.quote(text)
    whatsapp_url = f"https://api.whatsapp.com/send?text={encoded_text}"

    return {
        "status": "success",
        "farm_id": farm_id,
        "language": language,
        "whatsapp_url": whatsapp_url,
        "whatsapp_click_to_chat_url": whatsapp_url,
        "message_preview": text,
        "text_message": text,
        "integration_status": "SHARE_INTENT_READY"
    }

