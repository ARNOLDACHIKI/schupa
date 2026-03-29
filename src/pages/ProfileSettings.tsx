import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  const latestSchoolId = student?.documents?.filter((doc) => doc.type === "school_id")[0];

  const [form, setForm] = useState({
    photo: "",
    bio: "",
    course: "",
    institution: "",
    yearJoined: "",
    currentYear: "",
    totalYears: "",
  });
  const [schoolIdFile, setSchoolIdFile] = useState<File | null>(null);
  const [isSchoolIdVisible, setIsSchoolIdVisible] = useState(false);

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

  const handleSave = async () => {
    if (!student) {
      return;
    }

    try {
      await updateStudentProfile(student.id, {
        photo: form.photo,
        bio: form.bio,
        course: form.course.trim(),
        institution: form.institution.trim(),
        yearJoined: Number(form.yearJoined),
        currentYear: Number(form.currentYear),
        totalYears: Number(form.totalYears),
      });
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
    if (!file) {
      return;
    }

    try {
      const photo = await uploadProfilePhoto(student.id, file);
      setForm((prev) => ({ ...prev, photo }));
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

  const handleSchoolIdUpload = async () => {
    if (!student || !schoolIdFile) {
      return;
    }

    try {
      await uploadStudentDocument(student.id, "school_id", schoolIdFile);
      setSchoolIdFile(null);
      toast({ title: "School ID Uploaded", description: "Your school ID document is now on file." });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unable to upload school ID.",
        variant: "destructive",
      });
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
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Profile Photo</label>
                  <Input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
                  {form.photo ? <p className="text-xs text-muted-foreground mt-2">Current photo path: {form.photo}</p> : null}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
                  <Textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} placeholder="Tell sponsors a bit about yourself..." rows={4} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
                    <Input value={form.course} onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Institution</label>
                    <Input value={form.institution} onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Year Joined</label>
                    <Input type="number" value={form.yearJoined} onChange={(e) => setForm((prev) => ({ ...prev, yearJoined: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Current Year</label>
                    <Input type="number" value={form.currentYear} onChange={(e) => setForm((prev) => ({ ...prev, currentYear: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Total Years</label>
                    <Input type="number" value={form.totalYears} onChange={(e) => setForm((prev) => ({ ...prev, totalYears: e.target.value }))} />
                  </div>
                </div>
                <div className="rounded-md border border-border/60 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">School ID Document</p>
                  <Input type="file" accept=".pdf,image/*" onChange={(e) => setSchoolIdFile(e.target.files?.[0] || null)} />
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={handleSchoolIdUpload} disabled={!schoolIdFile}>
                      Upload School ID
                    </Button>
                    {latestSchoolId ? (
                      <Button type="button" variant="ghost" onClick={() => setIsSchoolIdVisible((prev) => !prev)}>
                        {isSchoolIdVisible ? "Hide Uploaded ID" : "Show Uploaded ID"}
                      </Button>
                    ) : null}
                  </div>
                  {latestSchoolId && isSchoolIdVisible ? (
                    <a href={latestSchoolId.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
                      {latestSchoolId.name}
                    </a>
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
