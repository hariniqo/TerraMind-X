import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { navigateToLogin } = useAuth();
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!navigateToLogin()) setError("Sign-in is unavailable in this preview.");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Sign in"
      subtitle="Continue through the secure account sign-in page."
      footer={
        <Link to="/register" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <p className="mb-3 text-sm text-destructive" role="status">{error}</p>}
        <Button type="submit" className="w-full h-12 font-medium">
          Continue to sign in
        </Button>
      </form>
    </AuthLayout>
  );
}