import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Navbar from "@/components/Navbar";
import schupaLogo from "@/assets/schupa-logo.png";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPendingApprovalNotice, setShowPendingApprovalNotice] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPendingApprovalNotice(false);
    const result = await login(email, password);
    if (result.success) {
      toast({ title: "Welcome back!", description: result.message });
      navigate(result.role === "admin" ? "/admin" : "/dashboard");
    } else {
      if (result.message.toLowerCase().includes("pending admin approval")) {
        setShowPendingApprovalNotice(true);
      }
      toast({ title: "Login Failed", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <img src={schupaLogo} alt="SCHUPA logo" className="w-12 h-12 rounded-xl object-cover mx-auto mb-2" />
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your SCHUPA account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Signing in..." : <><LogIn className="w-4 h-4 mr-2" /> Sign In</>}
              </Button>
            </form>
            {showPendingApprovalNotice && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Your application is under review by admin. You will be able to sign in once approval is completed.
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account? <Link to="/signup" className="text-accent hover:underline font-medium">Sign Up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
