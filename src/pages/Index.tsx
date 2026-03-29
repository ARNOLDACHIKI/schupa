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
import { apiRequest } from "@/lib/api";
import beneficiariesImg from "@/assets/beneficiaries.png";
import heroOverlayImg from "@/assets/hero-overlay.png";
import schoolMwangekaImg from "@/assets/school-mwangeka-secondary.png";
import schoolKiwindaImg from "@/assets/school-kiwinda-secondary.png";
import schoolMwagafwaImg from "@/assets/school-mwagafwa-vocational.png";
import schoolVoiImg from "@/assets/school-voi-youth-polytechnic.png";
import schoolAggreyImg from "@/assets/school-dr-aggrey-high.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [ibanCopied, setIbanCopied] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);

  const handleCopyIban = async () => {
    const iban = "DE18 7007 0024 0752 7997 00";

    try {
      await navigator.clipboard.writeText(iban);
      setIbanCopied(true);
      toast({ title: "IBAN copied", description: "The donation account IBAN has been copied." });

      window.setTimeout(() => {
        setIbanCopied(false);
      }, 2000);
    } catch (_error) {
      toast({ title: "Copy failed", description: "Please copy the IBAN manually.", variant: "destructive" });
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSendingContact(true);
    try {
      await apiRequest<{ message: string }>("/contact", {
        method: "POST",
        body: contactForm,
        token: null,
      });
      toast({ title: "Message Sent!", description: "We received your inquiry and will respond shortly." });
      setContactForm({ name: "", email: "", message: "" });
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Unable to send your inquiry right now.",
        variant: "destructive",
      });
    } finally {
      setIsSendingContact(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate(`/#${sectionId}`);
  };

  const programs = [
    {
      icon: GraduationCap,
      title: "Scholarships",
      desc: "We support students who cannot afford school or college fees, including many orphans and vulnerable young people.",
    },
    {
      icon: BookOpen,
      title: "School Infrastructure",
      desc: "We help fund practical school needs such as classrooms, dormitories, water tanks, biogas systems, furniture, and books.",
    },
    {
      icon: Globe,
      title: "In-Kind Support",
      desc: "We transfer useful materials and equipment, including computers and vocational training resources, to partner schools.",
    },
    {
      icon: TrendingUp,
      title: "Transparent Impact",
      desc: "About 95% of raised funds reach students directly, with regular on-site review of projects and support delivery.",
    },
  ];

  const partnerSchools = [
    {
      name: "Mwangeka Secondary School",
      type: "Girls' boarding secondary school",
      students: "586",
      since: "2000",
      highlight: "Support has included dormitory development and clean-energy school infrastructure.",
      about:
        "A girls' boarding school supported with safer, more stable learning conditions.",
      supportFocus:
        "Dormitories, sanitation upgrades, and scholarships to keep vulnerable girls in school.",
      image: schoolMwangekaImg,
      imagePosition: "center 32%",
    },
    {
      name: "Kiwinda Secondary School",
      type: "Mixed secondary school",
      students: "122",
      since: "2005",
      highlight: "Funding has improved learning conditions, including school electrification and equipment.",
      about:
        "A mixed secondary school receiving practical support tailored to local needs.",
      supportFocus:
        "Classroom resources, electrification, and fee support for at-risk learners.",
      image: schoolKiwindaImg,
      imagePosition: "center 40%",
    },
    {
      name: "Mwagafwa Vocational Training Center",
      type: "Vocational school",
      students: "ca. 140",
      since: "2007",
      highlight: "Students receive practical trade support through tools, equipment, and digital resources.",
      about:
        "A vocational center building job-ready trade skills through hands-on training.",
      supportFocus:
        "Workshop tools and digital resources for practical trade training.",
      image: schoolMwagafwaImg,
      imagePosition: "center 37%",
    },
    {
      name: "Voi Youth Polytechnic",
      type: "Vocational school",
      students: "ca. 200",
      since: "2010",
      highlight: "Programs strengthen job-ready skills in technical and service-based professions.",
      about:
        "A youth polytechnic focused on applied technical and service-sector training.",
      supportFocus:
        "Career-focused equipment and training support aligned with local job demand.",
      image: schoolVoiImg,
      imagePosition: "center 36%",
    },
    {
      name: "Dr. Aggrey High School",
      type: "Boys' boarding secondary school",
      students: "ca. 500",
      since: "2019",
      highlight: "Partnership expansion is focused on scaling targeted support for student success.",
      about:
        "A boys' boarding school where support strengthens outcomes at scale.",
      supportFocus:
        "Scholarships and phased school improvements that boost student progression.",
      image: schoolAggreyImg,
      imagePosition: "center 30%",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <img
          src={heroOverlayImg}
          alt="Students"
          className="absolute inset-0 w-full h-full object-cover object-[58%_35%] md:object-[52%_35%] lg:object-center"
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        {/* Sponsor Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 md:pr-16 pointer-events-none">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.2, scale: 1 }} transition={{ duration: 1, delay: 0.8 }} className="text-right">
            <div className="text-accent text-6xl md:text-8xl font-bold opacity-20">💼</div>
            <p className="text-primary-foreground/30 text-xl md:text-2xl font-semibold mt-4">SPONSOR</p>
          </motion.div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6 border border-accent/30">
              Education Access in Wundanyi, Kenya
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Shaping Brighter Minds<br />
            <span className="text-accent">For a Brighter World</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            School and college fees remain out of reach for many families. SCHUPA helps more young people access education and vocational training through scholarships, school projects, and accountable support.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8" onClick={() => navigate("/signup")}>
              Get Started <Users className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-primary-foreground/95 text-primary hover:bg-primary-foreground hover:text-primary text-base px-8 shadow-sm"
              onClick={() => navigate("/signin")}
            >
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
                School Partnership With Measurable Impact
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SCHUPA focuses on education access in and around Wundanyi in southeastern Kenya. We support students and partner schools so children and young adults can build a realistic path to independent livelihoods.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Support includes scholarships, targeted school improvements, and vocational equipment. Funds are reviewed through regular local engagement to ensure the right students and projects are prioritized.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: "95%", label: "Funds Reach Students" },
                  { num: "510", label: "Students Supported (2025)" },
                  { num: "86", label: "Scholarships Granted" },
                  { num: "€75,000+", label: "Invested in Kenya" },
                ].map((stat) => (
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
                <img src={beneficiariesImg} alt="SCHUPA beneficiaries" className="w-full h-[400px] object-cover object-[center_20%]" />
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
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Practical education support combining school fees, infrastructure, and direct project follow-up.</p>
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

      {/* Partner Schools */}
      <section id="schools" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Partner Network</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">Our Partner Schools</h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
              We review impact with school leaders and students during regular field engagement, then prioritize scholarships and infrastructure where support is most needed.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {partnerSchools.map((school, i) => (
              <motion.div
                key={school.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-border/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-[2fr_1fr] lg:grid-cols-[2.2fr_1fr]">
                      <div className="p-6 border-b md:border-b-0 md:border-r border-border/60 bg-secondary/40">
                        <div className="relative h-52 md:h-60 rounded-lg overflow-hidden mb-4">
                          <img
                            src={school.image}
                            alt={school.name}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: school.imagePosition }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />
                        </div>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-2">{school.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{school.type}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-background rounded-md p-2">
                            <p className="text-muted-foreground">Students</p>
                            <p className="font-semibold text-foreground">{school.students}</p>
                          </div>
                          <div className="bg-background rounded-md p-2">
                            <p className="text-muted-foreground">Partner Since</p>
                            <p className="font-semibold text-foreground">{school.since}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col justify-center">
                        <h4 className="text-base font-semibold text-foreground mb-3">About this school</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{school.about}</p>
                        <div className="mt-4 rounded-md bg-secondary p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Support Focus</p>
                          <p className="text-sm text-foreground">{school.supportFocus}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">{school.highlight}</p>
                      </div>
                    </div>
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
            <img src={beneficiariesImg} alt="Students" className="w-full h-[350px] object-cover object-[center_20%]" />
            <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
              <div className="text-center px-4">
                <Heart className="w-12 h-12 text-accent mx-auto mb-4" />
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Make a Difference Today</h2>
                <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6">
                  Even a small contribution can change a student's future. Support through annual membership (from 25 EUR) or a one-time donation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/signup")}>
                    Become a Member
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => scrollToSection("donations")}>
                    One-Time Donation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donations */}
      <section id="donations" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Donations</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">Even a Small Contribution Makes a Difference</h2>
            <p className="text-muted-foreground mt-3 max-w-3xl mx-auto">
              With your donation, you support school and college fees as well as essential education projects. Education remains the most sustainable path to independent livelihoods.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-background rounded-xl border border-border/50 p-5 text-center">
              <p className="text-sm text-muted-foreground">Minimum Membership Contribution</p>
              <p className="font-display text-3xl font-bold text-primary mt-1">25 EUR</p>
              <p className="text-sm text-muted-foreground mt-1">per year</p>
            </div>
            <div className="bg-background rounded-xl border border-border/50 p-5 text-center">
              <p className="text-sm text-muted-foreground">Funds Reaching Students Directly</p>
              <p className="font-display text-3xl font-bold text-primary mt-1">95%</p>
              <p className="text-sm text-muted-foreground mt-1">of total funds raised</p>
            </div>
            <div className="bg-background rounded-xl border border-border/50 p-5 text-center">
              <p className="text-sm text-muted-foreground">Students Supported (2025)</p>
              <p className="font-display text-3xl font-bold text-primary mt-1">510</p>
              <p className="text-sm text-muted-foreground mt-1">School and college students</p>
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-foreground mb-3">Donation Account</h3>
                  <p className="text-muted-foreground">SchuPa Kenia e.V.</p>
                  <p className="text-foreground font-medium mt-1">IBAN: DE18 7007 0024 0752 7997 00</p>
                  <p className="text-muted-foreground mt-1">Deutsche Bank</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleCopyIban}
                  >
                    {ibanCopied ? "IBAN Copied" : "Copy IBAN"}
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/signup")}>
                    Become a Member
                  </Button>
                  <Button variant="outline" onClick={() => scrollToSection("contact")}>
                    Donation Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSendingContact}>
                  <Send className="w-4 h-4 mr-2" /> {isSendingContact ? "Sending..." : "Send Message"}
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
