import { describe, it, expect } from "vitest";
import { formatPhoneE164, APP_CITY } from "@/lib/config";
import {
  ORDER_TRANSITIONS,
  canTransitionOrderStatus,
  normalizeOrderStatus,
} from "@/lib/order-transitions";

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
  it("allows pending to confirmed", () => {
    expect(ORDER_TRANSITIONS.pending).toContain("confirmed");
  });

  it("does not allow delivered to pending", () => {
    expect(ORDER_TRANSITIONS.delivered).not.toContain("pending");
  });

  it("allows customer to cancel pending order", () => {
    expect(canTransitionOrderStatus("pending", "cancelled", "customer")).toBe(true);
  });

  it("blocks customer from setting delivered", () => {
    expect(canTransitionOrderStatus("pending", "delivered", "customer")).toBe(false);
  });

  it("normalizes legacy delivering status", () => {
    expect(normalizeOrderStatus("delivering")).toBe("in_delivery");
  });
});
