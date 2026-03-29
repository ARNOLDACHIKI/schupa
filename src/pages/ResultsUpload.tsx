import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, apiUploadRequest } from "@/lib/api";

interface Result {
  id: string;
  semester: string;
  gpa: number;
  year: number;
  uploadedAt: Date;
}

interface UploadedDocument {
  id: string;
  type: "result" | "fee_statement";
  name: string;
  uploadedAt: string;
}

const ResultsUpload = () => {
  const { user, students, uploadResult, refreshData, isAuthInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [semester, setSemester] = useState("");
  const [gpa, setGpa] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [results, setResults] = useState<Result[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const student = students.find((s) => s.email === user?.email) || students[0];

  useEffect(() => {
    if (!student) return;

    setResults(
      student.results.map((item) => ({
        id: item.id || `${item.semester}-${item.year}`,
        semester: item.semester,
        gpa: item.gpa,
        year: item.year,
        uploadedAt: new Date(),
      }))
    );

    const loadDocuments = async () => {
      try {
        const response = await apiRequest<{ documents: UploadedDocument[] }>(`/students/${student.id}/documents`);
        setDocuments(response.documents.filter((doc) => doc.type === "result"));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student || !selectedFile || !semester || !gpa) {
      toast({ title: "Error", description: "Please fill all fields and select a file", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await uploadResult(student.id, {
        semester,
        year: parseInt(year, 10),
        gpa: parseFloat(gpa),
      });

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "result");
      await apiUploadRequest(`/students/${student.id}/documents`, formData);

      await refreshData();

      const documentsResponse = await apiRequest<{ documents: UploadedDocument[] }>(`/students/${student.id}/documents`);
      setDocuments(documentsResponse.documents.filter((doc) => doc.type === "result"));

      setSelectedFile(null);
      setSemester("");
      setGpa("");
      toast({ title: "Success", description: "Results uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload results", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex-grow max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Academic Results</h1>
          <p className="text-muted-foreground">Upload and manage your academic performance records</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="md:col-span-1">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Academic Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="">Select semester</option>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">GPA</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      placeholder="e.g., 3.8"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Year</label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Document</label>
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                      />
                      <label htmlFor="file-input" className="cursor-pointer block">
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
                    {isLoading ? "Uploading..." : "Upload Results"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results List */}
          <div className="md:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Your Results</CardTitle>
              </CardHeader>
              <CardContent>
                {student.results.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No results uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {student.results.map((result, index) => (
                      <div key={result.id || `${result.semester}-${index}`} className="p-3 border border-border/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-semibold">{result.semester} {result.year}</p>
                              <p className="text-sm text-muted-foreground">
                                GPA: <strong className="text-foreground">{result.gpa.toFixed(2)}</strong>
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Approved</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Academic record updated
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <h3 className="font-semibold mb-2">Uploaded Documents</h3>
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
                  <p>Documents are verified by admin. Upload clear, legible copies for faster approval.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* GPA Trend Chart Placeholder */}
        <Card className="mt-6 border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">GPA Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-secondary/20 rounded-lg text-muted-foreground">
              Chart will display GPA trends across semesters
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResultsUpload;
