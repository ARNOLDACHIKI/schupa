import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <Card className="border-border/50">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="font-display text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                SCHUPA ("we", "us", "our", or "Company") operates the platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Information Collection and Use</h2>
              <p className="text-muted-foreground mb-3">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Personal Data:</strong> Name, email, phone number, address, date of birth</li>
                <li><strong>Academic Data:</strong> Grades, transcripts, course information, institutional details</li>
                <li><strong>Financial Data:</strong> Fee records, payment history, balance information</li>
                <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent</li>
                <li><strong>Cookies:</strong> Authentication tokens, session management, preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Use of Data</h2>
              <p className="text-muted-foreground mb-3">SCHUPA uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information for service improvement</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Security of Data</h2>
              <p className="text-muted-foreground">
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the bottom of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:<br/>
                Email: support@schupa.org<br/>
                Address: SCHUPA Office, Kenya
              </p>
            </section>

            <div className="pt-6 border-t text-sm text-muted-foreground">
              <p>Last updated: March 27, 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
