"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { z } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(1).max(32),
  password: z.string().min(8).max(128),
});

type FormType = z.infer<typeof formSchema>;

export default function LoginForm() {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "difaananda40",
      password: "123321123321",
    },
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = form;

  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    try {
      await authService.login(data);
      router.replace("/dashboard");
    } catch (error) {
      let message = "An unexpected error occurred. Please try again.";

      if (error instanceof ApiError) {
        const fieldErrors = error.validationErrors?.fieldErrors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof FormType, {
              type: "server",
              message: messages[0],
            });
          });
        }
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setApiErrorMessage(message);
    }
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-y-4" onSubmit={handleSubmit(onSubmit)}>
        {apiErrorMessage && (
          <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
            {apiErrorMessage}
          </div>
        )}

        <div className="flex flex-col gap-y-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Type your username" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Type your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
