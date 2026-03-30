import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, DollarSign, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, apiUploadRequest } from "@/lib/api";

interface FeeRecord {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "charge" | "payment";
  status: "pending" | "completed";
}

const FeeStatement = () => {
  const { user, students, uploadFeeRecord, refreshData, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("Uploaded payment");
  const [amount, setAmount] = useState("");
  const [recordType, setRecordType] = useState<"payment" | "charge">("payment");
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
        status: "completed",
      })),
    [student]
  );

  const totalCharges = feeRecords
    .filter((r) => r.type === "charge")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPayments = feeRecords
    .filter((r) => r.type === "payment")
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalCharges - totalPayments;

  useEffect(() => {
    const loadDocuments = async () => {
      if (!student) return;
      try {
        const response = await apiRequest<{
          documents: Array<{ id: string; type: "result" | "fee_statement"; name: string; uploadedAt: string }>;
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    if (!student || !selectedFile || !amount || !description.trim() || !date) {
      toast({
        title: "Error",
        description: "Please fill all fields and select a file",
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
        description: description.trim(),
        amount: parsedAmount,
        type: recordType,
      });

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "fee_statement");
      await apiUploadRequest(`/students/${student.id}/documents`, formData);

      await refreshData();

      const response = await apiRequest<{
        documents: Array<{ id: string; type: "result" | "fee_statement"; name: string; uploadedAt: string }>;
      }>(`/students/${student.id}/documents`);
      setDocuments(
        response.documents
          .filter((doc) => doc.type === "fee_statement")
          .map((doc) => ({ id: doc.id, name: doc.name, uploadedAt: doc.uploadedAt }))
      );

      setSelectedFile(null);
      setAmount("");
      setDescription("Uploaded payment");
      setRecordType("payment");
      toast({ title: "Success", description: "Fee statement uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">Track and manage your tuition fees and payments</p>
        </div>

        {/* Balance Card */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Outstanding Balance</p>
                  <p className="font-display text-3xl font-bold text-primary">
                    KES {balance.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Charges</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  KES {totalCharges.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                <p className="font-display text-2xl font-bold text-green-600">
                  KES {totalPayments.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="md:col-span-1">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Upload Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Record Type</label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value as "payment" | "charge")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="payment">Payment</option>
                      <option value="charge">Charge</option>
                    </select>
                  </div>

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
                    <label className="text-sm font-medium block mb-1">Description</label>
                    <Input
                      type="text"
                      placeholder="e.g., M-Pesa payment"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Receipt/Proof</label>
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="fee-file-input"
                      />
                      <label htmlFor="fee-file-input" className="cursor-pointer block">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {selectedFile ? selectedFile.name : "Click to upload"}
                        </p>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Uploading..." : "Submit Payment"}
                  </Button>
                </form>
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
                            record.status === "completed"
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
                    <h3 className="font-semibold mb-2">Uploaded Receipts</h3>
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
                  <p>Submit payment proof (M-Pesa receipt, bank slip) within 24 hours of payment.</p>
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
                <Badge>Due in 30 days</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="font-medium">Semester 2 Tuition</span>
                <Badge variant="outline">Not yet billed</Badge>
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
