"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Select from 'react-select';

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
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoundCreateSchema } from "@/lib/api/schemas";
import { Player } from "@/lib/db/schema";

interface RoundFormProps {
  onSubmit: (data: z.infer<typeof RoundCreateSchema>) => void;
  players: Player[];
  initialData?: z.infer<typeof RoundCreateSchema>;
}

export function RoundForm({ onSubmit, players, initialData }: RoundFormProps) {
  const form = useForm<z.infer<typeof RoundCreateSchema>>({
    resolver: zodResolver(RoundCreateSchema),
    defaultValues: initialData || {
      participant_ids: [],
      loser_id: "",
    },
  });

  const playerOptions = players.map(player => ({ value: player.id, label: player.displayName }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="participant_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participants</FormLabel>
              <FormControl>
                <Select
                  isMulti
                  options={playerOptions}
                  onChange={options => field.onChange(options.map(option => option.value))}
                  value={playerOptions.filter(option => field.value.includes(option.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="loser_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loser</FormLabel>
              <ShadcnSelect onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the loser" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {players
                    .filter((player) =>
                      form.getValues("participant_ids").includes(player.id)
                    )
                    .map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </ShadcnSelect>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}