import { describe, it, expect } from "vitest";
import {
  formatCount,
  truncate,
  generateId,
  cn,
  SUBSCRIPTION_PLANS,
  SUPPORTED_PLATFORMS,
} from "@komet/shared";

describe("shared utilities", () => {
  describe("formatCount", () => {
    it("should format thousands", () => {
      expect(formatCount(1500)).toBe("1.5K");
    });

    it("should format millions", () => {
      expect(formatCount(2500000)).toBe("2.5M");
    });

    it("should return number as string for small values", () => {
      expect(formatCount(999)).toBe("999");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hi", 5)).toBe("Hi");
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("cn", () => {
    it("should join class names", () => {
      expect(cn("a", "b", undefined, false, "c")).toBe("a b c");
    });
  });
});

describe("shared constants", () => {
  it("should have 15 supported platforms", () => {
    expect(SUPPORTED_PLATFORMS).toHaveLength(15);
  });

  it("should have 4 subscription plans", () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(4);
  });
});
