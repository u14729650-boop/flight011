import { describe, expect, it } from "vitest";
import { isLive, starterBanners, type Banner } from "@/data/banners";
import { parseBannerInput } from "@/lib/banner-schema";

const base: Banner = { ...starterBanners[0], id: "x" };

describe("banner scheduling", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("respects active flag and start/end dates", () => {
    expect(isLive(base, now)).toBe(true);
    expect(isLive({ ...base, active: false }, now)).toBe(false);
    expect(isLive({ ...base, startsAt: "2026-10-12T00:00:00Z" }, now)).toBe(false);
    expect(isLive({ ...base, endsAt: "2026-10-11T12:00:00Z" }, now)).toBe(false);
    expect(isLive({ ...base, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-10-31T00:00:00Z" }, now)).toBe(true);
  });
});

describe("banner validation", () => {
  it("accepts a complete banner", () => {
    const { banner, errors } = parseBannerInput({ ...base, title: "  Diwali edit  " });
    expect(errors).toEqual({});
    expect(banner.title).toBe("Diwali edit");
  });
  it("requires a headline and an image, and a button needs both text and link", () => {
    const { errors } = parseBannerInput({ placement: "home", ctaLabel: "Shop" });
    expect(Object.keys(errors).sort()).toEqual(["ctaHref", "image", "title"]);
  });
  it("rejects unsafe links and images", () => {
    const { errors, banner } = parseBannerInput({ ...base, ctaHref: "javascript:alert(1)", image: { src: "http://insecure.example/a.jpg" } });
    expect(errors.ctaHref).toBeTruthy();
    expect(errors.image).toBeTruthy();
    expect(banner.image).toBeNull();
  });
  it("validates the schedule", () => {
    const { errors } = parseBannerInput({ ...base, startsAt: "2026-10-20T10:00", endsAt: "2026-10-19T10:00" });
    expect(errors.endsAt).toBeTruthy();
  });
});
