import React, { useRef, useEffect, useState } from 'react';
import { Gate, RiskAssessment, RedirectionSuggestion } from '../../types';
import { Layers, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ArrowRight, Activity, Flame, Shield, Compass } from 'lucide-react';

interface SpatialVenueMapProps {
  gates: Gate[];
  riskAssessments: Map<string, RiskAssessment>;
  redirections: RedirectionSuggestion[];
  selectedGateId: string | null;
  onSelectGate: (gateId: string | null) => void;
  onOpenSOSForGate?: (gateId: string) => void;
}

interface Particle {
  gateIndex: number;
  direction: 'ingress' | 'egress';
  progress: number;
  speed: number;
  laneOffset: number;
  alpha: number;
  trail: Array<{ x: number; y: number }>;
}

export const SpatialVenueMap: React.FC<SpatialVenueMapProps> = ({
  gates,
  riskAssessments,
  redirections,
  selectedGateId,
  onSelectGate,
  onOpenSOSForGate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);
  const radarAngleRef = useRef<number>(0);
  const animationTimeRef = useRef(0);
  const lastRenderTimeRef = useRef<number | null>(null);

  // Initialize flow particles with realistic corridor progression
  useEffect(() => {
    const pList: Particle[] = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      const gIdx = i % Math.max(1, gates.length);
      const gate = gates[gIdx];
      const dir: 'ingress' | 'egress' = gate
        ? gate.gateType === 'exit'
          ? 'egress'
          : gate.gateType === 'entry'
          ? 'ingress'
          : Math.random() > 0.4
          ? 'ingress'
          : 'egress'
        : 'ingress';

      pList.push({
        gateIndex: gIdx,
        direction: dir,
        progress: Math.random(),
        speed: 0.12 + Math.random() * 0.18,
        laneOffset: (Math.random() - 0.5) * 16,
        alpha: 0.6 + Math.random() * 0.4,
        trail: [],
      });
    }
    particlesRef.current = pList;
  }, [gates]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const previousTimestamp = lastRenderTimeRef.current ?? timestamp;
      const deltaSeconds = Math.min(0.05, Math.max(0.001, (timestamp - previousTimestamp) / 1000));
      lastRenderTimeRef.current = timestamp;
      animationTimeRef.current += deltaSeconds;
      const frameCount = animationTimeRef.current * 60;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Save context for zoom & pan
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // 1. Temple Complex Cyber Canvas Background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.7);
      bgGrad.addColorStop(0, '#0c162d');
      bgGrad.addColorStop(1, '#040813');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Isometric Temple Grid
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Concentric Radar Distance Rings
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) * 0.46;

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.09)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshairs
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Radar Sweep Effect
      if (showRadarSweep) {
        radarAngleRef.current += 0.015;
        const startAngle = radarAngleRef.current;
        const sweepSpan = 0.35;

        const sweepGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
        sweepGrad.addColorStop(0, 'rgba(245, 158, 11, 0.14)');
        sweepGrad.addColorStop(1, 'rgba(245, 158, 11, 0.01)');

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, startAngle - sweepSpan, startAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(startAngle) * maxRadius, centerY + Math.sin(startAngle) * maxRadius);
        ctx.stroke();
      }

      // Check if current venue is Ayodhya Ram Mandir
      const isAyodhya = gates.some(
        (g) =>
          g.name.toLowerCase().includes('ram') ||
          g.name.toLowerCase().includes('ayodhya') ||
          g.name.toLowerCase().includes('janmabhoomi') ||
          g.zone?.toLowerCase().includes('ayodhya') ||
          g.zone?.toLowerCase().includes('rampath') ||
          g.code?.startsWith('AP-') ||
          g.code?.startsWith('RM-')
      );

      // Water body graphic on top-right: Sarayu River (Ayodhya) or Arabian Sea (Somnath)
      ctx.fillStyle = isAyodhya ? 'rgba(59, 130, 246, 0.16)' : 'rgba(14, 165, 233, 0.14)';
      ctx.beginPath();
      ctx.moveTo(width * 0.65, 0);
      ctx.bezierCurveTo(width * 0.72, height * 0.22, width * 0.88, height * 0.42, width, height * 0.48);
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isAyodhya ? 'rgba(96, 165, 250, 0.85)' : 'rgba(56, 189, 248, 0.7)';
      ctx.font = 'bold 9px var(--font-mono)';
      ctx.fillText(
        isAyodhya ? '🌊 SARAYU RIVER (सरयू नदी - अयोध्या धाम)' : '🌊 ARABIAN SEA (अरब सागर - प्रभास पाटन)',
        width * 0.82,
        20
      );

      // Landmark Marker (Ram ki Paidi or Baan Stambh)
      ctx.fillStyle = isAyodhya ? 'rgba(249, 115, 22, 0.85)' : 'rgba(251, 191, 36, 0.55)';
      ctx.font = 'bold 8px var(--font-mono)';
      ctx.fillText(
        isAyodhya ? '🚩 राम की पैड़ी (RAM KI PAIDI)' : '📍 बाण स्तंभ (BAAN STAMBH)',
        width * 0.85,
        36
      );

      // 3. Temple Perimeter Boundary
      ctx.strokeStyle = isAyodhya ? 'rgba(249, 115, 22, 0.5)' : 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2;
      ctx.shadowColor = isAyodhya ? 'rgba(249, 115, 22, 0.4)' : 'rgba(245, 158, 11, 0.4)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(width * 0.12, height * 0.12, width * 0.76, height * 0.76, 28);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Central Garbhagriha & Sanctum
      const hubRadius = Math.min(width, height) * 0.16;
      const hubGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, hubRadius);
      hubGrad.addColorStop(0, isAyodhya ? 'rgba(249, 115, 22, 0.28)' : 'rgba(245, 158, 11, 0.25)');
      hubGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = hubGrad;
      ctx.strokeStyle = isAyodhya ? 'rgba(251, 146, 60, 0.85)' : 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Temple Dhwaja / Icon
      ctx.fillStyle = isAyodhya ? '#fb923c' : '#fbbf24';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('🚩 गर्भगृह (MAIN SANCTUM)', centerX, centerY - 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px var(--font-display)';
      ctx.fillText(
        isAyodhya ? 'SHRI RAM LALLA DARSHAN' : 'SHREE SOMNATH JYOTIRLINGA',
        centerX,
        centerY + 10
      );

      // Walkway Corridors connecting Gates to Garbhagriha
      gates.forEach((gate) => {
        const gx = (gate.location.x / 100) * width;
        const gy = (gate.location.y / 100) * height;

        ctx.strokeStyle = gate.isChokepoint ? 'rgba(255, 42, 95, 0.45)' : 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = gate.isChokepoint ? 3 : 2;
        ctx.setLineDash(gate.isChokepoint ? [6, 4] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(gx, gy);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 4. Draw Redirection Active Vectors (Animated neon arcs showing flow from Gate A to Gate B as per availability)
      redirections.forEach((redir) => {
        if (redir.status === 'suggested' || redir.status === 'approved' || redir.status === 'active') {
          const sourceGate = gates.find((g) => g.id === redir.sourceGateId);
          const targetGate = gates.find((g) => g.id === redir.targetGateId);
          if (sourceGate && targetGate) {
            const sx = (sourceGate.location.x / 100) * width;
            const sy = (sourceGate.location.y / 100) * height;
            const tx = (targetGate.location.x / 100) * width;
            const ty = (targetGate.location.y / 100) * height;

            const midX = (sx + tx) / 2 + (sy - ty) * 0.28;
            const midY = (sy + ty) / 2 + (tx - sx) * 0.28;

            const targetDensity = Math.round((targetGate.currentCount / Math.max(1, targetGate.maxSafeCapacity)) * 100);
            const targetAvailability = Math.max(0, 100 - targetDensity);
            const isAlternate = redir.recommendedRoute.includes('Option:') || redir.recommendedRoute.startsWith('Alternate route:');
            
            const strokeColor = isAlternate ? '#38bdf8' : '#34d399';
            const shadowGlow = isAlternate ? 'rgba(56, 189, 248, 0.85)' : 'rgba(52, 211, 153, 0.9)';

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isAlternate ? 2.5 : 3.2;
            ctx.setLineDash(isAlternate ? [8, 6] : []);
            ctx.shadowColor = shadowGlow;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(midX, midY, tx, ty);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            // Animated directional pulse moving from source to target
            const t = ((animationTimeRef.current * 0.7) % 1);
            const ax = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
            const ay = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(ax, ay, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Floating Route Tag Pill
            const labelText = `FLOW: ${sourceGate.code} ➔ ${targetGate.code} (${targetAvailability}% Available)`;
            ctx.font = 'bold 9.5px var(--font-mono)';
            const textWidth = ctx.measureText(labelText).width;
            
            ctx.fillStyle = 'rgba(7, 13, 29, 0.92)';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(midX - (textWidth / 2) - 8, midY - 14, textWidth + 16, 20, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = strokeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, midX, midY - 4);
          }
        }
      });

      // 5. Draw Animated Devotee Flow Particles with Saffron/Cyan Comet Trails
      if (showParticles && gates.length > 0) {
        particlesRef.current.forEach((p) => {
          const targetGate = gates[p.gateIndex % gates.length];
          if (!targetGate) return;

          const gx = (targetGate.location.x / 100) * width;
          const gy = (targetGate.location.y / 100) * height;

          // Start & end points of corridor
          const startX = p.direction === 'ingress' ? gx : centerX;
          const startY = p.direction === 'ingress' ? gy : centerY;
          const endX = p.direction === 'ingress' ? centerX : gx;
          const endY = p.direction === 'ingress' ? centerY : gy;

          const dx = endX - startX;
          const dy = endY - startY;
          const dist = Math.hypot(dx, dy) || 1;

          // Perpendicular vector for lane offset
          const nx = -dy / dist;
          const ny = dx / dist;

          // Advance progress
          p.progress += p.speed * deltaSeconds;
          if (p.progress >= 1.0) {
            p.progress = 0;
            p.gateIndex = Math.floor(Math.random() * gates.length);
            const nextGate = gates[p.gateIndex];
            p.direction = nextGate
              ? nextGate.gateType === 'exit'
                ? 'egress'
                : nextGate.gateType === 'entry'
                ? 'ingress'
                : Math.random() > 0.4
                ? 'ingress'
                : 'egress'
              : 'ingress';
            p.laneOffset = (Math.random() - 0.5) * 16;
            p.trail = [];
          }

          const t = p.progress;
          const px = startX + dx * t + nx * p.laneOffset;
          const py = startY + dy * t + ny * p.laneOffset;

          p.trail.push({ x: px, y: py });
          if (p.trail.length > 6) p.trail.shift();

          const isChoke = targetGate.isChokepoint;
          const isExit = p.direction === 'egress';
          const trailColor = isChoke ? 'rgba(255, 42, 95,' : isExit ? 'rgba(56, 189, 248,' : 'rgba(251, 191, 36,';
          const dotColor = isChoke ? '#ff2a5f' : isExit ? '#38bdf8' : '#fbbf24';

          const fade = Math.sin(t * Math.PI); // Smooth fade in and fade out at ends
          const effectiveAlpha = p.alpha * fade;

          if (p.trail.length > 1 && effectiveAlpha > 0.05) {
            ctx.strokeStyle = `${trailColor} ${effectiveAlpha * 0.6})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.stroke();
          }

          if (effectiveAlpha > 0.05) {
            ctx.fillStyle = dotColor;
            ctx.shadowColor = dotColor;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      // 6. Draw Dynamic Density Heat Halos & Gate Nodes
      gates.forEach((gate) => {
        const gx = (gate.location.x / 100) * width;
        const gy = (gate.location.y / 100) * height;
        const density = Math.round((gate.currentCount / Math.max(1, gate.maxSafeCapacity)) * 100);
        const risk = riskAssessments.get(gate.id);
        const riskLevel = risk?.riskLevel || 'NORMAL';
        const isSelected = selectedGateId === gate.id;

        let nodeColor = '#10b981';
        let glowColor = 'rgba(16, 185, 129, 0.45)';
        let haloRadius = 28 + Math.min(65, (density / 100) * 50);

        if (riskLevel === 'STAMPEDE_HAZARD') {
          nodeColor = '#ec4899';
          glowColor = 'rgba(236, 72, 153, 0.65)';
        } else if (riskLevel === 'CRITICAL') {
          nodeColor = '#ff2a5f';
          glowColor = 'rgba(255, 42, 95, 0.6)';
        } else if (riskLevel === 'HIGH') {
          nodeColor = '#ff6b2c';
          glowColor = 'rgba(255, 107, 44, 0.5)';
        } else if (riskLevel === 'MODERATE') {
          nodeColor = '#f59e0b';
          glowColor = 'rgba(245, 158, 11, 0.4)';
        }

        if (gate.sensorStatus === 'offline') {
          nodeColor = '#64748b';
          glowColor = 'rgba(100, 116, 139, 0.3)';
        }

        if (showHeatmap && gate.sensorStatus !== 'offline') {
          const auraGrad = ctx.createRadialGradient(gx, gy, 6, gx, gy, haloRadius);
          auraGrad.addColorStop(0, glowColor);
          auraGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(gx, gy, haloRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (riskLevel === 'CRITICAL' || riskLevel === 'STAMPEDE_HAZARD') {
          const pulseR = 25 + (Math.sin(frameCount * 0.12) + 1) * 9;
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gx, gy, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isSelected ? '#ffffff' : '#0a1124';
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = isSelected ? 4 : 2.5;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isSelected ? 15 : 8;
        ctx.beginPath();
        ctx.arc(gx, gy, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = isSelected ? '#0a1124' : '#ffffff';
        ctx.font = 'bold 10px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gate.code, gx, gy);

        const labelY = gy + 32;
        const availablePct = Math.max(0, 100 - density);
        const redirFromThis = redirections.find((r) => r.sourceGateId === gate.id && r.status !== 'dismissed');
        const redirToThis = redirections.find((r) => r.targetGateId === gate.id && r.status !== 'dismissed');

        ctx.fillStyle = 'rgba(7, 13, 29, 0.94)';
        ctx.strokeStyle = isSelected ? '#fbbf24' : redirFromThis ? '#ff2a5f' : redirToThis ? '#34d399' : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(gx - 62, labelY - 12, 124, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = nodeColor;
        ctx.font = 'bold 9.5px var(--font-mono)';
        const targetG = redirFromThis ? gates.find((g) => g.id === redirFromThis.targetGateId) : null;
        const statusText = redirFromThis
          ? `🔴 Flow➔${targetG ? targetG.code : 'Divert'}`
          : redirToThis
          ? `🟢 +${availablePct}% Avail`
          : `${density}% (${availablePct}% Free)`;
        ctx.fillText(statusText, gx, labelY);

        if (gate.isChokepoint) {
          ctx.fillStyle = '#ff2a5f';
          ctx.beginPath();
          ctx.arc(gx + 15, gy - 15, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px var(--font-sans)';
          ctx.fillText('!', gx + 15, gy - 15);
        }
      });

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [gates, riskAssessments, redirections, selectedGateId, zoom, showHeatmap, showParticles, showRadarSweep]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const unzoomedX = (clickX - centerX) / zoom + centerX;
    const unzoomedY = (clickY - centerY) / zoom + centerY;

    let clickedId: string | null = null;
    gates.forEach((gate) => {
      const gx = (gate.location.x / 100) * canvas.width;
      const gy = (gate.location.y / 100) * canvas.height;
      const dist = Math.sqrt((unzoomedX - gx) ** 2 + (unzoomedY - gy) ** 2);
      if (dist <= 28) {
        clickedId = gate.id;
      }
    });

    onSelectGate(clickedId);
  };

  const selectedGate = gates.find((g) => g.id === selectedGateId);
  const selectedRisk = selectedGate ? riskAssessments.get(selectedGate.id) : null;
  const isAyodhya = gates.some(
    (g) =>
      g.name.toLowerCase().includes('ram') ||
      g.name.toLowerCase().includes('ayodhya') ||
      g.name.toLowerCase().includes('janmabhoomi') ||
      g.zone?.toLowerCase().includes('ayodhya') ||
      g.zone?.toLowerCase().includes('rampath') ||
      g.code?.startsWith('AP-') ||
      g.code?.startsWith('RM-')
  );

  return (
    <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Map Header Controls */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: isAyodhya ? 'rgba(249, 115, 22, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: isAyodhya ? '#fb923c' : '#fbbf24',
          }}>
            <Layers size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {isAyodhya
                ? 'Shri Ram Janmabhoomi Spatial Radar (तीर्थ क्षेत्र स्थानिक रडार)'
                : 'Shri Somnath Jyotirlinga Spatial Radar (તીર્થ ક્ષેત્ર સ્થાનિક રડાર)'}
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isAyodhya
                ? 'Garbhagriha Sanctum, Janmabhoomi Path, Ram Path, Bhakti Path & Sugriva Q-Complex'
                : 'Garbhagriha Sanctum, Digvijay Dwar, Samudra Darshan & Arabian Sea Corridors'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              background: showHeatmap ? 'rgba(245, 158, 11, 0.2)' : 'rgba(20, 35, 70, 0.6)',
              color: showHeatmap ? '#fbbf24' : '#94a3b8',
              border: showHeatmap ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔥 Heatmap {showHeatmap ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowParticles(!showParticles)}
            style={{
              background: showParticles ? 'rgba(99, 102, 241, 0.25)' : 'rgba(20, 35, 70, 0.6)',
              color: showParticles ? '#818cf8' : '#94a3b8',
              border: showParticles ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🚩 Devotee Flows {showParticles ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowRadarSweep(!showRadarSweep)}
            style={{
              background: showRadarSweep ? 'rgba(16, 185, 129, 0.2)' : 'rgba(20, 35, 70, 0.6)',
              color: showRadarSweep ? '#34d399' : '#94a3b8',
              border: showRadarSweep ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📡 Radar {showRadarSweep ? 'ON' : 'OFF'}
          </button>

          <div style={{
            display: 'flex',
            background: 'rgba(13, 22, 42, 0.85)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', padding: '6px 10px', cursor: 'pointer' }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', padding: '6px 10px', cursor: 'pointer' }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', padding: '6px 10px', cursor: 'pointer' }}
              title="Reset View"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div style={{ position: 'relative', width: '100%', minHeight: '400px', flex: 1 }}>
        <canvas
          ref={canvasRef}
          width={840}
          height={480}
          onClick={handleCanvasClick}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'crosshair',
          }}
        />

        {selectedGate && selectedRisk && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(10, 17, 36, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '16px 20px',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
            zIndex: 10,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge badge-${selectedRisk.riskLevel.toLowerCase()}`}>
                  {selectedRisk.riskLevel.replace('_', ' ')} (SCORE: {selectedRisk.compositeScore}/100)
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedGate.name} ({selectedGate.code})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#fbbf24' }}>• {selectedGate.zone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.82rem', color: '#cbd5e1', marginTop: '8px' }}>
                <span>Devotees: <strong style={{ color: '#00d2ff' }}>{selectedGate.currentCount}</strong> / {selectedGate.maxSafeCapacity} ({selectedRisk.densityPercentage}%)</span>
                <span>Trend: <strong style={{ color: selectedRisk.trend === 'surging' ? '#ff2a5f' : '#fbbf24' }}>{selectedRisk.trend.toUpperCase()}</strong> ({selectedRisk.velocityPerMin > 0 ? `+${selectedRisk.velocityPerMin}` : selectedRisk.velocityPerMin}/min)</span>
                <span>Sensor: <strong style={{ color: selectedGate.sensorStatus === 'online' ? '#10b981' : '#ff2a5f' }}>{selectedGate.sensorStatus.toUpperCase()}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {onOpenSOSForGate && (
                <button
                  onClick={() => onOpenSOSForGate(selectedGate.id)}
                  className="btn btn-sos btn-sm"
                >
                  <Flame size={13} />
                  Trigger SOS at {selectedGate.code}
                </button>
              )}
              <button
                onClick={() => onSelectGate(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
