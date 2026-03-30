import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, apiUploadRequest } from "@/lib/api";

interface FeeRecord {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "charge" | "payment";
  status: string;
}

const FeeStatement = () => {
  const { user, students, uploadFeeRecord, refreshData, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isStructureUploading, setIsStructureUploading] = useState(false);
  const [feeStructureFile, setFeeStructureFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [feeStatus, setFeeStatus] = useState("Fee Semester 1 cleared");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [documents, setDocuments] = useState<Array<{ id: string; name: string; uploadedAt: string }>>([]);
  const student = students.find((s) => s.email === user?.email) || students[0];

  const feeRecords: FeeRecord[] = useMemo(
    () =>
      (student?.feeRecords || []).map((record) => ({
        id: record.id || `${record.date}-${record.description}`,
        date: new Date(record.date),
        description: record.description,
        amount: record.amount,
        type: record.type,
        status: record.type === "payment" ? record.description || "Payment recorded" : "Charge entry",
      })),
    [student]
  );

  const totalPayments = feeRecords
    .filter((r) => r.type === "payment")
    .reduce((sum, r) => sum + r.amount, 0);

  const latestPaymentDate = feeRecords
    .filter((r) => r.type === "payment")
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date;

  const semesterOneCleared = feeRecords.some(
    (record) => record.type === "payment" && record.description.toLowerCase().includes("semester 1")
  );
  const semesterTwoCleared = feeRecords.some(
    (record) => record.type === "payment" && record.description.toLowerCase().includes("semester 2")
  );

  useEffect(() => {
    const loadDocuments = async () => {
      if (!student) return;
      try {
        const response = await apiRequest<{
          documents: Array<{ id: string; type: "result" | "fee_statement" | "school_id"; name: string; uploadedAt: string }>;
        }>(`/students/${student.id}/documents`);
        setDocuments(
          response.documents
            .filter((doc) => doc.type === "fee_statement")
            .map((doc) => ({ id: doc.id, name: doc.name, uploadedAt: doc.uploadedAt }))
        );
      } catch (_error) {
        setDocuments([]);
      }
    };

    void loadDocuments();
  }, [student]);

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

  if (user.role !== "student") {
    navigate("/admin");
    return null;
  }

  const handleFeeStructureFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFeeStructureFile(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    if (!student || !amount || !feeStatus.trim() || !date) {
      toast({
        title: "Error",
        description: "Please fill all payment fields.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await uploadFeeRecord(student.id, {
        date,
        description: feeStatus.trim(),
        amount: parsedAmount,
        type: "payment",
      });

      await refreshData();

      setAmount("");
      setFeeStatus("Fee Semester 1 cleared");
      toast({ title: "Success", description: "Payment record saved successfully." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payment record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeeStructureUpload = async () => {
    if (!student || !feeStructureFile) {
      return;
    }

    setIsStructureUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", feeStructureFile);
      formData.append("type", "fee_statement");
      await apiUploadRequest(`/students/${student.id}/documents`, formData);
      await refreshData();

      const response = await apiRequest<{
        documents: Array<{ id: string; type: "result" | "fee_statement" | "school_id"; name: string; uploadedAt: string }>;
      }>(`/students/${student.id}/documents`);
      setDocuments(
        response.documents
          .filter((doc) => doc.type === "fee_statement")
          .map((doc) => ({ id: doc.id, name: doc.name, uploadedAt: doc.uploadedAt }))
      );

      setFeeStructureFile(null);
      toast({ title: "Success", description: "Fee structure uploaded successfully." });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unable to upload fee structure.",
        variant: "destructive",
      });
    } finally {
      setIsStructureUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Record school payments and upload your fee structure document</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="font-display text-3xl font-bold text-primary">KES {totalPayments.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Records</p>
                <p className="font-display text-2xl font-bold text-foreground">{feeRecords.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Latest Payment Date</p>
                <p className="font-display text-2xl font-bold text-green-600">{latestPaymentDate ? latestPaymentDate.toLocaleDateString() : "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="md:col-span-1">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Record Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Payment Amount</label>
                    <Input
                      type="number"
                      placeholder="e.g., 25000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Payment Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Fee Status</label>
                    <select
                      value={feeStatus}
                      onChange={(e) => setFeeStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="Fee Semester 1 cleared">Fee Semester 1 cleared</option>
                      <option value="Fee Semester 2 cleared">Fee Semester 2 cleared</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Payment"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                  <p className="text-sm font-medium">Upload Fee Structure</p>
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFeeStructureFileSelect}
                      className="hidden"
                      id="fee-structure-input"
                    />
                    <label htmlFor="fee-structure-input" className="cursor-pointer block">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {feeStructureFile ? feeStructureFile.name : "Click to upload fee structure"}
                      </p>
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleFeeStructureUpload}
                    disabled={!feeStructureFile || isStructureUploading}
                  >
                    {isStructureUploading ? "Uploading..." : "Upload Fee Structure"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <div className="md:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feeRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 border border-border/50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-grow">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.type === "charge"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {record.type === "charge" ? "-" : "+"}
                        </div>
                        <div>
                          <p className="font-semibold">{record.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {record.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            record.type === "charge"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {record.type === "charge" ? "-" : "+"}KES{" "}
                          {record.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            record.type === "payment"
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {documents.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <h3 className="font-semibold mb-2">Uploaded Fee Structures</h3>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="text-sm text-muted-foreground flex justify-between">
                          <span>{doc.name}</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Record only direct-to-school payments here, then upload the official fee structure separately.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fee Status Timeline */}
        <Card className="mt-6 border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Fee Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">Semester 1 Tuition</span>
                <Badge variant={semesterOneCleared ? "default" : "outline"}>{semesterOneCleared ? "Cleared" : "Not cleared"}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">Semester 2 Tuition</span>
                <Badge variant={semesterTwoCleared ? "default" : "outline"}>{semesterTwoCleared ? "Cleared" : "Not cleared"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default FeeStatement;
