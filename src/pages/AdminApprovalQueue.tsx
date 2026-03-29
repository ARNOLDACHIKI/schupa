import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  approved: boolean;
}

const AdminApprovalQueue = () => {
  const { user, pendingUsers, approveUser, rejectUser, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleApprove = async (userId: string) => {
    setIsLoading(true);
    try {
      await approveUser(userId);
      toast({
        title: "Success",
        description: "Student approved and will receive confirmation email.",
      });
      setSelectedUser(null);
      // Remove from pending list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve student.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    setIsLoading(true);
    try {
      await rejectUser(userId);
      toast({
        title: "Success",
        description: "Student rejected. Notification email will be sent.",
        variant: "destructive",
      });
      setSelectedUser(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject student.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Approval Queue</h1>
          <p className="text-muted-foreground">Review and approve pending student registrations</p>
        </div>

        {pendingUsers.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-3" />
              <p className="text-foreground font-semibold mb-1">All caught up!</p>
              <p className="text-muted-foreground">No pending approvals at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Pending List */}
            <div className="md:col-span-1">
              <Card className="border-border/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Pending ({pendingUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full text-left p-3 rounded-lg border border-border/50 transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-accent/10 border-accent"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <p className="font-semibold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Pending approval</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Details and Action */}
            <div className="md:col-span-2">
              {selectedUser ? (
                <Card className="border-border/50">
                  <CardHeader className="bg-secondary/50">
                    <CardTitle className="font-display text-lg">
                      {selectedUser.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Details */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">
                          Email
                        </label>
                        <p className="text-foreground">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase font-semibold">Status</label>
                        <p className="text-foreground">Pending approval</p>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-6">
                      <label className="text-sm font-semibold block mb-3">Rejection Reason (Optional)</label>
                      <Textarea
                        placeholder="Provide a reason if rejecting the application..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mb-4"
                      />

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(selectedUser.id)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={isLoading}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(selectedUser.id)}
                          variant="destructive"
                          className="flex-1"
                          disabled={isLoading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        A confirmation email will be sent to the student immediately upon approval or
                        rejection.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a student to review their registration</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalQueue;
