interface ProblemDetailLike {
  detail?: unknown;
  error?: unknown;
}

interface IssueLike {
  message?: unknown;
}

const isIssueLike = (value: unknown): value is IssueLike => {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in (value as Record<string, unknown>) &&
    typeof (value as IssueLike).message === "string"
  );
};

export function extractProblemDetailMessage(
  payload: unknown,
): string | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const candidate = payload as ProblemDetailLike;

  if (typeof candidate.detail === "string") {
    return candidate.detail;
  }

  if (Array.isArray(candidate.error)) {
    for (const entry of candidate.error) {
      if (isIssueLike(entry)) {
        return entry.message as string;
      }
    }
  }

  return undefined;
}
