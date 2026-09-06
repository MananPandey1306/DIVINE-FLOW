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

  // Filter gates needing relief (MODERATE, HIGH, CRITICAL, or STAMPEDE_HAZARD risk, or density >= 60%)
  const congestedGates = gates.filter((g) => {
    const risk = riskAssessments.get(g.id);
    const density = (g.currentCount / Math.max(1, g.maxSafeCapacity)) * 100;
    return (
      (g.sensorStatus === 'online' || measuredGateIds.has(g.id)) &&
      ((risk && (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'STAMPEDE_HAZARD' || risk.riskLevel === 'HIGH' || risk.riskLevel === 'MODERATE')) ||
        density >= 60)
    );
  });

  for (const sourceGate of congestedGates) {
    const sourceDensity = Math.round((sourceGate.currentCount / sourceGate.maxSafeCapacity) * 100);

    // Find compatible candidate gates with available capacity:
    // 1. Same compatible type (if source is 'entry', candidate must be 'entry' or 'both')
    // 2. Sensor is online or available
    // 3. Density is lower (at least 8% lower) and under 85% capacity
    const candidateGates = gates.filter((candidate) => {
      if (candidate.id === sourceGate.id) return false;

      // Type compatibility
      if (sourceGate.gateType === 'entry' && candidate.gateType === 'exit') return false;
      if (sourceGate.gateType === 'exit' && candidate.gateType === 'entry') return false;

      const candidateDensity = Math.round((candidate.currentCount / candidate.maxSafeCapacity) * 100);
      const candidateRisk = riskAssessments.get(candidate.id);
      const availableCapacity = candidate.maxSafeCapacity - candidate.currentCount;

      const isCandidateSafe = availableCapacity > 0 && candidateDensity < 85 && (!candidateRisk || (candidateRisk.riskLevel !== 'CRITICAL' && candidateRisk.riskLevel !== 'STAMPEDE_HAZARD'));
      const hasSignificantDelta = (sourceDensity - candidateDensity) >= 6;

      return isCandidateSafe && hasSignificantDelta;
    });

    if (candidateGates.length === 0) continue;

    // Score and rank candidates primarily by capacity availability (highest availability first) and shortest walk distance
    const scoredCandidates = candidateGates.map((target) => {
      const targetDensity = Math.round((target.currentCount / target.maxSafeCapacity) * 100);
      const availablePercentage = Math.max(0, 100 - targetDensity);
      const availableCapacity = Math.max(0, target.maxSafeCapacity - target.currentCount);
      const distanceMeters = calculateDistanceMeters(sourceGate, target);
      const walkingMinutes = Math.max(1, Math.round(distanceMeters / 75)); // 75m per min average crowd walk speed
      
      // Availability is primary factor, distance penalty is secondary
      const chokepointPenalty = target.isChokepoint ? 25 : 0;
      const suitabilityScore = (availablePercentage * 2) + (availableCapacity / 500) - (distanceMeters * 0.15) - chokepointPenalty;

      return {
        target,
        targetDensity,
        availablePercentage,
        availableCapacity,
        distanceMeters,
        walkingMinutes,
        suitabilityScore,
      };
    });

    // Sort by availability & suitability score descending
    scoredCandidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore || b.availablePercentage - a.availablePercentage || a.distanceMeters - b.distanceMeters);
    const bestCandidate = scoredCandidates[0];

    // Hysteresis & Anti-Ping-Pong verification
    const tracker = hysteresisState[sourceGate.id];
    let selectedTarget = bestCandidate.target;
    let selectedTargetDensity = bestCandidate.targetDensity;
    let selectedDistance = bestCandidate.distanceMeters;
    let selectedWalkMinutes = bestCandidate.walkingMinutes;
    let selectedAvailablePercentage = bestCandidate.availablePercentage;
    let selectedAvailableCapacity = bestCandidate.availableCapacity;

    if (tracker) {
      const elapsedSec = (now - tracker.lastSwitchTimestamp) / 1000;
      if (elapsedSec < tracker.stabilityHoldSeconds && tracker.lastTargetGateId !== bestCandidate.target.id) {
        const previousTarget = gates.find((g) => g.id === tracker.lastTargetGateId);
        if (previousTarget) {
          const prevDensity = Math.round((previousTarget.currentCount / previousTarget.maxSafeCapacity) * 100);
          if (prevDensity < 78 && (sourceDensity - prevDensity) >= 8) {
            selectedTarget = previousTarget;
            selectedTargetDensity = prevDensity;
            selectedAvailablePercentage = 100 - prevDensity;
            selectedAvailableCapacity = Math.max(0, previousTarget.maxSafeCapacity - previousTarget.currentCount);
            selectedDistance = calculateDistanceMeters(sourceGate, previousTarget);
            selectedWalkMinutes = Math.max(1, Math.round(selectedDistance / 75));
          }
        }
      } else if (tracker.lastTargetGateId !== bestCandidate.target.id) {
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
      recommendedRoute: `Flow: Divert from ${sourceGate.code} to ${selectedTarget.code} (${selectedAvailablePercentage}% Available, +${selectedAvailableCapacity.toLocaleString()} cap, ${selectedDistance}m walk).`,
      stabilityHoldSecRemaining: remainingHold,
      status: existing ? existing.status : 'suggested',
      autoApproved: existing ? existing.autoApproved : false,
    });

    // Secondary diversion options (e.g. Gate 1 to Gate 3, Gate 1 to Gate 4) in order of availability
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
        recommendedRoute: `Flow Option: ${sourceGate.code} ➔ ${candidate.target.code} (${candidate.availablePercentage}% Available, +${candidate.availableCapacity.toLocaleString()} cap, ${candidate.distanceMeters}m walk).`,
        stabilityHoldSecRemaining: remainingHold,
        status: alternateExisting ? alternateExisting.status : 'suggested',
        autoApproved: alternateExisting ? alternateExisting.autoApproved : false,
      });
    });
  }

  return suggestions;
}
