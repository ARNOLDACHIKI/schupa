import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-sm">S</span>
              </div>
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
              <li><a href="/#contact" className="hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</a></li>
              <li><a href="/signin" className="hover:text-accent transition-colors">Student Portal</a></li>
              <li><a href="/signin" className="hover:text-accent transition-colors">Admin Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> info@schupa.org</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-accent" /> +254 700 000 000</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Nairobi, Kenya</li>
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
