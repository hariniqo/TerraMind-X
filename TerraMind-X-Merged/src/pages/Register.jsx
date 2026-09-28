import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const { navigateToLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!navigateToLogin()) setError("Account setup is unavailable in this preview.");
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create an account"
      subtitle="Continue through the secure account setup page."
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          Already have an account? Sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <p className="mb-3 text-sm text-destructive" role="status">{error}</p>}
        <Button type="submit" className="w-full h-12 font-medium">
          Continue to account setup
        </Button>
      </form>
    </AuthLayout>
  );
}