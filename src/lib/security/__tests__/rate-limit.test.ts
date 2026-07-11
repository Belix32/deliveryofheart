import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  __resetRateLimitBucketsForTests,
} from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests();
  });

  it("allows requests under the limit", () => {
    expect(checkRateLimit("a", 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit("a", 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit("a", 3, 60_000).allowed).toBe(true);
  });

  it("blocks when limit exceeded", () => {
    checkRateLimit("b", 2, 60_000);
    checkRateLimit("b", 2, 60_000);
    const blocked = checkRateLimit("b", 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates keys", () => {
    checkRateLimit("x", 1, 60_000);
    expect(checkRateLimit("x", 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit("y", 1, 60_000).allowed).toBe(true);
  });
});
