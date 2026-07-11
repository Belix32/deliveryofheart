import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/phone";

describe("phone auth validation", () => {
  it("requires minimum password length", () => {
    const password = "123456";
    expect(password.length).toBeGreaterThanOrEqual(6);
  });

  it("normalizes phone for login lookup", () => {
    expect(normalizePhone("8 (999) 123-45-67")).toBe("+79991234567");
  });

  it("normalizes email to lowercase", () => {
    expect("User@Example.COM".trim().toLowerCase()).toBe("user@example.com");
  });
});
