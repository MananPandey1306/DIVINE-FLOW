export type GateType = 'entry' | 'exit' | 'both';

export type SensorType = 'camera_ai' | 'laser_beam' | 'smart_turnstile' | 'manual_tally' | 'vision_webcam';

export type SensorStatus = 'online' | 'degraded' | 'offline' | 'calibrating';

export type RiskLevel = 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'STAMPEDE_HAZARD';

export type WeatherCondition = 'clear' | 'rain' | 'heatwave' | 'storm';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type EventPhase = 'doors_open' | 'active_event' | 'intermission' | 'mass_egress';

export type AlertSeverity = 'ADVISORY' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export interface GateLocation {
  x: number; // 0-100 percentage for spatial venue map
  y: number; // 0-100 percentage for spatial venue map
  zone: string;
  gps?: {
    lat: number;
    lng: number;
  };
}

export interface GateDemographics {
  elderlyRatio: number; // 0 - 1 (e.g. 0.25 = 25%)
  childrenRatio: number; // 0 - 1
  pwdRatio: number; // 0 - 1 (Persons with Disabilities)
}

export interface GateHistoryPoint {
  timestamp: number;
  count: number;
  density: number;
}

export interface Gate {
  id: string;
  name: string;
  code: string; // e.g. "G-01"
  zone: string; // e.g. "North Plaza"
  location: GateLocation;
  maxSafeCapacity: number; // Maximum safe head count in the gate area
  currentCount: number; // Current live headcount
  gateType: GateType;
  sensorType: SensorType;
  sensorStatus: SensorStatus;
  lastHeartbeat: number; // timestamp
  isChokepoint: boolean;
  chokepointDescription?: string;
  demographics: GateDemographics;
  history: GateHistoryPoint[];
  inflowRate: number; // people per minute
  outflowRate: number; // people per minute
}

export interface RiskFactor {
  name: string;
  category: 'density' | 'demographics' | 'environment' | 'chokepoint' | 'trend';
  score: number; // 0 - 100 contribution
  weight: number;
  description: string;
  isMultiplier?: boolean;
}

export interface RiskAssessment {
  gateId: string;
  compositeScore: number; // 0 - 100
  riskLevel: RiskLevel;
  densityPercentage: number; // 0 - 100+
  trend: 'surging' | 'increasing' | 'stable' | 'decreasing';
  velocityPerMin: number; // Count change per minute
  accelerationPerMin2: number; // Rate of change of velocity
  factors: RiskFactor[];
  suggestedAction?: string;
  assessedAt: number;
}

export interface Alert {
  id: string;
  timestamp: number;
  gateId: string;
  gateName: string;
  severity: AlertSeverity;
  riskScore: number;
  densityPercentage: number;
  currentCount: number;
  maxCapacity: number;
  title: string;
  reasons: string[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  escalationTier: number; // 1: Supervisor, 2: Control Room, 3: Emergency Services
  escalationTimerRemaining: number; // seconds remaining before next tier escalation
  status: 'active' | 'investigating' | 'resolved' | 'escalated';
}

export interface SystemError {
  id: string;
  timestamp: number;
  gateId?: string;
  gateName?: string;
  component: 'CCTV Camera' | 'Laser Counter' | 'Network Gateway' | 'AI Vision Engine' | 'Turnstile IoT';
  severity: 'info' | 'warning' | 'error' | 'fatal';
  code: string;
  message: string;
  details?: string;
  resolved: boolean;
}

export interface RedirectionSuggestion {
  id: string;
  timestamp: number;
  sourceGateId: string;
  sourceGateName: string;
  sourceDensity: number;
  targetGateId: string;
  targetGateName: string;
  targetDensity: number;
  densityDelta: number; // e.g. 45% lower
  distanceMeters: number;
  estimatedWalkingMinutes: number;
  recommendedRoute: string;
  stabilityHoldSecRemaining: number;
  status: 'suggested' | 'approved' | 'active' | 'completed' | 'dismissed';
  autoApproved: boolean;
}

export interface BroadcastMessage {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  targetGateId: string | 'all';
  targetGateName: string;
  channels: ('signage' | 'pa_audio' | 'ground_app' | 'sms')[];
  priority: 'routine' | 'urgent' | 'emergency';
  spokenText?: string;
  createdBy: string;
  active: boolean;
}

export interface SOSDispatch {
  id: string;
  timestamp: number;
  gateId: string;
  gateName: string;
  location: GateLocation;
  emergencyType: 'stampede_risk' | 'medical_critical' | 'barricade_breach' | 'fire_smoke' | 'security_threat' | 'lost_child';
  severity: 'high' | 'critical';
  caller: string;
  notes: string;
  currentHeadcount: number;
  densityPercentage: number;
  unitsDispatched: string[];
  status: 'dispatched' | 'en_route' | 'on_scene' | 'resolved';
}

export interface IncidentRecord {
  id: string;
  timestamp: number;
  type: 'ALERT' | 'SOS' | 'REDIRECTION' | 'BROADCAST' | 'OVERRIDE' | 'SENSOR_FAIL' | 'CONFIG_CHANGE';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  gateId?: string;
  gateName?: string;
  details: string;
  performedBy: string;
  resolvedAt?: number;
}

export interface VenueEnvironment {
  weather: WeatherCondition;
  temperatureC: number;
  timeOfDay: TimeOfDay;
  eventPhase: EventPhase;
  totalFootfall: number;
  expectedTotalFootfall: number;
  eventStartTime: string;
  eventEndTime: string;
}

export interface VenueConfig {
  id: string;
  name: string;
  venueType: 'Religious Gathering' | 'Sports Stadium' | 'Exhibition & Convention' | 'Music Concert' | 'Transit Hub';
  description: string;
  gates: Gate[];
  environment: VenueEnvironment;
  autoRedirectionEnabled: boolean;
  hysteresisSeconds: number; // minimum time between re-routing switches
  escalationSlaSeconds: number; // time before unacknowledged alerts escalate
  audioAlertsEnabled: boolean;
  expectedFootfall?: number;
}
