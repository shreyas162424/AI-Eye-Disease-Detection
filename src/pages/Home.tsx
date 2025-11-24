import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Activity, Shield, Zap, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleStart = () => {
    navigate("/upload");
  };

  const handleDemo = () => {
    // 1. Create Fake Data for the Demo
    const demoResult = {
      predicted_disease: "Glaucoma",
      confidence: 0.94,
      probabilities: {
        "Glaucoma": 0.94,
        "Cataract": 0.03,
        "Diabetic Retinopathy": 0.02,
        "Normal": 0.01
      },
      // We leave masks empty for the demo to keep it simple, 
      // or you could add base64 strings if you have them.
      heatmap_png_base64: null, 
      mask_png_base64: null
    };

    // 2. Navigate to Results with this data
    navigate("/results", { 
      state: { 
        result: demoResult,
        // Use a generic placeholder image for the demo
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Fundus_photograph_of_normal_left_eye.jpg/600px-Fundus_photograph_of_normal_left_eye.jpg"
      } 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              AI-Powered Retinal Screening V2.0
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              Advanced Eye Care <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Through Artificial Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Early detection of Cataract, Glaucoma, and Diabetic Retinopathy using state-of-the-art deep learning algorithms. fast, accurate, and accessible.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleStart}
                className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                <Upload className="mr-2 h-5 w-5" /> Start Diagnosis
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleDemo}
                className="h-14 px-8 text-lg rounded-full border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-all"
              >
                <PlayCircle className="mr-2 h-5 w-5" /> View Demo Result
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Background Gradient Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Disease Detection</h3>
                <p className="text-slate-500 leading-relaxed">
                  Capable of identifying multiple retinal conditions including Cataracts, Glaucoma, and DR with 94% accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Medical Grade Privacy</h3>
                <p className="text-slate-500 leading-relaxed">
                  Your medical data is encrypted and anonymized. We adhere to strict privacy standards for patient data protection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Analysis</h3>
                <p className="text-slate-500 leading-relaxed">
                  Get detailed diagnostic reports in seconds. Powered by EfficientNet-B3 for rapid server-side inference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
