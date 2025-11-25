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

  // Helper: fetch a local file path (your /mnt/data/... file) and convert it to a data URI
  // Returns a full data URI like "data:image/png;base64,...."
  const fetchImageAsBase64 = async (path) => {
    try {
      const res = await fetch(path);
      if (!res.ok) {
        console.warn("fetchImageAsBase64: fetch returned non-ok response", res.status, path);
        return "";
      }
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = (e) => reject(e);
        reader.onloadend = () => resolve(reader.result); // data:<mime>;base64,...
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error loading image as base64:", path, err);
      return "";
    }
  };

  const handleDemo = async () => {
    // Use the uploaded image path in the container. Your tooling will map this to a URL.
    // Developer-provided file path:
    const localImagePath = "/mnt/data/bdc03f08-e79c-4831-bcb2-c2045ecc4583.png";

    // Fetch the local file and convert to data URIs for heatmap and mask.
    // If you have separate mask/gradcam images, replace these two with their respective paths.
    const heatmapDataUri = await fetchImageAsBase64(localImagePath);
    const maskDataUri = await fetchImageAsBase64(localImagePath);

    // If conversion failed, fall back to a small placeholder 1x1 pixel (so UI won't break)
    const placeholder1x1 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gKqk1q2AAAAAElFTkSuQmCC";

    const demoResult = {
      predicted_disease: "Glaucoma",
      confidence: 0.98,
      probabilities: {
        Glaucoma: 0.98,
        Cataract: 0.01,
        "Diabetic Retinopathy": 0.01,
        Normal: 0.0,
      },
      // Use the full data URIs so the Results page can display them directly
      heatmap_png_base64: heatmapDataUri || placeholder1x1,
      mask_png_base64: maskDataUri || placeholder1x1,
    };

    // Pass the local path as imageUrl — your deployment/tooling should convert this to a proper URL.
    navigate("/results", {
      state: {
        result: demoResult,
        imageUrl: localImagePath,
      },
    });
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Through Artificial Intelligence
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Early detection of Cataract, Glaucoma, and Diabetic Retinopathy using state-of-the-art deep learning algorithms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleStart} className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl">
                <Upload className="mr-2 h-5 w-5" /> {t("analyze_btn") || "Start Diagnosis"}
              </Button>
              <Button size="lg" variant="outline" onClick={handleDemo} className="h-14 px-8 text-lg rounded-full">
                <PlayCircle className="mr-2 h-5 w-5" /> View Demo Result
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
              { icon: Zap, color: "text-amber-600", bg: "bg-amber-100", title: "Instant Analysis", desc: "Get detailed diagnostic reports in seconds." },
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
