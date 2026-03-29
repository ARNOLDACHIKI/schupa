import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import schupaLogo from "@/assets/schupa-logo.png";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const { signup, verifySignupCode, resendSignupCode, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Error", description: "Please agree to the terms and conditions.", variant: "destructive" });
      return;
    }
    const result = await signup(name, email, password);
    if (result.success) {
      setSubmitted(true);
      toast({ title: "Verification Code Sent", description: result.message });
      return;
    }

    toast({ title: "Sign Up Failed", description: result.message, variant: "destructive" });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(verificationCode.trim())) {
      toast({ title: "Invalid Code", description: "Enter the 6-digit verification code.", variant: "destructive" });
      return;
    }

    const result = await verifySignupCode(email, verificationCode.trim());
    if (!result.success) {
      toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
      return;
    }

    setEmailVerified(true);
    toast({ title: "Email Verified", description: result.message });
  };

  const handleResendCode = async () => {
    const result = await resendSignupCode(email);
    if (!result.success) {
      toast({ title: "Unable to Resend", description: result.message, variant: "destructive" });
      return;
    }

    toast({ title: "Code Sent", description: result.message });
  };

  if (submitted && !emailVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-16 px-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Verify Your Email</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Verification Code</label>
                  <Input
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
              <Button type="button" variant="outline" className="w-full mt-3" onClick={() => void handleResendCode()} disabled={isLoading}>
                Resend Code
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Verification code expires in 15 minutes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted && emailVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-16 px-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Email Verified</h2>
              <p className="text-muted-foreground mb-6">
                Your scholarship application has been submitted and is now pending admin approval.
                You can sign in once your account is approved.
              </p>
              <Link to="/signin">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <img src={schupaLogo} alt="SCHUPA logo" className="w-12 h-12 rounded-xl object-cover mx-auto mb-2" />
            <CardTitle className="font-display text-2xl">Create Account</CardTitle>
            <CardDescription>Join SCHUPA and start your journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
                <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Confirm Password</label>
                <Input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the <Link to="/terms" className="text-accent hover:underline">Terms & Conditions</Link>
                </label>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? "Creating account..." : <><UserPlus className="w-4 h-4 mr-2" /> Sign Up</>}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <Link to="/signin" className="text-accent hover:underline font-medium">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
