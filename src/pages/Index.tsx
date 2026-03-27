import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Users, TrendingUp, Heart, BookOpen, Globe, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import beneficiariesImg from "@/assets/beneficiaries.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message Sent!", description: "We'll get back to you shortly." });
    setContactForm({ name: "", email: "", message: "" });
  };

  const programs = [
    { icon: GraduationCap, title: "Academic Sponsorship", desc: "Full tuition coverage for deserving students across Kenya's top universities." },
    { icon: BookOpen, title: "Mentorship Program", desc: "One-on-one guidance from industry professionals to shape career paths." },
    { icon: TrendingUp, title: "Progress Tracking", desc: "Real-time academic and financial tracking so sponsors stay informed." },
    { icon: Globe, title: "Community Impact", desc: "Building a network of empowered graduates who give back to society." },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6 border border-accent/30">
              Empowering Future Leaders
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Shaping Brighter Minds<br />
            <span className="text-accent">For a Brighter World</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Our curriculum empowers students with knowledge, skills, and experiences to excel. Track your sponsored students' progress in real-time.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8" onClick={() => navigate("/signup")}>
              Get Started <Users className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8" onClick={() => navigate("/signin")}>
              Sign In
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">About SCHUPA</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                Bridging the Gap Between Sponsors & Students
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SCHUPA is a student sponsorship tracking platform that connects sponsors with the students they support. 
                We believe every student deserves access to quality education, and every sponsor deserves to see the impact of their generosity.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our platform provides real-time tracking of academic results, fee statements, and overall progress — 
                giving sponsors peace of mind and students the accountability they need to excel.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[{ num: "200+", label: "Students Sponsored" }, { num: "50+", label: "Active Sponsors" }, { num: "95%", label: "Graduation Rate" }, { num: "15+", label: "Partner Universities" }].map((stat) => (
                  <div key={stat.label} className="bg-secondary rounded-lg p-4 text-center">
                    <div className="font-display text-2xl font-bold text-primary">{stat.num}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent z-10" />
                <img src={beneficiariesImg} alt="SCHUPA beneficiaries" className="w-full h-[400px] object-cover" />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">Our Beneficiaries</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">Our Programs</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Comprehensive support for students from enrollment to graduation and beyond.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((prog, i) => (
              <motion.div key={prog.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/10 transition-colors">
                      <prog.icon className="w-7 h-7 text-primary group-hover:text-accent transition-colors" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{prog.title}</h3>
                    <p className="text-sm text-muted-foreground">{prog.desc}</p>
                    <Button variant="link" className="mt-3 text-accent p-0 h-auto">Learn More →</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with Photo */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden">
            <img src={beneficiariesImg} alt="Students" className="w-full h-[350px] object-cover" />
            <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
              <div className="text-center px-4">
                <Heart className="w-12 h-12 text-accent mx-auto mb-4" />
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Make a Difference Today</h2>
                <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6">
                  Join SCHUPA and help transform lives. Every sponsorship creates a ripple effect of positive change.
                </p>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/signup")}>
                  Join SCHUPA
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Get in Touch</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">Contact Us</h2>
            <p className="text-muted-foreground mt-3">Have questions? We'd love to hear from you.</p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                    <Input placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                    <Input type="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                  <Textarea placeholder="How can we help?" rows={5} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
