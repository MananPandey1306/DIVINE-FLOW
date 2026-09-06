import {
  Gate,
  VenueConfig,
  RiskAssessment,
  Alert,
  SystemError,
  RedirectionSuggestion,
  BroadcastMessage,
  SOSDispatch,
  IncidentRecord,
} from '../types';
import { calculateRiskAssessment } from './riskEngine';
import { evaluateRedirectionPlan } from './redirectionEngine';
import { audioService } from './audioSynthesizer';
import { VENUE_PRESETS } from '../data/presets';

export type ScenarioPreset = 'normal' | 'rain_surge' | 'aarti_rush' | 'deepotsav_rush' | 'chokepoint_rush';

export class DataIngestionService {
  private venue: VenueConfig;
  private riskAssessments: Map<string, RiskAssessment> = new Map();
  private alerts: Alert[] = [];
  private systemErrors: SystemError[] = [];
  private redirectionSuggestions: RedirectionSuggestion[] = [];
  private broadcasts: BroadcastMessage[] = [];
  private sosDispatches: SOSDispatch[] = [];
  private incidentLogs: IncidentRecord[] = [];

  private timerId: number | null = null;
  private simulationSpeed: number = 1;
  private isPaused: boolean = false;
  private activeScenario: ScenarioPreset = 'normal';
  private subscribers: Set<() => void> = new Set();
  private visionBoundGateId: string | null = null;
  private visionDataGateIds: Set<string> = new Set();

  constructor() {
    this.venue = JSON.parse(JSON.stringify(VENUE_PRESETS[0]));
    this.initHistoricalData();
    this.recomputeAllMetrics();
  }

  private initHistoricalData() {
    this.venue.gates.forEach((gate) => {
      gate.history = [];
      gate.currentCount = 0;
      gate.inflowRate = 0;
      gate.outflowRate = 0;
      gate.sensorStatus = 'offline';
      gate.lastHeartbeat = 0;
    });
  }

  public subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  public start() {
    if (this.timerId) return;
    this.timerId = window.setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 2000 / this.simulationSpeed);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setSpeed(speed: number) {
    this.simulationSpeed = Math.max(0.2, speed);
    this.stop();
    this.start();
    this.notify();
  }

  public getSpeed(): number {
    return this.simulationSpeed;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.notify();
  }

  public getPaused(): boolean {
    return this.isPaused;
  }

  public getVenue(): VenueConfig {
    return this.venue;
  }

  public setVenue(venue: VenueConfig) {
    this.venue = JSON.parse(JSON.stringify(venue));
    this.visionDataGateIds.clear();
    this.initHistoricalData();
    this.alerts = [];
    this.redirectionSuggestions = [];
    this.recomputeAllMetrics();
    this.notify();
  }

