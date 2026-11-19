import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  SRGBColorSpace,
} from "three";
import { decompressFrames, parseGIF } from "gifuct-js";
import type { ParsedFrame } from "gifuct-js";
import type { Project } from "../data/projects";
import { assetUrl } from "../data/projects";
import { computeImageRect } from "../utils/textureMapping";

export type TextureStatus = "loading" | "ready" | "error";

export interface TextureProgress {
  loaded: number;
  total: number;
  errors: number;
}

export interface GifTextureHandle {
  id: string;
  status: TextureStatus;
  texture: CanvasTexture;
  error?: string;
  frames: number;
  width: number;
  height: number;
  durationMs: number;
}

interface FrameSnapshot {
  data: ImageData;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ManagedGif extends GifTextureHandle {
  project: Project;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  displayCanvas: HTMLCanvasElement;
  displayContext: CanvasRenderingContext2D;
  patchCanvas: HTMLCanvasElement;
  patchContext: CanvasRenderingContext2D;
  decoded: ParsedFrame[];
  index: number;
  elapsed: number;
  compositeWidth: number;
  compositeHeight: number;
  scale: number;
  previousFrame: ParsedFrame | null;
  previousSnapshot: FrameSnapshot | null;
  abort: AbortController | null;
}

const TEXTURE_SIZE = 512;
const MAX_COMPOSITE = 640;
const BACKGROUND = "#05070a";

class GifTextureManager {
  private records = new Map<string, ManagedGif>();
  private listeners = new Set<() => void>();
  private raf = 0;
  private lastTime = 0;
  private paused = false;
  private progress: TextureProgress = { loaded: 0, total: 0, errors: 0 };
  private progressSnapshot: TextureProgress = this.progress;

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        this.paused = document.visibilityState === "hidden";
        this.lastTime = 0;
      });
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getProgress = (): TextureProgress => this.progressSnapshot;

  registerAll(projects: Project[]): GifTextureHandle[] {
    return projects.map((project) => this.register(project));
  }

  register(project: Project): GifTextureHandle {
    const existing = this.records.get(project.id);
    if (existing) return existing;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("2D canvas is unavailable");

    const displayCanvas = document.createElement("canvas");
    displayCanvas.width = TEXTURE_SIZE;
    displayCanvas.height = TEXTURE_SIZE;
    const displayContext = displayCanvas.getContext("2d", { alpha: false });
    if (!displayContext) throw new Error("2D display canvas is unavailable");
    displayContext.fillStyle = BACKGROUND;
    displayContext.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    displayContext.fillStyle = "rgba(150, 170, 190, 0.16)";
    displayContext.font = "24px monospace";
    displayContext.textAlign = "center";
    displayContext.fillText("SYNCING ARCHIVE", TEXTURE_SIZE / 2, 260);

    const patchCanvas = document.createElement("canvas");
    const patchContext = patchCanvas.getContext("2d");
    if (!patchContext) throw new Error("2D patch canvas is unavailable");

    const texture = new CanvasTexture(displayCanvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.anisotropy = 4;

    const record: ManagedGif = {
      id: project.id,
      project,
      status: "loading",
      texture,
      frames: 0,
      width: 0,
      height: 0,
      durationMs: 0,
      canvas,
      context,
      displayCanvas,
      displayContext,
      patchCanvas,
      patchContext,
      decoded: [],
      index: 0,
      elapsed: 0,
      compositeWidth: 0,
      compositeHeight: 0,
      scale: 1,
      previousFrame: null,
      previousSnapshot: null,
      abort: null,
    };

    this.records.set(project.id, record);
    this.updateProgress();
    void this.load(record);
    this.ensureLoop();
    return record;
  }

  release(id: string) {
    const record = this.records.get(id);
    if (!record) return;
    record.abort?.abort();
    this.records.delete(id);
    record.texture.dispose();
    record.decoded = [];
    this.updateProgress();
    if (this.records.size === 0 && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  releaseAll(ids: string[]) {
    for (const id of ids) this.release(id);
  }

  private updateProgress() {
    const records = [...this.records.values()];
    const progress: TextureProgress = {
      loaded: records.filter((record) => record.status === "ready").length,
      total: records.length,
      errors: records.filter((record) => record.status === "error").length,
    };
    if (
      progress.loaded === this.progress.loaded &&
      progress.total === this.progress.total &&
      progress.errors === this.progress.errors
    ) {
      return;
    }
    this.progress = progress;
    this.progressSnapshot = progress;
    for (const listener of this.listeners) listener();
  }

  private async load(record: ManagedGif) {
    record.abort = new AbortController();
    try {
      const response = await fetch(assetUrl(record.project.image), {
        signal: record.abort.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      if (record.abort.signal.aborted) return;
      const parsed = parseGIF(buffer);
      const frames = decompressFrames(parsed, true);
      if (!frames.length) throw new Error("Empty GIF");
      record.frames = frames.length;
      record.width = parsed.lsd.width;
      record.height = parsed.lsd.height;
      record.durationMs = frames.reduce(
        (total, frame) => total + Math.max(frame.delay, 20),
        0,
      );
      const scale = Math.min(
        1,
        MAX_COMPOSITE / Math.max(parsed.lsd.width, parsed.lsd.height),
      );
      record.scale = scale;
      record.compositeWidth = Math.max(
        1,
        Math.round(parsed.lsd.width * scale),
      );
      record.compositeHeight = Math.max(
        1,
        Math.round(parsed.lsd.height * scale),
      );
      record.canvas.width = record.compositeWidth;
      record.canvas.height = record.compositeHeight;
      record.context.clearRect(
        0,
        0,
        record.compositeWidth,
        record.compositeHeight,
      );
      record.decoded = frames;
      record.index = 0;
      record.elapsed = 0;
      record.previousFrame = null;
      record.previousSnapshot = null;
      this.drawFrame(record, frames[0], true, false);
      record.status = "ready";
      this.renderDisplay(record);
      this.updateProgress();
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      record.status = "error";
      record.error = error instanceof Error ? error.message : "Unknown error";
      record.displayContext.fillStyle = BACKGROUND;
      record.displayContext.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      record.displayContext.fillStyle = "rgba(160, 180, 200, 0.28)";
      record.displayContext.font = "20px monospace";
      record.displayContext.textAlign = "center";
      record.displayContext.fillText(
        "SIGNAL OFFLINE",
        TEXTURE_SIZE / 2,
        260,
      );
      record.texture.needsUpdate = true;
      this.updateProgress();
    }
  }

  private getSnapshot(
    record: ManagedGif,
    frame: ParsedFrame,
  ): FrameSnapshot | null {
    const x = Math.max(0, Math.floor(frame.dims.left * record.scale));
    const y = Math.max(0, Math.floor(frame.dims.top * record.scale));
    const width = Math.min(
      record.compositeWidth - x,
      Math.max(1, Math.ceil(frame.dims.width * record.scale)),
    );
    const height = Math.min(
      record.compositeHeight - y,
      Math.max(1, Math.ceil(frame.dims.height * record.scale)),
    );
    if (width <= 0 || height <= 0) return null;
    return {
      data: record.context.getImageData(x, y, width, height),
      x,
      y,
      width,
      height,
    };
  }

  private applyDisposal(record: ManagedGif) {
    const previous = record.previousFrame;
    if (!previous) return;
    if (previous.disposalType === 3 && record.previousSnapshot) {
      record.context.putImageData(
        record.previousSnapshot.data,
        record.previousSnapshot.x,
        record.previousSnapshot.y,
      );
    } else if (previous.disposalType === 2) {
      const x = Math.max(0, Math.floor(previous.dims.left * record.scale));
      const y = Math.max(0, Math.floor(previous.dims.top * record.scale));
      const width = Math.max(
        1,
        Math.ceil(previous.dims.width * record.scale),
      );
      const height = Math.max(
        1,
        Math.ceil(previous.dims.height * record.scale),
      );
      record.context.clearRect(x, y, width, height);
    }
    record.previousSnapshot = null;
  }

  private drawFrame(
    record: ManagedGif,
    frame: ParsedFrame,
    first: boolean,
    disposing: boolean,
  ) {
    if (!first && disposing) {
      this.applyDisposal(record);
    }
    if (frame.disposalType === 3) {
      record.previousSnapshot = this.getSnapshot(record, frame);
    }
    if (
      record.patchCanvas.width !== frame.dims.width ||
      record.patchCanvas.height !== frame.dims.height
    ) {
      record.patchCanvas.width = Math.max(1, frame.dims.width);
      record.patchCanvas.height = Math.max(1, frame.dims.height);
    }
    const image = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
    record.patchContext.putImageData(image, 0, 0);
    record.context.drawImage(
      record.patchCanvas,
      frame.dims.left * record.scale,
      frame.dims.top * record.scale,
      frame.dims.width * record.scale,
      frame.dims.height * record.scale,
    );
    record.previousFrame = frame;
  }

  private advance(record: ManagedGif) {
    if (!record.decoded.length) return;
    const nextIndex = (record.index + 1) % record.decoded.length;
    this.drawFrame(record, record.decoded[nextIndex], false, true);
    record.index = nextIndex;
    this.renderDisplay(record);
  }

  private renderDisplay(record: ManagedGif) {
    const context = record.displayContext;
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    if (
      record.compositeWidth <= 0 ||
      record.compositeHeight <= 0 ||
      !record.decoded.length
    ) {
      record.texture.needsUpdate = true;
      return;
    }
    const rect = computeImageRect(
      record.compositeWidth,
      record.compositeHeight,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      record.project.imageFit,
      record.project.focalPoint,
    );
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      record.canvas,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      rect.dx,
      rect.dy,
      rect.dw,
      rect.dh,
    );
    record.texture.needsUpdate = true;
  }

  private ensureLoop() {
    if (this.raf) return;
    this.lastTime = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    if (this.paused) {
      this.lastTime = now;
      return;
    }
    if (!this.lastTime) {
      this.lastTime = now;
      return;
    }
    const dt = Math.min(now - this.lastTime, 100);
    this.lastTime = now;
    for (const record of this.records.values()) {
      if (record.status !== "ready" || record.decoded.length <= 1) continue;
      record.elapsed += dt;
      let guard = 0;
      while (guard < 8) {
        const delay = Math.max(
          20,
          record.decoded[record.index]?.delay ?? 100,
        );
        if (record.elapsed < delay) break;
        record.elapsed -= delay;
        this.advance(record);
        guard += 1;
      }
    }
  };
}

export const gifTextureManager = new GifTextureManager();
