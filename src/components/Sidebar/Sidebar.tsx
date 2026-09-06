import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Eye,
  Camera,
  Shield,
  Radio,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { VenueConfig } from '../../types';
import { dataIngestionService } from '../../services/dataIngestion';

interface SidebarProps {
  currentTab: 'command_center' | 'public_signage' | 'vision_feed';
  setCurrentTab: (tab: 'command_center' | 'public_signage' | 'vision_feed') => void;
  venue: VenueConfig;
  onOpenSetup: () => void;
  onOpenBroadcast: () => void;
  onOpenSOS: () => void;
  onOpenIncidentLog: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  venue,
  onOpenSetup,
  onOpenBroadcast,
  onOpenSOS,
  onOpenIncidentLog,
}) => {
  const isAyodhya = venue.id.includes('ayodhya') || venue.id.includes('ram');

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        zIndex: 100,
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      {/* ── Brand Header ── */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: '#f8fafc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            padding: '2px',
            overflow: 'hidden',
          }}
        >
          <img src="/logo.png" alt="DF" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              DivineFlow
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#00b894' }}>
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* ── Shrine Toggle (Somnath / Ayodhya) ── */}
      <div style={{ padding: '12px 16px 6px' }}>
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => dataIngestionService.loadPreset('somnath-jyotirlinga-mandir')}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: !isAyodhya ? '#00b894' : 'transparent',
              color: !isAyodhya ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
              textAlign: 'center',
            }}
          >
            🔱 Somnath
          </button>
          <button
            type="button"
            onClick={() => dataIngestionService.loadPreset('ram-janmabhoomi-ayodhya')}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: isAyodhya ? '#00b894' : 'transparent',
              color: isAyodhya ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
              textAlign: 'center',
            }}
          >
            🚩 Ayodhya
          </button>
        </div>
      </div>

      {/* ── Nav Sections ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* MAIN SECTION */}
        <div>
          <div style={{ padding: '4px 10px 6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              MAIN
            </span>
            <p style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '1px' }}>
              Command & Telemetry
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* My Dashboard (Selected active pill) */}
            <div>
              <button
                onClick={() => setCurrentTab('command_center')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  background: currentTab === 'command_center' ? '#00b894' : 'transparent',
                  color: currentTab === 'command_center' ? '#ffffff' : '#334155',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <LayoutDashboard size={16} />
                  <span>My Dashboard</span>
                </div>
                <ChevronRight size={14} style={{ opacity: currentTab === 'command_center' ? 1 : 0.4 }} />
              </button>

              {/* Sub-items when active */}
              {currentTab === 'command_center' && (
                <div style={{ paddingLeft: '32px', paddingTop: '4px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }} onClick={() => {}}>Campus Map</span>
                  <span style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }} onClick={() => {}}>Gate Queues</span>
                  <span style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }} onClick={() => {}}>Ground Force</span>
                </div>
              )}
            </div>

            {/* Temple Zones */}
            <button
              onClick={() => {}}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <MapPin size={15} />
                <span>Temple Zones</span>
              </div>
              <span style={{ fontSize: '9.5px', background: '#f1f5f9', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Soon
              </span>
            </button>

            {/* AI Vision CCTV (Camera Feed) */}
            <button
              onClick={() => setCurrentTab('vision_feed')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: currentTab === 'vision_feed' ? '#00b894' : 'transparent',
                color: currentTab === 'vision_feed' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '13px',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Camera size={15} />
                <span>AI Vision CCTV</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '9.5px',
                  background: currentTab === 'vision_feed' ? 'rgba(255,255,255,0.25)' : 'rgba(0, 184, 148, 0.15)',
                  color: currentTab === 'vision_feed' ? '#ffffff' : '#00b894',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 800,
                }}>
                  ● Live
                </span>
              </div>
            </button>

            {/* Crowd Monitoring (Signage Tab) */}
            <button
              onClick={() => setCurrentTab('public_signage')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: currentTab === 'public_signage' ? 'rgba(0, 184, 148, 0.12)' : 'transparent',
                color: currentTab === 'public_signage' ? '#00b894' : '#334155',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Eye size={15} />
                <span>Pilgrim Signage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9.5px', background: 'rgba(0, 184, 148, 0.15)', color: '#00b894', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  ● Live
                </span>
                <ExternalLink size={11} color="#94a3b8" />
              </div>
            </button>
          </div>
        </div>

        {/* OPERATIONS SECTION */}
        <div>
          <div style={{ padding: '4px 10px 6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              OPERATIONS
            </span>
            <p style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '1px' }}>
              Action & Crisis Center
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Announcements */}
            <button
              onClick={onOpenBroadcast}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#334155',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Radio size={15} />
                <span>Announcements</span>
              </div>
              <span style={{ fontSize: '9.5px', background: '#f1f5f9', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Soon
              </span>
            </button>

            {/* Emergency Center */}
            <button
              onClick={onOpenSOS}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <AlertTriangle size={15} color="#ef4444" />
              <span>Emergency Center</span>
            </button>
          </div>
        </div>

        {/* RESOURCES SECTION */}
        <div>
          <div style={{ padding: '4px 10px 6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              RESOURCES
            </span>
            <p style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '1px' }}>
              Analytics & System
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Reports & Analytics */}
            <button
              onClick={onOpenIncidentLog}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#334155',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <BarChart3 size={15} />
              <span>Reports & Analytics</span>
            </button>

            {/* Settings & Overrides */}
            <button
              onClick={onOpenSetup}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#334155',
                fontWeight: 600,
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Settings size={15} />
                <span>Settings & Overrides</span>
              </div>
              <span style={{ fontSize: '9.5px', background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                v2.4
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
