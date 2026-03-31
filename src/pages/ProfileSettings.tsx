import { useEffect, useState, type ChangeEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, students, isDataLoading, updateStudentProfile, uploadStudentDocument, uploadProfilePhoto, isAuthInitialized } = useAuth();
  const student = students.find((entry) => entry.email === user?.email) || students[0];
  const schoolIdDocuments = student?.documents
    ?.filter((doc) => doc.type === "school_id")
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) || [];

  const latestSchoolIdFront = schoolIdDocuments.find((doc) => doc.name.toLowerCase().includes("front"));
  const latestSchoolIdBack = schoolIdDocuments.find((doc) => doc.name.toLowerCase().includes("back"));
  const latestSchoolIdGeneric = schoolIdDocuments.find(
    (doc) => !doc.name.toLowerCase().includes("front") && !doc.name.toLowerCase().includes("back")
  );
  const latestFeeStatement = feeStatementDocuments[0];
  const handleFeeStatementUpload = async () => {
    if (!student || !feeStatementFile) {
      return;
    }
    if (!feeStatementFile.type.startsWith("image/") && feeStatementFile.type !== "application/pdf") {
      toast({ title: "Upload Failed", description: "Fee statement must be a PDF or image file.", variant: "destructive" });
      return;
    }
    if (feeStatementFile.size > 10 * 1024 * 1024) {
      toast({ title: "Upload Failed", description: "Fee statement file must be smaller than 10MB.", variant: "destructive" });
      return;
    }
    try {
      const renamedFile = new File([feeStatementFile], `fee-statement-${Date.now()}-${feeStatementFile.name}`, {
        type: feeStatementFile.type,
      });
      await uploadStudentDocument(student.id, "fee_statement", renamedFile);
      setFeeStatementFile(null);
      toast({ title: "Fee Statement Uploaded", description: "Your fee statement is now on file." });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unable to upload fee statement.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!student) {
      return;
    }

    setForm({
      photo: student.photo || "",
      bio: student.bio || "",
      course: student.course,
      institution: student.institution,
      yearJoined: String(student.yearJoined),
      currentYear: String(student.currentYear),
      totalYears: String(student.totalYears),
    });
    setPhotoChanged(false);
  }, [student]);

  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== "student") {
    return <Navigate to="/admin" replace />;
  }

  if (!student && !isDataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Profile Settings</CardTitle>
              <CardDescription>Your student profile is not ready yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSave = async () => {
    if (!student) {
      return;
    }

    if (form.course.trim().length < 2) {
      toast({ title: "Invalid Course", description: "Course must be at least 2 characters.", variant: "destructive" });
      return;
    }

    if (form.institution.trim().length < 2) {
      toast({ title: "Invalid Institution", description: "Institution must be at least 2 characters.", variant: "destructive" });
      return;
    }

    const yearJoined = Number(form.yearJoined);
    const currentYear = Number(form.currentYear);
    const totalYears = Number(form.totalYears);

    if (!Number.isInteger(yearJoined) || !Number.isInteger(currentYear) || !Number.isInteger(totalYears)) {
      toast({ title: "Invalid Academic Years", description: "Year fields must be valid whole numbers.", variant: "destructive" });
      return;
    }

    if (currentYear < 1 || currentYear > 5 || totalYears < 1 || totalYears > 5) {
      toast({ title: "Invalid Academic Years", description: "Current year and total years must be between 1 and 5.", variant: "destructive" });
      return;
    }

    if (currentYear > totalYears) {
      toast({ title: "Invalid Academic Years", description: "Current year cannot exceed total years.", variant: "destructive" });
      return;
    }

    try {
      const updatePayload: {
        photo?: string;
        bio?: string;
        course: string;
        institution: string;
        yearJoined: number;
        currentYear: number;
        totalYears: number;
      } = {
        bio: form.bio,
        course: form.course.trim(),
        institution: form.institution.trim(),
        yearJoined,
        currentYear,
        totalYears,
      };
      
      // Only include photo in update if it has been changed
      if (photoChanged && form.photo) {
        updatePayload.photo = form.photo;
      }
      
      await updateStudentProfile(student.id, updatePayload);
      setPhotoChanged(false);
      toast({ title: "Profile Saved", description: "Your profile settings were updated." });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unable to save profile settings.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!student) {
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Upload Failed",
        description: "Please select an image file for your profile photo.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Upload Failed",
        description: "Profile photo must be smaller than 10MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }
    try {
      const photo = await uploadProfilePhoto(student.id, file);
      setForm((prev) => ({ ...prev, photo }));
      setPhotoChanged(true);
      await refreshData();
      toast({ title: "Photo Uploaded", description: "Your profile photo has been uploaded." });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unable to upload photo.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Profile Settings</CardTitle>
            <CardDescription>Update your profile information used in sponsor tracking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDataLoading && !student ? (
              <p className="text-muted-foreground">Loading profile...</p>
            ) : (
              <>
                {/* School ID Value Display */}
                <div className="rounded-md border border-border/60 p-4 mb-4 bg-muted/30">
                  <span className="text-sm font-medium text-foreground">Your School ID:</span>
                  <span className="ml-2 text-base font-mono text-primary">{student?.id || "N/A"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Year Joined</label>
                    <Input type="number" value={form.yearJoined} onChange={(e) => setForm((prev) => ({ ...prev, yearJoined: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Current Year</label>
                    <Input type="number" min="1" max="5" value={form.currentYear} onChange={(e) => setForm((prev) => ({ ...prev, currentYear: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Total Years</label>
                    <Input type="number" min="1" max="5" value={form.totalYears} onChange={(e) => setForm((prev) => ({ ...prev, totalYears: e.target.value }))} />
                  </div>
                </div>
                <div className="rounded-md border border-border/60 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">School ID Document</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Front Side</label>
                      <Input type="file" accept=".pdf,image/*" onChange={(e) => setSchoolIdFrontFile(e.target.files?.[0] || null)} />
                      <Button type="button" variant="outline" onClick={() => handleSchoolIdUpload("front")} disabled={!schoolIdFrontFile}>
                        Upload Front
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Back Side</label>
                      <Input type="file" accept=".pdf,image/*" onChange={(e) => setSchoolIdBackFile(e.target.files?.[0] || null)} />
                      <Button type="button" variant="outline" onClick={() => handleSchoolIdUpload("back")} disabled={!schoolIdBackFile}>
                        Upload Back
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(latestSchoolIdFront || latestSchoolIdBack || latestSchoolIdGeneric) ? (
                      <Button type="button" variant="ghost" onClick={() => setIsSchoolIdVisible((prev) => !prev)}>
                        {isSchoolIdVisible ? "Hide Uploaded ID" : "Show Uploaded ID"}
                      </Button>
                    ) : null}
                  </div>
                  {isSchoolIdVisible ? (
                    <div className="space-y-2 text-sm">
                      {latestSchoolIdFront ? (
                        <a href={latestSchoolIdFront.url} target="_blank" rel="noreferrer" className="block text-primary underline-offset-4 hover:underline">
                          View Front: {latestSchoolIdFront.name}
                        </a>
                      ) : null}
                      {latestSchoolIdBack ? (
                        <a href={latestSchoolIdBack.url} target="_blank" rel="noreferrer" className="block text-primary underline-offset-4 hover:underline">
                          View Back: {latestSchoolIdBack.name}
                        </a>
                      ) : null}
                      {!latestSchoolIdFront && !latestSchoolIdBack && latestSchoolIdGeneric ? (
                        <a href={latestSchoolIdGeneric.url} target="_blank" rel="noreferrer" className="block text-primary underline-offset-4 hover:underline">
                          {latestSchoolIdGeneric.name}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {/* Fee Statement Upload Section */}
                <div className="rounded-md border border-border/60 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Fee Statement Document</p>
                  <div className="space-y-2">
                    <Input type="file" accept=".pdf,image/*" onChange={(e) => setFeeStatementFile(e.target.files?.[0] || null)} />
                    <Button type="button" variant="outline" onClick={handleFeeStatementUpload} disabled={!feeStatementFile}>
                      Upload Fee Statement
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {latestFeeStatement ? (
                      <Button type="button" variant="ghost" onClick={() => setIsFeeStatementVisible((prev) => !prev)}>
                        {isFeeStatementVisible ? "Hide Uploaded Fee Statement" : "Show Uploaded Fee Statement"}
                      </Button>
                    ) : null}
                  </div>
                  {isFeeStatementVisible && latestFeeStatement ? (
                    <div className="space-y-2 text-sm">
                      <a href={latestFeeStatement.url} target="_blank" rel="noreferrer" className="block text-primary underline-offset-4 hover:underline">
                        View Fee Statement: {latestFeeStatement.name}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-3">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProfileSettings;
