import { Link } from "react-router-dom";

export default function UserNotRegisteredError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-xl font-semibold">Account not registered</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This account is not registered for the application. Contact the app administrator or continue with another account.
        </p>
        <Link className="mt-5 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/login">
          Continue to sign in
        </Link>
      </section>
    </main>
  );
}