import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { User, GraduationCap, DollarSign, FileText, Upload, LogOut, Home, CheckCircle, Circle, Clock } from "lucide-react";
import { type Student } from "@/data/mockData";

const StudentDashboard = () => {
  const { user, logout, students, setStudents } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "fees" | "profile">("overview");

  const student = students.find((s) => s.email === user?.email) || students[0];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePhotoUpload = () => {
    toast({ title: "Photo Updated", description: "Your profile photo has been updated successfully." });
  };

  const handleResultUpload = () => {
    toast({ title: "Results Uploaded", description: "Your transcript has been uploaded for review." });
  };

  const handleFeeUpload = () => {
    toast({ title: "Fee Statement Uploaded", description: "Your fee statement has been submitted." });
  };

  if (!user) {
    navigate("/signin");
    return null;
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Home },
    { id: "results" as const, label: "Results", icon: GraduationCap },
    { id: "fees" as const, label: "Fees", icon: DollarSign },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  const progressSteps = Array.from({ length: student.totalYears }, (_, i) => ({
    year: i + 1,
    label: `Year ${i + 1}`,
    completed: i + 1 < student.currentYear,
    current: i + 1 === student.currentYear,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-primary text-primary-foreground h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="font-display font-bold text-sm text-accent-foreground">S</span>
          </div>
          <span className="font-display font-semibold text-lg hidden sm:block">SCHUPA</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-foreground/80 hidden sm:block">{user.name}</span>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-16 md:w-56 bg-card border-r border-border min-h-[calc(100vh-4rem)] p-2 md:p-4 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden md:block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Welcome */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
                <p className="text-primary-foreground/80">Here's your academic journey at a glance.</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Course", value: student.course, icon: GraduationCap },
                  { label: "Year", value: `${student.currentYear} of ${student.totalYears}`, icon: Clock },
                  { label: "Latest GPA", value: student.results[student.results.length - 1]?.gpa.toFixed(1) || "N/A", icon: FileText },
                  { label: "Fee Balance", value: `KES ${student.feeBalance.toLocaleString()}`, icon: DollarSign },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className="w-4 h-4 text-accent" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Progress Timeline */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Academic Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
                    {progressSteps.map((step) => (
                      <div key={step.year} className="relative flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed ? "bg-primary text-primary-foreground" : step.current ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {step.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs mt-2 ${step.current ? "font-bold text-accent" : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                    <div className="relative flex flex-col items-center z-10">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-xs mt-2 text-muted-foreground">Grad</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GPA Chart */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg">GPA Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={student.results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="gpa" stroke="hsl(21, 100%, 45%)" strokeWidth={3} dot={{ fill: "hsl(125, 56%, 24%)", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Remarks */}
              {student.remarks.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Admin Remarks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {student.remarks.map((r, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-secondary rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{r.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{r.by} • {r.date}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "results" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">Academic Results</h2>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleResultUpload}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Transcript
                </Button>
              </div>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg">GPA Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={student.results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="gpa" stroke="hsl(21, 100%, 45%)" strokeWidth={3} dot={{ fill: "hsl(125, 56%, 24%)", r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Results History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Semester</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Year</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">GPA</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.results.map((r, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                            <td className="py-3 px-4 text-foreground">{r.semester}</td>
                            <td className="py-3 px-4 text-foreground">{r.year}</td>
                            <td className="py-3 px-4 font-semibold text-foreground">{r.gpa.toFixed(1)}</td>
                            <td className="py-3 px-4">
                              <Badge variant={r.gpa >= 3.5 ? "default" : r.gpa >= 2.5 ? "secondary" : "destructive"} className={r.gpa >= 3.5 ? "bg-primary" : ""}>
                                {r.gpa >= 3.5 ? "Excellent" : r.gpa >= 2.5 ? "Good" : "Needs Improvement"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "fees" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">Fee Statements</h2>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleFeeUpload}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Statement
                </Button>
              </div>

              <Card className={`border-2 ${student.feeBalance > 0 ? "border-accent" : "border-primary"}`}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className={`font-display text-4xl font-bold ${student.feeBalance > 0 ? "text-accent" : "text-primary"}`}>
                    KES {student.feeBalance.toLocaleString()}
                  </p>
                  <Badge className={`mt-2 ${student.feeBalance === 0 ? "bg-primary" : "bg-accent"}`}>
                    {student.feeBalance === 0 ? "Fully Paid" : "Balance Outstanding"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Description</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Amount (KES)</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.feeRecords.map((f, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                            <td className="py-3 px-4 text-foreground">{f.date}</td>
                            <td className="py-3 px-4 text-foreground">{f.description}</td>
                            <td className={`py-3 px-4 text-right font-semibold ${f.type === "payment" ? "text-primary" : "text-accent"}`}>
                              {f.type === "payment" ? "-" : "+"}{f.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={f.type === "payment" ? "default" : "secondary"} className={f.type === "payment" ? "bg-primary" : ""}>
                                {f.type === "payment" ? "Payment" : "Charge"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">My Profile</h2>

              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={student.photo} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-display">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={handlePhotoUpload}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-display text-xl font-bold text-foreground">{student.name}</h3>
                      <p className="text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Course", value: student.course },
                  { label: "Institution", value: student.institution },
                  { label: "Year Joined", value: student.yearJoined.toString() },
                  { label: "Current Year", value: `Year ${student.currentYear} of ${student.totalYears}` },
                ].map((info) => (
                  <Card key={info.label} className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{info.label}</p>
                      <p className="font-display font-semibold text-foreground">{info.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
