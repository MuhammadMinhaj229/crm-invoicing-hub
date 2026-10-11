import { describe, expect, test } from "bun:test";

import { parsePageDocument, validatePageDocument } from "../src/lib/page-builder/schema";

const layout = {
  align: "left",
  width: "normal",
  spaceTop: 3,
  spaceBottom: 3,
  background: "none",
  hideMobile: false,
  hideDesktop: false,
};

function validDocument() {
  return {
    page: "home",
    blocks: [
      {
        id: "text-block",
        type: "text",
        props: { text: "A structured, editable page." },
        layout,
      },
    ],
  };
}

describe("page document contract", () => {
  test("accepts a valid legacy document and supplies schema version 1", () => {
    const result = parsePageDocument(validDocument());
    expect(result).not.toBeNull();
    expect(result?.schemaVersion).toBe(1);
    expect(result?.page).toBe("home");
  });

  test("rejects unsupported block types", () => {
    const document = validDocument();
    document.blocks[0] = {
      id: "unsafe-block",
      type: "rawHtml",
      props: { html: "<script>alert(1)</script>" },
      layout,
    };
    expect(validatePageDocument(document).ok).toBe(false);
  });

  test("rejects javascript URLs in editable button actions", () => {
    const document = {
      schemaVersion: 1,
      page: "home",
      blocks: [
        {
          id: "button-block",
          type: "buttons",
          props: {
            items: [
              { id: "btn-1", label: "Open", href: "javascript:alert(1)", style: "solid", size: "md" },
            ],
          },
          layout,
        },
      ],
    };
    const result = validatePageDocument(document);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("HTTP(S)");
  });

  test("rejects unsupported document versions", () => {
    const document = { ...validDocument(), schemaVersion: 99 };
    expect(parsePageDocument(document)).toBeNull();
  });

  test("rejects non-serializable data", () => {
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;
    expect(validatePageDocument(circular).ok).toBe(false);
  });
});
