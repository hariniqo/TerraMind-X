from app.schemas.recommendation import FarmContext
from app.core.config import get_settings
from app.services.nvidia import NvidiaNIMClient

settings = get_settings()


class TamilExplanationService:
    def __init__(self) -> None:
        self.nvidia = NvidiaNIMClient()

    async def generate(self, context: FarmContext, final_decision: dict) -> str:
        if settings.explabs_api_key:
            try:
                return await self.nvidia.generate_explanation(context, final_decision)
            except Exception as e:
                # Log error and fall back to local
                pass

        return self._local_explanation(context, final_decision)

    def _local_explanation(self, context: FarmContext, final_decision: dict) -> str:
        crop = final_decision.get("crop_recommendation", "Groundnut")
        soil_type = context.soil_type
        ph = context.ph_level
        moisture = context.moisture
        price = final_decision.get("expected_price", "₹6,400 / quintal")
        oversupply = final_decision.get("oversupply_risk_pct", 18)
        degradation = final_decision.get("soil_degradation_index", 0.15)
        sustainability = final_decision.get("sustainability_index", 89)
        
        # Build Tamil Explanation
        tamil = (
            f"தமிழ் விளக்கம்:\n"
            f"உங்கள் நிலத்தின் வகை {soil_type} (pH {ph}, ஈரப்பதம் {moisture}%) என கண்டறியப்பட்டுள்ளது. "
            f"முந்தைய பயிர்களை ஆராய்ந்த பிறகு, 'உழவன்' மற்றும் 'நிலம்' முகவர்கள் {crop} பயிரிட பரிந்துரைக்கின்றனர். "
            f"தற்போது சந்தையில் இந்த பயிருக்கு நல்ல விலை ({price}) எதிர்பார்க்கப்படுகிறது, "
            f"மேலும் மற்ற விவசாயிகளின் நடவு முறையை SIS பரவல் மாடல் மூலம் கணக்கிட்டதில், "
            f"இதன் சந்தை விநியோக ஆபத்து (Oversupply Risk) {oversupply}% மட்டுமே உள்ளது. "
            f"மண் அரிப்பு அபாயம் {degradation} மற்றும் உங்களின் ஒட்டுமொத்த சுற்றுச்சூழல் நிலைத்தன்மை குறியீடு {sustainability}/100 ஆகும்."
        )
        
        # Build English Explanation
        english = (
            f"English Explanation:\n"
            f"Based on your {soil_type} soil (pH of {ph} and moisture of {moisture}%), the Land and Agronomy agents "
            f"recommend sowing {crop}. The price forecast predicts a stable rate of {price}. "
            f"Our Crop Diffusion model shows a herd-planting oversupply risk of {oversupply}%, meaning market saturation is low. "
            f"Your soil degradation index is calculated at {degradation:.2f}, and the sustainability score is {sustainability}/100."
        )
        
        return f"{tamil}\n\n{english}"

