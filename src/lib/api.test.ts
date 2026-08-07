import { formatLastEdited, formatNoteDate } from "./api";

describe("formatNoteDate", () => {
  const now = new Date("2024-07-21T12:00:00Z");

  it("returns today", () => {
    expect(formatNoteDate("2024-07-21T08:00:00Z", now)).toBe("today");
  });

  it("returns yesterday", () => {
    expect(formatNoteDate("2024-07-20T08:00:00Z", now)).toBe("yesterday");
  });

  it("returns month day", () => {
    expect(formatNoteDate("2024-06-11T08:00:00Z", now)).toMatch(/June/);
  });
});

describe("formatLastEdited", () => {
  it("formats timestamp", () => {
    const text = formatLastEdited("2024-07-21T20:39:00Z");
    expect(text).toContain("2024");
  });
});
