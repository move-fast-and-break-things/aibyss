import type { Application } from "pixi.js";

export function getSmoothZoomScreen(appRef: Ref<Application | null>) {
  let startZoomTime: number;
  const zoomDuration = 500;
  let targetScale: number;
  let targetPos: { x: number; y: number };
  let isZooming = false;
  function smoothZoom({ pos, scale }: { pos: { x: number; y: number }; scale: number }) {
    if (!appRef.value) {
      return;
    }

    if (isZooming) {
      return; // Prevent multiple simultaneous zooms
    }
    isZooming = true;
    targetScale = scale;
    targetPos = pos;
    startZoomTime = performance.now();

    requestAnimationFrame(animateZoom);
  }

  function animateZoom(currentTime: number) {
    if (!appRef.value || !appRef.value.stage) {
      console.error("AppRef or stage is not initialized");
      return;
    }

    const elapsedTime = currentTime - startZoomTime;
    const progress = Math.min(elapsedTime / zoomDuration, 1);

    // Get the current scale and the scale change based on progress
    const currentScale = appRef.value.stage.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * progress;

    // Calculate the world position relative to the current scale
    const worldPos = {
      x: (targetPos.x - appRef.value.stage.position.x) / appRef.value.stage.scale.x,
      y: (targetPos.y - appRef.value.stage.position.y) / appRef.value.stage.scale.y,
    };
    appRef.value.stage.scale.set(newScale);

    const newScreenPos = {
      x: worldPos.x * newScale + appRef.value.stage.position.x,
      y: worldPos.y * newScale + appRef.value.stage.position.y,
    };

    // Adjust the stage position to follow the zoom focus point
    appRef.value.stage.position.set(
      Math.min(0, Math.max(appRef.value.stage.position.x - (newScreenPos.x - targetPos.x), appRef.value.screen.width - appRef.value.screen.width * newScale)),
      Math.min(0, Math.max(appRef.value.stage.position.y - (newScreenPos.y - targetPos.y), appRef.value.screen.height - appRef.value.screen.height * newScale)),
    );

    if (progress < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      isZooming = false;
    }
  }

  return smoothZoom;
}

export function followPlayerBot({
  appRef,
  x,
  y,
}: {
  appRef: Ref<Application | null>;
  x: number;
  y: number;
}) {
  if (!appRef.value) {
    throw new Error("unexpected: game not initialized");
  }
  const currentPos = appRef.value.stage.position;
  const targetPos = {
    x: -x * appRef.value.stage.scale.x + appRef.value.screen.width / 2,
    y: -y * appRef.value.stage.scale.y + appRef.value.screen.height / 2,
  };
  const newPosX = currentPos.x + (targetPos.x - currentPos.x) * 0.1;
  const newPosY = currentPos.y + (targetPos.y - currentPos.y) * 0.1;

  appRef.value.stage.position.set(
    Math.min(0, Math.max(newPosX, appRef.value.screen.width - appRef.value.screen.width * appRef.value.stage.scale.x)),
    Math.min(0, Math.max(newPosY, appRef.value.screen.height - appRef.value.screen.height * appRef.value.stage.scale.y)),
  );
}

export function getZoomScale({
  minZoom,
  maxZoom,
  stageScale,
  playerRadius,
}: {
  minZoom: number;
  maxZoom: number;
  stageScale: number;
  playerRadius: number;
}) {
  return (Math.max(minZoom, Math.min(maxZoom, ((stageScale + 3) - ((stageScale + 3) * ((playerRadius + 10) / 100))))));
}
