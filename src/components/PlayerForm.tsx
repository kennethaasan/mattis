
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
import { Input } from "@/components/ui/input";
import { PlayerCreateSchema } from "@/lib/api/schemas";

interface PlayerFormProps {
  onSubmit: (data: z.infer<typeof PlayerCreateSchema>) => void;
  initialData?: z.infer<typeof PlayerCreateSchema>;
}

export function PlayerForm({ onSubmit, initialData }: PlayerFormProps) {
  const form = useForm<z.infer<typeof PlayerCreateSchema>>({
    resolver: zodResolver(PlayerCreateSchema),
    defaultValues: initialData || {
      display_name: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter player name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
