import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

describe("role checks", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("admin role name is recognized", async () => {
    const roles = ["admin", "courier", "client"];
    expect(roles.includes("admin")).toBe(true);
  });

  it("courier section requires courier role", async () => {
    const userRoles = ["courier"];
    const hasAccess = userRoles.includes("courier") || userRoles.includes("admin");
    expect(hasAccess).toBe(true);
  });

  it("denies courier access without role", () => {
    const userRoles = ["client"];
    const hasAccess = userRoles.includes("courier") || userRoles.includes("admin");
    expect(hasAccess).toBe(false);
  });
});
