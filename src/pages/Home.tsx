import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Activity, Shield, Zap, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStart = () => {
    navigate("/upload");
  };

  // Helper function to convert public folder images to Base64
  // This simulates the data format a Python backend usually sends
  const fetchImageAsBase64 = async (path) => {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Returns data:image/png;base64,...
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error loading demo image:", path, error);
      return "";
    }
  };

  const handleDemo = async () => {
    // --- 1. LOAD IMAGES FROM PUBLIC FOLDER ---
    // Ensure you have these files in your /public/demo/ folder
    const originalImagePath = "/original.jpg"; 
    
    // Fetch and convert the mask and heatmap to Base64 strings
    // We strip the "data:image/png;base64," prefix if your backend usually sends raw base64 strings,
    // otherwise, keep the result as is depending on how your Results page handles it.
    // Here we assume the Results page handles full data URIs or raw base64.
    // For this example, we pass the full data URI.
    const maskBase64 = await fetchImageAsBase64("/mask.png");
    const heatmapBase64 = await fetchImageAsBase64("/gradcam.png");

    // --- 2. REALISTIC DEMO RESULT ---
    const demoResult = {
      predicted_disease: "Glaucoma",
      confidence: 0.98,
      probabilities: {
        "Glaucoma": 0.98,
        "Cataract": 0.01,
        "Diabetic Retinopathy": 0.01,
        "Normal": 0.00
      },
      // Pass the converted Base64 strings here
      heatmap_png_base64: heatmapBase64, 
      mask_png_base64: maskBase64
    };

    navigate("/results", { 
      state: { 
        result: demoResult,
        // We pass the direct path for the original image
        imageUrl: originalImagePath
      } 
    });
  };

 return (
  <div className="min-h-screen bg-background">
    <section className="relative pt-20 pb-32 overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            AI-Powered Retinal Screening V2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight text-foreground">
            Advanced Eye Care <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Through Artificial Intelligence
            </span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed text-muted-foreground">
            Early detection of Cataract, Glaucoma, and Diabetic Retinopathy using
            state-of-the-art deep learning algorithms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary button stays custom (dark pill) */}
            <Button
              size="lg"
              onClick={handleStart}
              className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl dark:bg-primary dark:hover:bg-primary-soft dark:text-primary-foreground"
            >
              <Upload className="mr-2 h-5 w-5" />{" "}
              {t("analyze_btn") || "Start Diagnosis"}
            </Button>

            {/* Outline button – force good contrast in both themes */}
            <Button
              size="lg"
              variant="outline"
              onClick={handleDemo}
              className="h-14 px-8 text-lg rounded-full border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> View Demo Result
            </Button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Use semantic background instead of fixed slate-50 */}
    <section className="py-24 bg-muted/60 border-t border-border/60">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl mx-auto text-center mb-14">
      <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground/80 uppercase tracking-wide">
        Clinical-Grade AI Pipeline
      </p>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        Built for ophthalmology teams, not just demos
      </h2>
      <p className="mt-3 text-sm md:text-base text-muted-foreground">
        Every scan is processed through a secure, multi-stage workflow designed
        to maximise diagnostic confidence and minimise risk.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        {
          icon: Activity,
          accent: "from-emerald-400/70 via-emerald-500/60 to-emerald-300/60",
          chip: "Disease Coverage",
          title: "Multi-Disease Detection",
          desc: "Single model screens for Diabetic Retinopathy, Glaucoma and Cataract with 94% test-set accuracy.",
        },
        {
          icon: Shield,
          accent: "from-sky-400/70 via-blue-500/60 to-cyan-300/60",
          chip: "Security & Compliance",
          title: "Medical-Grade Privacy",
          desc: "On-device anonymisation, encrypted transmission and audit-ready logs for clinical workflows.",
        },
        {
          icon: Zap,
          accent: "from-amber-400/70 via-orange-500/60 to-yellow-300/60",
          chip: "Turnaround Time",
          title: "Instant Reporting",
          desc: "Grad-CAM heatmaps, lesion overlays and probability charts generated in just a few seconds.",
        },
      ].map((feature, i) => (
        <Card
          key={i}
          className="group relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
        >
          {/* soft gradient glow in the corner */}
          <div
            className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${feature.accent} opacity-40 blur-2xl group-hover:opacity-60 transition-opacity`}
          />

          <CardContent className="relative p-7 flex flex-col h-full">
            {/* chip */}
            <span className="inline-flex items-center self-start rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">
              {feature.chip}
            </span>

            {/* icon */}
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/90 shadow-md ring-1 ring-border/70">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>

            {/* title + description */}
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.desc}
            </p>

            {/* subtle footer line */}
            <div className="mt-6 pt-4 border-t border-border/60 text-[11px] uppercase tracking-wide text-muted-foreground/80 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80 group-hover:bg-emerald-300" />
              AI-assisted, clinician-in-the-loop workflow
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</section>

  </div>
);

};

export default Home;
