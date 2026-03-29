import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trash2, CheckCircle2, AlertCircle, FileText, DollarSign, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";

interface Notification {
  id: string;
  type: "approval" | "remark" | "fee" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: ReactNode;
}

const Notifications = () => {
  const { user, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiRequest<{
          notifications: Array<{
            id: string;
            type: "approval" | "remark" | "fee" | "system" | "result" | "message";
            title: string;
            message: string;
            read: boolean;
            createdAt: string;
          }>;
        }>("/notifications");

        setNotifications(
          response.notifications.map((item) => ({
            id: item.id,
            type: item.type === "result" ? "system" : item.type,
            title: item.title,
            message: item.message,
            read: item.read,
            timestamp: new Date(item.createdAt),
            icon:
              item.type === "approval" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : item.type === "remark" || item.type === "message" ? (
                <MessageSquare className="w-5 h-5 text-blue-500" />
              ) : item.type === "fee" ? (
                <DollarSign className="w-5 h-5 text-orange-500" />
              ) : (
                <FileText className="w-5 h-5 text-purple-500" />
              ),
          }))
        );
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load notifications",
          variant: "destructive",
        });
      }
    };

    if (user) {
      void loadNotifications();
    }
  }, [toast, user]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" });
    } catch (_error) {
      // Optimistic UI update still applied
    }
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest<{ message: string }>(`/notifications/${id}`, { method: "DELETE" });
      setNotifications(notifications.filter((n) => n.id !== id));
      toast({ title: "Notification deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest<{ message: string }>("/notifications/read-all", { method: "PATCH" });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update notifications",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "approval":
        return "bg-green-100 text-green-800";
      case "remark":
        return "bg-blue-100 text-blue-800";
      case "fee":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-4xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-border/50 cursor-pointer transition-colors ${
                  !notification.read ? "bg-secondary/50 border-primary/30" : ""
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <CardContent className="p-4 flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-4 flex-grow">
                    <div className="mt-1">{notification.icon}</div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <Badge variant="default" className="ml-auto">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {notification.timestamp.toLocaleDateString()} at{" "}
                        {notification.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Filter by type */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <h3 className="font-semibold mb-3">Filter by type</h3>
          <div className="flex flex-wrap gap-2">
            {["approval", "remark", "fee", "system"].map((type) => (
              <Badge key={type} variant="secondary" className="cursor-pointer py-1 px-3">
                {type.charAt(0).toUpperCase() + type.slice(1)} ({notifications.filter((n) => n.type === type).length})
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Notifications;
