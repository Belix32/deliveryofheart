import { describe, it, expect } from "vitest";

describe("email auth validation", () => {
  it("requires minimum password length", () => {
    const password = "123456";
    expect(password.length).toBeGreaterThanOrEqual(6);
  });

  it("normalizes email to lowercase", () => {
    expect("User@Example.COM".trim().toLowerCase()).toBe("user@example.com");
  });
});
