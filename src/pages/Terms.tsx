import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Terms & Conditions</h1>
        <Card className="border-border/50">
          <CardContent className="p-6 md:p-8 prose prose-sm max-w-none text-muted-foreground">
            <p className="text-sm text-muted-foreground mb-4"><strong>Last Updated:</strong> March 27, 2026</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the SCHUPA Student Sponsorship Tracking Platform ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">2. User Accounts</h2>
            <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials. All accounts are subject to admin approval before activation. SCHUPA reserves the right to deny or revoke access at any time.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">3. Student Responsibilities</h2>
            <p>Students using this Platform agree to: (a) provide accurate and truthful personal and academic information; (b) upload authentic academic transcripts and fee statements; (c) keep their profile information up to date; (d) not share their login credentials with others.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">4. Sponsor & Admin Use</h2>
            <p>Sponsors and administrators may view student data for tracking and evaluation purposes only. Any data accessed through this Platform must not be shared with unauthorized third parties or used for purposes other than sponsorship management.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">5. Data Privacy</h2>
            <p>SCHUPA is committed to protecting your personal data. We collect only the information necessary for the Platform's functionality. Your data will not be sold to third parties. Students' academic records and financial information are treated as confidential.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">6. Intellectual Property</h2>
            <p>All content, design, and functionality of this Platform are the property of SCHUPA. You may not copy, modify, or distribute any part of the Platform without prior written consent.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">7. Limitation of Liability</h2>
            <p>SCHUPA provides this Platform "as is" and makes no warranties regarding accuracy, availability, or fitness for a particular purpose. SCHUPA shall not be liable for any damages arising from the use of this Platform.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">8. Modifications</h2>
            <p>SCHUPA reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>

            <h2 className="font-display text-lg font-semibold text-foreground mt-6 mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at info@schupa.org.</p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
