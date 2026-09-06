import React, { useState, useEffect } from 'react';
import {
  VenueConfig,
  RiskAssessment,
  Alert,
  SystemError,
  RedirectionSuggestion,
  BroadcastMessage,
  SOSDispatch,
  IncidentRecord,
  RiskLevel,
} from './types';
import { dataIngestionService } from './services/dataIngestion';
import { Navbar } from './components/Navbar/Navbar';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { PublicSignageView } from './components/PublicSignage/PublicSignageView';
import { VisionStreamView, VisionMediaItem } from './components/ComputerVision/VisionStreamView';
import { BroadcastModal } from './components/Broadcast/BroadcastModal';
import { SOSModal } from './components/SOS/SOSModal';
import { IncidentLogModal } from './components/IncidentLog/IncidentLogModal';
import { VenueSetupModal } from './components/Onboarding/VenueSetupModal';
import { DetectionApiModal } from './components/Settings/DetectionApiModal';
import { visionDetector } from './services/visionDetector';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'command_center' | 'public_signage' | 'vision_feed'>('command_center');
  const [visionMedia, setVisionMedia] = useState<Record<string, VisionMediaItem[]>>({});
  const [venue, setVenue] = useState<VenueConfig>(() => dataIngestionService.getVenue());
  const [riskAssessments, setRiskAssessments] = useState<Map<string, RiskAssessment>>(() => dataIngestionService.getRiskAssessments());
  const [alerts, setAlerts] = useState<Alert[]>(() => dataIngestionService.getAlerts());
  const [systemErrors, setSystemErrors] = useState<SystemError[]>(() => dataIngestionService.getSystemErrors());
  const [redirections, setRedirections] = useState<RedirectionSuggestion[]>(() => dataIngestionService.getRedirections());
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(() => dataIngestionService.getBroadcasts());
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => dataIngestionService.getIncidentLogs());

  // Modal States
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isIncidentLogOpen, setIsIncidentLogOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDetectionApiOpen, setIsDetectionApiOpen] = useState(false);
  const [targetedGateId, setTargetedGateId] = useState<string | null>(null);

  useEffect(() => {
    const savedApiUrl = typeof window !== 'undefined' ? localStorage.getItem('cams-pro-detection-api-url') : null;
    if (savedApiUrl) {
      visionDetector.setDetectionApiUrl(savedApiUrl);
    }

    const unsubscribe = dataIngestionService.subscribe(() => {
      setVenue({ ...dataIngestionService.getVenue() });
      setRiskAssessments(new Map(dataIngestionService.getRiskAssessments()));
      setAlerts([...dataIngestionService.getAlerts()]);
      setSystemErrors([...dataIngestionService.getSystemErrors()]);
      setRedirections([...dataIngestionService.getRedirections()]);
      setBroadcasts([...dataIngestionService.getBroadcasts()]);
      setIncidents([...dataIngestionService.getIncidentLogs()]);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenBroadcastForGate = (gateId: string) => {
    setTargetedGateId(gateId);
    setIsBroadcastOpen(true);
  };

  const handleOpenSOSForGate = (gateId: string) => {
    setTargetedGateId(gateId);
    setIsSOSOpen(true);
  };

  // Determine highest active risk across all gates
  let highestRisk: RiskLevel = 'NORMAL';
  const activeAlerts = alerts.filter((a) => a.status === 'active' || a.status === 'escalated');
  riskAssessments.forEach((r) => {
    if (r.riskLevel === 'STAMPEDE_HAZARD') highestRisk = 'STAMPEDE_HAZARD';
    else if (r.riskLevel === 'CRITICAL' && highestRisk !== 'STAMPEDE_HAZARD') highestRisk = 'CRITICAL';
    else if (r.riskLevel === 'HIGH' && highestRisk !== 'STAMPEDE_HAZARD' && highestRisk !== 'CRITICAL') highestRisk = 'HIGH';
    else if (r.riskLevel === 'MODERATE' && highestRisk === 'NORMAL') highestRisk = 'MODERATE';
  });

  return (
    <div className="app-container">
      {/* Primary Header & Scenario Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        venue={venue}
        activeAlertCount={activeAlerts.length}
        highestRisk={highestRisk}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenDetectionApi={() => setIsDetectionApiOpen(true)}
        onOpenBroadcast={() => {
          setTargetedGateId(null);
          setIsBroadcastOpen(true);
        }}
        onOpenSOS={() => {
          setTargetedGateId(null);
          setIsSOSOpen(true);
        }}
        onOpenIncidentLog={() => setIsIncidentLogOpen(true)}
      />

      {/* Dynamic Views */}
      <main style={{ flex: 1 }}>
        {currentTab === 'command_center' && (
          <AdminDashboard
            venue={venue}
            riskAssessments={riskAssessments}
            alerts={alerts}
            systemErrors={systemErrors}
            redirections={redirections}
            broadcasts={broadcasts}
            onOpenSOSForGate={handleOpenSOSForGate}
            onOpenBroadcastForGate={handleOpenBroadcastForGate}
          />
        )}

        {currentTab === 'public_signage' && (
          <PublicSignageView
            venue={venue}
            gates={venue.gates}
            riskAssessments={riskAssessments}
            redirections={redirections}
            broadcasts={broadcasts}
          />
        )}

        {currentTab === 'vision_feed' && (
          <VisionStreamView
            venue={venue}
            gates={venue.gates}
            visionMedia={visionMedia}
            setVisionMedia={setVisionMedia}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        gates={venue.gates}
        defaultGateId={targetedGateId}
      />

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        gates={venue.gates}
        targetGateId={targetedGateId}
      />

      <IncidentLogModal
        isOpen={isIncidentLogOpen}
        onClose={() => setIsIncidentLogOpen(false)}
        incidents={incidents}
      />

      <VenueSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        currentVenue={venue}
      />

      <DetectionApiModal
        isOpen={isDetectionApiOpen}
        onClose={() => setIsDetectionApiOpen(false)}
      />
    </div>
  );
};

export default App;
