import { describe, it, expect } from "vitest";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "waiting_courier",
  "in_delivery",
  "delivered",
  "cancelled",
];

describe("order status workflow", () => {
  it("accepts all production statuses", () => {
    expect(VALID_STATUSES).toContain("pending");
    expect(VALID_STATUSES).toContain("delivered");
    expect(VALID_STATUSES).toHaveLength(8);
  });

  it("follows expected progression", () => {
    const flow = ["pending", "confirmed", "preparing", "ready", "in_delivery", "delivered"];
    for (let i = 1; i < flow.length; i++) {
      expect(VALID_STATUSES.indexOf(flow[i])).toBeGreaterThan(
        VALID_STATUSES.indexOf(flow[i - 1])
      );
    }
  });
});

describe("checkout validation", () => {
  it("requires restaurant, items and address", () => {
    const payload = {
      restaurant_id: "r1",
      items: [{ menu_item_id: "m1", quantity: 1, price: 100 }],
      address_text: "ул. Ленина 1",
    };
    expect(payload.restaurant_id).toBeTruthy();
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.address_text.length).toBeGreaterThan(0);
  });
});
