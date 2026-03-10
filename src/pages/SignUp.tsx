import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const useSupabaseAuth = Boolean(supabase);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signUp({ email, password, fullName: name });
    if (result.error) {
      toast({ title: "Sign Up Failed", description: result.error });
      return;
    }

    toast({
      title: "Account Created",
      description: result.needsEmailConfirmation
        ? "Check your email to confirm your account before signing in."
        : "Your account has been created successfully.",
    });

    setName("");
    setEmail("");
    setPassword("");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 max-w-full">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm tracking-tight">YG</span>
            </div>
            <span className="font-heading font-bold text-left text-sm sm:text-base text-foreground leading-tight">
              <span className="sm:hidden">Youth Governance System</span>
              <span className="hidden sm:inline">Youth Governance Transparency and Accountability System</span>
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join the youth of San Mateo today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 card-shadow space-y-4">
          {!useSupabaseAuth && (
            <div className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
              Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={!useSupabaseAuth}>Create Account</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">&lt;- Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
