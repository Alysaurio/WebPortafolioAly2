import { useSyncExternalStore } from "react";
import type { FaceKey } from "../data/faces";
import { PROJECTS, projectByFace } from "../data/projects";

export type ArchiveMode =
  | "intro"
  | "free"
  | "preview"
  | "snapping"
  | "assembled"
  | "about"
  | "contact";

export type PanelView = "project" | "about" | "contact" | null;

export interface ArchiveSnapshot {
  mode: ArchiveMode;
  activeFace: FaceKey;
  selectedFace: FaceKey | null;
  view: PanelView;
  detailsOpen: boolean;
  introComplete: boolean;
  previewReady: boolean;
  interacted: boolean;
}

export interface ArchiveControllerApi {
  requestProject(index: number): void;
  enterView(view: "about" | "contact"): void;
  returnToArchive(): void;
  cancelSnap(): void;
}

const initialSnapshot: ArchiveSnapshot = {
  mode: "intro",
  activeFace: "+Z",
  selectedFace: null,
  view: null,
  detailsOpen: false,
  introComplete: false,
  previewReady: false,
  interacted: false,
};

class ArchiveStore {
  private snapshot: ArchiveSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private controller: ArchiveControllerApi | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): ArchiveSnapshot => this.snapshot;

  registerController(controller: ArchiveControllerApi) {
    this.controller = controller;
  }

  unregisterController() {
    this.controller = null;
  }

  patch(partial: Partial<ArchiveSnapshot>) {
    let changed = false;
    for (const key of Object.keys(partial) as Array<keyof ArchiveSnapshot>) {
      if (this.snapshot[key] !== partial[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) listener();
  }

  notifyActiveFace(face: FaceKey) {
    this.patch({ activeFace: face });
  }

  notifyMode(mode: ArchiveMode) {
    this.patch({ mode });
  }

  notifyPreviewReady(previewReady: boolean) {
    this.patch({ previewReady });
  }

  notifyIntroComplete(introComplete: boolean) {
    this.patch({ introComplete });
  }

  notifySnapComplete(face: FaceKey) {
    this.patch({
      mode: "assembled",
      selectedFace: face,
      view: "project",
      detailsOpen: false,
      previewReady: false,
      introComplete: true,
    });
  }

  selectProject(index: number) {
    this.controller?.requestProject(index);
  }

  selectAdjacent(direction: number) {
    const snapshot = this.snapshot;
    const currentFace = snapshot.selectedFace ?? snapshot.activeFace;
    const current = PROJECTS.findIndex(
      (project) => project.face === currentFace,
    );
    const start = current < 0 ? 0 : current;
    const nextIndex =
      (start + direction + PROJECTS.length) % PROJECTS.length;
    this.controller?.requestProject(nextIndex);
  }

  openAbout() {
    this.patch({
      view: "about",
      mode: "about",
      selectedFace: null,
      detailsOpen: false,
      previewReady: false,
    });
    this.controller?.enterView("about");
  }

  openContact() {
    this.patch({
      view: "contact",
      mode: "contact",
      selectedFace: null,
      detailsOpen: false,
      previewReady: false,
    });
    this.controller?.enterView("contact");
  }

  openArchive() {
    this.patch({
      view: null,
      mode: "free",
      selectedFace: null,
      detailsOpen: false,
      previewReady: false,
    });
    this.controller?.returnToArchive();
  }

  openDetails() {
    if (!this.snapshot.selectedFace) return;
    this.patch({ detailsOpen: true });
  }

  closeDetails() {
    this.patch({ detailsOpen: false });
  }

  handleEscape() {
    if (this.snapshot.detailsOpen) {
      this.closeDetails();
      return;
    }
    if (this.snapshot.view === "about" || this.snapshot.view === "contact") {
      this.openArchive();
      return;
    }
    if (this.snapshot.selectedFace) {
      this.openArchive();
    }
  }

  beginDrag() {
    if (this.snapshot.view === "about" || this.snapshot.view === "contact") {
      return;
    }
    if (this.snapshot.selectedFace || this.snapshot.view === "project") {
      this.patch({
        selectedFace: null,
        view: null,
        detailsOpen: false,
      });
    }
  }

  activeProjectIndex(): number {
    const face = this.snapshot.selectedFace ?? this.snapshot.activeFace;
    const index = PROJECTS.findIndex(
      (project) => project.face === face,
    );
    return index < 0 ? 0 : index;
  }

  activeProject() {
    return projectByFace(this.snapshot.activeFace) ?? PROJECTS[0];
  }
}

export const archiveStore = new ArchiveStore();

export const archiveActions = {
  selectProject: (index: number) => archiveStore.selectProject(index),
  nextProject: () => archiveStore.selectAdjacent(1),
  previousProject: () => archiveStore.selectAdjacent(-1),
  openAbout: () => archiveStore.openAbout(),
  openContact: () => archiveStore.openContact(),
  openArchive: () => archiveStore.openArchive(),
  openDetails: () => archiveStore.openDetails(),
  closeDetails: () => archiveStore.closeDetails(),
  escape: () => archiveStore.handleEscape(),
};

export const useArchive = <T,>(
  selector: (snapshot: ArchiveSnapshot) => T,
): T =>
  useSyncExternalStore(
    archiveStore.subscribe,
    () => selector(archiveStore.getSnapshot()),
    () => selector(archiveStore.getSnapshot()),
  );
