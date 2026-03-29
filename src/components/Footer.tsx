import { Globe, Mail, MapPin } from "lucide-react";
import schupaLogo from "@/assets/schupa-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={schupaLogo} alt="SCHUPA logo" className="w-9 h-9 rounded-md object-cover" />
              <span className="font-display text-xl font-bold">SCHUPA</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Shaping brighter minds for a brighter world. Empowering students through sponsorship and mentorship.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/#home" className="hover:text-accent transition-colors">Home</a></li>
              <li><a href="/#about" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="/#programs" className="hover:text-accent transition-colors">Programs</a></li>
              <li><a href="/#schools" className="hover:text-accent transition-colors">Partner Schools</a></li>
              <li><a href="/#donations" className="hover:text-accent transition-colors">Donations</a></li>
              <li><a href="/#contact" className="hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</a></li>
              <li><a href="/profile-settings" className="hover:text-accent transition-colors">Profile Settings</a></li>
              <li><a href="/signin" className="hover:text-accent transition-colors">Student Portal</a></li>
              <li><a href="/signin" className="hover:text-accent transition-colors">Admin Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> info@schupa-kenia.de</li>
              <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> www.schupa-kenia.de</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Wundanyi, Kenya / Munich, Germany</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} SCHUPA. All rights reserved. Shaping brighter minds for a brighter world.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
