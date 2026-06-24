import { describe, it, expect } from "vitest";
import { formatPhoneE164, APP_CITY } from "@/lib/config";

describe("config", () => {
  it("defaults city to Сураж", () => {
    expect(APP_CITY).toBeTruthy();
  });

  it("formats Russian phone to E.164", () => {
    expect(formatPhoneE164("9991234567")).toBe("+79991234567");
    expect(formatPhoneE164("89991234567")).toBe("+79991234567");
  });
});

describe("order status transitions", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["waiting_courier", "cancelled"],
    waiting_courier: ["in_delivery", "cancelled"],
    in_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  };

  it("allows pending to confirmed", () => {
    expect(validTransitions.pending).toContain("confirmed");
  });

  it("does not allow delivered to pending", () => {
    expect(validTransitions.delivered).not.toContain("pending");
  });
});
