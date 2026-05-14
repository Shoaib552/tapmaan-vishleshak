"""
rule_engine.py — DETERMINISTIC AUTHORITY LAYER
================================================
This is the SOLE decision-making authority.
The LLM has zero input into decisions produced here.

Design principles:
- Every code path returns an explicit, self-contained RuleOutput dict
- AQI=None is treated as a first-class data state, not an edge case
- No strings are assembled that could mislead downstream LLM formatting
"""

from dataclasses import dataclass
from typing import Optional


# ── Canonical decision labels (used verbatim in API response) ──────────────
class Decision:
    GO_OUTSIDE       = "GO OUTSIDE"
    LIMITED_EXPOSURE = "LIMITED EXPOSURE"
    AVOID            = "AVOID"


# ── Structured output (replaces raw dict — prevents key typos) ────────────
@dataclass(frozen=True)
class RuleOutput:
    decision:       str   # One of Decision.* constants
    reason:         str   # Human-readable rule that fired
    temp_status:    str   # "28°C" | "UNKNOWN"
    aqi_status:     str   # "Level 3" | "UNKNOWN"
    aqi_available:  bool  # Explicit flag consumed by orchestrator guardrail
    temp_available: bool  # Explicit flag consumed by orchestrator guardrail

    def to_dict(self) -> dict:
        return {
            "decision":       self.decision,
            "reason":         self.reason,
            "temp_status":    self.temp_status,
            "aqi_status":     self.aqi_status,
            "aqi_available":  self.aqi_available,
            "temp_available": self.temp_available,
        }


class WeatherRuleEngine:
    """
    Pure deterministic rule engine.

    Priority order (highest → lowest):
        1. Extreme heat (temp >= 40)  → AVOID
        2. High heat (37–39.9°C)      → LIMITED EXPOSURE
        3. Poor AQI (aqi >= 4)        → LIMITED EXPOSURE
        4. Default                    → GO OUTSIDE

    AQI=None means data is UNAVAILABLE — it does NOT mean AQI is good.
    The engine never infers a missing value; it marks it explicitly.
    """

    # ── AQI thresholds (OpenWeatherMap scale 1–5) ──────────────────────────
    AQI_POOR_THRESHOLD = 4   # Level 4 = Poor, Level 5 = Very Poor

    # ── Temperature thresholds (°C) ───────────────────────────────────────
    TEMP_EXTREME_THRESHOLD = 40.0
    TEMP_HIGH_THRESHOLD    = 37.0

    def decide(self, temp: Optional[float], aqi: Optional[int]) -> RuleOutput:
        """
        Returns a RuleOutput describing the deterministic decision.

        Parameters
        ----------
        temp : float | None
            Ambient temperature in °C. None = sensor/API failure.
        aqi  : int | None
            OpenWeatherMap AQI index (1–5). None = data unavailable.
        """
        temp_available = temp is not None
        aqi_available  = aqi  is not None

        temp_status = f"{temp}°C"    if temp_available else "UNKNOWN"
        aqi_status  = f"Level {aqi}" if aqi_available  else "UNKNOWN"

        # ── Rule evaluation (explicit priority chain) ──────────────────────

        # Rule 1: Extreme heat — overrides everything
        if temp_available and temp >= self.TEMP_EXTREME_THRESHOLD:
            return RuleOutput(
                decision       = Decision.AVOID,
                reason         = f"Extreme heat: temperature is {temp}°C, which exceeds the {self.TEMP_EXTREME_THRESHOLD}°C danger threshold.",
                temp_status    = temp_status,
                aqi_status     = aqi_status,
                aqi_available  = aqi_available,
                temp_available = temp_available,
            )

        # Rule 2: High heat
        if temp_available and temp >= self.TEMP_HIGH_THRESHOLD:
            aqi_note = (
                "" if aqi_available
                else " AQI data is unavailable and has NOT been factored in."
            )
            return RuleOutput(
                decision       = Decision.LIMITED_EXPOSURE,
                reason         = f"High heat: temperature is {temp}°C (between {self.TEMP_HIGH_THRESHOLD}°C and {self.TEMP_EXTREME_THRESHOLD}°C).{aqi_note}",
                temp_status    = temp_status,
                aqi_status     = aqi_status,
                aqi_available  = aqi_available,
                temp_available = temp_available,
            )

        # Rule 3: Poor air quality (only fires when AQI data actually exists)
        if aqi_available and aqi >= self.AQI_POOR_THRESHOLD:
            return RuleOutput(
                decision       = Decision.LIMITED_EXPOSURE,
                reason         = f"Poor air quality: AQI is Level {aqi}, which meets or exceeds the threshold of Level {self.AQI_POOR_THRESHOLD}.",
                temp_status    = temp_status,
                aqi_status     = aqi_status,
                aqi_available  = aqi_available,
                temp_available = temp_available,
            )

        # Rule 4: Default — safe conditions
        #
        # NOTE: If AQI is None here, we still say GO OUTSIDE based on
        # temperature alone, but the reason explicitly states AQI was
        # not factored in. The orchestrator will surface this caveat.
        aqi_caveat = (
            "" if aqi_available
            else " Note: AQI data was unavailable and could not be evaluated."
        )
        return RuleOutput(
            decision       = Decision.GO_OUTSIDE,
            reason         = f"Temperature ({temp_status}) is within safe range and no air quality issues detected.{aqi_caveat}",
            temp_status    = temp_status,
            aqi_status     = aqi_status,
            aqi_available  = aqi_available,
            temp_available = temp_available,
        )