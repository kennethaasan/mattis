import { describe, expect, test } from "vitest";

import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils/id";

describe("utils", () => {
  test("cn merges class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "text-red-500")).toBe(
      "text-sm text-red-500",
    );
  });

  test("generateId returns a UUID", () => {
    const id = generateId();

    expect(typeof id).toBe("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test("generateId produces unique values", () => {
    const first = generateId();
    const second = generateId();

    expect(first).not.toBe(second);
  });
});
