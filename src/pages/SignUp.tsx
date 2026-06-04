import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BrandLogo from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type BarangayOption = {
  id: string;
  name: string;
};

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [barangays, setBarangays] = useState<BarangayOption[]>([]);
  const [barangaysLoading, setBarangaysLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const useSupabaseAuth = Boolean(supabase);
  const passwordsMatch = password === confirmPassword;
  const isGmailEmail = /^[a-z0-9._%+-]+@gmail\.com$/i.test(email.trim());
  const normalizedContactNumber = contactNumber.trim();
  const isContactNumberValid = /^09\d{9}$/.test(normalizedContactNumber);
  const selectedBarangayName = barangays.find((item) => item.id === barangayId)?.name ?? "N/A";
  const canSubmit = Boolean(
    useSupabaseAuth &&
      name.trim() &&
      email.trim() &&
      isGmailEmail &&
      isContactNumberValid &&
      barangayId &&
      password &&
      confirmPassword &&
      passwordsMatch,
  );

  useEffect(() => {
    let mounted = true;

    const loadBarangays = async () => {
      if (!supabase) {
        if (!mounted) return;
        setBarangays([]);
        setBarangaysLoading(false);
        return;
      }

      setBarangaysLoading(true);
      const { data, error } = await supabase
        .from("barangays")
        .select("id,name")
        .order("name", { ascending: true });

      if (!mounted) return;
      if (error) {
        setBarangays([]);
        setBarangaysLoading(false);
        return;
      }

      const options = (data ?? []).map((row) => ({ id: row.id as string, name: row.name as string }));
      setBarangays(options);
      setBarangaysLoading(false);
      if (!barangayId && options.length > 0) {
        setBarangayId(options[0].id);
      }
    };

    void loadBarangays();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast({
        title: "Password Mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    if (!isGmailEmail) {
      toast({
        title: "Invalid Email",
        description: "Use a valid Gmail address ending with @gmail.com.",
      });
      return;
    }

    if (!isContactNumberValid) {
      toast({
        title: "Invalid Contact Number",
        description: "Contact number must be 11 digits and start with 09.",
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  const proceedCreateAccount = async () => {
    setIsCreating(true);
    const result = await signUp({
      email: email.trim().toLowerCase(),
      password,
      fullName: name,
      contactNumber: normalizedContactNumber,
      barangayId,
    });
    setIsCreating(false);
    if (result.error) {
      setIsConfirmOpen(false);
      toast({ title: "Sign Up Failed", description: result.error });
      return;
    }

    setIsConfirmOpen(false);
    toast({
      title: "Account Created",
      description: result.needsEmailConfirmation
        ? "Check your email to confirm your account. The confirmation link will sign you in automatically."
        : "Your account has been created. Please sign in using your credentials.",
    });

    setName("");
    setEmail("");
    setContactNumber("");
    setBarangayId(barangays[0]?.id ?? "");
    setPassword("");
    setConfirmPassword("");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-180px] right-[-140px] h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-190px] left-[-150px] h-[400px] w-[400px] rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 text-left">
          <Link to="/" className="inline-flex items-center gap-3 max-w-full">
            <BrandLogo imgClassName="h-10 w-10" showText subtitle="Youth Portal" />
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-5 card-shadow"
        >
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Only user accounts can be created here.</p>
          </div>

          {!useSupabaseAuth && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
              Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              required
            />
            {email && !isGmailEmail && <p className="text-xs text-destructive">Email must end with @gmail.com.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber" className="text-foreground">Contact Number</Label>
            <Input
              id="contactNumber"
              placeholder="09XXXXXXXXX"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              inputMode="numeric"
              maxLength={11}
              required
            />
            {!isContactNumberValid && (
              <p className="text-xs text-destructive">Contact number must be 11 digits and start with 09.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="barangayId" className="text-foreground">Barangay</Label>
            <select
              id="barangayId"
              value={barangayId}
              onChange={(e) => setBarangayId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={barangaysLoading || barangays.length === 0}
              required
            >
              {barangays.length === 0 ? (
                <option value="">
                  {barangaysLoading ? "Loading barangays..." : "No barangays available"}
                </option>
              ) : (
                barangays.map((barangay) => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))
              )}
            </select>
            {barangays.length === 0 && !barangaysLoading && (
              <p className="text-xs text-warning">Barangay list is empty. Seed the supported barangays first.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              required
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            disabled={!canSubmit}
          >
            Create User Account
          </Button>
        </form>

        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are all details correct?</AlertDialogTitle>
            <AlertDialogDescription>
              Please review before creating your account.
              <span className="block mt-2 text-foreground">Name: {name.trim() || "N/A"}</span>
              <span className="block text-foreground">Email: {email.trim() || "N/A"}</span>
              <span className="block text-foreground">Barangay: {selectedBarangayName}</span>
              <span className="mt-3 flex items-start gap-2">
                <Checkbox
                  id="signup-policy-agreement"
                  checked={agreedToPolicies}
                  onCheckedChange={(checked) => setAgreedToPolicies(Boolean(checked))}
                  disabled={isCreating}
                />
                <Label htmlFor="signup-policy-agreement" className="text-sm font-normal leading-5 text-left text-foreground">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>See Form Again</AlertDialogCancel>
            <AlertDialogAction onClick={proceedCreateAccount} disabled={isCreating || !agreedToPolicies}>
              {isCreating ? "Creating..." : "Proceed"}
            </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium hover:text-primary/90">Sign in</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">&lt;- Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
