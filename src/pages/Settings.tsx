import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Eye, EyeOff, Lock, Mail, Bell, Trash2, Moon, Languages } from "lucide-react";

interface UserPreference {
  emailNotifications: boolean;
  weeklyReport: boolean;
  adminAlerts: boolean;
  feeReminders: boolean;
  language: "en" | "sw";
  darkMode: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthInitialized } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "notifications" | "account">("password");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [preferences, setPreferences] = useState<UserPreference>({
    emailNotifications: true,
    weeklyReport: true,
    adminAlerts: true,
    feeReminders: true,
    language: "en",
    darkMode: false,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await apiRequest<{ preference: UserPreference }>("/preferences");
        setPreferences(response.preference);
        document.documentElement.classList.toggle("dark", response.preference.darkMode);
        localStorage.setItem("schupa_dark_mode", String(response.preference.darkMode));
        localStorage.setItem("schupa_language", response.preference.language);
      } catch (_error) {
        // keep defaults
      }
    };

    if (user) {
      void loadPreferences();
    }
  }, [user]);

  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/signin");
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword,
          newPassword,
        },
      });
      toast({ title: "Success", description: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ preference: UserPreference }>("/preferences", {
        method: "PATCH",
        body: preferences,
      });
      setPreferences(response.preference);
      document.documentElement.classList.toggle("dark", response.preference.darkMode);
      localStorage.setItem("schupa_dark_mode", String(response.preference.darkMode));
      localStorage.setItem("schupa_language", response.preference.language);
      toast({ title: "Success", description: "Preferences updated." });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save preferences.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure? This action cannot be undone. All your data will be permanently deleted.")) {
      try {
        await apiRequest<{ message: string }>("/auth/account", { method: "DELETE" });
        logout();
        toast({ title: "Account deleted", description: "Your account has been removed.", variant: "destructive" });
        navigate("/");
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Unable to delete account.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Tabs */}
          <div className="md:col-span-1">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <Button
                  variant={activeTab === "password" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("password")}
                >
                  <Lock className="w-4 h-4 mr-2" /> Password
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                </Button>
                <Button
                  variant={activeTab === "account" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("account")}
                >
                  <Mail className="w-4 h-4 mr-2" /> Account
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeTab === "password" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Current Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">New Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Confirm Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">Email Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive emails for account activities</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Weekly Progress Report</p>
                        <p className="text-sm text-muted-foreground">Get a summary of your progress every Sunday</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.weeklyReport}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, weeklyReport: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Admin Alerts</p>
                        <p className="text-sm text-muted-foreground">Important messages from administrators</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.adminAlerts}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, adminAlerts: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Fee Reminders</p>
                        <p className="text-sm text-muted-foreground">Notifications when fees are due</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.feeReminders}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, feeReminders: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium flex items-center gap-2"><Moon className="w-4 h-4" /> Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Switch between light and dark appearance</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, darkMode: e.target.checked }))}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="p-3 border border-border/50 rounded-lg">
                      <p className="font-medium flex items-center gap-2 mb-2"><Languages className="w-4 h-4" /> Language</p>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value as "en" | "sw" }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="en">English</option>
                        <option value="sw">Kiswahili</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleSavePreferences}
                      disabled={isLoading}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isLoading ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "account" && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display">Account Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-medium mb-2">Account Email</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="font-medium mb-2">Account Status</p>
                    <p className="text-muted-foreground">{user?.approved ? "Active" : "Pending Approval"}</p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                    >
                      Sign Out
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                  </div>

                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                    <p className="font-medium mb-1">⚠️ Danger Zone</p>
                    <p>Deleting your account is permanent and cannot be reversed. All your data will be deleted.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
