import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import hi from "@/i18n/messages/hi.json";
import ta from "@/i18n/messages/ta.json";

type Tree = { [key: string]: string | Tree };

/** "topbar.settings" style paths to every string in the tree. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
    return out;
  }, {});
}

/** Names of the {placeholders} in an ICU message, ignoring plural and select branches. */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]).sort();
}

const source = flatten(en);

describe.each([
  ["ta", ta],
  ["hi", hi],
])("%s messages", (_locale, messages) => {
  const translated = flatten(messages as Tree);

  it("has exactly the same keys as English", () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
  });

  it("has no empty strings", () => {
    for (const [key, value] of Object.entries(translated)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("keeps the same {placeholders} as English, so no value is dropped", () => {
    for (const [key, value] of Object.entries(translated)) {
      expect(placeholders(value), key).toEqual(placeholders(source[key]));
    }
  });
});
