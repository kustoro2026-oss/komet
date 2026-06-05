import { describe, it, expect } from "vitest";
import { ZernioClient, ZernioError } from "@komet/zernio-client";

describe("ZernioClient", () => {
  it("should throw error when no API key provided", () => {
    expect(() => new ZernioClient("")).toThrow("Zernio API key is required");
  });

  it("should create client with valid API key", () => {
    const client = new ZernioClient("test-key");
    expect(client).toBeInstanceOf(ZernioClient);
  });
});

describe("ZernioError", () => {
  it("should create error with status code", () => {
    const error = new ZernioError(402, "free_tier_exceeded");
    expect(error.status).toBe(402);
    expect(error.isPaymentRequired).toBe(true);
    expect(error.isUnauthorized).toBe(false);
  });

  it("should detect rate limiting", () => {
    const error = new ZernioError(429);
    expect(error.isRateLimited).toBe(true);
  });

  it("should detect unauthorized", () => {
    const error = new ZernioError(401);
    expect(error.isUnauthorized).toBe(true);
  });
});
