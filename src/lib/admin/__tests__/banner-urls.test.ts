import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isExternalBannerLink,
  isSafeRelativePath,
  isValidBannerImageUrl,
  isValidBannerLinkUrl,
} from "@/lib/admin/banner-urls";

describe("banner-urls", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts safe relative paths", () => {
    expect(isSafeRelativePath("/restaurant/1")).toBe(true);
    expect(isSafeRelativePath("//evil.com")).toBe(false);
  });

  it("validates supabase storage image urls", () => {
    expect(
      isValidBannerImageUrl(
        "https://abc.supabase.co/storage/v1/object/public/banners/a.jpg"
      )
    ).toBe(true);
    expect(isValidBannerImageUrl("javascript:alert(1)")).toBe(false);
    expect(isValidBannerImageUrl("https://evil.com/x.jpg")).toBe(false);
  });

  it("validates banner link urls", () => {
    expect(isValidBannerLinkUrl("/store/foo")).toBe(true);
    expect(isValidBannerLinkUrl(null)).toBe(true);
    expect(isValidBannerLinkUrl("javascript:alert(1)")).toBe(false);
  });

  it("detects external banner links", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    expect(isExternalBannerLink("https://app.example.com/promo")).toBe(true);
    expect(isExternalBannerLink("/promo")).toBe(false);
  });
});
