from app.schemas.recommendation import FarmContext, AgentDecision


class AgronomyAgent:
    def analyze(self, context: FarmContext) -> AgentDecision:
        recommendations = {
            "irrigation_strategy": self._recommend_irrigation(context),
            "pest_management": self._recommend_pest_strategy(context),
            "fertilizer_plan": self._recommend_fertilizer(context),
        }
        score = self._score(context)
        return AgentDecision(agent_name="agronomy", score=score, recommendations=recommendations)

    def _recommend_irrigation(self, context: FarmContext) -> str:
        if context.rainfall_last_30_days < 40:
            return "முழு தண்ணீர் பாசனம் மற்றும் சொட்டு நீர் பாசனம் (Drip irrigation daily)"
        if context.rainfall_last_30_days < 100:
            return "மழை பெய்ய வாய்ப்புள்ளதால் பாசனத்தை 24 மணி நேரம் தள்ளிப்போடவும் (Delay irrigation by 24h due to forecast)"
        return "மழைநீர் சேகரிப்பு மற்றும் வடிகால் அமைப்பு (Rainwater harvesting and drainage)"

    def _recommend_pest_strategy(self, context: FarmContext) -> list[str]:
        strategies = ["வேப்ப எண்ணெய் கரைசல் தெளித்தல் (Neem oil spray)", "பயிர் சுற்று முறை (Crop rotation)"]
        if context.pest_observation:
            strategies.append(f"கண்டறியப்பட்ட பூச்சிகள் தடுப்பு: {', '.join(context.pest_observation)}")
        return strategies

    def _recommend_fertilizer(self, context: FarmContext) -> str:
        if context.ph_level < 6.0:
            return "தொழு உரம் + இலை தழை உரங்கள் (FYM + Green manure)"
        return "மண்புழு உரம் மற்றும் உயிர் உரங்கள் (Vermicompost + Biofertilizers)"

    def _score(self, context: FarmContext) -> float:
        score = 0.75
        if context.rainfall_last_30_days >= 40:
            score += 0.1
        if context.pest_observation:
            score += 0.05
        return min(score, 1.0)
