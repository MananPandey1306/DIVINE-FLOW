import { Gate, RiskAssessment, RedirectionSuggestion } from '../types';

interface ActiveHysteresisTracker {
  [sourceGateId: string]: {
    lastTargetGateId: string;
    lastSwitchTimestamp: number;
    stabilityHoldSeconds: number;
  };
}

const hysteresisState: ActiveHysteresisTracker = {};

/**
 * Calculates Euclidean distance between two gates on a 0-100 normalized spatial canvas.
 * Approximates 1% map distance = 8 meters in real venue scale.
 */
function calculateDistanceMeters(gateA: Gate, gateB: Gate): number {
  const dx = (gateA.location.x - gateB.location.x);
  const dy = (gateA.location.y - gateB.location.y);
  const distUnits = Math.sqrt(dx * dx + dy * dy);
  return Math.round(distUnits * 8); // e.g. 30 units = 240 meters
}

export function evaluateRedirectionPlan(
  gates: Gate[],
  riskAssessments: Map<string, RiskAssessment>,
  configuredHysteresisSec = 25,
  existingSuggestions: RedirectionSuggestion[] = [],
  measuredGateIds: Set<string> = new Set(gates.map((gate) => gate.id))
): RedirectionSuggestion[] {
  const now = Date.now();
  const suggestions: RedirectionSuggestion[] = [];

  // Filter gates needing relief (HIGH, CRITICAL, or STAMPEDE_HAZARD risk, or density >= 75%)
  const congestedGates = gates.filter((g) => {
    const risk = riskAssessments.get(g.id);
    const density = (g.currentCount / Math.max(1, g.maxSafeCapacity)) * 100;
    return (
      g.sensorStatus === 'online' &&
      measuredGateIds.has(g.id) &&
      ((risk && (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'STAMPEDE_HAZARD' || risk.riskLevel === 'HIGH')) ||
        density >= 75)
    );
  });

  for (const sourceGate of congestedGates) {
    const sourceDensity = Math.round((sourceGate.currentCount / sourceGate.maxSafeCapacity) * 100);

    // Find compatible candidate gates:
    // 1. Same compatible type (if source is 'entry', candidate must be 'entry' or 'both')
    // 2. Sensor is online
    // 3. Density is substantially lower (at least 18% lower) and under 68% capacity
    const candidateGates = gates.filter((candidate) => {
      if (candidate.id === sourceGate.id) return false;
      if (candidate.sensorStatus !== 'online') return false;
      if (!measuredGateIds.has(candidate.id)) return false;

      // Type compatibility
      if (sourceGate.gateType === 'entry' && candidate.gateType === 'exit') return false;
      if (sourceGate.gateType === 'exit' && candidate.gateType === 'entry') return false;

      const candidateDensity = Math.round((candidate.currentCount / candidate.maxSafeCapacity) * 100);
      const candidateRisk = riskAssessments.get(candidate.id);
      const availableCapacity = candidate.maxSafeCapacity - candidate.currentCount;

      // Allow a nearby alternative gate when it is comparatively free, even if it cannot absorb the full overflow instantly.
      // This keeps Gate 4 / other underused diversion paths visible in the route plan instead of excluding them too aggressively.
      const minimumAbsorptionCapacity = Math.max(1000, sourceGate.currentCount * 0.7);
      const isCandidateSafe = availableCapacity >= minimumAbsorptionCapacity && candidateDensity < 72 && (!candidateRisk || candidateRisk.riskLevel === 'NORMAL' || candidateRisk.riskLevel === 'MODERATE');
      const hasSignificantDelta = (sourceDensity - candidateDensity) >= 12;

      return isCandidateSafe && hasSignificantDelta;
    });

    if (candidateGates.length === 0) continue;

    // Choose the nearest gate that can absorb the current source crowd.
    const scoredCandidates = candidateGates.map((target) => {
      const targetDensity = Math.round((target.currentCount / target.maxSafeCapacity) * 100);
      const distanceMeters = calculateDistanceMeters(sourceGate, target);
      const walkingMinutes = Math.max(1, Math.round(distanceMeters / 75)); // 75m per min average crowd walk speed
      
      // Higher score is better: heavily penalize high density, moderately penalize far distance
      const capacityAvailability = 100 - targetDensity;
      const distancePenalty = distanceMeters * 2;
      const chokepointPenalty = target.isChokepoint ? 30 : 0;
      const suitabilityScore = capacityAvailability * 0.25 - distancePenalty - chokepointPenalty;

      return {
        target,
        targetDensity,
        distanceMeters,
        walkingMinutes,
        suitabilityScore,
      };
    });

    scoredCandidates.sort((a, b) => a.distanceMeters - b.distanceMeters || b.suitabilityScore - a.suitabilityScore);
    const bestCandidate = scoredCandidates[0];

    // Hysteresis & Anti-Ping-Pong verification
    const tracker = hysteresisState[sourceGate.id];
    let selectedTarget = bestCandidate.target;
    let selectedTargetDensity = bestCandidate.targetDensity;
    let selectedDistance = bestCandidate.distanceMeters;
    let selectedWalkMinutes = bestCandidate.walkingMinutes;

    if (tracker) {
      const elapsedSec = (now - tracker.lastSwitchTimestamp) / 1000;
      // If we recently recommended a target and the timer hasn't expired, stay with previous target if it is still acceptable
      if (elapsedSec < tracker.stabilityHoldSeconds && tracker.lastTargetGateId !== bestCandidate.target.id) {
        const previousTarget = gates.find((g) => g.id === tracker.lastTargetGateId);
        if (previousTarget) {
          const prevDensity = Math.round((previousTarget.currentCount / previousTarget.maxSafeCapacity) * 100);
          if (prevDensity < 70 && (sourceDensity - prevDensity) >= 12) {
            // Keep the previous recommendation for stability
            selectedTarget = previousTarget;
            selectedTargetDensity = prevDensity;
            selectedDistance = calculateDistanceMeters(sourceGate, previousTarget);
            selectedWalkMinutes = Math.max(1, Math.round(selectedDistance / 75));
          }
        }
      } else if (tracker.lastTargetGateId !== bestCandidate.target.id) {
        // Switch to new target and reset hysteresis timer
        hysteresisState[sourceGate.id] = {
          lastTargetGateId: bestCandidate.target.id,
          lastSwitchTimestamp: now,
          stabilityHoldSeconds: configuredHysteresisSec,
        };
      }
    } else {
      hysteresisState[sourceGate.id] = {
        lastTargetGateId: bestCandidate.target.id,
        lastSwitchTimestamp: now,
        stabilityHoldSeconds: configuredHysteresisSec,
      };
    }

    const densityDelta = sourceDensity - selectedTargetDensity;
    const remainingHold = tracker
      ? Math.max(0, Math.round(tracker.stabilityHoldSeconds - (now - tracker.lastSwitchTimestamp) / 1000))
      : configuredHysteresisSec;

    // Check if there is an existing suggestion we are updating
    const existing = existingSuggestions.find((s) => s.sourceGateId === sourceGate.id && s.status !== 'dismissed');

    suggestions.push({
      id: existing ? existing.id : `redir-${sourceGate.id}-${selectedTarget.id}-${Date.now()}`,
      timestamp: existing ? existing.timestamp : now,
      sourceGateId: sourceGate.id,
      sourceGateName: sourceGate.name,
      sourceDensity,
      targetGateId: selectedTarget.id,
      targetGateName: selectedTarget.name,
      targetDensity: selectedTargetDensity,
      densityDelta,
      distanceMeters: selectedDistance,
      estimatedWalkingMinutes: selectedWalkMinutes,
      recommendedRoute: `Follow blue overhead signage toward ${selectedTarget.name} (${selectedDistance}m, ~${selectedWalkMinutes} min).`,
      stabilityHoldSecRemaining: remainingHold,
      status: existing ? existing.status : 'suggested',
      autoApproved: existing ? existing.autoApproved : false,
    });

    // Show secondary diversion options, so operators can see other viable routes for the same overcrowded gate.
    const alternateCandidates = scoredCandidates.slice(1, 4);
    alternateCandidates.forEach((candidate, index) => {
      const alternateExisting = existingSuggestions.find(
        (s) => s.sourceGateId === sourceGate.id && s.targetGateId === candidate.target.id && s.status !== 'dismissed'
      );
      const altDensityDelta = sourceDensity - candidate.targetDensity;
      suggestions.push({
        id: alternateExisting ? alternateExisting.id : `redir-alt-${sourceGate.id}-${candidate.target.id}-${Date.now()}-${index}`,
        timestamp: alternateExisting ? alternateExisting.timestamp : now,
        sourceGateId: sourceGate.id,
        sourceGateName: sourceGate.name,
        sourceDensity,
        targetGateId: candidate.target.id,
        targetGateName: candidate.target.name,
        targetDensity: candidate.targetDensity,
        densityDelta: altDensityDelta,
        distanceMeters: candidate.distanceMeters,
        estimatedWalkingMinutes: candidate.walkingMinutes,
        recommendedRoute: `Alternate route: ${candidate.target.name} (${candidate.distanceMeters}m, ~${candidate.walkingMinutes} min).`,
        stabilityHoldSecRemaining: remainingHold,
        status: alternateExisting ? alternateExisting.status : 'suggested',
        autoApproved: alternateExisting ? alternateExisting.autoApproved : false,
      });
    });
  }

  return suggestions;
}
