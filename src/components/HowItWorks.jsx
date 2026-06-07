import { useState, useEffect } from "react";
import loginimage from "../assets/loginimage.png";
import facility from "../assets/facility.png";
import listwaste from "../assets/listwaste.png";
import verify from "../assets/verify.png";
import priceimg from "../assets/priceimg.png";
import recyimg from "../assets/recyimg.png";
import complete from "../assets/complete.png";
import browse from "../assets/browse.png";
import review from "../assets/review.png";
import offer from "../assets/offer.png";
import collect from "../assets/collect.png";
import background from "../assets/background.png";

/* ── Responsive hook ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="8" fill="#10B981" />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const sellerSteps = [
  {
    number: "01",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    title: "Create Your Account",
    description: "Sign up as a Waste Seller in under two minutes. Set your location, pick the waste categories you deal with, and you are ready to start earning from your recyclables.",
    bullets: ["Quick sign-up with email or phone", "Set your location for nearby matches", "Select your waste material categories"],
    imageLeft: true,
    image: loginimage,
  },
  {
    number: "02",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>,
    title: "List Your Waste Materials",
    description: "Snap a photo of your recyclable waste, pick the type and quantity, and list it on the marketplace. Our smart form walks you through every detail so nothing gets missed.",
    bullets: ["Upload photos via drag & drop", "Select waste type — plastic, metal, paper & more", "Enter estimated quantity in kilograms"],
    imageLeft: false,
    image: listwaste,
  },
  {
    number: "03",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    title: "AI-Powered Verification",
    description: "Our computer vision system analyzes your waste photos to verify quality, detect contamination, and assign a quality score — ensuring fair pricing for everyone.",
    bullets: ["Automatic quality assessment in seconds", "Contamination detection and alerts", "Quality score from 0 to 100"],
    imageLeft: true,
    image: verify,
  },
  {
    number: "04",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    title: "Get Dynamic Pricing",
    description: "Our machine learning engine calculates a fair market price based on waste type, quality score, current demand, and your location. No haggling, no guesswork — just transparent value.",
    bullets: ["Real-time market-based pricing", "Transparent price breakdown", "Price influenced by quality and demand"],
    imageLeft: false,
    image: priceimg,
  },
  {
    number: "05",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    title: "Get Matched with a Recycler",
    description: "Our platform automatically connects you with verified recyclers nearby. Compare ratings, check their capacity, and accept the best offer — all from your dashboard.",
    bullets: ["Automatic matching with nearby recyclers", "Compare recycler ratings and reviews", "Accept offers directly from your dashboard"],
    imageLeft: true,
    image: recyimg,
  },
  {
    number: "06",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>,
    title: "Get Paid & Track Progress",
    description: "The recycler collects your waste and payment is processed securely. Track everything — from listing to payout — in one place on your dashboard.",
    bullets: ["Seamless collection scheduling", "Secure payment to your mobile wallet or bank", "Track all transactions in real-time"],
    imageLeft: false,
    image: complete,
  },
];

const recyclerSteps = [
  {
    number: "01",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    title: "Create Your Recycler Account",
    description: "Register as a verified Recycler in minutes. Add your facility details, waste categories you process, capacity, and working hours so sellers can find you easily.",
    bullets: ["Quick registration with facility details", "Set your processing capacity and categories", "Add working hours and location for easy discovery"],
    imageLeft: true,
    image: loginimage,
  },
  {
    number: "02",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
    title: "Set Up Your Facility Profile",
    description: "Build a compelling facility profile that showcases your operations. Add photos, list the materials you process, and set your pricing structure to attract quality sellers.",
    bullets: ["Upload facility photos and certifications", "Specify accepted waste types and grades", "Set your buying price ranges per material"],
    imageLeft: false,
    image: facility,
  },
  {
    number: "03",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    title: "Browse Available Waste Listings",
    description: "Explore a live feed of waste listings near you. Filter by material type, quality score, quantity, and distance. Find exactly the materials your facility needs.",
    bullets: ["Live feed of nearby waste listings", "Filter by material, quality, and quantity", "Save searches for recurring material needs"],
    imageLeft: true,
    image: browse,
  },
  {
    number: "04",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Review AI-Verified Quality Scores",
    description: "Before making an offer, review the AI-generated quality score and contamination report for each listing. Make informed decisions — no more surprises on collection day.",
    bullets: ["AI quality scores for every listing", "Detailed contamination reports", "Photo verification you can trust"],
    imageLeft: false,
    image: review,
  },
  {
    number: "05",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>,
    title: "Make an Offer & Schedule Collection",
    description: "Found the right materials? Make an offer at the system-recommended price or propose your own. Coordinate collection logistics directly through the platform.",
    bullets: ["Make offers at system-recommended prices", "Built-in messaging with sellers", "Flexible collection scheduling tools"],
    imageLeft: true,
    image: offer,
  },
  {
    number: "06",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: "Collect, Process & Grow",
    description: "Pick up the materials, process them at your facility, and pay the seller through our secure platform. Build your reputation with every successful transaction.",
    bullets: ["Organized collection logistics", "Secure payment processing to sellers", "Build ratings to attract more listings"],
    imageLeft: false,
    image: collect,
  },
];

function StepCard({ step, index, isMobile }) {
  const isLeft = step.imageLeft;

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : (isLeft ? "row" : "row-reverse"),
      gap: isMobile ? 20 : 48,
      alignItems: isMobile ? "stretch" : "center",
      padding: isMobile ? "32px 0" : "52px 0",
      borderBottom: "1px solid #f0f0f0",
    }}>
      {/* Image block */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: isMobile ? "100%" : 420,
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 12, left: 16,
          fontSize: isMobile ? 52 : 72,
          fontWeight: 900,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1, zIndex: 2,
          userSelect: "none",
        }}>{step.number}</span>
        <div
            style={{
                width: "100%",
                height: isMobile ? 180 : 260,
                borderRadius: 16,
                overflow: "hidden",
            }}
            >
            <img
                src={step.image}
                alt={step.title}
                style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                }}
            />
            </div>
        </div>

      {/* Content block */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#1a3a2a",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {step.icon}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            color: "#9ca3af", textTransform: "uppercase",
          }}>Step {step.number}</span>
        </div>

        <h3 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 800,
          color: "#0d2b1e",
          marginBottom: 10,
          lineHeight: 1.3,
        }}>{step.title}</h3>

        <p style={{
          fontSize: 13,
          color: "#6b7280",
          lineHeight: 1.7,
          marginBottom: 16,
        }}>{step.description}</p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {step.bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
              <span style={{ marginTop: 1, flexShrink: 0 }}><CheckIcon /></span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HowItWorks({ onBack }) {
  const [tab, setTab] = useState("sellers");
  const isMobile = useIsMobile();
  const steps = tab === "sellers" ? sellerSteps : recyclerSteps;
  const px = isMobile ? 20 : 40;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "inherit" }}>

      {/* ── Navbar ── */}

