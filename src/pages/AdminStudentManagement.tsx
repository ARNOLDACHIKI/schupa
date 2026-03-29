import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { type Student } from "@/data/mockData";

const AdminStudentManagement = () => {
  const { user, students, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "status">("name");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending">("all");

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

  const filteredStudents = students
    .filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "approved" && s.approved) ||
        (filterStatus === "pending" && !s.approved);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "email") return a.email.localeCompare(b.email);
      return a.approved === b.approved ? 0 : a.approved ? -1 : 1;
    });

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      toast({ title: "Student deleted", description: "The student has been permanently removed.", variant: "destructive" });
    }
  };

  const handleViewDetails = (studentId: string) => {
    toast({ title: "Feature coming soon", description: "Detailed student view will be available soon." });
  };

  const stats = {
    total: students.length,
    approved: students.filter((s) => s.approved).length,
    pending: students.filter((s) => !s.approved).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Student Management</h1>
          <p className="text-muted-foreground">Manage all registered students and their profiles</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Students</p>
              <p className="font-display text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Approved</p>
              <p className="font-display text-3xl font-bold text-primary">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="font-display text-3xl font-bold text-accent">{stats.pending}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50 mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="all">All Students</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Course</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Balance</th>
                      <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student: Student) => (
                      <tr
                        key={student.id}
                        className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{student.name}</td>
                        <td className="py-3 px-4 text-foreground">{student.email}</td>
                        <td className="py-3 px-4 text-foreground">{student.course}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={student.approved ? "default" : "secondary"}
                            className={student.approved ? "bg-primary" : "bg-accent"}
                          >
                            {student.approved ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 px-4 font-semibold ${
                            student.feeBalance > 0 ? "text-accent" : "text-primary"
                          }`}
                        >
                          KES {student.feeBalance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(student.id)}
                            className="text-accent hover:bg-accent/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStudentManagement;
