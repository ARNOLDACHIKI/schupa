import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Settings, Bell, FileText, MessageSquare } from "lucide-react";
import schupaLogo from "@/assets/schupa-logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard =
    location.pathname === "/dashboard" ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Programs", href: "/#programs" },
    { label: "Schools", href: "/#schools" },
    { label: "Donations", href: "/#donations" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={schupaLogo} alt="SCHUPA logo" className="w-9 h-9 rounded-md object-cover" />
          <span className="font-display text-xl font-bold text-foreground">SCHUPA</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isOnDashboard && (
                <Button variant="ghost" size="sm" onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>
                  <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/messages")}>
                <MessageSquare className="w-4 h-4 mr-1" /> Messages
              </Button>
              {user.role === "student" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")}>
                    <Bell className="w-4 h-4 mr-1" /> Notifications
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-1" /> Settings
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate("/privacy-policy")}>
                <FileText className="w-4 h-4 mr-1" /> Privacy
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/signin")}>Sign In</Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 animate-fade-in">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="block py-2 text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 mt-3">
            {user ? (
              <>
                {!isOnDashboard && (
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate(user.role === "admin" ? "/admin" : "/dashboard"); setOpen(false); }}>
                    Dashboard
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/messages"); setOpen(false); }}>
                  <MessageSquare className="w-4 h-4 mr-1" /> Messages
                </Button>
                {user.role === "student" && (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/notifications"); setOpen(false); }}>
                      <Bell className="w-4 h-4 mr-1" /> Notifications
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/settings"); setOpen(false); }}>
                      <Settings className="w-4 h-4 mr-1" /> Settings
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" className="flex-1 mt-2" onClick={() => { navigate("/privacy-policy"); setOpen(false); }}>
                  <FileText className="w-4 h-4 mr-1" /> Privacy
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { handleLogout(); setOpen(false); }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/signin"); setOpen(false); }}>Sign In</Button>
                <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { navigate("/signup"); setOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
