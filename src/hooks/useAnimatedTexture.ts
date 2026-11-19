import { useEffect, useState, useSyncExternalStore } from "react";
import type { Project } from "../data/projects";
import {
  gifTextureManager,
  type GifTextureHandle,
  type TextureProgress,
} from "../lib/GifTextureManager";

export const useAnimatedTextures = (
  projects: Project[],
): GifTextureHandle[] => {
  const [handles] = useState(() => gifTextureManager.registerAll(projects));
  useEffect(() => {
    return () => gifTextureManager.releaseAll(handles.map((handle) => handle.id));
  }, [handles]);
  return handles;
};

export const useAnimatedTexture = (
  project: Project,
): GifTextureHandle | null => {
  const [handle, setHandle] = useState<GifTextureHandle | null>(null);
  useEffect(() => {
    setHandle(gifTextureManager.register(project));
    return () => gifTextureManager.release(project.id);
  }, [project]);
  return handle;
};

export const useTextureProgress = (): TextureProgress =>
  useSyncExternalStore(
    gifTextureManager.subscribe,
    gifTextureManager.getProgress,
    gifTextureManager.getProgress,
  );
