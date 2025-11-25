import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Activity, Shield, Zap, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const navigate = useNavigate();
  const languageCtx = useLanguage?.() ?? { t: (k) => undefined }; // safe fallback
  const { t } = languageCtx;

  const handleStart = () => {
    navigate("/upload");
  };

  // Helper function to convert public folder images to Base64 (returns full data URI)
  const fetchImageAsBase64 = async (relativePath, timeoutMs = 10000) => {
    try {
      // Use PUBLIC_URL to work in dev and production builds
      const url = `${process.env.PUBLIC_URL || ""}${relativePath}`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        console.error("fetchImageAsBase64: non-ok response", url, response.status);
        return "";
      }
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : "");
        };
        reader.onerror = (e) => {
          reader.abort();
          reject(e);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // If fetch aborted or other network error, return empty string and log
      console.error("Error loading demo image:", relativePath, error);
      return "";
    }
  };

  const handleDemo = async () => {
    // --- 1. LOAD IMAGES FROM PUBLIC FOLDER ---
    // Put these files in /public/demo/ or adjust paths as needed
    const originalImagePath = `${process.env.PUBLIC_URL || ""}/demo/original.jpg`;

    const maskBase64 = await fetchImageAsBase64("/demo/mask.png");
    const heatmapBase64 = await fetchImageAsBase64("/demo/gradcam.png");

    // --- 2. REALISTIC DEMO RESULT ---
    const demoResult = {
      predicted_disease: "Glaucoma",
      confidence: 0.98,
      probabilities: {
        Glaucoma: 0.98,
        Cataract: 0.01,
        "Diabetic Retinopathy": 0.01,
        Normal: 0.0,
      },
      // Keep full data URIs (you can strip prefix on the Results page if needed)
      heatmap_png_base64: heatmapBase64,
      mask_png_base64: maskBase64,
    };

    navigate("/results", {
      state: {
        result: demoResult,
        imageUrl: originalImagePath,
      },
    });
  };

  const features = [
    {
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-100",
      title: "Multi-Disease Detection",
      desc: "Detects Cataracts, Glaucoma, and DR with 94% accuracy.",
    },
    {
      icon: Shield,
      color: "text-blue-600",
      bg: "bg-blue-100",
      title: "Medical Grade Privacy",
      desc: "Encrypted and anonymized data processing.",
    },
    {
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-100",
      title: "Instant Analysis",
      desc: "Get detailed diagnostic reports in seconds.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              AI-Powered Retinal Screening V2.0
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              Advanced Eye Care <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Through Artificial Intelligence
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Early detection of Cataract, Glaucoma, and Diabetic Retinopathy using state-of-the-art deep learning algorithms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleStart}
                className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl"
                aria-label="Start Diagnosis"
              >
                <Upload className="mr-2 h-5 w-5" /> {t("analyze_btn") || "Start Diagnosis"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleDemo}
                className="h-14 px-8 text-lg rounded-full"
                aria-label="View Demo Result"
              >
                <PlayCircle className="mr-2 h-5 w-5" /> View Demo Result
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={i}
                  className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <CardContent className="p-8">
                    <div
                      className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
