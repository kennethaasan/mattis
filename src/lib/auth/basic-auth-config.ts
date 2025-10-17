export const BASIC_AUTH_PROVIDER_ID = "credential" as const;

export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
};

export const basicAuthUser = {
  id: getEnvVar("BASIC_AUTH_USER_ID"),
  email: getEnvVar("BASIC_AUTH_USERNAME"),
  password: getEnvVar("BASIC_AUTH_PASSWORD"),
} as const;

export const basicAuthUserProfile = {
  email: basicAuthUser.email,
  emailVerified: true,
  name: basicAuthUser.email,
} as const;
