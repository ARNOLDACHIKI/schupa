import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  metadata: Record<string, unknown> | null;
}

const AdminAuditLogs = () => {
  const { user, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");

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

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await apiRequest<{ logs: AuditLog[] }>("/admin/audit-logs");
        setLogs(response.logs);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load audit logs",
          variant: "destructive",
        });
      }
    };

    void loadLogs();
  }, [toast]);

  const filtered = logs.filter((log) => {
    if (!query.trim()) return true;
    const value = `${log.action} ${log.entity} ${log.actor?.name || ""}`.toLowerCase();
    return value.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">Track key platform actions for transparency and compliance</p>
        </div>

        <Card className="border-border/50 mb-4">
          <CardContent className="p-4">
            <Input
              placeholder="Filter by action, entity, or actor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Logs ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-2 text-muted-foreground">Action</th>
                    <th className="text-left py-3 px-2 text-muted-foreground">Entity</th>
                    <th className="text-left py-3 px-2 text-muted-foreground">Actor</th>
                    <th className="text-left py-3 px-2 text-muted-foreground">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-2 font-medium">{log.action}</td>
                      <td className="py-2 px-2">{log.entity}</td>
                      <td className="py-2 px-2">{log.actor?.name || "System"}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground max-w-[260px] truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminAuditLogs;
