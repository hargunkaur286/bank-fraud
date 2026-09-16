"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { EnterAccountForm } from "./enter-account-form";
import { CreateAccountForm } from "./create-account-form";
import { useActiveAccount } from "@/lib/account-context";

export function OnboardingScreen() {
  const { error } = useActiveAccount();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Coverstone</h1>
          <div className="h-0.75 w-8 rounded-full bg-primary" />
          <p className="mt-1 text-sm text-muted-foreground">
            Digital banking with built-in fraud detection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Log in, or create a new account.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error.message}
              </p>
            ) : null}
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="new">Create account</TabsTrigger>
                <TabsTrigger value="legacy">Account number</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-4">
                <LoginForm />
              </TabsContent>
              <TabsContent value="new" className="pt-4">
                <CreateAccountForm />
              </TabsContent>
              <TabsContent value="legacy" className="pt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  For accounts created before login existed - these have no
                  password on file, so this skips authentication entirely.
                </p>
                <EnterAccountForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
