import { it, describe, expect } from "vitest";
import { setRgbColorOpacity } from "./setRgbColorOpacity";

describe("setRgbColorOpacity", () => {
  it("should set the opacity of an rgb color", () => {
    const color = "rgb(255, 0, 0)";
    const opacity = 0.5;
    const result = setRgbColorOpacity({ color, opacity });
    expect(result).toBe("rgba(255, 0, 0, 0.5)");
  });

  it("should set the opacity of an rgba color", () => {
    const color = "rgba(255, 39, 128, 0.2)";
    const opacity = 0.5;
    const result = setRgbColorOpacity({ color, opacity });
    expect(result).toBe("rgba(255, 39, 128, 0.5)");
  });

  it("should throw an error for an hsl color", () => {
    const color = "hsl(0, 100%, 50%)";
    const opacity = 0.5;
    expect(() => setRgbColorOpacity({ color, opacity })).toThrowError("unexpected color format");
  });

  it("should throw an error for an rgb color with opacity", () => {
    const color = "rgb(255, 0, 0, 0.2)";
    const opacity = 0.5;
    expect(() => setRgbColorOpacity({ color, opacity })).toThrowError("unexpected color format");
  });

  it("should throw an error for an rgba color without opacity", () => {
    const color = "rgba(255, 0, 0)";
    const opacity = 0.5;
    expect(() => setRgbColorOpacity({ color, opacity })).toThrowError("unexpected color format");
  });
});
