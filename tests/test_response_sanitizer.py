import pytest
from app.core.response_sanitizer import sanitize_ai_response

def test_hashtag_heading_removal():
    raw = "# Recommendation\nSow Chilli instead of Tomato.\n## Market Analysis\nWholesale prices are strong."
    clean = sanitize_ai_response(raw)
    assert "#" not in clean
    assert "**Recommendation**" in clean
    assert "**Market Analysis**" in clean
    assert "Sow Chilli instead of Tomato." in clean

def test_social_media_hashtag_removal():
    raw = "Organic pest control using Neem oil #Organic #Farming #EcoFriendly #Safe"
    clean = sanitize_ai_response(raw)
    assert "#" not in clean
    assert "Organic Farming EcoFriendly Safe" in clean

def test_preserve_legitimate_technical_identifiers():
    raw = "Field zone #1 has soil pH 6.8. Color hex #0B2118 indicates healthy humus. Plot #Plot-3 recorded #2 alert."
    clean = sanitize_ai_response(raw)
    assert "#1" in clean
    assert "#0B2118" in clean
    assert "#Plot-3" in clean
    assert "#2" in clean

def test_tamil_and_numbers_preservation():
    raw = "### பரிந்துரை\nஉங்கள் நிலத்திற்கு தக்காளி பயிரிடுவது 85% ஏற்றது. #விவசாயம்"
    clean = sanitize_ai_response(raw)
    assert "#" not in clean
    assert "**பரிந்துரை**" in clean
    assert "85%" in clean

def test_robotic_phrase_cleaning():
    raw = "As an AI language model, I recommend applying vermicompost."
    clean = sanitize_ai_response(raw)
    assert "As an AI" not in clean
    assert "I recommend applying vermicompost." in clean
