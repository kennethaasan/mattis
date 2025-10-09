import { z } from "zod";

// --- Base Schemas ---

export const uuidSchema = z.string().refine((val) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}, { message: "Must be a valid UUID." });

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

export const RoundCreateSchema = z.object({
  participant_ids: z.array(uuidSchema).min(2, "A round must have at least two participants."),
  loser_id: uuidSchema,
}).refine(data => data.participant_ids.includes(data.loser_id), {
  message: "The loser must be one of the participants.",
  path: ["loser_id"],
});

export const RoundUpdateSchema = z.object({
  participant_ids: z.array(uuidSchema).min(2, "A round must have at least two participants.").optional(),
  loser_id: uuidSchema.optional(),
}).refine(data => {
  if (data.participant_ids && data.loser_id) {
    return data.participant_ids.includes(data.loser_id);
  }
  return true;
}, {
  message: "The loser must be one of the participants.",
  path: ["loser_id"],
});

// --- FettMattis Schemas ---

export const FettMattisCreateSchema = z.object({
  player_id: uuidSchema,
  round_id: uuidSchema.optional(),
});

// --- Leaderboard Schemas ---

const CURRENT_YEAR = new Date().getFullYear();

export const LeaderboardQuerySchema = z.object({
  year: z
    .union([z.literal("all"), z.coerce.number().int().min(2000).max(CURRENT_YEAR)])
    .optional(),
});

// --- Utility Schemas ---

export const ProblemDetailsSchema = z.object({
  type: z.url().default("about:blank"),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.url().optional(),
});

// Export types
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerCreate = z.infer<typeof PlayerCreateSchema>;
export type PlayerUpdate = z.infer<typeof PlayerUpdateSchema>;
export type RoundCreate = z.infer<typeof RoundCreateSchema>;
export type RoundUpdate = z.infer<typeof RoundUpdateSchema>;
export type FettMattisCreate = z.infer<typeof FettMattisCreateSchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