{/* ── Hero ── */}
<section style={{
  position: "relative",
  minHeight: isMobile ? 340 : 520,
  display: "flex", flexDirection: "column",
  justifyContent: "center",
  overflow: "hidden",
}}>
  {/* Background image — NO heavy overlay */}
  <img
    src={background}
    alt=""
    style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      objectFit: "cover", objectPosition: "center",
      zIndex: 0,
    }}
  />

  {/* Subtle left-side gradient so text stays readable */}
  {/* Left gradient — make it stronger */}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(to right, rgba(13,43,30,0.65) 0%, rgba(13,43,30,0.35) 55%, transparent 100%)",
      zIndex: 1,
    }} />

  {/* Navbar spacer */}
  <div style={{ height: isMobile ? 72 : 80 }} />

  {/* Text content */}
  <div style={{
    position: "relative", zIndex: 2,
    padding: isMobile ? "24px 20px 48px" : "48px 56px 72px",
    maxWidth: isMobile ? "100%" : 580,
  }}>
    {/* Badge */}
<span style={{
  display: "inline-block",
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.45)",
  color: "#fff",                           // ← white
  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
  textTransform: "uppercase", padding: "6px 14px",
  borderRadius: 999, marginBottom: isMobile ? 14 : 20,
}}>Your Guide to WasteLink</span>