  public loadPreset(presetId: string) {
    const found = VENUE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      this.setVenue(found);
      this.logIncident('CONFIG_CHANGE', 'low', `Loaded pilgrimage preset: ${found.name}`, undefined, 'Somnath Shrine Command');
    }
  }

  public bindVisionFeedToGate(gateId: string | null) {
    this.visionBoundGateId = gateId;
    this.notify();
  }

  public getVisionBoundGateId(): string | null {
    return this.visionBoundGateId;
  }

  public updateGateConfig(gateId: string, updates: Partial<Pick<Gate, 'maxSafeCapacity' | 'gateType'>>) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    if (!gate) return;

    if (typeof updates.maxSafeCapacity === 'number') {
      gate.maxSafeCapacity = Math.max(1, Math.round(updates.maxSafeCapacity));
    }
    if (updates.gateType) {
      gate.gateType = updates.gateType;
    }

    this.recomputeGateMetrics(gate);
    this.recomputeRedirections();
    this.notify();
  }

  public updateVisionCount(gateId: string, count: number, demographics?: { elderlyRatio: number; childrenRatio: number; pwdRatio: number }) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    if (!gate) return;

    gate.currentCount = Math.max(0, Math.round(count));
    gate.lastHeartbeat = Date.now();
    gate.sensorStatus = 'online';
    this.visionDataGateIds.add(gateId);

    if (demographics) {
      gate.demographics = { ...demographics };
    }

    this.recomputeGateMetrics(gate);
    this.recomputeRedirections();
    this.notify();
  }

  private recomputeRedirections() {
    this.redirectionSuggestions = evaluateRedirectionPlan(
      this.venue.gates,
      this.riskAssessments,
      this.venue.hysteresisSeconds,
      this.redirectionSuggestions,
      this.visionDataGateIds
    );

    if (this.venue.autoRedirectionEnabled) {
      this.redirectionSuggestions.forEach((suggestion) => {
        if (suggestion.status === 'suggested') this.approveRedirection(suggestion.id, true);
      });
    }
  }

  public applyScenario(scenario: ScenarioPreset) {
    this.activeScenario = scenario;

    switch (scenario) {
      case 'rain_surge':
        this.venue.environment.weather = 'rain';
        this.venue.environment.temperatureC = 22;
        this.venue.gates.forEach((g) => {
          if (g.name.includes('Digvijay') || g.name.includes('Samudra')) {
            g.currentCount = Math.round(g.maxSafeCapacity * (0.88 + Math.random() * 0.1));
            g.inflowRate = 420;
          }
        });
        this.logIncident('ALERT', 'high', 'Monsoon Coastal Surge on Digvijay Dwar & Sea Walkway Canopies', undefined, 'Somnath Met Dept');
        audioService.playUrgentAlert();
        break;

      case 'aarti_rush':
        this.venue.environment.eventPhase = 'active_event';
        this.venue.gates.forEach((g) => {
          if (g.name.includes('Digvijay') || g.name.includes('Sardar')) {
            g.currentCount = Math.round(g.maxSafeCapacity * 0.92);
            g.inflowRate = 480;
          }
        });
        this.logIncident('ALERT', 'high', 'Sandhya Aarti Darshan Ingress Surge: High Pilgrim Flow at Someshwar Garbhagriha Approaches', undefined, 'Somnath Command Center');
        audioService.playUrgentAlert();
        break;

      case 'deepotsav_rush':
        this.venue.environment.weather = 'clear';
        this.venue.environment.timeOfDay = 'evening';
        this.venue.gates.forEach((g) => {
          g.currentCount = Math.round(g.maxSafeCapacity * (0.85 + Math.random() * 0.15));
          g.inflowRate = 560;
        });
        this.logIncident('ALERT', 'critical', 'Maha Shivratri Triveni Sangam & Sea Walkway Mega Influx (1.2M Devotees)', undefined, 'Somnath Trust & Gujarat Police');
        audioService.playSosAlarm();
        break;

      case 'chokepoint_rush':
        if (this.venue.gates.length > 1) {
          const targetGate = this.venue.gates[1]; // Samudra Darshan Gate 2
          targetGate.currentCount = Math.round(targetGate.maxSafeCapacity * 1.06);
          targetGate.inflowRate = 580;
          targetGate.demographics.elderlyRatio = 0.52;
          this.logIncident('ALERT', 'critical', `STAMPEDE RISK: Severe Chokepoint Surge at ${targetGate.name} (Sea Walkway Corridor)`, targetGate.id, 'Risk Engine');
          audioService.playSosAlarm();
        }
        break;

      case 'normal':
      default:
        this.venue.environment.weather = 'clear';
        this.venue.environment.eventPhase = 'doors_open';
        this.venue.gates.forEach((g) => {
          g.sensorStatus = 'online';
          g.currentCount = Math.round(g.maxSafeCapacity * (0.35 + Math.random() * 0.28));
          g.inflowRate = Math.round(120 + Math.random() * 90);
          g.outflowRate = Math.round(100 + Math.random() * 80);
        });
        this.logIncident('CONFIG_CHANGE', 'low', 'Reset scenario to Normal Daily Darshan Operations', undefined, 'Somnath Control Room');
        break;
    }

    this.recomputeAllMetrics();
    this.notify();
  }

  public getActiveScenario(): ScenarioPreset {
    return this.activeScenario;
  }

  private tick() {
    const now = Date.now();

    this.venue.gates.forEach((gate) => {
      if (gate.sensorStatus === 'online' && now - gate.lastHeartbeat > 45000) {
        gate.sensorStatus = 'degraded';
        this.reportSystemError(gate.id, gate.name, 'Laser Counter', 'warning', 'HEARTBEAT_DELAY', 'Somnath Pilgrimage sensor heartbeat delayed.');
      }

      if (gate.sensorStatus === 'offline') {
        return;
      }

      if (this.visionBoundGateId === gate.id) {
        return;
      }

      const randomNoise = (Math.random() - 0.48) * 18;
      const netFlow = Math.round((gate.inflowRate - gate.outflowRate) * 0.05 + randomNoise);
      gate.currentCount = Math.max(10, gate.currentCount + netFlow);

      if (!gate.history || gate.history.length === 0 || now - gate.history[gate.history.length - 1].timestamp >= 8000) {
        gate.history.push({
          timestamp: now,
          count: gate.currentCount,
          density: Math.round((gate.currentCount / gate.maxSafeCapacity) * 100),
        });
        if (gate.history.length > 20) {
          gate.history.shift();
        }
      }

      gate.lastHeartbeat = now;
      this.recomputeGateMetrics(gate);
    });

    this.redirectionSuggestions = evaluateRedirectionPlan(
      this.venue.gates,
      this.riskAssessments,
      this.venue.hysteresisSeconds,
      this.redirectionSuggestions
    );

    if (this.venue.autoRedirectionEnabled) {
      this.redirectionSuggestions.forEach((sugg) => {
        if (sugg.status === 'suggested') {
          this.approveRedirection(sugg.id, true);
        }
      });
    }

    this.alerts.forEach((alert) => {
      if (alert.status === 'active' || alert.status === 'escalated') {
        if (!alert.acknowledged) {
          alert.escalationTimerRemaining = Math.max(0, alert.escalationTimerRemaining - 2);
          if (alert.escalationTimerRemaining === 0 && alert.escalationTier < 3) {
            alert.escalationTier += 1;
            alert.status = 'escalated';
            alert.escalationTimerRemaining = this.venue.escalationSlaSeconds;
            
            const tierNames = ['Gate Supervisor (द्वार प्रभारी)', 'Central Control Room (केंद्रीय नियंत्रण कक्ष)', 'Incident Commander & SDRF/PAC Forces'];
            const targetRole = tierNames[alert.escalationTier - 1];
            
            this.logIncident(
              'ALERT',
              'high',
              `ALERT ESCALATED to Tier ${alert.escalationTier} (${targetRole}): ${alert.gateName} unacknowledged!`,
              alert.gateId,
              'Escalation Pipeline'
            );
            audioService.playUrgentAlert();
          }
        }
      }
    });

    this.notify();
  }

  private recomputeGateMetrics(gate: Gate) {
    const risk = calculateRiskAssessment(gate, this.venue.environment);
    this.riskAssessments.set(gate.id, risk);

    if (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'STAMPEDE_HAZARD' || risk.riskLevel === 'HIGH') {
      const existingActiveAlert = this.alerts.find(
        (a) => a.gateId === gate.id && (a.status === 'active' || a.status === 'investigating' || a.status === 'escalated')
      );

      const severity = risk.riskLevel === 'STAMPEDE_HAZARD' ? 'EMERGENCY' : risk.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      const reasons = risk.factors.filter((f) => f.score > 0).map((f) => `${f.name}: ${f.description}`);

      if (!existingActiveAlert) {
        const newAlert: Alert = {
          id: `alert-${gate.id}-${Date.now()}`,
          timestamp: Date.now(),
          gateId: gate.id,
          gateName: gate.name,
          severity,
          riskScore: risk.compositeScore,
          densityPercentage: risk.densityPercentage,
          currentCount: gate.currentCount,
          maxCapacity: gate.maxSafeCapacity,
          title: risk.riskLevel === 'STAMPEDE_HAZARD' ? `🚨 STAMPEDE DANGER AT ${gate.code} (${gate.name})` : `⚠️ Heavy Pilgrim Influx at ${gate.code}`,
          reasons,
          acknowledged: false,
          escalationTier: 1,
          escalationTimerRemaining: this.venue.escalationSlaSeconds,
          status: 'active',
        };

        this.alerts.unshift(newAlert);
        this.logIncident('ALERT', severity === 'EMERGENCY' ? 'critical' : 'high', `Threshold crossed: ${newAlert.title}`, gate.id, 'Ayodhya Risk Engine');

        if (this.venue.audioAlertsEnabled) {
          if (severity === 'EMERGENCY') {
            audioService.playSosAlarm();
          } else {
            audioService.playUrgentAlert();
          }
        }
      } else {
        existingActiveAlert.densityPercentage = risk.densityPercentage;
        existingActiveAlert.currentCount = gate.currentCount;
        existingActiveAlert.riskScore = risk.compositeScore;
        existingActiveAlert.reasons = reasons;
      }
    }
  }

  private recomputeAllMetrics() {
    this.venue.gates.forEach((g) => this.recomputeGateMetrics(g));
  }

  public acknowledgeAlert(alertId: string, officerName = 'Somnath Control Officer') {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = officerName;
      alert.acknowledgedAt = Date.now();
      alert.status = 'investigating';
      this.logIncident('ALERT', 'medium', `Alert acknowledged by ${officerName} for ${alert.gateName}`, alert.gateId, officerName);
      this.notify();
    }
  }

  public resolveAlert(alertId: string, officerName = 'Somnath Duty Commander') {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      this.logIncident('ALERT', 'low', `Alert resolved by ${officerName} for ${alert.gateName}`, alert.gateId, officerName);
      this.notify();
    }
  }

  public adjustGateCount(gateId: string, delta: number) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    if (gate) {
      gate.currentCount = Math.max(0, gate.currentCount + delta);
      this.recomputeGateMetrics(gate);
      this.logIncident('OVERRIDE', 'low', `Manual pilgrim tally adjustment (${delta > 0 ? '+' : ''}${delta}) at ${gate.name}`, gateId, 'Ground Marshal');
      this.notify();
    }
  }

  public toggleGateSensor(gateId: string) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    if (gate) {
      if (gate.sensorStatus === 'online') {
        gate.sensorStatus = 'offline';
        this.reportSystemError(gate.id, gate.name, 'CCTV Camera', 'error', 'CAM_OFFLINE', 'CCTV camera feed disconnected on pilgrimage corridor.');
      } else {
        gate.sensorStatus = 'online';
        gate.lastHeartbeat = Date.now();
        this.reportSystemError(gate.id, gate.name, 'CCTV Camera', 'info', 'CAM_ONLINE', 'CCTV camera feed restored and streaming.', true);
      }
      this.notify();
    }
  }

  public reportSystemError(
    gateId: string | undefined,
    gateName: string | undefined,
    component: SystemError['component'],
    severity: SystemError['severity'],
    code: string,
    message: string,
    resolved = false
  ) {
    const err: SystemError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      gateId,
      gateName,
      component,
      severity,
      code,
      message,
      resolved,
    };
    this.systemErrors.unshift(err);
    if (this.systemErrors.length > 50) this.systemErrors.pop();
    this.notify();
  }

  public approveRedirection(suggestionId: string, isAuto = false) {
    const suggestion = this.redirectionSuggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = 'active';
      suggestion.autoApproved = isAuto;

      const broadcastTitle = `Pilgrim Diversion: ${suggestion.sourceGateName} -> ${suggestion.targetGateName}`;
      const broadcastText = `जय सोमनाथ! ધ્યાન આપો: ${suggestion.sourceGateName} પર વધુ ભીડ છે. સરળ દર્શન માટે કૃપા કરીને ${suggestion.targetGateName} તરફ પ્રસ્થાન કરો (${suggestion.distanceMeters} મીટર, ~${suggestion.estimatedWalkingMinutes} મિનિટ).`;
      
      this.sendBroadcast(
        broadcastTitle,
        broadcastText,
        suggestion.sourceGateId,
        suggestion.sourceGateName,
        ['signage', 'pa_audio', 'ground_app'],
        'urgent',
        isAuto ? 'Somnath Autopilot AI' : 'Shri Somnath Trust Control Room'
      );

      this.logIncident(
        'REDIRECTION',
        'high',
        `Pilgrim Redirection Activated: ${suggestion.sourceGateName} to ${suggestion.targetGateName} (Delta -${suggestion.densityDelta}%)`,
        suggestion.sourceGateId,
        isAuto ? 'Somnath Redirection Engine' : 'Admin Approval'
      );

      this.notify();
    }
  }

  public dismissRedirection(suggestionId: string) {
    const suggestion = this.redirectionSuggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = 'dismissed';
      this.notify();
    }
  }

  public sendBroadcast(
    title: string,
    message: string,
    targetGateId: string | 'all',
    targetGateName: string,
    channels: ('signage' | 'pa_audio' | 'ground_app' | 'sms')[],
    priority: 'routine' | 'urgent' | 'emergency',
    createdBy: string
  ) {
    const broadcast: BroadcastMessage = {
      id: `bc-${Date.now()}`,
      timestamp: Date.now(),
      title,
      message,
      targetGateId,
      targetGateName,
      channels,
      priority,
      createdBy,
      active: true,
    };

    this.broadcasts.unshift(broadcast);
    this.logIncident('BROADCAST', priority === 'emergency' ? 'critical' : priority === 'urgent' ? 'high' : 'low', `Broadcast: "${title}" [${channels.join(', ')}]`, targetGateId === 'all' ? undefined : targetGateId, createdBy);

    if (channels.includes('pa_audio')) {
      audioService.speakAnnouncement(message, priority !== 'routine');
    }

    this.notify();
  }

  public triggerSOS(
    gateId: string,
    emergencyType: SOSDispatch['emergencyType'],
    notes: string,
    unitsDispatched: string[],
    caller = 'Somnath Shrine Command'
  ) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    if (!gate) return;

    const density = Math.round((gate.currentCount / gate.maxSafeCapacity) * 100);

    const sos: SOSDispatch = {
      id: `sos-${Date.now()}`,
      timestamp: Date.now(),
      gateId: gate.id,
      gateName: gate.name,
      location: gate.location,
      emergencyType,
      severity: 'critical',
      caller,
      notes,
      currentHeadcount: gate.currentCount,
      densityPercentage: density,
      unitsDispatched,
      status: 'dispatched',
    };

    this.sosDispatches.unshift(sos);
    this.logIncident('SOS', 'critical', `SOMNATH EMERGENCY SOS: ${emergencyType.toUpperCase()} at ${gate.name}. Units: ${unitsDispatched.join(', ')}`, gate.id, caller);
    
    audioService.playSosAlarm();
    this.notify();
  }

  public logIncident(
    type: IncidentRecord['type'],
    severity: IncidentRecord['severity'],
    title: string,
    gateId?: string,
    performedBy = 'System'
  ) {
    const gate = this.venue.gates.find((g) => g.id === gateId);
    const rec: IncidentRecord = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      severity,
      title,
      gateId,
      gateName: gate?.name,
      details: title,
      performedBy,
    };
    this.incidentLogs.unshift(rec);
    if (this.incidentLogs.length > 150) this.incidentLogs.pop();
  }

  public getRiskAssessments(): Map<string, RiskAssessment> {
    return this.riskAssessments;
  }
  public getAlerts(): Alert[] {
    return this.alerts;
  }
  public getSystemErrors(): SystemError[] {
    return this.systemErrors;
  }
  public getRedirections(): RedirectionSuggestion[] {
    return this.redirectionSuggestions;
  }
  public getBroadcasts(): BroadcastMessage[] {
    return this.broadcasts;
  }
  public getSOSDispatches(): SOSDispatch[] {
    return this.sosDispatches;
  }
  public getIncidentLogs(): IncidentRecord[] {
    return this.incidentLogs;
  }
}

export const dataIngestionService = new DataIngestionService();
