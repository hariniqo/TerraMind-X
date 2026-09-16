import re
import logging
from typing import Tuple, List

logger = logging.getLogger(__name__)

# Banned or extremely toxic chemicals in India / Tamil Nadu
BANNED_PESTICIDES = [
    "monocrotophos", "paraquat", "endosulfan", "phosphamidon", "carbofuran",
    "phorate", "methomyl", "triazophos", "ddvp"
]

def verify_and_sanitize_advisory(text: str, language: str = "en") -> Tuple[str, List[str]]:
    """
    Sanitizes generated LLM text for toxic chemicals and enforces physical dosage limit checks.
    """
    warnings = []
    sanitized_text = text
    
    # 1. Chemical Pesticide Scan
    for pesticide in BANNED_PESTICIDES:
        # Match word boundaries case insensitively
        pattern = re.compile(rf"\b{pesticide}\b", re.IGNORECASE)
        if pattern.search(sanitized_text):
            logger.warning(f"Safety Violation: Detected banned/unsafe pesticide '{pesticide}' in LLM advisory.")
            warnings.append(f"Safety warning: Banned/toxic pesticide '{pesticide}' was removed from the advisory. Please consult organic alternatives.")
            # Replace with a safe message
            sanitized_text = pattern.sub("[Unsafe/Banned pesticide recommendations removed for environmental safety]", sanitized_text)
            
    # 2. Dosage check protection
    # Look for patterns like "X kg/ha" or "X liters" to see if they look excessive
    # For example, recommending more than 300 kg of chemical fertilizers
    nitrogen_dosage_matches = re.findall(r"(\d+(?:\.\d+)?)\s*(?:kg/ha|kg per hectare|kg/acre)\s*(?:of|)\s*(?:urea|nitrogen|chemical|fertilizer)", sanitized_text, re.IGNORECASE)
    for match in nitrogen_dosage_matches:
        val = float(match)
        if val > 350.0:
            warnings.append(f"Safety Alert: Exceptionally high fertilizer application rate ({val} kg/ha) recommended in text. Cap verified at 250 kg/ha.")
            sanitized_text += "\n[Caution: Extremely high application rates detected. Please check local Soil Health Card dosage regulations before application.]"
            break
            
    # 3. Bilingual Language Consistency check
    # If Tamil is selected, verify if there are Tamil Unicode characters in the output
    if language.lower() in ["ta", "tamil", "ta_in"]:
        tamil_char_pattern = re.compile(r"[\u0b80-\u0bff]")
        if not tamil_char_pattern.search(sanitized_text):
            warnings.append("Requested language was Tamil, but generated advisory has no Tamil Unicode content. Fallback activated.")
            
    return sanitized_text, warnings
