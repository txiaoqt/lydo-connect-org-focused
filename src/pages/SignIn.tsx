import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const MOCK_LOGIN = {
  email: "youthuser@lydo.local",
  password: "YouthConnect123",
};

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailMatches = email.trim().toLowerCase() === MOCK_LOGIN.email.toLowerCase();
    const passwordMatches = password === MOCK_LOGIN.password;

    if (!emailMatches || !passwordMatches) {
      toast({
        title: "Sign In Failed",
        description: "Use the mock credentials shown in the input placeholders.",
      });
      return;
    }

    signIn();
    toast({ title: "Signed In", description: "You are now signed in to LYDO Connect." });
    setEmail("");
    setPassword("");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xl">L</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">LYDO <span className="text-primary">Connect</span></span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 card-shadow space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder={MOCK_LOGIN.email} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder={MOCK_LOGIN.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">&lt;- Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
