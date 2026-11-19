import { Euler, Quaternion, Vector3 } from "three";
import { PROJECTS } from "../../data/projects";
import type { FaceKey } from "../../data/faces";
import {
  archiveStore,
  type ArchiveControllerApi,
} from "../../state/archiveStore";
import {
  FREE_SEPARATION,
  PREVIEW_ENTER,
  PREVIEW_SEPARATION,
  SNAP_ENTER,
  SNAP_EXIT,
  getFaceQuaternion,
  getFaceNormal,
} from "../../utils/geometry";
import {
  getNearestFace,
  magneticResistance,
  resolveHysteresis,
  smoothstep,
} from "../../utils/faceDetection";
import {
  clamp01,
  damp,
  dampVector,
  easeInOutCubic,
  easeOutCubic,
  lerp,
} from "../../utils/animation";

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const INTRO_EXTRA = 1.15;

interface SnapState {
  face: FaceKey;
  elapsed: number;
  duration: number;
  from: Quaternion;
  to: Quaternion;
}

export class CubeController implements ArchiveControllerApi {
  readonly quaternion = new Quaternion().setFromEuler(
    new Euler(0.34, -0.62, 0.08, "XYZ"),
  );
  readonly objectPosition = new Vector3();
  readonly cameraDirection = new Vector3(0, 0, 1);

  objectScale = 1;
  moduleOffset = FREE_SEPARATION;
  moduleTilt = 1;
  previewAmount = 0;
  coreIntensity = 4;
  beamsOpacity = 0.2;
  pulse = 0;
  time = 0;

