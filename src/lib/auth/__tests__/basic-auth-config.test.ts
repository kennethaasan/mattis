import { describe, expect, test } from "vitest";

import {
  BASIC_AUTH_PROVIDER_ID,
  basicAuthUser,
  basicAuthUserProfile,
  getEnvVar,
} from "@/lib/auth/basic-auth-config";

describe("basic-auth-config", () => {
  test("exposes the credential provider id", () => {
    expect(BASIC_AUTH_PROVIDER_ID).toBe("credential");
  });

  test("getEnvVar returns configured values", () => {
    const value = getEnvVar("BASIC_AUTH_USERNAME");
    expect(value).toBe(process.env.BASIC_AUTH_USERNAME);
  });

  test("getEnvVar throws for missing values", () => {
    const key = "MISSING_BASIC_AUTH_CONFIG_VALUE";
    const existing = process.env[key];
    delete process.env[key];

    expect(() => getEnvVar(key)).toThrow(
      `Environment variable ${key} is not set.`,
    );

    if (existing) {
      process.env[key] = existing;
    }
  });

  test("builds a stable basic auth user", () => {
    expect(basicAuthUser).toEqual({
      id: process.env.BASIC_AUTH_USER_ID,
      email: process.env.BASIC_AUTH_USERNAME,
      password: process.env.BASIC_AUTH_PASSWORD,
    });
  });

  test("builds a basic auth profile from the user", () => {
    expect(basicAuthUserProfile).toEqual({
      email: process.env.BASIC_AUTH_USERNAME,
      emailVerified: true,
      name: process.env.BASIC_AUTH_USERNAME,
    });
  });
});
