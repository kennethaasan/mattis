
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FettMattisCreateSchema } from "@/lib/api/schemas";
import { Player, Round } from "@/lib/db/schema";

interface FettMattisFormProps {
  onSubmit: (data: z.infer<typeof FettMattisCreateSchema>) => void;
  players: Player[];
  rounds: Round[];
  initialData?: z.infer<typeof FettMattisCreateSchema>;
}

export function FettMattisForm({ onSubmit, players, rounds, initialData }: FettMattisFormProps) {
  const form = useForm<z.infer<typeof FettMattisCreateSchema>>({
    resolver: zodResolver(FettMattisCreateSchema),
    defaultValues: initialData || {
      player_id: "",
      round_id: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="player_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="round_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Round (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a round" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.id} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
