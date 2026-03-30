import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, DollarSign, GraduationCap, CheckCircle, XCircle, Search, Home, UserCheck, BarChart3, FileText, Download, ArrowLeft, MessageSquare, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";

import type { Student } from "@/data/mockData";

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
  repliedAt: string | null;
  replyMessage: string | null;
  linkedUser: { id: string; name: string; email: string } | null;
}

const AdminDashboard = () => {
  const { user, students, pendingUsers, approveUser, rejectUser, addRemark, isDataLoading, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "pending" | "analytics" | "inquiries">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterFeeBalance, setFilterFeeBalance] = useState<"all" | "cleared" | "outstanding">("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [remark, setRemark] = useState("");
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplyingToInquiry, setIsReplyingToInquiry] = useState(false);

  useEffect(() => {
    if (!selectedStudent) return;
    const latest = students.find((student) => student.id === selectedStudent.id) || null;
    setSelectedStudent(latest);
  }, [students, selectedStudent]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    let mounted = true;

    const loadInquiries = async () => {
      if (mounted) {
        setIsLoadingInquiries(true);
      }

      try {
        const response = await apiRequest<{ inquiries: ContactInquiry[] }>("/admin/contact-messages");
        if (mounted) {
          setInquiries(response.inquiries);
        }
      } catch (error) {
        if (mounted) {
          toast({
            title: "Could not load inquiries",
            description: error instanceof Error ? error.message : "Unable to load contact inquiries.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setIsLoadingInquiries(false);
        }
      }
    };

    void loadInquiries();
    const timer = window.setInterval(() => {
      void loadInquiries();
    }, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [toast, user]);

  useEffect(() => {
    if (!selectedInquiryId && inquiries.length > 0) {
      setSelectedInquiryId(inquiries[0].id);
    }
  }, [inquiries, selectedInquiryId]);

  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking your session...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    navigate("/signin");
    return null;
  }

  if (isDataLoading && students.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(normalizedQuery) ||
      s.email.toLowerCase().includes(normalizedQuery) ||
      s.course.toLowerCase().includes(normalizedQuery);
    const matchCourse = !filterCourse || s.course === filterCourse;
    const matchYear = !filterYear || s.currentYear.toString() === filterYear;
    const matchFeeBalance =
      filterFeeBalance === "all" ||
      (filterFeeBalance === "cleared" && s.feeBalance <= 0) ||
      (filterFeeBalance === "outstanding" && s.feeBalance > 0);
    return matchSearch && matchCourse && matchYear && matchFeeBalance;
  });

  const courses = [...new Set(students.map((s) => s.course))];
  const totalBalance = students.reduce((sum, s) => sum + s.feeBalance, 0);
  const avgGpa = students.reduce((sum, s) => sum + (s.results[s.results.length - 1]?.gpa || 0), 0) / students.length;

  const enrollmentData = courses.map((c) => ({ name: c.length > 15 ? c.substring(0, 15) + "…" : c, count: students.filter((s) => s.course === c).length }));
  const feeData = [
    { name: "Paid", value: students.filter((s) => s.feeBalance === 0).length },
    { name: "Outstanding", value: students.filter((s) => s.feeBalance > 0).length },
  ];
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedInquiryId) || null;
  const PIE_COLORS = ["hsl(125, 56%, 24%)", "hsl(21, 100%, 45%)"];

  const performanceData = [
    { range: "3.5-4.0", count: students.filter((s) => { const g = s.results[s.results.length - 1]?.gpa || 0; return g >= 3.5; }).length },
    { range: "3.0-3.4", count: students.filter((s) => { const g = s.results[s.results.length - 1]?.gpa || 0; return g >= 3.0 && g < 3.5; }).length },
    { range: "2.5-2.9", count: students.filter((s) => { const g = s.results[s.results.length - 1]?.gpa || 0; return g >= 2.5 && g < 3.0; }).length },
    { range: "<2.5", count: students.filter((s) => { const g = s.results[s.results.length - 1]?.gpa || 0; return g < 2.5; }).length },
  ];

  const feeTrendMap = students
    .flatMap((student) => student.feeRecords)
    .reduce<Record<string, { charges: number; payments: number }>>((acc, record) => {
      const monthKey = record.date.slice(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = { charges: 0, payments: 0 };
      }

      if (record.type === "charge") {
        acc[monthKey].charges += record.amount;
      } else {
        acc[monthKey].payments += record.amount;
      }

      return acc;
    }, {});

  const feeTrendData = Object.entries(feeTrendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({
      month,
      charges: totals.charges,
      payments: totals.payments,
      netBalance: totals.charges - totals.payments,
    }));

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      toast({ title: "Approved", description: "Student has been approved." });
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Unable to approve student.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectUser(userId);
      toast({ title: "Rejected", description: "Registration has been rejected.", variant: "destructive" });
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Unable to reject registration.",
        variant: "destructive",
      });
    }
  };

  const handleAddRemark = async () => {
    if (!selectedStudent || !remark.trim()) return;
    try {
      await addRemark(selectedStudent.id, remark);
      toast({ title: "Remark Added", description: "Your remark has been saved." });
      setRemark("");
    } catch (error) {
      toast({
        title: "Remark Failed",
        description: error instanceof Error ? error.message : "Unable to add remark.",
        variant: "destructive",
      });
    }
  };

  const handleReplyInquiry = async () => {
    if (!selectedInquiryId || !replyMessage.trim()) {
      toast({ title: "Reply required", description: "Please enter a reply before sending.", variant: "destructive" });
      return;
    }

    const messageToSend = replyMessage.trim();
    console.log(`[Admin Reply] Sending reply to inquiry ${selectedInquiryId}: "${messageToSend.substring(0, 50)}..."`);

    setIsReplyingToInquiry(true);
    try {
      const response = await apiRequest<{ message: string; deliveredInWebsite: boolean }>(`/admin/contact-messages/${selectedInquiryId}/reply`, {
        method: "POST",
        body: {
          message: messageToSend,
        },
      });

      console.log(`[Admin Reply] Response from server:`, response);

      const refreshed = await apiRequest<{ inquiries: ContactInquiry[] }>("/admin/contact-messages");
      setInquiries(refreshed.inquiries);
      setReplyMessage("");

      toast({
        title: "Reply sent",
        description: response.deliveredInWebsite
          ? "Reply sent to email and website inbox."
          : "Reply sent to email. No matching website account found for inbox delivery.",
      });
    } catch (error) {
      toast({
        title: "Reply failed",
        description: error instanceof Error ? error.message : "Unable to send reply.",
        variant: "destructive",
      });
    } finally {
      setIsReplyingToInquiry(false);
    }
  };

  const exportCSV = () => {
    const headers = "Name,Email,Course,Institution,Year,Fee Balance,Latest GPA\n";
    const rows = students.map((s) => `${s.name},${s.email},${s.course},${s.institution},${s.currentYear},${s.feeBalance},${s.results[s.results.length - 1]?.gpa || "N/A"}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "schupa_students.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Student data exported as CSV." });
  };

  const exportPDF = async () => {
    const { exportStudentsPdf } = await import("@/lib/pdfExport");
    exportStudentsPdf(students);
    toast({ title: "Exported", description: "Student data exported as PDF." });
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Home },
    { id: "students" as const, label: "Students", icon: Users },
    { id: "pending" as const, label: `Pending (${pendingUsers.length})`, icon: UserCheck },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "inquiries" as const, label: `Inquiries (${inquiries.filter((inquiry) => !inquiry.repliedAt).length})`, icon: Mail },
  ];

  const selectedStudentResultDocuments = (selectedStudent?.documents || []).filter((doc) => doc.type === "result");

  // Student detail view
  if (selectedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 p-4 md:p-8 max-w-5xl mx-auto">
          <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
          </Button>

          <div className="space-y-6 animate-fade-in">
            {/* Student header */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display">
                      {selectedStudent.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{selectedStudent.name}</h2>
                    <p className="text-muted-foreground">{selectedStudent.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-primary">{selectedStudent.course}</Badge>
                      <Badge variant="secondary">Year {selectedStudent.currentYear}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Institution</p><p className="font-display font-semibold text-foreground">{selectedStudent.institution}</p></CardContent></Card>
              <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Year Joined</p><p className="font-display font-semibold text-foreground">{selectedStudent.yearJoined}</p></CardContent></Card>
              <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Latest GPA</p><p className="font-display font-semibold text-foreground">{selectedStudent.results[selectedStudent.results.length - 1]?.gpa.toFixed(1) || "N/A"}</p></CardContent></Card>
              <Card className={`border-2 ${selectedStudent.feeBalance > 0 ? "border-accent" : "border-primary"}`}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fee Balance</p><p className={`font-display font-semibold ${selectedStudent.feeBalance > 0 ? "text-accent" : "text-primary"}`}>KES {selectedStudent.feeBalance.toLocaleString()}</p></CardContent></Card>
            </div>

            {/* GPA Chart */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display">GPA Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={selectedStudent.results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="gpa" stroke="hsl(21, 100%, 45%)" strokeWidth={3} dot={{ fill: "hsl(125, 56%, 24%)", r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fee Records */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display">Fee Records</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-2 px-3 text-muted-foreground">Date</th><th className="text-left py-2 px-3 text-muted-foreground">Description</th><th className="text-right py-2 px-3 text-muted-foreground">Amount</th><th className="text-left py-2 px-3 text-muted-foreground">Type</th></tr></thead>
                    <tbody>
                      {selectedStudent.feeRecords.map((f, i) => (
                        <tr key={i} className="border-b border-border/50"><td className="py-2 px-3">{f.date}</td><td className="py-2 px-3">{f.description}</td><td className={`py-2 px-3 text-right font-semibold ${f.type === "payment" ? "text-primary" : "text-accent"}`}>{f.amount.toLocaleString()}</td><td className="py-2 px-3"><Badge variant={f.type === "payment" ? "default" : "secondary"} className={f.type === "payment" ? "bg-primary" : ""}>{f.type}</Badge></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Results / Transcripts */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display">Uploaded Results / Transcripts</CardTitle></CardHeader>
              <CardContent>
                {selectedStudentResultDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transcript files uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedStudentResultDocuments.map((doc) => (
                      <div key={doc.id} className="p-3 border border-border/50 rounded-lg flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={doc.url} target="_blank" rel="noreferrer" download>
                            <Download className="w-4 h-4 mr-1" /> Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remarks */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display">Remarks</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedStudent.remarks.map((r, i) => (
                  <div key={i} className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-foreground">{r.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.by} • {r.date}</p>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <Textarea placeholder="Add a remark..." value={remark} onChange={(e) => setRemark(e.target.value)} className="flex-1" />
                  <Button className="bg-primary text-primary-foreground self-end" onClick={handleAddRemark}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 flex">
        <aside className="w-16 md:w-56 bg-card border-r border-border min-h-[calc(100vh-4rem)] p-2 md:p-4 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden md:block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
                <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-primary-foreground/80">Manage students, track progress, and monitor sponsorships.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Students", value: students.length, icon: Users, color: "text-primary" },
                  { label: "Pending Approval", value: pendingUsers.length, icon: UserCheck, color: "text-accent" },
                  { label: "Total Fee Balance", value: `KES ${totalBalance.toLocaleString()}`, icon: DollarSign, color: "text-accent" },
                  { label: "Avg GPA", value: avgGpa.toFixed(2), icon: GraduationCap, color: "text-primary" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="font-display font-bold text-xl text-foreground">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick enrollment chart */}
              <Card className="border-border/50">
                <CardHeader><CardTitle className="font-display">Enrollment by Course</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(125, 56%, 24%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "students" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-foreground">Student Management</h2>
                <div className="flex gap-2">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => void exportPDF()}>
                    <FileText className="w-4 h-4 mr-2" /> Export PDF
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search students..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <select className="border border-input bg-background rounded-md px-3 py-2 text-sm" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
                  <option value="">All Courses</option>
                  {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border border-input bg-background rounded-md px-3 py-2 text-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">All Years</option>
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y.toString()}>Year {y}</option>)}
                </select>
                <select className="border border-input bg-background rounded-md px-3 py-2 text-sm" value={filterFeeBalance} onChange={(e) => setFilterFeeBalance(e.target.value as "all" | "cleared" | "outstanding")}>
                  <option value="all">All Balances</option>
                  <option value="cleared">Cleared Balance</option>
                  <option value="outstanding">Outstanding Balance</option>
                </select>
              </div>

              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/50">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Student</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Course</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">Year</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Balance</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden sm:table-cell">GPA</th>
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{s.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-foreground">{s.name}</p>
                                  <p className="text-xs text-muted-foreground md:hidden">{s.course}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-foreground hidden md:table-cell">{s.course}</td>
                            <td className="py-3 px-4 text-foreground hidden sm:table-cell">{s.currentYear}/{s.totalYears}</td>
                            <td className={`py-3 px-4 text-right font-semibold ${s.feeBalance > 0 ? "text-accent" : "text-primary"}`}>
                              {s.feeBalance.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              <Badge className={s.results[s.results.length - 1]?.gpa >= 3.5 ? "bg-primary" : "bg-secondary text-secondary-foreground"}>
                                {s.results[s.results.length - 1]?.gpa.toFixed(1) || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" className="text-accent" onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); }}>
                                View
                              </Button>
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

          {activeTab === "pending" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">Pending Approvals</h2>
              {pendingUsers.length === 0 ? (
                <Card className="border-border/50"><CardContent className="p-8 text-center"><UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No pending registrations.</p></CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((pu) => (
                    <Card key={pu.id} className="border-border/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-accent/10 text-accent">{pu.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{pu.name}</p>
                            <p className="text-sm text-muted-foreground">{pu.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleApprove(pu.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(pu.id)}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "inquiries" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-foreground">Contact Inquiries</h2>
                <p className="text-sm text-muted-foreground">
                  {inquiries.filter((inquiry) => !inquiry.repliedAt).length} pending
                </p>
              </div>

              {isLoadingInquiries && inquiries.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">Loading contact inquiries...</CardContent>
                </Card>
              ) : inquiries.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">No contact inquiries yet.</CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="font-display text-lg">Incoming Inquiries</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[560px] overflow-auto">
                      {inquiries.map((inquiry) => (
                        <button
                          key={inquiry.id}
                          type="button"
                          onClick={() => setSelectedInquiryId(inquiry.id)}
                          className={`w-full text-left rounded-lg border p-3 transition-colors ${
                            selectedInquiryId === inquiry.id
                              ? "border-primary bg-primary/5"
                              : "border-border/50 hover:bg-secondary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">{inquiry.name}</p>
                            <Badge variant={inquiry.repliedAt ? "secondary" : "default"}>
                              {inquiry.repliedAt ? "Replied" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{inquiry.email}</p>
                          <p className="text-sm text-foreground mt-2 line-clamp-3">{inquiry.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(inquiry.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="font-display text-lg">Reply</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!selectedInquiry ? (
                        <p className="text-sm text-muted-foreground">Select an inquiry to reply.</p>
                      ) : (
                        <>
                          <div className="rounded-lg bg-secondary/40 p-3 space-y-2">
                            <p className="text-sm font-semibold text-foreground">{selectedInquiry.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedInquiry.email}</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{selectedInquiry.message}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Badge variant={selectedInquiry.acknowledgedAt ? "secondary" : "outline"}>
                                {selectedInquiry.acknowledgedAt ? "Acknowledged" : "Ack pending"}
                              </Badge>
                              <Badge variant={selectedInquiry.linkedUser ? "secondary" : "outline"}>
                                {selectedInquiry.linkedUser ? "Website account matched" : "No website account match"}
                              </Badge>
                            </div>
                          </div>

                          {selectedInquiry.replyMessage && (
                            <div className="rounded-lg border border-border/50 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Latest reply</p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedInquiry.replyMessage}</p>
                            </div>
                          )}

                          <Textarea
                            placeholder="Write your reply to the sender"
                            rows={7}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                          />
                          <Button onClick={() => void handleReplyInquiry()} disabled={isReplyingToInquiry} className="w-full">
                            {isReplyingToInquiry ? "Sending reply..." : "Send Reply"}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">Analytics</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Fee Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={feeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {feeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-display text-lg">Performance Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(21, 100%, 45%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/50 md:col-span-2">
                  <CardHeader><CardTitle className="font-display text-lg">Fee Trends</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={feeTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Line type="monotone" dataKey="charges" stroke="hsl(21, 100%, 45%)" strokeWidth={2} name="Charges" />
                        <Line type="monotone" dataKey="payments" stroke="hsl(125, 56%, 24%)" strokeWidth={2} name="Payments" />
                        <Line type="monotone" dataKey="netBalance" stroke="hsl(220, 70%, 45%)" strokeWidth={2} name="Net" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/50 md:col-span-2">
                  <CardHeader><CardTitle className="font-display text-lg">Enrollment by Course</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={enrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(125, 56%, 24%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