{/* Heading */}
<h1 style={{
  fontSize: isMobile ? 30 : 54,
  fontWeight: 900, lineHeight: 1.1,
  color: "#fff",                           // ← white
  textShadow: "0 2px 12px rgba(0,0,0,0.3)", // ← shadow for depth
  marginBottom: isMobile ? 14 : 20,
  letterSpacing: "-1px",
}}>
  Turning Waste Into Worth, One Step at a Time
</h1>

{/* Subtext */}
<p style={{
  fontSize: isMobile ? 13 : 15,
  color: "rgba(255,255,255,0.88)",         // ← near-white
  textShadow: "0 1px 6px rgba(0,0,0,0.25)",
  lineHeight: 1.7,
  maxWidth: 420,
  marginBottom: isMobile ? 28 : 36,
}}>
  WasteLink makes recycling simple. From listing your waste to getting paid — here is exactly how it all works.
</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        onClick={onBack}
        style={{
          background: "#10B981", color: "#fff",
          border: "none", borderRadius: 999,
          padding: "12px 28px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        Get Started
      </button>
      
    </div>
  </div>
</section>

      {/* ── Tab Toggle ── */}
      <section style={{
        padding: isMobile ? "24px 20px 20px" : "32px 40px 28px",
        textAlign: "center",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
          color: "#9ca3af", textTransform: "uppercase", marginBottom: 14,
        }}>
          Choose Your Journey
        </p>
        <div style={{
          display: "inline-flex",
          background: "#f3f4f6",
          borderRadius: 999, padding: 4, gap: 4,
          maxWidth: "100%",
        }}>
          {[
            {
              key: "sellers", label: "For Waste Sellers",
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
            },
            {
              key: "recyclers", label: "For Recyclers",
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
            },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "9px 14px" : "10px 22px",
                borderRadius: 999,
                border: "none", cursor: "pointer",
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                background: tab === key ? "#0d2b1e" : "transparent",
                color: tab === key ? "#fff" : "#6b7280",
                transition: "all 0.2s",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 10, padding: "0 16px" }}>
          {tab === "sellers"
            ? "You have waste to sell — learn how to list it, get verified, and earn money."
            : "You process recyclables — learn how to find suppliers and grow your business."}
        </p>
      </section>

      {/* ── Steps ── */}
      <main style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: isMobile ? `0 ${px}px 40px` : `0 ${px}px 60px`,
      }}>
        {steps.map((step, index) => (
          <StepCard key={`${tab}-${index}`} step={step} index={index} isMobile={isMobile} />
        ))}
      </main>

      {/* ── CTA Banner ── */}
      <section style={{ padding: isMobile ? `0 ${px}px 40px` : `0 ${px}px 60px` }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          borderRadius: isMobile ? 16 : 24,
          overflow: "hidden",
          position: "relative",
          padding: isMobile ? "40px 24px" : "56px 40px",
          textAlign: "center",
          background: "linear-gradient(rgba(13,43,30,0.83), rgba(13,43,30,0.83)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80') center/cover",
        }}>
          <p style={{
            color: "#10B981", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12,
          }}>
            Ready to Start?
          </p>
          <h2 style={{
            fontSize: isMobile ? 24 : 32,
            fontWeight: 900, color: "#fff", marginBottom: 12,
          }}>
            Join the Recycling Revolution
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: isMobile ? 13 : 14,
            marginBottom: 28, maxWidth: 440,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}>
            Whether you are a waste generator looking to earn or a recycler seeking materials, WasteLink makes the connection seamless.
          </p>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12, justifyContent: "center",
            alignItems: "center",
          }}>
            <button
              onClick={onBack}
              style={{
                background: "#10B981", color: "#fff",
                border: "none", borderRadius: 12,
                padding: "12px 28px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit",
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Get Started
            </button>
            <button
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 12, color: "#fff",
                padding: "12px 28px", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                width: isMobile ? "100%" : "auto",
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}