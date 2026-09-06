import { Gate, VenueEnvironment, RiskAssessment, RiskLevel, RiskFactor } from '../types';

export function calculateRiskAssessment(gate: Gate, env: VenueEnvironment): RiskAssessment {
  const densityPercentage = Math.round((gate.currentCount / Math.max(1, gate.maxSafeCapacity)) * 100 * 10) / 10;
  
  const factors: RiskFactor[] = [];
  let baseDensityScore = 0;

  // 1. Base Density Factor
  if (densityPercentage < 50) {
    baseDensityScore = (densityPercentage / 50) * 30;
    factors.push({
      name: 'Safe Headcount Density',
      category: 'density',
      score: Math.round(baseDensityScore),
      weight: 0.4,
      description: `Gate is operating at safe ${densityPercentage}% capacity (${gate.currentCount}/${gate.maxSafeCapacity}).`,
    });
  } else if (densityPercentage < 70) {
    baseDensityScore = 30 + ((densityPercentage - 50) / 20) * 25;
    factors.push({
      name: 'Moderate Crowd Volume',
      category: 'density',
      score: Math.round(baseDensityScore),
      weight: 0.4,
      description: `Gate at ${densityPercentage}% capacity. Steady pedestrian throughput.`,
    });
  } else if (densityPercentage < 85) {
    baseDensityScore = 55 + ((densityPercentage - 70) / 15) * 23;
    factors.push({
      name: 'High Density Influx',
      category: 'density',
      score: Math.round(baseDensityScore),
      weight: 0.4,
      description: `Gate at elevated ${densityPercentage}% capacity. Approaching comfort threshold.`,
    });
  } else if (densityPercentage < 98) {
    baseDensityScore = 78 + ((densityPercentage - 85) / 13) * 16;
    factors.push({
      name: 'Critical Overcrowding Alert',
      category: 'density',
      score: Math.round(baseDensityScore),
      weight: 0.45,
      description: `Gate is at ${densityPercentage}% of safe threshold. High compression risk.`,
    });
  } else {
    baseDensityScore = Math.min(100, 94 + (densityPercentage - 98) * 2);
    factors.push({
      name: 'Severe Capacity Breach (Stampede Hazard)',
      category: 'density',
      score: Math.round(baseDensityScore),
      weight: 0.5,
      description: `CRITICAL: Gate density exceeded maximum design limit (${densityPercentage}%). Immediate crush danger!`,
    });
  }

  // 2. Velocity & Acceleration Trend Calculation
  let velocityPerMin = gate.inflowRate - gate.outflowRate;
  let accelerationPerMin2 = 0;
  
  if (gate.history && gate.history.length >= 2) {
    const recent = gate.history[gate.history.length - 1];
    const prev = gate.history[gate.history.length - 2];
    const timeDeltaMin = Math.max(0.1, (recent.timestamp - prev.timestamp) / 60000);
    const countDelta = recent.count - prev.count;
    velocityPerMin = Math.round(countDelta / timeDeltaMin);

    if (gate.history.length >= 3) {
      const older = gate.history[gate.history.length - 3];
      const olderTimeDelta = Math.max(0.1, (prev.timestamp - older.timestamp) / 60000);
      const prevVelocity = (prev.count - older.count) / olderTimeDelta;
      accelerationPerMin2 = Math.round((velocityPerMin - prevVelocity) / timeDeltaMin);
    }
  }

  let trend: 'surging' | 'increasing' | 'stable' | 'decreasing' = 'stable';
  let trendImpact = 0;

  if (velocityPerMin > 120 || accelerationPerMin2 > 40) {
    trend = 'surging';
    trendImpact = 18;
    factors.push({
      name: 'Rapid Surge Velocity',
      category: 'trend',
      score: trendImpact,
      weight: 0.15,
      description: `Surge incoming: +${velocityPerMin} people/min (${accelerationPerMin2 > 0 ? 'accelerating' : 'steady'}).`,
    });
  } else if (velocityPerMin > 35) {
    trend = 'increasing';
    trendImpact = 8;
    factors.push({
      name: 'Steady Inflow Growth',
      category: 'trend',
      score: trendImpact,
      weight: 0.1,
      description: `Inflow exceeds egress by +${velocityPerMin} people/min.`,
    });
  } else if (velocityPerMin < -35) {
    trend = 'decreasing';
    trendImpact = -5;
    factors.push({
      name: 'Crowd Dissipating',
      category: 'trend',
      score: trendImpact,
      weight: 0.05,
      description: `Net outflow is -${Math.abs(velocityPerMin)} people/min. Density easing.`,
    });
  }

  // 3. Demographic Vulnerability Multiplier
  const elderly = gate.demographics.elderlyRatio || 0;
  const children = gate.demographics.childrenRatio || 0;
  const pwd = gate.demographics.pwdRatio || 0;

  const demographicScore = Math.round((elderly * 28) + (children * 22) + (pwd * 35));
  if (demographicScore > 5) {
    const vulnerableSummary: string[] = [];
    if (elderly >= 0.15) vulnerableSummary.push(`${Math.round(elderly * 100)}% elderly`);
    if (children >= 0.1) vulnerableSummary.push(`${Math.round(children * 100)}% children`);
    if (pwd >= 0.03) vulnerableSummary.push(`${Math.round(pwd * 100)}% persons with disabilities`);

    factors.push({
      name: 'High Demographic Vulnerability',
      category: 'demographics',
      score: demographicScore,
      weight: 0.18,
      description: `Higher crush/trip vulnerability due to ${vulnerableSummary.join(', ') || 'vulnerable crowd profile'}.`,
    });
  }

  // 4. Chokepoint Multiplier
  let chokepointScore = 0;
  if (gate.isChokepoint) {
    chokepointScore = densityPercentage > 65 ? 18 : 10;
    factors.push({
      name: 'Physical Chokepoint Hazard',
      category: 'chokepoint',
      score: chokepointScore,
      weight: 0.15,
      description: gate.chokepointDescription || 'Geometry restriction (stairs/narrow arch) elevates bottleneck risk.',
    });
  }

  // 5. Environmental & Event Context
  let envScore = 0;
  if (env.weather === 'rain') {
    envScore += 14;
    factors.push({
      name: 'Wet Surface Slip Hazard',
      category: 'environment',
      score: 14,
      weight: 0.1,
      description: 'Heavy precipitation creates slick ground and umbrella crowding.',
    });
  } else if (env.weather === 'storm') {
    envScore += 22;
    factors.push({
      name: 'Storm Evacuation Rush',
      category: 'environment',
      score: 22,
      weight: 0.12,
      description: 'Severe weather triggers sudden ingress panic into covered gates.',
    });
  } else if (env.weather === 'heatwave') {
    envScore += 9;
    factors.push({
      name: 'Extreme Thermal Stress',
      category: 'environment',
      score: 9,
      weight: 0.08,
      description: 'High heat creates fainting and heatstroke vulnerability in standing queues.',
    });
  }

  if (env.eventPhase === 'mass_egress') {
    envScore += 12;
    factors.push({
      name: 'Mass Egress Exit Surge',
      category: 'environment',
      score: 12,
      weight: 0.1,
      description: 'Simultaneous departure pulse across all stadium exits.',
    });
  }

  // Composite Calculation
  const totalWeightedAddition = trendImpact + demographicScore + chokepointScore + envScore;
  const compositeScore = Math.max(0, Math.min(100, Math.round(baseDensityScore * 0.65 + totalWeightedAddition * 0.7)));

  // Risk Level Classification
  let riskLevel: RiskLevel = 'NORMAL';
  let suggestedAction = 'Normal operations. Maintain standard gate monitoring.';

  if (compositeScore >= 95 || densityPercentage >= 105) {
    riskLevel = 'STAMPEDE_HAZARD';
    suggestedAction = 'EMERGENCY: Halt incoming ingress immediately. Open all emergency bypass gates and dispatch ground security.';
  } else if (compositeScore >= 80 || densityPercentage >= 88) {
    riskLevel = 'CRITICAL';
    suggestedAction = 'Trigger automated crowd redirection to adjacent gates. Deploy barrier marshals and slow ingress flow.';
  } else if (compositeScore >= 62 || densityPercentage >= 72) {
    riskLevel = 'HIGH';
    suggestedAction = 'Recommend crowd diversion on digital signage. Prepare secondary gates for incoming overflow.';
  } else if (compositeScore >= 42 || densityPercentage >= 55) {
    riskLevel = 'MODERATE';
    suggestedAction = 'Advisory: Monitor queue buildup. Keep turnstiles clear.';
  }

  return {
    gateId: gate.id,
    compositeScore,
    riskLevel,
    densityPercentage,
    trend,
    velocityPerMin,
    accelerationPerMin2,
    factors,
    suggestedAction,
    assessedAt: Date.now(),
  };
}
