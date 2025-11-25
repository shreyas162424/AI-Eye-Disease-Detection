import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Activity, Shield, Zap, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleStart = () => navigate("/upload");

  // Fetch a public file and convert to a full data URI (data:image/...)
  const fetchImageAsBase64 = async (path) => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        console.error(`[Demo] failed to fetch ${path} status=${response.status}`);
        return "";
      }
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // "data:image/png;base64,...."
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("[Demo] error fetching image", path, err);
      return "";
    }
  };

  const handleDemo = async () => {
    setLoadingDemo(true);
    try {
      // These must be in your project's public/ folder
      const originalUrl = "/original.jpg";
      const maskUrl = "/mask.png";
      const gradcamUrl = "/gradcam.png";

      const [maskDataUrl, gradcamDataUrl] = await Promise.all([
        fetchImageAsBase64(maskUrl),
        fetchImageAsBase64(gradcamUrl),
      ]);

      // If either returned empty, fallback to a tiny placeholder so UI doesn't break
      const placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42mNgYGD4DwABBAEAfm2ZbQAAAABJRU5ErkJggg==";

      const finalMask = maskDataUrl || placeholder;
      const finalGradcam = gradcamDataUrl || placeholder;

      // Some parts of your app might expect raw base64 without the prefix.
      // Detect and strip header if you need the raw base64 string:
      const stripPrefix = (dataUri) => {
        const parts = (dataUri || "").split(",");
        return parts.length > 1 ? parts[1] : dataUri; // returns raw base64 or original if no comma
      };

      const demoResult = {
        predicted_disease: "Glaucoma",
        confidence: 0.98,
        probabilities: {
          Glaucoma: 0.98,
          Cataract: 0.01,
          "Diabetic Retinopathy": 0.01,
          Normal: 0.0,
        },
        // choose which format your Results page expects:
        // - full data URI: finalGradcam (e.g. "data:image/png;base64,...")
        // - raw base64: stripPrefix(finalGradcam)
        heatmap_png_base64: stripPrefix(finalGradcam),
        mask_png_base64: stripPrefix(finalMask),
      };

      navigate("/results", {
        state: {
          result: demoResult,
          // imageUrl used for <img src="..."> on results page; public root path works here
          imageUrl: originalUrl,
        },
      });
    } catch (err) {
      console.error("Demo flow failed:", err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              AI-Powered Retinal Screening V2.0
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              Advanced Eye Care <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Through Artificial Intelligence</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Early detection of Cataract, Glaucoma, and Diabetic Retinopathy using state-of-the-art deep learning algorithms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleStart} className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
                <Upload className="mr-2 h-5 w-5" /> {t("analyze_btn") || "Start Diagnosis"}
              </Button>

              <Button size="lg" variant="outline" onClick={handleDemo} disabled={loadingDemo} className="h-14 px-8 text-lg rounded-full">
                {loadingDemo ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Demo...</>) : (<><PlayCircle className="mr-2 h-5 w-5" /> View Demo Result</>)}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Activity, color: "text-green-600", bg: "bg-green-100", title: "Multi-Disease Detection", desc: "Detects Cataracts, Glaucoma, and DR with 94% accuracy." },
              { icon: Shield, color: "text-blue-600", bg: "bg-blue-100", title: "Medical Grade Privacy", desc: "Encrypted and anonymized data processing." },
              { icon: Zap, color: "text-amber-600", bg: "bg-amber-100", title: "Instant Analysis", desc: "Get detailed diagnostic reports in seconds." }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 ${feature.color}`}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
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