  private store = archiveStore;
  private canvas: HTMLCanvasElement | null = null;
  private pointerId: number | null = null;
  private dragging = false;
  private dragOriginAssembled = false;
  private lastX = 0;
  private lastY = 0;
  private lastMoveTime = 0;
  private velocityPitch = 0;
  private velocityYaw = 0;
  private snap: SnapState | null = null;
  private introElapsed = 0;
  private introExtra = INTRO_EXTRA;
  private introDone = false;
  private introPulseFired = false;
  private separation = FREE_SEPARATION;
  private tilt = 1;
  private preview = 0;
  private core = 4;
  private beams = 0.18;
  private lastNearestAngle = 90;
  private lastNearestFace: FaceKey = "+Z";
  private lockedFace: FaceKey | null = null;
  private reducedMotion = false;
  private layoutMobile = false;
  private transitionScale = 1;
  private readonly tempQuaternion = new Quaternion();
  private readonly tempVector = new Vector3();
  private readonly pointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly pointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private readonly pointerUp = (event: PointerEvent) => this.onPointerUp(event);
  private readonly pointerCancel = (event: PointerEvent) =>
    this.onPointerUp(event, true);

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", this.pointerDown);
    canvas.addEventListener("pointermove", this.pointerMove);
    window.addEventListener("pointerup", this.pointerUp);
    window.addEventListener("pointercancel", this.pointerCancel);
    window.addEventListener("blur", this.cancelPointer);
    this.store.registerController(this);
  }

  detach() {
    this.store.unregisterController();
    if (!this.canvas) return;
    this.canvas.removeEventListener("pointerdown", this.pointerDown);
    this.canvas.removeEventListener("pointermove", this.pointerMove);
    window.removeEventListener("pointerup", this.pointerUp);
    window.removeEventListener("pointercancel", this.pointerCancel);
    window.removeEventListener("blur", this.cancelPointer);
    this.canvas = null;
  }

  private cancelPointer = () => {
    this.dragging = false;
    this.pointerId = null;
    this.snap = null;
  };

  private onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!this.canvas) return;
    this.finishIntro();
    const snapshot = this.store.getSnapshot();
    this.dragOriginAssembled =
      snapshot.mode === "assembled" || snapshot.view === "project";
    this.snap = null;
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.velocityPitch = 0;
    this.velocityYaw = 0;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastMoveTime = performance.now();
    this.store.beginDrag();
    this.store.patch({ interacted: true });
    this.store.notifyPreviewReady(false);
    if (snapshot.view !== "about" && snapshot.view !== "contact") {
      this.store.patch({ mode: "free" });
    }
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      /* pointer capture can fail on some browsers */
    }
    this.canvas.dataset.dragging = "true";
    event.preventDefault();
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    const now = performance.now();
    const dt = Math.max(8, now - this.lastMoveTime) / 1000;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastMoveTime = now;
    if (!dx && !dy) return;

    const resistance = magneticResistance(
      this.lastNearestAngle,
      PREVIEW_ENTER,
      SNAP_ENTER,
      0.58,
    );
    const sensitivity = event.pointerType === "touch" ? 0.0085 : 0.0055;
    const yaw = dx * sensitivity * resistance;
    const pitch = dy * sensitivity * resistance;
    this.applyWorldRotation(pitch, yaw);

    const cappedYaw = Math.max(-7, Math.min(7, yaw / dt));
    const cappedPitch = Math.max(-7, Math.min(7, pitch / dt));
    this.velocityYaw = lerp(this.velocityYaw, cappedYaw, 0.32);
    this.velocityPitch = lerp(this.velocityPitch, cappedPitch, 0.32);
    event.preventDefault();
  }

  private onPointerUp(event: PointerEvent, cancelled = false) {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
    if (this.canvas) {
      this.canvas.dataset.dragging = "false";
      try {
        this.canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    this.store.notifyPreviewReady(false);
    if (cancelled) {
      this.velocityPitch = 0;
      this.velocityYaw = 0;
      return;
    }
    const snapshot = this.store.getSnapshot();
    if (
      this.lastNearestAngle <= SNAP_ENTER &&
      snapshot.view !== "about" &&
      snapshot.view !== "contact"
    ) {
      this.startSnap(this.lastNearestFace);
      return;
    }
    this.dragOriginAssembled = false;
    if (this.snap === null) {
      this.store.notifyMode(
        snapshot.view === "about" || snapshot.view === "contact"
          ? snapshot.view
          : "free",
      );
    }
  }

  private applyWorldRotation(pitch: number, yaw: number) {
    this.tempQuaternion.copy(this.quaternion);
    const rotateX = new Quaternion().setFromAxisAngle(
      this.tempVector.copy(X_AXIS),
      pitch,
    );
    const rotateY = new Quaternion().setFromAxisAngle(Y_AXIS, yaw);
    this.quaternion
      .copy(rotateX)
      .multiply(rotateY)
      .multiply(this.tempQuaternion)
      .normalize();
  }

  private finishIntro() {
    if (this.introDone) return;
    this.introDone = true;
    this.introElapsed = Math.max(this.introElapsed, 2);
    this.introExtra = 0;
    this.store.notifyIntroComplete(true);
  }

  private targetQuaternionForFace(face: FaceKey): Quaternion {
    const base = getFaceQuaternion(face);
    const normal = getFaceNormal(face).applyQuaternion(base).normalize();
    const align = new Quaternion().setFromUnitVectors(
      normal,
      this.cameraDirection,
    );
    return align.multiply(base).normalize();
  }

  requestProject(index: number) {
    const project = PROJECTS[index];
    if (!project) return;
    this.finishIntro();
    this.dragging = false;
    this.pointerId = null;
    this.velocityPitch = 0;
    this.velocityYaw = 0;
    this.dragOriginAssembled = false;
    this.store.patch({
      mode: "snapping",
      view: null,
      selectedFace: null,
      detailsOpen: false,
      previewReady: false,
      interacted: true,
    });
    this.startSnap(project.face);
  }

  private startSnap(face: FaceKey) {
    const target = this.targetQuaternionForFace(face);
    this.snap = {
      face,
      elapsed: 0,
      duration: this.reducedMotion ? 200 : 680,
      from: this.quaternion.clone(),
      to: target,
    };
    this.velocityPitch = 0;
    this.velocityYaw = 0;
    this.store.notifyMode("snapping");
  }

  cancelSnap() {
    this.snap = null;
  }

  enterView(view: "about" | "contact") {
    this.snap = null;
    this.dragging = false;
    this.velocityPitch = 0;
    this.velocityYaw = 0;
    this.store.notifyMode(view);
    this.store.notifyPreviewReady(false);
  }

  returnToArchive() {
    this.snap = null;
    this.dragging = false;
    this.velocityPitch = 0;
    this.velocityYaw = 0;
    this.store.notifyMode("free");
  }

  update(
    dt: number,
    cameraPosition: Vector3,
    viewportWidth: number,
    reducedMotion: boolean,
  ) {
    const step = Math.min(dt, 0.05);
    this.time += step;
    this.reducedMotion = reducedMotion;
    this.layoutMobile = viewportWidth < 860;
    const snapshot = this.store.getSnapshot();

    this.updateIntro(Math.min(dt, 0.5));
    this.updateSnap(Math.min(dt, 0.25));

    this.cameraDirection
      .copy(cameraPosition)
      .sub(this.objectPosition)
      .normalize();

    if (!this.dragging && !this.snap && !reducedMotion) {
      const speed = Math.hypot(this.velocityPitch, this.velocityYaw);
      if (speed > 0.0015) {
        this.applyWorldRotation(
          this.velocityPitch * step,
          this.velocityYaw * step,
        );
        const decay = Math.exp(-3.2 * step);
        this.velocityPitch *= decay;
        this.velocityYaw *= decay;
      } else {
        this.velocityPitch = 0;
        this.velocityYaw = 0;
      }
    }

    const nearest = getNearestFace(this.quaternion, this.cameraDirection);
    this.lastNearestAngle = nearest.angle;
    this.lastNearestFace = nearest.face;
    if (nearest.face !== snapshot.activeFace) {
      this.store.notifyActiveFace(nearest.face);
    }

    const candidate = resolveHysteresis(
      this.lockedFace,
      [nearest, ...nearest.others],
      SNAP_ENTER,
      SNAP_EXIT,
    );
    this.lockedFace = candidate.face;

    const nearTarget = nearest.angle < PREVIEW_ENTER;
    const previewTarget =
      nearTarget && !this.snap
        ? 1 - smoothstep(SNAP_ENTER, PREVIEW_ENTER, nearest.angle)
        : 0;
    this.preview = damp(this.preview, previewTarget, 6, step);
    this.previewAmount = this.preview;

    const snapReady =
      this.dragging &&
      nearest.angle <= SNAP_ENTER &&
      snapshot.view !== "about" &&
      snapshot.view !== "contact";
    if (snapReady !== snapshot.previewReady) {
      this.store.notifyPreviewReady(snapReady);
    }

    this.updateMode(snapshot, nearest.angle);
    this.updateSeparation(step, snapshot, nearest.angle);
    this.updateLayout(step, snapshot);
    this.updateLighting(step, snapshot, nearest.angle);
  }

  private updateIntro(elapsedDt: number) {
    if (!this.introDone) {
      this.introElapsed += elapsedDt;
      if (!this.introPulseFired && this.introElapsed >= 1.22) {
        this.introPulseFired = true;
        this.pulse = 1;
      }
      if (this.introElapsed >= 1.6) {
        this.introDone = true;
        this.store.notifyIntroComplete(true);
      }
    }
    const introTarget =
      !this.introDone && this.introElapsed < 1.25
        ? INTRO_EXTRA * (1 - easeOutCubic(clamp01(this.introElapsed / 1.25)))
        : 0;
    this.introExtra = introTarget;
  }

  private updateSnap(dt: number) {
    if (!this.snap) return;
    this.snap.elapsed += dt;
    const duration = this.snap.duration / 1000;
    const t = clamp01(this.snap.elapsed / duration);
    this.quaternion.slerpQuaternions(
      this.snap.from,
      this.snap.to,
      easeInOutCubic(t),
    );
    if (t >= 1) {
      const face = this.snap.face;
      this.quaternion.copy(this.snap.to);
      this.snap = null;
      this.pulse = 1;
      this.store.notifySnapComplete(face);
    }
  }

  private updateMode(
    snapshot: ReturnType<typeof archiveStore.getSnapshot>,
    angle: number,
  ) {
    let mode = snapshot.mode;
    if (!this.introDone) {
      mode = "intro";
    } else if (this.snap) {
      mode = "snapping";
    } else if (snapshot.view === "about") {
      mode = "about";
    } else if (snapshot.view === "contact") {
      mode = "contact";
    } else if (this.dragging && angle < PREVIEW_ENTER) {
      mode = "preview";
    } else if (
      !this.dragging &&
      snapshot.selectedFace &&
      angle <= SNAP_ENTER
    ) {
      mode = "assembled";
    } else if (snapshot.view !== "project") {
      mode = "free";
    }
    if (mode !== snapshot.mode) this.store.notifyMode(mode);
  }

  private updateSeparation(
    dt: number,
    snapshot: ReturnType<typeof archiveStore.getSnapshot>,
    angle: number,
  ) {
    let target: number;
    if (snapshot.view === "about" || snapshot.view === "contact") {
      target = 0.19;
    } else if (this.snap || (snapshot.selectedFace && !this.dragging)) {
      target = 0;
    } else if (this.dragging && this.dragOriginAssembled) {
      target = FREE_SEPARATION * smoothstep(SNAP_EXIT, PREVIEW_ENTER, angle);
    } else {
      target =
        FREE_SEPARATION +
        PREVIEW_SEPARATION *
          (1 - smoothstep(SNAP_ENTER, PREVIEW_ENTER, angle));
    }
    if (!this.introDone && this.introElapsed < 1.4) {
      target = 0;
    }
    this.separation = damp(this.separation, target, 5.2, dt);
    let tiltTarget =
      this.snap || (snapshot.selectedFace && !this.dragging)
        ? 0
        : clamp01(this.separation / (FREE_SEPARATION * 0.8)) *
          (1 + this.preview * 0.35);
    if (!this.introDone && this.introElapsed < 1.4) {
      tiltTarget = 0;
    }
    this.tilt = damp(this.tilt, tiltTarget, 4.5, dt);
    this.moduleOffset = this.separation + this.introExtra;
    this.moduleTilt = this.tilt;
  }

  private updateLayout(
    dt: number,
    snapshot: ReturnType<typeof archiveStore.getSnapshot>,
  ) {
    const desktop = !this.layoutMobile;
    const view = snapshot.view;
    let x = 0;
    let y = 0;
    let z = 0;
    let scale = 1;
    if (view === "project" || (this.snap && snapshot.mode === "snapping")) {
      if (desktop) {
        x = -0.52;
        y = 0.04;
        z = 0.22;
        scale = 1.14;
      } else {
        x = 0;
        y = 0.58;
        z = 0.16;
        scale = 0.92;
      }
    } else if (view === "about" || view === "contact") {
      if (desktop) {
        x = 0.82;
        y = 0;
        z = 0;
        scale = 0.8;
      } else {
        x = 0;
        y = 0.62;
        z = 0;
        scale = 0.64;
      }
    }
    const introScale =
      0.86 +
      0.14 * easeOutCubic(clamp01(this.introElapsed / 1.15));
    this.transitionScale = damp(this.transitionScale, scale, 3.4, dt);
    this.objectScale = this.transitionScale * introScale;
    dampVector(
      this.objectPosition,
      this.tempVector.set(x, y, z),
      3.4,
      dt,
    );
  }

  private updateLighting(
    dt: number,
    snapshot: ReturnType<typeof archiveStore.getSnapshot>,
    angle: number,
  ) {
    let core = 4;
    if (snapshot.view === "project") core = 9;
    if (snapshot.view === "about" || snapshot.view === "contact") core = 6;
    if (this.dragging) core += 2;
    if (angle < PREVIEW_ENTER) {
      core += 9 * (1 - smoothstep(SNAP_ENTER, PREVIEW_ENTER, angle));
    }
    core += this.preview * 7;
    if (this.snap) core += 12;
    core += this.pulse * 42;
    this.core = damp(this.core, core, 5, dt);
    this.coreIntensity = this.core;

    const beamsTarget =
      0.02 +
      (this.separation / FREE_SEPARATION) * 0.2 +
      this.preview * 0.06 +
      this.pulse * 0.24;
    this.beams = damp(this.beams, beamsTarget, 4, dt);
    this.beamsOpacity = this.beams;
    this.pulse *= Math.exp(-3.4 * dt);
  }
}
