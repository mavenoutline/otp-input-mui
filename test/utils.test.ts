import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOWED,
  defaultFormatSeconds,
  extractTyped,
  normalizeDigit,
  splitAllowed,
  stripPasteSeparators,
} from "../src/otp/utils";

describe("normalizeDigit", () => {
  it.each([
    ["٣", "3"], // Arabic-Indic
    ["۵", "5"], // Extended Arabic-Indic (was "149" in 1.x)
    ["९", "9"], // Devanagari
    ["７", "7"], // Fullwidth
    ["a", "a"],
  ])("%s -> %s", (input, expected) => expect(normalizeDigit(input)).toBe(expected));
});

describe("splitAllowed", () => {
  it("drops disallowed chars", () => {
    expect(splitAllowed("12a3", DEFAULT_ALLOWED.number)).toEqual(["1", "2", "3"]);
  });
  it("applies transform before validating", () => {
    expect(splitAllowed("ab1", /^[A-Z0-9]$/, "uppercase")).toEqual(["A", "B", "1"]);
  });
  it("is safe with global regexes", () => {
    expect(splitAllowed("111", /[0-9]/g)).toEqual(["1", "1", "1"]);
  });
});

describe("extractTyped", () => {
  it("handles caret before and after the existing char", () => {
    expect(extractTyped("51", "5")).toBe("1");
    expect(extractTyped("15", "5")).toBe("1");
  });
  it("passes through replacements and autofill", () => {
    expect(extractTyped("7", "5")).toBe("7");
    expect(extractTyped("123456", "")).toBe("123456");
  });
});

it("stripPasteSeparators", () => {
  expect(stripPasteSeparators(" 123-456 ")).toBe("123456");
});

it("defaultFormatSeconds", () => {
  expect(defaultFormatSeconds(75)).toBe("1:15");
  expect(defaultFormatSeconds(-3)).toBe("0:00");
});
