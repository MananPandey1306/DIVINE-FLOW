// Vityarthi Crowd Vision Engine
// Tiered Detection: BlazeFace (close-range) → COCO-SSD (crowd bodies) → Grid Density Estimation (500+ crowds)

import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { FaceDetector, FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";

export interface FacialLandmark {
  x: number;
  y: number;
  score?: number;
  name: "right_eye" | "left_eye" | "nose" | "mouth" | "right_ear" | "left_ear" | string;
}

export interface DetectedEntity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  headX: number;
  headY: number;
  headRadius: number;
  confidence: number;
  label: string;
  trackAge: number;
  distanceTier: "close" | "mid" | "far";
  viewOrientation: "frontal" | "rear_or_side";
  rowCategory: "foreground" | "midground" | "background";
  landmarks?: FacialLandmark[];
  detectionSource?: "blazeface" | "coco_body" | "density_grid" | "simulated";
}

export interface VisionStats {
  fps: number;
  detectedCount: number;
  rawDetections: number;
  inferenceTimeMs: number;
  isProcessing: boolean;
  modelStatus: string;
  activeEngines: string;
  sensitivity: "low" | "medium" | "high" | "ultra" | "max";
  detectionMode: "mediapipe_crowd_face" | "mediapipe_short" | "hybrid" | "cloud_api";
  viewMode: "reticles" | "dots_only" | "landmarks" | "heatmap" | "hybrid";
  distanceBreakdown: { close: number; mid: number; far: number };
  estimatedDemographics: { elderlyRatio: number; childrenRatio: number; pwdRatio: number };
  densityEstimate?: number;
}

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export class VisionDetector {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private lastFrameTime = 0;
  private fps = 30;
  private lastInferenceDurationMs = 12;
  private trackedEntities: DetectedEntity[] = [];
  private onCountUpdate?: (count: number, stats: VisionStats) => void;
  private isRunning = false;
  private mode: "simulated" | "webcam" | "image" | "video_file" = "simulated";
  private countHistory: number[] = [];

  private sensitivity: "low" | "medium" | "high" | "ultra" | "max" = "ultra";
  private detectionMode: "mediapipe_crowd_face" | "mediapipe_short" | "hybrid" | "cloud_api" = "hybrid";
  private viewMode: "reticles" | "dots_only" | "landmarks" | "heatmap" | "hybrid" = "hybrid";
  private confidenceThreshold = 0.28;
  private cocoConfidenceThreshold = 0.18;
  private countMultiplier = 1.0;
  private manualOffset = 0;

  private blazefaceVideoDetector: any = null;
  private blazefaceImageDetector: any = null;
  private isBlazefaceLoading = false;
  private isBlazefaceReady = false;

  private objectDetector: any = null;
  private isObjectDetectorLoading = false;
  private isObjectDetectorReady = false;

  private cocoModel: any = null;
  private isCocoLoading = false;
  private isCocoReady = false;

  private modelStatus = "Loading AI Models...";
  private activeEngines = "Initializing...";
  private remoteApiError = false;
  private lastInferenceTime = 0;
  private isInferencing = false;
  private lastNeuralDetections: DetectedEntity[] = [];
  private nextTrackId = 1;
  private trackMisses = new Map<number, number>();
  private densityEstimate = 0;
  private lastTrackingTime = 0;

  private heatmapCanvas: HTMLCanvasElement | null = null;
  private heatmapCtx: CanvasRenderingContext2D | null = null;

  private simulatedCrowdNodes: Array<{ x: number; y: number; vx: number; vy: number; size: number; distance: "close" | "mid" | "far" }> = [];
  private remoteDetectionApiUrl = typeof import.meta !== "undefined"
    ? ((import.meta as any).env?.VITE_DETECTION_API_URL ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('cams-pro-detection-api-url') ?? 'http://localhost:8000/api/detect' : 'http://localhost:8000/api/detect'))
    : 'http://localhost:8000/api/detect';

  constructor() {
    this.initSimulatedCrowd();
    this.initHeatmapBuffer();
    this.loadBlazeFace();
    this.loadObjectDetector();
    this.loadCocoModel();
  }

  private initHeatmapBuffer() {
    this.heatmapCanvas = document.createElement("canvas");
    this.heatmapCanvas.width = 200;
    this.heatmapCanvas.height = 120;
    this.heatmapCtx = this.heatmapCanvas.getContext("2d");
  }

  private initSimulatedCrowd() {
    this.simulatedCrowdNodes = [];
    for (let i = 0; i < 38; i++) {
      const y = 30 + Math.random() * 330;
      const isFar = y < 120;
      const isMid = y >= 120 && y < 240;
      this.simulatedCrowdNodes.push({ x: 30 + Math.random() * 580, y, vx: (Math.random() - 0.5) * 1.0, vy: (Math.random() - 0.5) * 0.7, size: isFar ? 12 : isMid ? 22 : 34, distance: isFar ? "far" : isMid ? "mid" : "close" });
    }
  }

  private async loadBlazeFace() {
    if (this.isBlazefaceLoading || this.isBlazefaceReady) return;
    this.isBlazefaceLoading = true;
    this.modelStatus = "Loading BlazeFace AI...";
    try {
      const wasmFileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const modelUrl = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
      const opts = (mode: string) => ({ baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" as any }, runningMode: mode as any, minDetectionConfidence: this.confidenceThreshold, minSuppressionThreshold: 0.3 });
      const optsCPU = (mode: string) => ({ baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" as any }, runningMode: mode as any, minDetectionConfidence: this.confidenceThreshold, minSuppressionThreshold: 0.3 });
      try { this.blazefaceVideoDetector = await FaceDetector.createFromOptions(wasmFileset, opts("VIDEO")); }
      catch { this.blazefaceVideoDetector = await FaceDetector.createFromOptions(wasmFileset, optsCPU("VIDEO")); }
      try { this.blazefaceImageDetector = await FaceDetector.createFromOptions(wasmFileset, opts("IMAGE")); }
      catch { try { this.blazefaceImageDetector = await FaceDetector.createFromOptions(wasmFileset, optsCPU("IMAGE")); } catch (e) { console.warn("BlazeFace image detector unavailable:", e); } }
      this.isBlazefaceReady = true;
      this.modelStatus = "BlazeFace fallback ready";
      this.activeEngines = "COCO-SSD primary; BlazeFace fallback";
      console.log("✅ BlazeFace loaded");
    } catch (e) {
      console.error("BlazeFace load failed:", e);
      this.modelStatus = "BlazeFace unavailable - COCO-SSD only";
    } finally { this.isBlazefaceLoading = false; }
  }

  private async loadObjectDetector() {
    if (this.isObjectDetectorLoading || this.isObjectDetectorReady || !ObjectDetector) return;
    this.isObjectDetectorLoading = true;
    this.modelStatus = "Loading Object Detector...";
    try {
      const wasmFileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const modelUrl = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
      const opts = (mode: string) => ({
        baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" as any },
        runningMode: mode as any,
        scoreThreshold: this.confidenceThreshold,
        categoryAllowlist: ["person"],
      });
      const optsCPU = (mode: string) => ({
        baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" as any },
        runningMode: mode as any,
        scoreThreshold: this.confidenceThreshold,
        categoryAllowlist: ["person"],
      });
      try { this.objectDetector = await ObjectDetector.createFromOptions(wasmFileset, opts("VIDEO")); }
      catch { this.objectDetector = await ObjectDetector.createFromOptions(wasmFileset, optsCPU("VIDEO")); }
      this.isObjectDetectorReady = true;
      this.modelStatus = "Object Detector fallback ready";
      this.activeEngines = "COCO-SSD primary; Object Detector fallback";
      console.log("✅ MediaPipe ObjectDetector loaded");
    } catch (e) {
      console.warn("ObjectDetector load failed:", e);
      this.modelStatus = "Object Detector unavailable - fallback detection active";
    } finally {
      this.isObjectDetectorLoading = false;
    }
  }

  private async loadCocoModel() {
    if (this.cocoModel || this.isCocoLoading) return;
    this.isCocoLoading = true;
    try {
      await tf.ready();
      this.cocoModel = await cocoSsd.load({ base: "mobilenet_v2" });
      this.isCocoReady = true;
      console.log("✅ COCO-SSD crowd body detector loaded");
      if (!this.modelStatus.includes("BlazeFace") && !this.modelStatus.includes("Object Detector")) this.modelStatus = "COCO-SSD Crowd Engine Ready";
    } catch (e) { console.warn("COCO-SSD load failed:", e); }
    finally { this.isCocoLoading = false; }
  }

  public setCallback(callback: (count: number, stats: VisionStats) => void) { this.onCountUpdate = callback; }
  public setDetectionApiUrl(apiUrl: string) {
    const next = apiUrl.trim();
    this.remoteDetectionApiUrl = next;
    this.detectionMode = next ? 'cloud_api' : 'hybrid';
    this.remoteApiError = false;
  }
  public getSensitivity() { return this.sensitivity; }
  public getDetectionMode() { return this.detectionMode; }

  public setSensitivity(s: "low" | "medium" | "high" | "ultra" | "max") {
    this.sensitivity = s;
    if (s === "low") { this.confidenceThreshold = 0.45; this.cocoConfidenceThreshold = 0.25; }
    else if (s === "medium") { this.confidenceThreshold = 0.35; this.cocoConfidenceThreshold = 0.20; }
    else if (s === "high") { this.confidenceThreshold = 0.28; this.cocoConfidenceThreshold = 0.18; }
    else if (s === "ultra") { this.confidenceThreshold = 0.22; this.cocoConfidenceThreshold = 0.15; }
    else if (s === "max") { this.confidenceThreshold = 0.18; this.cocoConfidenceThreshold = 0.12; }
    try { this.blazefaceVideoDetector?.setOptions({ minDetectionConfidence: this.confidenceThreshold }); } catch {}
    try { this.blazefaceImageDetector?.setOptions({ minDetectionConfidence: this.confidenceThreshold }); } catch {}
  }

  public setDetectionMode(mode: "mediapipe_crowd_face" | "mediapipe_short" | "hybrid" | "cloud_api") { this.detectionMode = mode; }
  public setViewMode(mode: "reticles" | "dots_only" | "landmarks" | "heatmap" | "hybrid") { this.viewMode = mode; }
  public setCalibration(multiplier: number, offset: number) { this.countMultiplier = multiplier; this.manualOffset = offset; }

  public startSimulation(canvas: HTMLCanvasElement) {
    this.stop();
    this.canvasElement = canvas;
    this.canvasElement.width = 640;
    this.canvasElement.height = 360;
    this.mode = "simulated";
    this.isRunning = true;
    this.trackedEntities = [];
    this.trackMisses.clear();
    this.countHistory = [];
    this.lastNeuralDetections = [];
    this.lastInferenceTime = 0;
    this.loopSimulation();
  }

  public async startWebcam(video: HTMLVideoElement, canvas: HTMLCanvasElement, facingMode: "user" | "environment" = "user"): Promise<boolean> {
    this.stop();
    this.videoElement = video;
    this.canvasElement = canvas;
    this.mode = "webcam";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode }, audio: false });
      video.srcObject = stream;
      await video.play();
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      this.isRunning = true;
      this.trackedEntities = [];
      this.trackMisses.clear();
      this.lastNeuralDetections = [];
      this.countHistory = [];
      this.lastInferenceTime = 0;
      this.loopVideo();
      return true;
    } catch (err) {
      console.warn("Webcam access failed:", err);
      this.stop();
      return false;
    }
  }

  public async startScreenCapture(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<boolean> {
    this.stop();
    this.videoElement = video;
    this.canvasElement = canvas;
    this.mode = "webcam"; // Treat it as a continuous stream like webcam
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      video.srcObject = stream;
      await video.play();
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      this.isRunning = true;
      this.trackedEntities = [];
      this.trackMisses.clear();
      this.lastNeuralDetections = [];
      this.lastInferenceTime = 0;
      this.countHistory = [];
      this.lastTrackingTime = 0;
      this.loopVideo();
      
      // Handle the user clicking 'Stop sharing' on the browser's floating bar
      stream.getVideoTracks()[0].onended = () => {
        this.startSimulation(canvas);
      };
      
      return true;
    } catch (err) {
      console.warn("Screen capture failed:", err);
      this.stop();
      return false;
    }
  }

  public async analyzeStaticImage(imageElement: HTMLImageElement, canvas: HTMLCanvasElement): Promise<DetectedEntity[]> {
    this.stop();
    this.canvasElement = canvas;
    this.mode = "image";
    const width = imageElement.naturalWidth || imageElement.width || 1280;
    const height = imageElement.naturalHeight || imageElement.height || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const startTime = performance.now();
    ctx.drawImage(imageElement, 0, 0, width, height);
    const detections = await this.runImageDetection(imageElement, width, height);
    this.lastInferenceDurationMs = Math.round(performance.now() - startTime);
    this.trackedEntities = detections;
    this.renderOverlays(ctx, width, height);
    const finalCount = this.computeFinalCount();
    this.renderTelemetryHUD(ctx, width, height, finalCount);
    this.calculateStatsAndNotify(finalCount);
    return detections;
  }

  public async playVideoFile(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<void> {
    this.stop();
    this.videoElement = video;
    this.canvasElement = canvas;
    this.mode = "video_file";
    await video.play();
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    this.isRunning = true;
    this.trackedEntities = [];
    this.trackMisses.clear();
    this.countHistory = [];
    this.lastTrackingTime = 0;
    this.loopVideo();
  }

  public stop() {
    this.isRunning = false;
    this.lastTrackingTime = 0;
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.videoElement?.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      this.videoElement.srcObject = null;
    }
  }

  private loopVideo = async () => {
    if (!this.isRunning || !this.canvasElement || !this.videoElement) return;
    const ctx = this.canvasElement.getContext("2d");
    if (!ctx) return;
    const video = this.videoElement;
    if (video.readyState >= 2 && !video.paused && !video.ended) {
      const width = this.canvasElement.width;
      const height = this.canvasElement.height;
      ctx.drawImage(video, 0, 0, width, height);
      const now = performance.now();
      if (!this.isInferencing && now - this.lastInferenceTime >= 120) {
        this.lastInferenceTime = now;
        this.isInferencing = true;
        const infStart = performance.now();
        this.runVideoInference(video, width, height)
          .then((raw) => { this.lastInferenceDurationMs = Math.round(performance.now() - infStart); this.lastNeuralDetections = raw; this.isInferencing = false; })
          .catch((err) => { console.warn("Inference error:", err); this.isInferencing = false; });
      }
      this.trackedEntities = this.smoothAndTrack(this.lastNeuralDetections);
      this.renderOverlays(ctx, width, height);
      const finalCount = this.computeFinalCount();
      this.renderTelemetryHUD(ctx, width, height, finalCount);
      this.calculateStatsAndNotify(finalCount);
    }
    this.animFrameId = requestAnimationFrame(this.loopVideo);
  };

  private async runVideoInference(video: HTMLVideoElement, width: number, height: number): Promise<DetectedEntity[]> {
    const detections: DetectedEntity[] = [];
    const ts = performance.now();

    if (this.remoteDetectionApiUrl) {
      const remote = await this.callRemoteDetectionApi(video, width, height);
      if (remote && remote.length) return remote;
    }

    if (this.isCocoReady && this.cocoModel) {
      try {
        const preds = await this.cocoModel.detect(video, 100, this.cocoConfidenceThreshold);
        detections.push(...this.parseCocoPredictions(preds.filter((p: any) => p.class === "person"), width, height));
      } catch (e) { console.warn("COCO inference error:", e); }
    } else if (this.isObjectDetectorReady && this.objectDetector) {
      try {
        const r = this.objectDetector.detectForVideo(video, ts);
        if (r?.detections) detections.push(...this.parseObjectDetections(r.detections, width, height));
      } catch (e) { console.warn("ObjectDetector inference error:", e); }
    } else if (this.isBlazefaceReady && this.blazefaceVideoDetector) {
      try {
        const r = this.blazefaceVideoDetector.detectForVideo(video, ts);
        if (r?.detections) detections.push(...this.parseBlazeFaceDetections(r.detections, width, height));
      } catch {}
    }

    const refined = this.refineCrowdDetections(detections);
    this.densityEstimate = this.estimateDensityGrid(refined, width, height);
    return this.applyNMS(refined);
  }

  private async runImageDetection(source: HTMLImageElement | HTMLCanvasElement, width: number, height: number): Promise<DetectedEntity[]> {
    const detections: DetectedEntity[] = [];

    if (this.remoteDetectionApiUrl) {
      const remote = await this.callRemoteDetectionApi(source, width, height);
      if (remote && remote.length) return remote;
    }

    if (this.isCocoReady && this.cocoModel) {
      try {
        const preds = await this.cocoModel.detect(source, 100, this.cocoConfidenceThreshold);
        detections.push(...this.parseCocoPredictions(preds.filter((p: any) => p.class === "person"), width, height));
      } catch (e) { console.warn("COCO image error:", e); }
    } else if (this.isObjectDetectorReady && this.objectDetector) {
      try {
        const r = this.objectDetector.detect(source);
        if (r?.detections) detections.push(...this.parseObjectDetections(r.detections, width, height));
      } catch (e) { console.warn("ObjectDetector image error:", e); }
    } else if (this.isBlazefaceReady && this.blazefaceImageDetector) {
      try {
        const r = this.blazefaceImageDetector.detect(source);
        if (r?.detections) detections.push(...this.parseBlazeFaceDetections(r.detections, width, height));
      } catch (e) { console.warn("BlazeFace image error:", e); }
    }

    const refined = this.refineCrowdDetections(detections);
    this.densityEstimate = this.estimateDensityGrid(refined, width, height);
    return this.applyNMS(refined);
  }

  private estimateCrowdDensityFromCanvas(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, width: number, height: number): number {
    const sampleWidth = 160;
    const sampleHeight = Math.max(90, Math.round((sampleWidth * height) / Math.max(1, width)));
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleWidth;
    tempCanvas.height = sampleHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return 0;
    tempCtx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
    const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let colorPixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];
      if (a < 40) continue;
      totalPixels += 1;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightness = (r + g + b) / 3;
      const isHumanTone = brightness > 25 && brightness < 230 && saturation > 0.18 && (Math.abs(r - g) > 20 || Math.abs(g - b) > 20 || Math.abs(r - b) > 20);
      if (isHumanTone || (saturation > 0.28 && brightness > 30 && brightness < 220)) {
        colorPixels += 1;
      }
    }

    const ratio = totalPixels ? colorPixels / totalPixels : 0;
    if (ratio < 0.08) return 0;
    return Math.min(4000, Math.round((ratio * sampleWidth * sampleHeight) / 9));
  }

  private refineCrowdDetections(detections: DetectedEntity[]): DetectedEntity[] {
    const filtered = detections.filter((d) => {
      const area = d.width * d.height;
      const acceptableSize = area >= 70 && (d.headRadius >= 4 || d.distanceTier !== 'far');
      const confidenceGuard = d.confidence >= 0.12 || d.distanceTier === 'close' || d.confidence >= 0.08;
      return acceptableSize && confidenceGuard;
    });

    const merged: DetectedEntity[] = [];
    for (const item of filtered.sort((a, b) => b.confidence - a.confidence)) {
      const near = merged.find((candidate) => {
        const dx = candidate.headX - item.headX;
        const dy = candidate.headY - item.headY;
        const radius = Math.max(16, (candidate.headRadius + item.headRadius) * 0.75);
        return Math.hypot(dx, dy) <= radius;
      });

      if (!near) {
        merged.push(item);
        continue;
      }

      const updated = {
        ...near,
        headX: (near.headX * 0.5 + item.headX * 0.5),
        headY: (near.headY * 0.5 + item.headY * 0.5),
        headRadius: Math.max(near.headRadius, item.headRadius),
        confidence: Math.max(near.confidence, item.confidence),
        trackAge: Math.max(near.trackAge, item.trackAge),
      };
      const idx = merged.indexOf(near);
      merged[idx] = updated;
    }

    return merged;
  }

  private async callRemoteDetectionApi(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, width: number, height: number): Promise<DetectedEntity[] | null> {
    const url = this.remoteDetectionApiUrl.trim();
    if (!url) return null;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(source, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', 0.85));
      const base64 = await blobToBase64(blob);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ image: base64, width, height, source: 'yolo_crowd' }),
      });

      if (!response.ok) {
        this.remoteApiError = true;
        this.modelStatus = `Remote API error (${response.status})`;
        return null;
      }
      const data = await response.json();
      if (data?.error) {
        this.remoteApiError = true;
        this.modelStatus = "Remote API model unavailable";
        return null;
      }

      const count = Number(
        data?.count ??
        data?.people ??
        data?.total_count ??
        data?.crowd_count ??
        data?.metrics?.count ??
        data?.result?.count ??
        0
      );

      const detectionsFromPayload = Array.isArray(data?.detections) ? data.detections :
        Array.isArray(data?.people) ? data.people :
        Array.isArray(data?.predictions) ? data.predictions :
        Array.isArray(data?.boxes) ? data.boxes :
        [];

      const formatted: DetectedEntity[] = detectionsFromPayload.map((item: any, idx: number) => {
        const box = item?.bbox ?? item?.box ?? item?.coordinates ?? item?.xyxy ?? item?.position ?? null;
        const x = Number(item?.x ?? item?.center_x ?? item?.cx ?? item?.centerX ?? box?.[0] ?? 0);
        const y = Number(item?.y ?? item?.center_y ?? item?.cy ?? item?.centerY ?? box?.[1] ?? 0);
        const rawWidth = item?.width ?? item?.w ?? (item?.x2 !== undefined ? Number(item.x2) - x : box ? Number(box[2]) - x : 0);
        const rawHeight = item?.height ?? item?.h ?? (item?.y2 !== undefined ? Number(item.y2) - y : box ? Number(box[3]) - y : 0);
        const w = Number(rawWidth);
        const h = Number(rawHeight);

        return {
          id: idx + 1,
          x: Number.isFinite(x) ? x : width / 2,
          y: Number.isFinite(y) ? y : height / 2,
          width: Number.isFinite(w) && w > 0 ? w : 24,
          height: Number.isFinite(h) && h > 0 ? h : 32,
          headX: Number.isFinite(x) ? x : width / 2,
          headY: Number.isFinite(y) ? y : height / 2,
          headRadius: Math.max(6, Math.min(24, (Number.isFinite(w) && w > 0 ? w : 24) * 0.2)),
          confidence: Number(item?.confidence ?? item?.score ?? 0.8),
          label: `Person #${idx + 1}`,
          trackAge: 10,
          distanceTier: (Number.isFinite(h) && h > height * 0.2 ? 'close' : Number.isFinite(h) && h > height * 0.08 ? 'mid' : 'far') as any,
          viewOrientation: 'rear_or_side',
          rowCategory: (Number.isFinite(y) && y < height * 0.38 ? 'background' : Number.isFinite(y) && y < height * 0.68 ? 'midground' : 'foreground') as any,
          detectionSource: 'coco_body' as const,
        };
      });

      if (formatted.length) {
        this.remoteApiError = false;
        this.modelStatus = "YOLO-CROWD API active";
        this.activeEngines = "YOLO-CROWD remote API";
        this.densityEstimate = Number.isFinite(count) ? Math.round(count) : this.densityEstimate;
        return formatted;
      }

      if (Number.isFinite(count) && count > 0) {
        this.remoteApiError = false;
        this.modelStatus = "YOLO-CROWD API active";
        this.activeEngines = "YOLO-CROWD remote API";
        const syntheticDetections: DetectedEntity[] = Array.from({ length: Math.min(600, Math.max(1, Math.round(count))) }, (_, idx) => {
          const col = idx % 18;
          const row = Math.floor(idx / 18);
          const x = width * ((col + 0.5) / 18);
          const y = height * ((row + 0.5) / 18);
          return {
            id: idx + 1,
            x,
            y,
            width: 22,
            height: 32,
            headX: x,
            headY: y,
            headRadius: 10,
            confidence: 0.8,
            label: `Person #${idx + 1}`,
            trackAge: 10,
            distanceTier: y < height * 0.3 ? 'close' : y < height * 0.7 ? 'mid' : 'far',
            viewOrientation: 'rear_or_side',
            rowCategory: y < height * 0.38 ? 'background' : y < height * 0.68 ? 'midground' : 'foreground',
            detectionSource: 'coco_body' as const,
          };
        });
        this.densityEstimate = Math.round(count);
        return syntheticDetections;
      }

      return null;
    } catch {
      this.remoteApiError = true;
      this.modelStatus = "Remote API unreachable; using local fallback";
      return null;
    }
  }

  private estimateDensityGrid(detections: DetectedEntity[], width: number, height: number): number {
    const COLS = 8, ROWS = 5;
    const cellW = width / COLS, cellH = height / ROWS;
    let bonus = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const n = detections.filter((d) => d.headX >= col * cellW && d.headX < (col + 1) * cellW && d.headY >= row * cellH && d.headY < (row + 1) * cellH).length;
        if (n >= 3) bonus += n * 1.8;
      }
    }
    return Math.round(bonus);
  }

  private parseObjectDetections(raw: any[], width: number, height: number): DetectedEntity[] {
    return raw
      .filter((det: any) => det?.categories?.some((c: any) => (c.categoryName || c.label || '').toLowerCase() === 'person' || c.categoryName === 'person'))
      .map((det: any, idx: number) => {
        const box = det.boundingBox;
        if (!box) return null;
        const score = det.categories?.[0]?.score ?? 0.8;
        const isNorm = box.width <= 1.0 && box.height <= 1.0 && box.originX <= 1.0 && box.originY <= 1.0;
        const bx = Math.max(0, isNorm ? box.originX * width : box.originX);
        const by = Math.max(0, isNorm ? box.originY * height : box.originY);
        const bw = Math.max(12, isNorm ? box.width * width : box.width);
        const bh = Math.max(18, isNorm ? box.height * height : box.height);
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        const headRadius = Math.max(7, Math.min(34, Math.max(bw, bh) * 0.18));
        return {
          id: idx + 1,
          x: cx,
          y: cy,
          width: bw,
          height: bh,
          headX: cx,
          headY: by + bh * 0.22,
          headRadius,
          confidence: Math.round(score * 100) / 100,
          label: `Person #${idx + 1}`,
          trackAge: 10,
          distanceTier: (bh > height * 0.3 ? 'close' : bh > height * 0.08 ? 'mid' : 'far') as any,
          viewOrientation: 'rear_or_side' as const,
          rowCategory: (cy < height * 0.38 ? 'background' : cy < height * 0.68 ? 'midground' : 'foreground') as any,
          detectionSource: 'coco_body' as const,
        };
      }).filter(Boolean) as DetectedEntity[];
  }

  private parseBlazeFaceDetections(raw: any[], width: number, height: number): DetectedEntity[] {
    return raw.map((det: any, idx: number) => {
      const box = det.boundingBox;
      if (!box) return null;
      const score = det.categories?.[0]?.score ?? 0.85;
      if (score < this.confidenceThreshold) return null;
      const isNorm = box.width <= 1.0 && box.height <= 1.0 && box.originX <= 1.0 && box.originY <= 1.0;
      const bx = Math.max(0, isNorm ? box.originX * width : box.originX);
      const by = Math.max(0, isNorm ? box.originY * height : box.originY);
      const bw = Math.max(10, isNorm ? box.width * width : box.width);
      const bh = Math.max(10, isNorm ? box.height * height : box.height);
      const cx = bx + bw / 2, cy = by + bh / 2;
      const headRadius = Math.max(8, Math.max(bw, bh) * 0.48);
      const distanceTier: "close" | "mid" | "far" = bw > width * 0.14 ? "close" : bw < width * 0.04 ? "far" : "mid";
      const landmarks: FacialLandmark[] = [];
      if (det.keypoints?.length > 0) {
        const names = ["right_eye", "left_eye", "nose", "mouth", "right_ear", "left_ear"] as const;
        det.keypoints.forEach((kp: any, ki: number) => {
          landmarks.push({ x: kp.x <= 1.0 ? kp.x * width : kp.x, y: kp.y <= 1.0 ? kp.y * height : kp.y, score: kp.score ?? 0.9, name: names[ki] || `lm_${ki}` });
        });
      }
      return { id: idx + 1, x: cx, y: cy + bh * 0.5, width: bw * 2, height: bh * 4, headX: cx, headY: cy, headRadius, confidence: Math.round(score * 100) / 100, label: `Person #${idx + 1}`, trackAge: 10, distanceTier, viewOrientation: "frontal" as const, rowCategory: (cy < height * 0.38 ? "background" : cy < height * 0.68 ? "midground" : "foreground") as any, landmarks, detectionSource: "blazeface" as const };
    }).filter(Boolean) as DetectedEntity[];
  }

  private parseCocoPredictions(persons: any[], width: number, height: number): DetectedEntity[] {
    return persons
      .filter((p: any) => p.score >= this.cocoConfidenceThreshold)
      .map((p: any, idx: number) => {
        const [bx, by, bw, bh] = p.bbox;
        const cx = bx + bw / 2, cy = by + bh / 2;
        return { id: idx + 1, x: cx, y: cy, width: bw, height: bh, headX: cx, headY: by + bh * 0.15, headRadius: Math.max(6, Math.min(50, bw * 0.25)), confidence: Math.round(p.score * 100) / 100, label: `Person #${idx + 1}`, trackAge: 10, distanceTier: (bh > height * 0.35 ? "close" : bh > height * 0.10 ? "mid" : "far") as any, viewOrientation: "rear_or_side" as const, rowCategory: (cy < height * 0.38 ? "background" : cy < height * 0.68 ? "midground" : "foreground") as any, detectionSource: "coco_body" as const };
      })
      .filter(Boolean) as DetectedEntity[];
  }

  private applyNMS(detections: DetectedEntity[], iouThreshold = 0.42): DetectedEntity[] {
    detections.sort((a, b) => b.confidence - a.confidence);
    const accepted: DetectedEntity[] = [];
    for (const cand of detections) {
      const r = Math.max(cand.headRadius, 8);
      const [cx1, cy1, cx2, cy2] = [cand.headX - r, cand.headY - r, cand.headX + r, cand.headY + r];
      const candArea = (cx2 - cx1) * (cy2 - cy1);
      let suppressed = false;
      for (const kept of accepted) {
        const kr = Math.max(kept.headRadius, 8);
        const [kx1, ky1, kx2, ky2] = [kept.headX - kr, kept.headY - kr, kept.headX + kr, kept.headY + kr];
        if (cand.distanceTier === "far" && kept.distanceTier === "far") {
          if (Math.hypot(kept.headX - cand.headX, kept.headY - cand.headY) < 12) { suppressed = true; break; }
          continue;
        }
        const interW = Math.max(0, Math.min(cx2, kx2) - Math.max(cx1, kx1));
        const interH = Math.max(0, Math.min(cy2, ky2) - Math.max(cy1, ky1));
        const interArea = interW * interH;
        if (interArea === 0) continue;
        const keptArea = (kx2 - kx1) * (ky2 - ky1);
        const iou = interArea / (candArea + keptArea - interArea || 1);
        if (iou > iouThreshold) { suppressed = true; break; }
      }
      if (!suppressed) accepted.push(cand);
    }
    return accepted;
  }

  private smoothAndTrack(current: DetectedEntity[]): DetectedEntity[] {
    if (this.trackedEntities.length === 0) {
      return current.map((e) => {
        const id = this.nextTrackId++;
        this.trackMisses.set(id, 0);
        return { ...e, id, label: `Person #${id}` };
      });
    }
    const now = performance.now();
    const deltaSeconds = this.lastTrackingTime ? Math.min(0.1, Math.max(0.01, (now - this.lastTrackingTime) / 1000)) : 0.033;
    this.lastTrackingTime = now;
    const alpha = Math.min(0.24, Math.max(0.12, deltaSeconds * 4));
    const smoothed: DetectedEntity[] = [];
    const used = new Set<number>();
    current.forEach((curr) => {
      let bestIdx = -1;
      let minDist = curr.distanceTier === "far" ? 30 : curr.distanceTier === "mid" ? 55 : 90;
      this.trackedEntities.forEach((prev, idx) => {
        if (used.has(idx)) return;
        const d = Math.hypot(prev.headX - curr.headX, prev.headY - curr.headY);
        if (d < minDist) { minDist = d; bestIdx = idx; }
      });
      if (bestIdx >= 0) {
        const prev = this.trackedEntities[bestIdx];
        used.add(bestIdx);
        this.trackMisses.set(prev.id, 0);
        const velocityX = curr.headX - prev.headX;
        const velocityY = curr.headY - prev.headY;
        const predictedX = curr.headX + velocityX * Math.min(0.12, deltaSeconds * 2);
        const predictedY = curr.headY + velocityY * Math.min(0.12, deltaSeconds * 2);
        smoothed.push({
          ...curr,
          id: prev.id,
          headX: prev.headX * (1 - alpha) + predictedX * alpha,
          headY: prev.headY * (1 - alpha) + predictedY * alpha,
          headRadius: prev.headRadius * (1 - alpha) + curr.headRadius * alpha,
          trackAge: prev.trackAge + 1,
        });
      } else {
        const id = this.nextTrackId++;
        this.trackMisses.set(id, 0);
        smoothed.push({ ...curr, id });
      }
    });

    // Keep a track alive briefly through detector jitter or partial occlusion.
    this.trackedEntities.forEach((previous, index) => {
      if (used.has(index)) return;
      const missed = (this.trackMisses.get(previous.id) ?? 0) + 1;
      this.trackMisses.set(previous.id, missed);
      if (missed <= 8) {
        smoothed.push({ ...previous, confidence: previous.confidence * 0.92, trackAge: previous.trackAge + 1 });
      } else {
        this.trackMisses.delete(previous.id);
      }
    });

    return smoothed.map((s) => ({ ...s, label: `Person #${s.id}` }));
  }

  private computeFinalCount(): number {
    const base = this.trackedEntities.length;
    const recentAverage = this.countHistory.length ? Math.round(this.countHistory.reduce((a, b) => a + b, 0) / this.countHistory.length) : base;
    const finalCount = Math.round(base * 0.65 + recentAverage * 0.35);
    return Math.max(0, Math.round(finalCount * this.countMultiplier + this.manualOffset));
  }

  private renderOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.viewMode === "heatmap" || this.viewMode === "hybrid") this.renderHeatmap(ctx, width, height);
    if (this.viewMode !== "heatmap") this.renderEntities(ctx, this.trackedEntities, this.viewMode);
  }

  private renderEntities(ctx: CanvasRenderingContext2D, entities: DetectedEntity[], viewType: string) {
    entities.forEach((entity) => {
      const { headX: hX, headY: hY, headRadius: hR, distanceTier, detectionSource } = entity;
      const color = detectionSource === "blazeface" ? "#00d2ff" : detectionSource === "coco_body" ? "#34d399" : detectionSource === "simulated" ? "#a78bfa" : "#f59e0b";
      const lw = distanceTier === "far" ? 1.2 : distanceTier === "mid" ? 1.6 : 2.0;
      if (viewType === "dots_only") { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(hX, hY, Math.max(3, hR * 0.35), 0, Math.PI * 2); ctx.fill(); return; }
      const bW = Math.max(20, hR * 2.2), bH = Math.max(26, hR * 2.8);
      const bX = hX - bW / 2, bY = hY - bH / 2;
      const cLen = Math.min(9, Math.max(3, bW * 0.22));
      ctx.fillStyle = `${color}12`; ctx.fillRect(bX, bY, bW, bH);
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
      ctx.moveTo(bX, bY + cLen); ctx.lineTo(bX, bY); ctx.lineTo(bX + cLen, bY);
      ctx.moveTo(bX + bW - cLen, bY); ctx.lineTo(bX + bW, bY); ctx.lineTo(bX + bW, bY + cLen);
      ctx.moveTo(bX, bY + bH - cLen); ctx.lineTo(bX, bY + bH); ctx.lineTo(bX + cLen, bY + bH);
      ctx.moveTo(bX + bW - cLen, bY + bH); ctx.lineTo(bX + bW, bY + bH); ctx.lineTo(bX + bW, bY + bH - cLen);
      ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(hX, hY, 2, 0, Math.PI * 2); ctx.fill();
      if (entity.landmarks?.length && (viewType === "landmarks" || viewType === "hybrid" || viewType === "reticles")) {
        entity.landmarks.forEach((lm) => { ctx.fillStyle = "#00d2ff"; ctx.beginPath(); ctx.arc(lm.x, lm.y, distanceTier === "far" ? 1.2 : 2, 0, Math.PI * 2); ctx.fill(); });
      }
      if (distanceTier !== "far" && viewType !== "dots_only") {
        const badge = `${Math.round(entity.confidence * 100)}%`;
        ctx.fillStyle = "rgba(7,13,29,0.88)"; ctx.strokeStyle = color; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.roundRect(bX, bY - 14, 28, 12, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 7.5px monospace"; ctx.fillText(badge, bX + 4, bY - 4);
      }
    });
  }

  private renderHeatmap(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.heatmapCtx || !this.heatmapCanvas) return;
    const hW = this.heatmapCanvas.width, hH = this.heatmapCanvas.height;
    this.heatmapCtx.clearRect(0, 0, hW, hH);
    this.trackedEntities.forEach((e) => {
      const hx = (e.headX / width) * hW, hy = (e.headY / height) * hH;
      const r = Math.max(10, (e.headRadius / width) * hW * 3.5);
      const g = this.heatmapCtx!.createRadialGradient(hx, hy, 0, hx, hy, r);
      g.addColorStop(0, "rgba(255, 42, 95, 0.9)"); g.addColorStop(0.4, "rgba(245, 158, 11, 0.6)"); g.addColorStop(0.8, "rgba(0, 210, 255, 0.25)"); g.addColorStop(1, "rgba(0, 210, 255, 0)");
      this.heatmapCtx!.fillStyle = g; this.heatmapCtx!.beginPath(); this.heatmapCtx!.arc(hx, hy, r, 0, Math.PI * 2); this.heatmapCtx!.fill();
    });
    ctx.save(); ctx.globalAlpha = 0.48; ctx.drawImage(this.heatmapCanvas, 0, 0, width, height); ctx.restore();
  }

  private renderTelemetryHUD(ctx: CanvasRenderingContext2D, width: number, height: number, count: number) {
    ctx.fillStyle = "rgba(4,8,19,0.88)"; ctx.fillRect(0, 0, width, 28);
    const eng = this.remoteApiError ? "LOCAL FALLBACK" : this.detectionMode === "cloud_api" && this.activeEngines.includes("YOLO") ? "YOLO-CROWD API" : this.isCocoReady ? "COCO-SSD PERSON" : this.isObjectDetectorReady ? "OBJECT DETECTOR" : this.isBlazefaceReady ? "BLAZEFACE FALLBACK" : "LOADING";
    ctx.fillStyle = "#00d2ff"; ctx.font = "bold 10px monospace";
    ctx.fillText(`${eng} // ${this.lastInferenceDurationMs}ms // HEADCOUNT: ${count}`, 12, 18);
    ctx.fillStyle = "#fbbf24"; ctx.font = "9px monospace";
    ctx.fillText(`[${this.sensitivity.toUpperCase()}] ${this.modelStatus}`, Math.max(width - 380, width * 0.5), 18);
    ctx.fillStyle = "#ff3366"; ctx.beginPath(); ctx.arc(width - 38, 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px monospace"; ctx.fillText("LIVE", width - 30, 18);
  }

  private loopSimulation = () => {
    if (!this.isRunning || !this.canvasElement) return;
    const ctx = this.canvasElement.getContext("2d");
    if (!ctx) return;
    const width = this.canvasElement.width, height = this.canvasElement.height;
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#080e1a"); bg.addColorStop(1, "#04080f");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(0, 210, 255, 0.06)"; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    this.trackedEntities = [];
    this.simulatedCrowdNodes.forEach((node, idx) => {
      node.x += node.vx; node.y += node.vy;
      if (node.x < 25 || node.x > width - 25) node.vx *= -1;
      if (node.y < 30 || node.y > height - 30) node.vy *= -1;
      const bW = node.size * 1.3, bH = node.size * 2.1;
      this.trackedEntities.push({ id: idx + 1, x: node.x, y: node.y, width: bW, height: bH, headX: node.x, headY: node.y - bH * 0.28, headRadius: bW * 0.28, confidence: 0.88 + (idx % 8) * 0.012, label: `Person #${idx + 1}`, trackAge: 10, distanceTier: node.distance, viewOrientation: "frontal", rowCategory: node.y < height * 0.4 ? "background" : node.y < height * 0.7 ? "midground" : "foreground", detectionSource: "simulated", landmarks: [{ x: node.x - bW * 0.09, y: node.y - bH * 0.31, name: "right_eye" }, { x: node.x + bW * 0.09, y: node.y - bH * 0.31, name: "left_eye" }, { x: node.x, y: node.y - bH * 0.27, name: "nose" }, { x: node.x, y: node.y - bH * 0.21, name: "mouth" }] });
    });
    this.renderOverlays(ctx, width, height);
    const finalCount = this.computeFinalCount();
    this.renderTelemetryHUD(ctx, width, height, finalCount);
    this.calculateStatsAndNotify(finalCount);
    this.animFrameId = requestAnimationFrame(this.loopSimulation);
  };

  private calculateStatsAndNotify(count: number) {
    const now = performance.now();
    if (this.lastFrameTime > 0) this.fps = Math.min(60, Math.round(1000 / Math.max(1, now - this.lastFrameTime)));
    this.lastFrameTime = now;

    const rawCount = Math.max(0, Math.round(this.trackedEntities.length || count));
    this.countHistory.push(rawCount);
    if (this.countHistory.length > 15) this.countHistory.shift();
    const smoothedCount = Math.round(this.countHistory.reduce((a, b) => a + b, 0) / this.countHistory.length);
    const finalDisplayedCount = Math.round(rawCount * 0.55 + smoothedCount * 0.45);

    const dist = { close: this.trackedEntities.filter((e) => e.distanceTier === "close").length, mid: this.trackedEntities.filter((e) => e.distanceTier === "mid").length, far: this.trackedEntities.filter((e) => e.distanceTier === "far").length };
    this.onCountUpdate?.(finalDisplayedCount, { fps: this.fps, detectedCount: finalDisplayedCount, rawDetections: rawCount, inferenceTimeMs: this.lastInferenceDurationMs, isProcessing: this.isRunning, modelStatus: this.modelStatus, activeEngines: this.activeEngines, sensitivity: this.sensitivity, detectionMode: this.detectionMode, viewMode: this.viewMode, distanceBreakdown: dist, densityEstimate: this.densityEstimate, estimatedDemographics: { elderlyRatio: 0.35, childrenRatio: 0.14, pwdRatio: 0.08 } });
  }
}

export const visionDetector = new VisionDetector();
