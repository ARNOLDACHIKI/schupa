import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface MessageDto {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  from: { id: string; name: string; email: string };
  to: { id: string; name: string; email: string };
}

const Messages = () => {
  const navigate = useNavigate();
  const { user, students, isAuthInitialized } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const [recipients, setRecipients] = useState<Array<{ id: string; name: string }>>([]);
  const [toUserId, setToUserId] = useState("");

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        if (user.role === "admin") {
          const options = students
            .filter((student) => Boolean(student.userId))
            .map((student) => ({ id: student.userId as string, name: student.name }));
          setRecipients(options);
          if (!toUserId && options.length > 0) {
            setToUserId(options[0].id);
          }
        } else {
          const response = await apiRequest<{ admins: Array<{ id: string; name: string }> }>("/users/admins");
          setRecipients(response.admins);
          if (!toUserId && response.admins.length > 0) {
            setToUserId(response.admins[0].id);
          }
        }
      } catch (_error) {
        setRecipients([]);
      }
    };

    void loadRecipients();
  }, [students, toUserId, user.role]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await apiRequest<{ messages: MessageDto[] }>("/messages");
        setMessages(response.messages);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load messages",
          variant: "destructive",
        });
      }
    };

    void loadMessages();
  }, [toast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !body.trim()) {
      toast({ title: "Error", description: "Subject and message are required.", variant: "destructive" });
      return;
    }

    const recipientId = toUserId;
    if (!recipientId) {
      toast({ title: "Error", description: "Select a recipient.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      await apiRequest<{ message: string }>("/messages", {
        method: "POST",
        body: {
          toUserId: recipientId,
          subject,
          body,
        },
      });

      const response = await apiRequest<{ messages: MessageDto[] }>("/messages");
      setMessages(response.messages);
      setSubject("");
      setBody("");
      toast({ title: "Message sent" });
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Unable to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Secure communication between students and administrators</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleSend}>
                {user.role === "admin" && (
                  <select
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {recipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name}
                      </option>
                    ))}
                  </select>
                )}

                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message"
                  rows={6}
                />
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Conversation History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {messages.map((message) => (
                <div key={message.id} className="border border-border/50 rounded-lg p-3">
                  <div className="flex justify-between gap-3 mb-1">
                    <p className="font-semibold text-sm">{message.subject}</p>
                    <p className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    From {message.from.name} to {message.to.name}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
