import { describe, it, expect } from "vitest";
import { getZoomScale } from "./zoomUtils";

describe("getZoomScale", () => {
  it("should return maximum zoom scale when player is very small", () => {
    const result = getZoomScale({
      minZoom: 1,
      maxZoom: 3,
      stageScale: 1,
      playerRadius: 0,
    });
    expect(result).toBe(3);
  });

  it("should return minimum zoom scale when player is very large", () => {
    const result = getZoomScale({
      minZoom: 1,
      maxZoom: 3,
      stageScale: 1,
      playerRadius: 100,
    });
    expect(result).toBe(1);
  });

  it("should return with proper zoom scale", () => {
    const result = getZoomScale({
      minZoom: 1,
      maxZoom: 3,
      stageScale: 1,
      playerRadius: 35,
    });
    expect(result).toBeCloseTo(2.2);
  });
});
