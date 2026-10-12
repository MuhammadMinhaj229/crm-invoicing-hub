import { describe, expect, test } from "bun:test";
import { hasCmsEditorAccess } from "../src/lib/page-builder/access";

describe("CMS editor access", () => {
  test("allows explicitly provisioned editor roles", () => {
    expect(hasCmsEditorAccess("owner")).toBe(true);
    expect(hasCmsEditorAccess("admin")).toBe(true);
    expect(hasCmsEditorAccess("editor")).toBe(true);
  });

  test("denies absent, unknown and user-controlled role values", () => {
    expect(hasCmsEditorAccess(undefined)).toBe(false);
    expect(hasCmsEditorAccess(null)).toBe(false);
    expect(hasCmsEditorAccess("")).toBe(false);
    expect(hasCmsEditorAccess("member")).toBe(false);
    expect(hasCmsEditorAccess("marketing")).toBe(false);
    expect(hasCmsEditorAccess({ role: "owner" })).toBe(false);
  });
});
