import { z } from "zod";

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

export const AuthSessionResponseSchema = z.union([
  AuthSessionSchema,
  z.null(),
]);

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

export const PlayersResponseSchema = PlayerSchema.array();

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

export const RoundListResponseSchema = RoundSchema.array();
export const LatestRoundResponseSchema = RoundSchema.nullable();

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

export const FettMattisListResponseSchema = FettMattisSchema.array();

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

export const RegularLeaderboardResponseSchema =
  RegularLeaderboardItemSchema.array();
export const FettmattisLeaderboardResponseSchema =
  FettmattisLeaderboardItemSchema.array();

// --- Utility Schemas ---

export const ProblemDetailsSchema = z.object({
  type: z.string().url().or(z.literal("about:blank")),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().url().optional(),
});

// --- Exported Types ---

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthSessionData = z.infer<typeof AuthSessionDataSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type EmailPasswordSignInRequest = z.infer<
  typeof EmailPasswordSignInRequestSchema
>;
export type EmailPasswordSignInResponse = z.infer<
  typeof EmailPasswordSignInResponseSchema
>;
export type SignOutResponse = z.infer<typeof SignOutResponseSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerCreate = z.infer<typeof PlayerCreateSchema>;
export type PlayerUpdate = z.infer<typeof PlayerUpdateSchema>;
export type Round = z.infer<typeof RoundSchema>;
export type RoundCreate = z.infer<typeof RoundCreateSchema>;
export type RoundUpdate = z.infer<typeof RoundUpdateSchema>;
export type FettMattis = z.infer<typeof FettMattisSchema>;
export type FettMattisCreate = z.infer<typeof FettMattisCreateSchema>;
export type RegularLeaderboardItem = z.infer<
  typeof RegularLeaderboardItemSchema
>;
export type FettmattisLeaderboardItem = z.infer<
  typeof FettmattisLeaderboardItemSchema
>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
