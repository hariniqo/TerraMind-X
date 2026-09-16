import re
from typing import Optional

def sanitize_ai_response(text: Optional[str]) -> str:
    """
    Sanitizes AI-generated agricultural responses:
    1. Removes markdown hashtag heading markers (# Heading, ## Heading, ### Heading) -> converts to clean natural headings.
    2. Removes social-media style hashtags (#Recommendation, #Agri, #Market, etc.).
    3. Preserves legitimate technical '#' characters (e.g., #1, #2, #F401, #0B2118 hex colors, ticket #492).
    4. Removes robotic filler phrases like 'As an AI...', 'As a large language model...'.
    5. Normalizes excessive whitespace and repeated newlines while preserving Tamil and regional scripts.
    6. Preserves valid bolding (**text**), lists, and agricultural numbers with units (e.g. 5.5 pH, 2.5 t/ha, ₹2,800/q).
    """
    if not text:
        return ""

    content = str(text)

    # 1. Strip robotic AI disclaimers
    robotic_patterns = [
        r"(?i)^as an ai (language )?model,?\s*",
        r"(?i)^as an ai agricultural (advisor|assistant),?\s*",
        r"(?i)^i am an ai (language )?model,?\s*",
        r"(?i)^as a virtual assistant,?\s*"
    ]
    for pat in robotic_patterns:
        content = re.sub(pat, "", content)

    # 2. Transform Markdown hashtag headings at line starts to clean bold natural headings
    # e.g., '### Market Analysis' -> '**Market Analysis**' or 'Market Analysis'
    def replace_heading(match: re.Match) -> str:
        heading_text = match.group(1).strip()
        if heading_text.startswith("**") and heading_text.endswith("**"):
            return heading_text
        return f"**{heading_text}**"

    content = re.sub(r"(?m)^[ \t]*#{1,6}[ \t]+([^\n#]+)$", replace_heading, content)

    # 3. Handle standalone inline hashtag headings like '## Soil Health' in middle of text
    content = re.sub(r"(?m)^[ \t]*#{1,6}[ \t]*", "", content)

    # 4. Remove trailing/social media hashtags (e.g. #OrganicFarming #SoilHealth #Tomato #விவசாயம்)
    # But PRESERVE technical identifiers like #1, #2, #0B2118, #A12, #Plot-3
    def filter_hashtags(match: re.Match) -> str:
        word = match.group(1)
        # If it's a number (e.g. #1, #23), keep it
        if re.match(r"^\d+$", word):
            return f"#{word}"
        # If it's a 3 or 6 char hex color code (e.g. #0B2118, #FFF), keep it
        if re.match(r"^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", word):
            return f"#{word}"
        # If it's a recognized ASCII identifier format with digits like #Zone1, #Plot2, #TMX-01, keep it
        if re.match(r"^[A-Za-z0-9_\-]+$", word) and re.search(r"\d", word) and len(word) <= 8:
            return f"#{word}"
        # Otherwise it's a word/social tag like #Recommendation, #விவசாயம், #शेतकरी -> remove hash symbol
        return word

    # Match hashtags preceded by whitespace, punctuation or start of line
    content = re.sub(r"(?<=\s)#([^\s#.,!?:;()\[\]{}'\"/\\<>]+)", filter_hashtags, content)
    content = re.sub(r"^#([^\s#.,!?:;()\[\]{}'\"/\\<>]+)", filter_hashtags, content)

    # 5. Clean up repeated hashtags (## or ### anywhere in text)
    content = re.sub(r"#{2,}", "", content)

    # 6. Normalize excessive blank lines (more than 2 consecutive newlines)
    content = re.sub(r"\n{3,}", "\n\n", content)

    # 7. Normalize duplicate spaces on individual lines without ruining indentation
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in content.split("\n")]
    content = "\n".join(lines).strip()

    return content
