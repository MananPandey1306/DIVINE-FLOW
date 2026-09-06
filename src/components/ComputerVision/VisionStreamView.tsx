import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileImage, FileVideo, Image as ImageIcon, Info, Play, Upload, Users, Video, X } from 'lucide-react';
import { Gate, VenueConfig } from '../../types';
import { dataIngestionService } from '../../services/dataIngestion';
import { audioService } from '../../services/audioSynthesizer';
import { VisionStats, visionDetector } from '../../services/visionDetector';

export type VisionMediaItem = { id: string; url: string; name: string; type: 'image' | 'video'; headCount: number; sourceType?: 'upload' | 'ip'; };

interface VisionStreamViewProps {
  venue: VenueConfig;
  gates: Gate[];
  visionMedia: Record<string, VisionMediaItem[]>;
  setVisionMedia: React.Dispatch<React.SetStateAction<Record<string, VisionMediaItem[]>>>;
}

const defaultDemographics = { elderlyRatio: 0.18, childrenRatio: 0.12, pwdRatio: 0.08 };

export const VisionStreamView: React.FC<VisionStreamViewProps> = ({
  venue,
  gates,
  visionMedia,
  setVisionMedia,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedGateId, setSelectedGateId] = useState(gates[0]?.id ?? '');
  const [activeVideoMediaId, setActiveVideoMediaId] = useState<string | null>(null);
  const [stats, setStats] = useState<VisionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ipCameraUrl, setIpCameraUrl] = useState('');
  const [ipError, setIpError] = useState('');
  const [pendingGateConfig, setPendingGateConfig] = useState<{ gateId: string; files?: File[]; ipUrl?: string } | null>(null);
  const [pendingMaxCapacity, setPendingMaxCapacity] = useState(50);
  const [pendingGateType, setPendingGateType] = useState<'entry' | 'exit' | 'both'>('both');
  const [scanMode, setScanMode] = useState<'camera' | 'webcam' | null>(null);
  const [scanError, setScanError] = useState('');
  const [sensitivity, setSensitivityState] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
  const [viewMode, setViewModeState] = useState<'reticles' | 'dots_only' | 'landmarks' | 'heatmap' | 'hybrid'>('reticles');

  const handleSensitivityChange = (newSens: 'low' | 'medium' | 'high' | 'ultra') => {
    setSensitivityState(newSens);
    visionDetector.setSensitivity(newSens);
  };

  const handleViewModeChange = (newMode: 'reticles' | 'dots_only' | 'landmarks' | 'heatmap' | 'hybrid') => {
    setViewModeState(newMode);
    visionDetector.setViewMode(newMode);
  };

  useEffect(() => {
    if (!selectedGateId && gates[0]) {
      setSelectedGateId(gates[0].id);
    }
  }, [gates, selectedGateId]);

  const selectedGate = gates.find((gate) => gate.id === selectedGateId);
  const pendingGate = pendingGateConfig ? gates.find((gate) => gate.id === pendingGateConfig.gateId) : null;
  const selectedMedia = visionMedia[selectedGateId] ?? [];
  const selectedMediaItem = selectedMedia.find((item) => item.id === activeVideoMediaId) ?? selectedMedia.find((item) => item.type === 'video') ?? selectedMedia[0] ?? null;
  const uploadedCount = Object.keys(visionMedia).length;
  const gateCameraTotal = selectedMedia.reduce((total, item) => total + (Number.isFinite(item.headCount) ? item.headCount : 0), 0);
  const effectiveCount = gateCameraTotal > 0 ? gateCameraTotal : Number(stats?.detectedCount ?? 0);
  const capacity = selectedGate && effectiveCount ? Math.min(100, Math.round((effectiveCount / selectedGate.maxSafeCapacity) * 100)) : 0;

  useEffect(() => {
    visionDetector.setCallback((count, nextStats) => {
      setStats(nextStats);

      if (selectedGateId) {
        setVisionMedia((prev) => {
          if (!activeVideoMediaId) return prev;
          const current = prev[selectedGateId] ?? [];
          const updated = current.map((item) => item.id === activeVideoMediaId ? { ...item, headCount: count } : item);
          const finalTotal = updated.reduce((total, item) => total + (Number.isFinite(item.headCount) ? item.headCount : 0), 0);
          dataIngestionService.updateVisionCount(selectedGateId, finalTotal || count, nextStats.estimatedDemographics ?? defaultDemographics);
          return { ...prev, [selectedGateId]: updated };
        });
      }
    });
    return () => visionDetector.stop();
  }, [activeVideoMediaId, selectedGateId, setVisionMedia]);

  const playGateMedia = useCallback(async (gateId: string) => {
    const mediaList = visionMedia[gateId] ?? [];
    const videoMedia = mediaList.find((item) => item.id === activeVideoMediaId && item.type === 'video') ?? mediaList.find((item) => item.type === 'video') ?? null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoMedia) {
      visionDetector.stop();
      dataIngestionService.bindVisionFeedToGate(null);
      setStats(null);
      return;
    }

    setActiveVideoMediaId(videoMedia.id);
    setIsLoading(true);
    setStats(null);
    dataIngestionService.bindVisionFeedToGate(gateId);

    try {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.src = videoMedia.url;
      video.load();
      video.currentTime = 0;

      if (video.readyState >= 2) {
        await visionDetector.playVideoFile(video, canvas);
      } else {
        await new Promise<void>((resolve) => {
          const onReady = () => {
            video.removeEventListener('loadedmetadata', onReady);
            resolve();
          };
          video.addEventListener('loadedmetadata', onReady, { once: true });
          video.load();
        });
        await visionDetector.playVideoFile(video, canvas);
      }
    } catch (error) {
      console.warn('Video playback failed:', error);
      video.pause();
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeVideoMediaId, visionMedia]);

  const selectGate = useCallback((gateId: string) => {
    setSelectedGateId(gateId);
    const media = visionMedia[gateId] ?? [];
    const videoMedia = media.find((item) => item.type === 'video') ?? null;
    if (videoMedia) {
      setActiveVideoMediaId(videoMedia.id);
      void playGateMedia(gateId);
    } else {
      setActiveVideoMediaId(null);
      visionDetector.stop();
      dataIngestionService.bindVisionFeedToGate(null);
      setStats(null);
    }
  }, [playGateMedia, visionMedia]);

  const applyGateMediaConfig = useCallback((gateId: string, maxSafeCapacity: number, gateType: 'entry' | 'exit' | 'both') => {
    dataIngestionService.updateGateConfig(gateId, { maxSafeCapacity, gateType });
  }, []);

  const handleFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('video/') || file.type.startsWith('image/'));
    if (!files.length) return;

    const gateId = selectedGateId || gates[0]?.id;
    if (!gateId) return;

    const gate = gates.find((item) => item.id === gateId);
    setPendingMaxCapacity(gate?.maxSafeCapacity ?? 50);
    setPendingGateType(gate?.gateType ?? 'both');
    setPendingGateConfig({ gateId, files });
    event.target.value = '';
  }, [gates, selectedGateId]);

  const connectIpCamera = useCallback(() => {
    const rawUrl = ipCameraUrl.trim();
    if (!rawUrl) {
      setIpError('Enter an IP camera URL first.');
      return;
    }
    const valid = /^(https?:\/\/|rtsp:\/\/)/i.test(rawUrl);
    if (!valid) {
      setIpError('Use a valid http://, https:// or rtsp:// stream URL.');
      return;
    }

    const gateId = selectedGateId || gates[0]?.id;
    if (!gateId) {
      setIpError('Select a gate before connecting a camera.');
      return;
    }

    const gate = gates.find((item) => item.id === gateId);
    setPendingMaxCapacity(gate?.maxSafeCapacity ?? 50);
    setPendingGateType(gate?.gateType ?? 'both');
    setPendingGateConfig({ gateId, ipUrl: rawUrl });
    setIpCameraUrl('');
    setIpError('');
  }, [gates, ipCameraUrl, selectedGateId]);

  const startLiveScan = useCallback(async (mode: 'camera' | 'webcam') => {
    const gateId = selectedGateId || gates[0]?.id;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!gateId || !video || !canvas) {
      setScanError('Select a gate before starting the live scan.');
      return;
    }

    setScanError('');
    setScanMode(mode);
    setStats(null);
    audioService.unlockFromUserGesture();
    dataIngestionService.bindVisionFeedToGate(gateId);
    const started = await visionDetector.startWebcam(video, canvas, mode === 'camera' ? 'environment' : 'user');
    if (!started) {
      setScanMode(null);
      setScanError(`Unable to access the ${mode}. Check browser camera permission and try again.`);
    }
  }, [gates, selectedGateId]);

  const stopLiveScan = useCallback(() => {
    visionDetector.stop();
    dataIngestionService.bindVisionFeedToGate(null);
    setScanMode(null);
    setStats(null);
  }, []);

  const confirmPendingGateConfig = useCallback(() => {
    if (!pendingGateConfig) return;

    const { gateId, files, ipUrl } = pendingGateConfig;
    applyGateMediaConfig(gateId, pendingMaxCapacity, pendingGateType);

    if (files && files.length) {
      audioService.unlockFromUserGesture();
      const nextItems: VisionMediaItem[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        headCount: 0,
        sourceType: 'upload',
      }));

      setVisionMedia((prev) => ({
        ...prev,
        [gateId]: [...(prev[gateId] ?? []), ...nextItems],
      }));

      const firstVideo = nextItems.find((item) => item.type === 'video');
      if (firstVideo) {
        setSelectedGateId(gateId);
        setActiveVideoMediaId(firstVideo.id);
        void playGateMedia(gateId);
      }
    }

    if (ipUrl) {
      const newItem: VisionMediaItem = {
        id: `ip-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: ipUrl,
        name: ipUrl,
        type: 'video',
        headCount: 0,
        sourceType: 'ip',
      };

      setVisionMedia((prev) => ({
        ...prev,
        [gateId]: [...(prev[gateId] ?? []), newItem],
      }));
      setSelectedGateId(gateId);
      setActiveVideoMediaId(newItem.id);
      void playGateMedia(gateId);
    }

    setPendingGateConfig(null);
  }, [applyGateMediaConfig, pendingGateConfig, pendingGateType, pendingMaxCapacity, playGateMedia, setVisionMedia]);

  const removeMedia = useCallback((gateId: string, itemId: string) => {
    setVisionMedia((prev) => {
      const current = prev[gateId] ?? [];
      const next = current.filter((item) => item.id !== itemId);
      if (!next.length) {
        const copy = { ...prev };
        delete copy[gateId];
        return copy;
      }
      return { ...prev, [gateId]: next };
    });

    if (gateId === selectedGateId) {
      if (activeVideoMediaId === itemId) {
        setActiveVideoMediaId(null);
      }
      visionDetector.stop();
      dataIngestionService.bindVisionFeedToGate(null);
      setStats(null);
    }
  }, [activeVideoMediaId, selectedGateId]);


  return (
    <>
      {pendingGateConfig && (
        <div className="modal-overlay" onClick={() => setPendingGateConfig(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '440px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>Gate setup</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>{pendingGate ? `${pendingGate.code} / ${pendingGate.name}` : 'Selected gate'}</h3>
              </div>
              <button onClick={() => setPendingGateConfig(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>Maximum capacity</label>
                <input
                  type="number"
                  min={1}
                  value={pendingMaxCapacity}
                  onChange={(event) => setPendingMaxCapacity(Math.max(1, Number(event.target.value) || 1))}
                  style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>Gate type</label>
                <select
                  value={pendingGateType}
                  onChange={(event) => setPendingGateType(event.target.value as 'entry' | 'exit' | 'both')}
                  style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.8rem' }}
                >
                  <option value="entry">Entry / Ingress</option>
                  <option value="exit">Exit / Egress</option>
                  <option value="both">Bi-directional</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button className="btn btn-secondary" onClick={() => setPendingGateConfig(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmPendingGateConfig}>Continue</button>
            </div>
          </div>
        </div>
      )}

      <main className="vision-page">
      <section className="vision-hero">
        <div>
          <p className="eyebrow">Temple operations / computer vision</p>
          <h1>Gate feeds, images and crowd totals in one view.</h1>
          <p className="vision-intro">Upload one camera image or video for a gate and use that count for the live simulation.</p>
        </div>
        <div className="feed-progress" aria-label={`${uploadedCount} gate groups saved`}>
          <strong>{uploadedCount}<span> / {gates.length}</span></strong>
          <small>saved locations</small>
        </div>
      </section>

      <section className="upload-strip">
        <div className="upload-copy">
          <div className="section-icon"><Upload size={18} /></div>
          <div>
            <h2>Load gate camera / image feeds</h2>
            <p>Upload multiple files for the selected gate or connect an IP camera stream for live monitoring.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleFiles} />
          <button className="btn btn-primary upload-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> {selectedMedia.length ? `Add more media for ${selectedGate?.code ?? 'gate'}` : 'Upload videos / images'}
          </button>
        </div>
      </section>

      <section className="upload-strip" style={{ marginTop: '12px' }}>
        <div className="upload-copy">
          <div className="section-icon"><Camera size={18} /></div>
          <div>
            <h2>Connect local IP camera</h2>
            <p>Use a direct RTSP / HTTP stream for any of the seven gates.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 'min(100%, 460px)' }}>
          <input
            type="text"
            value={ipCameraUrl}
            onChange={(e) => { setIpCameraUrl(e.target.value); if (ipError) setIpError(''); }}
            placeholder="http://192.168.1.10:8080/stream"
            style={{ minWidth: 240, flex: '1 1 240px', background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '9px 12px', fontSize: '0.8rem' }}
          />
          <button className="btn btn-secondary" onClick={connectIpCamera}>
            Connect live feed
          </button>
        </div>
        {ipError && <div style={{ color: '#fca5a5', fontSize: '0.72rem', marginTop: '6px', width: '100%' }}>{ipError}</div>}
      </section>

      <section className="upload-strip live-scan-strip" style={{ marginTop: '12px' }}>
        <div className="upload-copy">
          <div className="section-icon"><Video size={18} /></div>
          <div>
            <h2>Start live scanning</h2>
            <p>Use the rear Camera for the venue or the front Webcam for an operator view.</p>
          </div>
        </div>
        <div className="live-scan-actions">
          <button className="btn btn-secondary" onClick={() => void startLiveScan('camera')} disabled={Boolean(scanMode)}>
            <Camera size={16} /> Camera
          </button>
          <button className="btn btn-primary" onClick={() => void startLiveScan('webcam')} disabled={Boolean(scanMode)}>
            <Video size={16} /> Webcam
          </button>
          {scanMode && <button className="btn btn-secondary" onClick={stopLiveScan}>Stop scan</button>}
        </div>
        {scanError && <div className="scan-error">{scanError}</div>}
      </section>

      <section className="gate-feed-list" aria-label="Gate video assignments">
        {gates.map((gate, index) => {
          const mediaItems = visionMedia[gate.id] ?? [];
          const isSelected = selectedGateId === gate.id;
          return (
            <button key={gate.id} className={`gate-feed-row ${isSelected ? 'is-selected' : ''}`} onClick={() => selectGate(gate.id)}>
              <span className="gate-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="gate-feed-name"><strong>{gate.code}</strong><span>{gate.name.replace(/^Gate \d+ - /, '')}</span></span>
              <span className={`feed-status ${mediaItems.length ? 'is-ready' : ''}`}>
                {mediaItems.length ? <CheckCircle2 size={15} /> : <Info size={15} />}
                {mediaItems.length ? `${mediaItems.length} media files` : 'No media uploaded'}
              </span>
              {mediaItems.length > 0 && (
                <span className="remove-feed" role="button" aria-label={`Remove ${gate.code} media`} onClick={(event) => { event.stopPropagation(); removeMedia(gate.id, mediaItems[0].id); }}><X size={15} /></span>
              )}
            </button>
          );
        })}
      </section>

      <section className="vision-workspace">
        <div className="stream-panel">
          <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p className="eyebrow">Selected feed</p>
              <h2>{selectedGate ? `${selectedGate.code} / ${selectedGate.name.replace(/^Gate \d+ - /, '')}` : 'Choose a gate'}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.75)', padding: '3px 6px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.22)' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6d28d9', paddingRight: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sens:</span>
                {(['low', 'medium', 'high', 'ultra'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSensitivityChange(s)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: sensitivity === s ? '#7c3aed' : 'transparent',
                      color: sensitivity === s ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.75)', padding: '3px 6px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.22)' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6d28d9', paddingRight: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>View:</span>
                {(['reticles', 'dots_only', 'heatmap', 'hybrid'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleViewModeChange(m)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === m ? '#7c3aed' : 'transparent',
                      color: viewMode === m ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease',
                      textTransform: 'capitalize',
                    }}
                  >
                    {m === 'dots_only' ? 'Dots' : m}
                  </button>
                ))}
              </div>

              <span className={`live-label ${stats ? 'is-live' : ''}`}>
                <span />
                {stats ? 'ANALYZING' : 'READY'}
              </span>
            </div>
          </div>

          <div className="video-stage">
            <video ref={videoRef} muted playsInline hidden />
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              style={{
                display: selectedMedia.length > 0 && selectedMedia.some((item) => item.type === 'video') ? 'block' : 'none'
              }}
            />

            {!selectedMedia.length && (
              <div className="stage-empty">
                <FileVideo size={32} />
                <strong>Upload camera / image files for {selectedGate?.code ?? 'this gate'}</strong>
                <span>Camera totals and AI estimates will appear here once the gate is ready.</span>
              </div>
            )}

            {selectedMedia.length > 0 && !selectedMedia.some((item) => item.type === 'video') && (
              <div className="stage-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexDirection: 'column' }}>
                <FileImage size={32} />
                <strong>Image uploaded</strong>
                <span>Image files saved for {selectedGate?.code ?? 'this gate'}.</span>
              </div>
            )}

            {selectedMedia.length > 0 && selectedMedia.some((item) => item.type === 'video') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 12px 0', justifyContent: 'flex-start' }}>
                {selectedMedia.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveVideoMediaId(item.id);
                      void playGateMedia(selectedGateId);
                    }}
                    style={{
                      background: activeVideoMediaId === item.id ? 'rgba(14,165,233,0.2)' : 'rgba(15,23,42,0.7)',
                      color: '#e2e8f0',
                      border: activeVideoMediaId === item.id ? '1px solid rgba(14,165,233,0.6)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '999px',
                      padding: '6px 10px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {item.sourceType === 'ip' ? 'IP Camera' : 'Video'} • {item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name}
                  </button>
                ))}
              </div>
            )}

            {isLoading && <div className="stage-loading"><Play size={20} /> Preparing video analysis...</div>}
          </div>

          <div className="stage-footer">
            <span><Video size={15} /> Multi-source camera media</span>
            <span><Camera size={15} /> AI person detection</span>
            <span><Info size={15} /> Total count is the sum of all gate sources</span>
          </div>
        </div>

        <aside className="telemetry-panel">
          <div className="telemetry-card primary-metric">
            <p className="eyebrow">Effective headcount</p>
            <strong>{effectiveCount.toLocaleString()}</strong>
            <span>{stats ? `${stats.inferenceTimeMs} ms inference / ${stats.fps} FPS` : 'Camera total or AI estimate pending'}</span>
          </div>

          <div className="telemetry-card">
            <div className="metric-label">
              <span>Gate capacity</span>
              <strong>{selectedGate ? `${capacity}%` : '--'}</strong>
            </div>
            <div className="capacity-track"><span style={{ width: `${capacity}%` }} /></div>
            <small>
              {selectedGate ? `${effectiveCount.toLocaleString()} / ${selectedGate.maxSafeCapacity.toLocaleString()} safe capacity` : 'No count available'}
            </small>
          </div>

          {selectedMedia.length > 0 && (
            <div className="telemetry-card">
              <p className="eyebrow">Camera sources</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {selectedMedia.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {item.type === 'video' ? <Video size={14} /> : <ImageIcon size={14} />}
                      <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</small>
                    </span>
                    <button type="button" onClick={() => removeMedia(selectedGateId, item.id)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <small style={{ display: 'block', marginTop: '8px' }}>Counts are summed across all source files for this gate.</small>
            </div>
          )}

          {stats ? (
            <div className="telemetry-card">
              <p className="eyebrow">Detection engine</p>
              <p className="engine-name">{stats.modelStatus}</p>
              <small>{stats.activeEngines}</small>
            </div>
          ) : (
            <div className="telemetry-card telemetry-note">
              <Info size={17} />
              <p>AI estimates are generated after the gate video starts playing. The current crowd value is updated automatically from the selected source.</p>
            </div>
          )}
        </aside>
      </section>

      <p className="vision-disclaimer"><Users size={15} /> Headcounts for each location are the total of all uploaded camera or IP feed counts for that gate. AI estimates are used as the active fallback and should be reviewed before any crowd-control action.</p>
      <span className="sr-only">{venue.name}</span>
      </main>
    </>
  );
};
