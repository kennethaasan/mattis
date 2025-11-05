import { z } from "zod";

import type { components } from "@/lib/api/generated";

// --- Base Schemas ---

export const uuidSchema = z.string().refine(
  (val) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      val,
    );
  },
  { message: "Must be a valid UUID." },
);

const isoDateTimeSchema = z.string().datetime({ offset: true });

// --- Authentication Schemas ---

export const AuthUserSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: isoDateTimeSchema.optional(),
  updatedAt: isoDateTimeSchema.optional(),
});

export const AuthSessionDataSchema = z.object({
  token: z.string(),
  expiresAt: isoDateTimeSchema.optional(),
  id: z.string().optional(),
  createdAt: isoDateTimeSchema.optional(),
  updatedAt: isoDateTimeSchema.optional(),
});

export const AuthSessionSchema = z.object({
  session: AuthSessionDataSchema,
  user: AuthUserSchema,
});

export const AuthSessionResponseSchema = z.union([AuthSessionSchema, z.null()]);

export const EmailPasswordSignInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  callbackURL: z.string().url().optional(),
  rememberMe: z.boolean().optional(),
});

export const EmailPasswordSignInResponseSchema = z.object({
  redirect: z.boolean(),
  token: z.string(),
  url: z.string().url().nullable().optional(),
  user: AuthUserSchema,
});

export const SignOutResponseSchema = z.object({
  success: z.boolean(),
});

// --- Player Schemas ---

export const PlayerSchema = z.object({
  id: uuidSchema,
  display_name: z.string().min(1, "Display name cannot be empty."),
  active: z.boolean(),
});

export const PlayerCreateSchema = z.object({
  display_name: z.string().min(1, "Display name cannot be empty."),
});

export const PlayerUpdateSchema = z.object({
  display_name: z.string().min(1, "Display name cannot be empty.").optional(),
  active: z.boolean().optional(),
});

// --- Round Schemas ---

export const RoundSchema = z.object({
  id: uuidSchema,
  created_at: isoDateTimeSchema,
  participants: PlayerSchema.array(),
  loser: PlayerSchema,
});

export const RoundCreateSchema = z
  .object({
    participant_ids: z
      .array(uuidSchema)
      .min(2, "A round must have at least two participants."),
    loser_id: uuidSchema,
  })
  .refine((data) => data.participant_ids.includes(data.loser_id), {
    message: "The loser must be one of the participants.",
    path: ["loser_id"],
  });

export const RoundUpdateSchema = z
  .object({
    participant_ids: z
      .array(uuidSchema)
      .min(2, "A round must have at least two participants.")
      .optional(),
    loser_id: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.participant_ids && data.loser_id) {
        return data.participant_ids.includes(data.loser_id);
      }
      return true;
    },
    {
      message: "The loser must be one of the participants.",
      path: ["loser_id"],
    },
  );

export const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// --- FettMattis Schemas ---

export const FettMattisSchema = z.object({
  id: uuidSchema,
  player: PlayerSchema,
  round_id: uuidSchema.nullish(),
  created_at: isoDateTimeSchema,
});

export const FettMattisCreateSchema = z.object({
  player_id: uuidSchema,
  round_id: uuidSchema.optional(),
});

// --- Leaderboard Schemas ---

const CURRENT_YEAR = new Date().getFullYear();

export const LeaderboardQuerySchema = z.object({
  year: z
    .union([
      z.literal("all"),
      z.coerce.number().int().min(2000).max(CURRENT_YEAR),
    ])
    .optional(),
});

export const RegularLeaderboardItemSchema = z.object({
  player: PlayerSchema,
  rank: z.number().int(),
  loss_percentage: z.number(),
  participation_count: z.coerce.number().int(),
  loss_count: z.coerce.number().int(),
});

export const FettmattisLeaderboardItemSchema = z.object({
  player: PlayerSchema,
  rank: z.number().int(),
  fettmattis_count: z.coerce.number().int(),
});

export const LeaderboardSeasonsResponseSchema = z.object({
  seasons: z.array(z.coerce.number().int().min(2000).max(CURRENT_YEAR)).min(1),
});

// --- Utility Schemas ---

export const ProblemDetailsSchema = z.object({
  type: z.string().url().or(z.literal("about:blank")),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().url().optional(),
});

// --- Exported Types ---

type ApiSchemas = components["schemas"];

export type AuthUser = ApiSchemas["AuthUser"];
export type AuthSessionData = ApiSchemas["AuthSessionData"];
export type AuthSession = ApiSchemas["AuthSession"];
export type AuthSessionResponse = AuthSession | null;
export type EmailPasswordSignInRequest =
  ApiSchemas["EmailPasswordSignInRequest"];
export type EmailPasswordSignInResponse =
  ApiSchemas["EmailPasswordSignInResponse"];
export type SignOutResponse = ApiSchemas["SignOutResponse"];
export type Player = ApiSchemas["Player"];
export type PlayerCreate = ApiSchemas["PlayerCreate"];
export type PlayerUpdate = ApiSchemas["PlayerUpdate"];
export type LeaderboardSeasonsResponse =
  ApiSchemas["LeaderboardSeasonsResponse"];
export type Round = ApiSchemas["Round"];
export type RoundCreate = ApiSchemas["RoundCreate"];
export type RoundUpdate = ApiSchemas["RoundUpdate"];
export type FettMattis = ApiSchemas["FettMattis"];
export type FettMattisCreate = ApiSchemas["FettMattisCreate"];
export type RegularLeaderboardItem = ApiSchemas["RegularLeaderboardItem"];
export type FettmattisLeaderboardItem = ApiSchemas["FettmattisLeaderboardItem"];
export type ProblemDetails = ApiSchemas["Problem"];
export type ListQuery = z.infer<typeof ListQuerySchema>;
