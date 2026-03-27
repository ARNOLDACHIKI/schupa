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

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { signup, isLoading } = useAuth();
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
      toast({ title: "Account Created!", description: result.message });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-16 px-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Awaiting Approval</h2>
              <p className="text-muted-foreground mb-6">
                Your account has been created successfully! Please wait for admin approval before you can log in.
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
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
              <span className="text-primary-foreground font-display font-bold">S</span>
            </div>
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
