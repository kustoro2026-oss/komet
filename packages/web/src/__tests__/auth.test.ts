import { describe, it, expect } from "vitest";
import {
  signUp,
  signIn,
  signOut,
} from "@komet/auth";

describe("auth package", () => {
  it("should export auth functions", () => {
    expect(signUp).toBeDefined();
    expect(signIn).toBeDefined();
    expect(signOut).toBeDefined();
  });

  it("should handle missing env vars gracefully", async () => {
    // Will throw because env vars are not set in test
    await expect(signUp("test@test.com", "password123")).rejects.toThrow();
  });
});
