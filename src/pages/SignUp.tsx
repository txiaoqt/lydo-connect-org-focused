import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PREDEFINED_ADMIN_CREDENTIALS } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

type BarangayOption = {
  id: string;
  name: string;
};

const SignUp = () => {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [barangays, setBarangays] = useState<BarangayOption[]>([]);
  const [barangaysLoading, setBarangaysLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const useSupabaseAuth = Boolean(supabase);
  const isAdminMode = mode === "admin";
  const passwordsMatch = password === confirmPassword;
  const canSubmit = Boolean(
    !isAdminMode &&
      useSupabaseAuth &&
      name.trim() &&
      email.trim() &&
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
        .order("name", { ascending: true })
        .limit(16);

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

    if (isAdminMode) {
      toast({
        title: "Admin Registration Disabled",
        description: "Admin accounts are predefined and cannot be registered from this page.",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Password Mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    const result = await signUp({
      email,
      password,
      fullName: name,
      contactNumber,
      barangayId,
    });
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
    setContactNumber("");
    setBarangayId(barangays[0]?.id ?? "");
    setPassword("");
    setConfirmPassword("");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-[#071422] text-slate-100 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-180px] right-[-140px] h-[360px] w-[360px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[-190px] left-[-150px] h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 text-left">
          <Link to="/" className="inline-flex items-center gap-3 max-w-full">
            <div className="h-11 w-11 rounded-xl bg-emerald-400 text-[#082538] font-bold flex items-center justify-center shadow-[0_0_0_1px_rgba(16,185,129,0.45)]">
              LC
            </div>
            <div>
              <p className="font-heading font-bold text-base leading-tight text-white">LYDO Connect</p>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Admin Portal</p>
            </div>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#1b3248] bg-[#0b1a2b]/95 backdrop-blur-xl p-6 sm:p-7 space-y-5 shadow-[0_24px_60px_rgba(2,8,24,0.55)]"
        >
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Create account</h1>
            <p className="text-sm text-cyan-100/65 mt-1">Only user accounts can be created here.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-cyan-100/85">Account Type</Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0f2437] p-1 border border-[#1a3249]">
              <button
                type="button"
                onClick={() => setMode("user")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !isAdminMode ? "bg-emerald-400 text-[#082538]" : "text-cyan-100/70 hover:text-cyan-100"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setMode("admin")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isAdminMode ? "bg-emerald-400 text-[#082538]" : "text-cyan-100/70 hover:text-cyan-100"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {!useSupabaseAuth && !isAdminMode && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
              Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file.
            </div>
          )}

          {isAdminMode && (
            <div className="rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              Admin accounts are predefined and cannot be registered.
              {" Use "}<code>{PREDEFINED_ADMIN_CREDENTIALS.username}</code>
              {" / "}
              <code>{PREDEFINED_ADMIN_CREDENTIALS.password}</code>
              {" on the sign-in page."}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-cyan-100/85">Full Name</Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#10273a] border-[#1f3b55] text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400/40"
              disabled={isAdminMode}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-cyan-100/85">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#10273a] border-[#1f3b55] text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400/40"
              disabled={isAdminMode}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber" className="text-cyan-100/85">Contact Number (Optional)</Label>
            <Input
              id="contactNumber"
              placeholder="09XXXXXXXXX"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="bg-[#10273a] border-[#1f3b55] text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400/40"
              disabled={isAdminMode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barangayId" className="text-cyan-100/85">Barangay</Label>
            <select
              id="barangayId"
              value={barangayId}
              onChange={(e) => setBarangayId(e.target.value)}
              className="w-full rounded-md border border-[#1f3b55] bg-[#10273a] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              disabled={isAdminMode || barangaysLoading || barangays.length === 0}
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
            {!isAdminMode && barangays.length === 0 && !barangaysLoading && (
              <p className="text-xs text-amber-300">Barangay list is empty. Seed the 16 barangays first.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-cyan-100/85">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#10273a] border-[#1f3b55] text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400/40"
              disabled={isAdminMode}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-cyan-100/85">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#10273a] border-[#1f3b55] text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400/40"
              disabled={isAdminMode}
              required
            />
            {!isAdminMode && confirmPassword && !passwordsMatch && (
              <p className="text-xs text-rose-300">Passwords do not match.</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-[#072134] font-semibold"
            disabled={!canSubmit}
          >
            {isAdminMode ? "Admin Cannot Register" : "Create User Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-cyan-100/65 mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-emerald-300 font-medium hover:text-emerald-200">Sign in</Link>
        </p>
        <p className="text-center mt-3">
          <Link to="/" className="text-sm text-cyan-100/55 hover:text-cyan-100 transition-colors">&lt;- Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
