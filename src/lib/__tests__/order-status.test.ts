import { describe, expect, it } from "vitest";
import { getStatusLabel } from "@/lib/order-status";

describe("order-status", () => {
  it("returns Russian labels for known statuses", () => {
    expect(getStatusLabel("pending")).toBe("Новый");
    expect(getStatusLabel("delivered")).toBe("Доставлен");
  });

  it("falls back to raw status", () => {
    expect(getStatusLabel("unknown")).toBe("unknown");
  });
});
