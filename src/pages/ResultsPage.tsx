import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { saveScan } from "../lib/scanStorage";
import { ArrowLeft, AlertCircle, CheckCircle, Info, Calendar, MapPin, Share2 } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { PredictionResult } from "@/lib/api";
import ChatWidget from "@/components/ChatWidget";

// --- NEW COMPONENTS ---
import { CompareSlider } from "@/components/CompareSlider";
import { ReportView } from "@/components/ReportView";
import { Feedback } from "@/components/Feedback";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface LocationState {
  result: PredictionResult;
  imageUrl: string;
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = location.state as LocationState | undefined;
    if (state?.result) {
      setResult(state.result);
      setImageUrl(state.imageUrl ?? null);
    } else {
      navigate("/upload");
    }
  }, [location.state, navigate]);

  // Persist scan locally
  useEffect(() => {
    if (!result || saved) return;
    try {
      const rec = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        imageDataUrl: imageUrl ?? "",
        prediction: result.predicted_disease,
        probability: result.confidence,
        gradcamDataUrl: result.heatmap_png_base64 ? `data:image/png;base64,${result.heatmap_png_base64}` : undefined,
        maskDataUrl: result.mask_png_base64 ? `data:image/png;base64,${result.mask_png_base64}` : undefined,
        notes: "",
      };
      saveScan(rec);
      setSaved(true);
    } catch (err) {
      console.warn("Failed to save scan:", err);
    }
  }, [result, imageUrl, saved]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading results...</p>
          <Button onClick={() => navigate("/upload")} variant="outline">
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  // Normalization logic
  const normalizePredKey = (s?: string | null) => {
    if (!s) return "normal";
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_")
      .replace(/[^\w_]/g, "");
  };

  const predKey = normalizePredKey(result.predicted_disease);
  const friendlyLabel = predKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const isNormal = predKey === "normal";
  const confidence = (Number(result.confidence || 0) * 100).toFixed(1);

  // Image Sources
  const gradcamSrc = result.heatmap_png_base64 ? `data:image/png;base64,${result.heatmap_png_base64}` : null;
  const maskSrc = result.mask_png_base64 ? `data:image/png;base64,${result.mask_png_base64}` : null;

  // Chart Data
  const probabilities = result.probabilities ?? {};
  const chartLabels = Object.keys(probabilities).map((k) =>
    k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
  const chartValues = Object.values(probabilities).map((v) => Number(v));
  const chartColors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

  const barData = {
    labels: chartLabels,
    datasets: [{ label: "Probability", data: chartValues, backgroundColor: chartColors, borderRadius: 6 }],
  };
  const pieData = {
    labels: chartLabels,
    datasets: [{ data: chartValues, backgroundColor: chartColors, borderColor: "#fff", borderWidth: 2 }],
  };

  const diseaseInfo: Record<string, any> = {
    normal: {
      title: "Normal",
      description: "No signs of eye disease detected. Your retinal scan appears healthy.",
      severity: "None",
      color: "text-green-600",
      urgency: "Routine follow-up in 1–2 years",
      recommendations: [
        "Maintain regular eye check-ups every 12–24 months.",
        "Protect your eyes from excessive UV exposure.",
        "Eat foods rich in vitamins A, C, and E.",
        "Stay hydrated and rest eyes during screen use.",
      ],
    },
    cataract: {
      title: "Cataract",
      description: "Cataracts cause clouding of the eye’s lens, leading to blurred vision.",
      severity: "Moderate",
      color: "text-amber-500",
      urgency: "Consult an ophthalmologist within 2–4 weeks",
      recommendations: [
        "Book an appointment with an ophthalmologist.",
        "Consider surgery if daily activities are affected.",
        "Use anti-glare sunglasses.",
      ],
    },
    glaucoma: {
      title: "Glaucoma",
      description: "Increased intraocular pressure damaging the optic nerve.",
      severity: "High",
      color: "text-red-600",
      urgency: "Seek consultation within 1–2 weeks",
      recommendations: [
        "Consult an ophthalmologist immediately.",
        "Monitor intraocular pressure.",
        "Adhere to prescribed eye drops.",
      ],
    },
    diabetic_retinopathy: {
      title: "Diabetic Retinopathy",
      description: "High blood sugar damaging retinal blood vessels.",
      severity: "Moderate–Severe",
      color: "text-red-500",
      urgency: "Consult an ophthalmologist within 1–2 weeks",
      recommendations: [
        "Schedule an exam with a retina specialist.",
        "Control blood sugar levels strictly.",
        "Monitor blood pressure.",
      ],
    },
  };

  const info = diseaseInfo[predKey] ?? diseaseInfo["normal"];
  const chatSystemPrompt = `You are a medical-explainer assistant. Diagnosis: ${friendlyLabel} (${confidence}%). Explain simply and suggest care.`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/upload")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered eye disease detection results</p>
          </div>
        </div>

        {/* Main Result Card */}
        <Card className={`shadow-lg border-2 ${isNormal ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isNormal ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertCircle className="h-8 w-8 text-yellow-600" />}
              <div>
                <CardTitle className="text-2xl">
                  {t(result.predicted_disease) || friendlyLabel}
                </CardTitle>
                <CardDescription>
                  Confidence: {confidence}% • Analysis completed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{info.description}</p>

                <h3 className="font-semibold mb-2">Severity Level</h3>
                <Badge variant={isNormal ? "secondary" : "destructive"}>{info.severity}</Badge>

                <h3 className="font-semibold mb-2">Urgency</h3>
                <p className="text-sm font-medium text-yellow-700">{info.urgency}</p>
              </div>

              {/* --- FEATURE 1: COMPARE SLIDER --- */}
              {imageUrl && maskSrc && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Info size={16} /> AI Lesion Detection
                  </h3>
                  <CompareSlider original={imageUrl} overlay={maskSrc} />
                </div>
              )}
              {imageUrl && !maskSrc && (
                 <div className="rounded-lg overflow-hidden border">
                    <img src={imageUrl} alt="Original" className="w-full h-64 object-cover" />
                 </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Probability Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 bg-white p-4 rounded"><Bar data={barData} options={{ responsive: true }} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-xl">Disease Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 bg-white p-4 rounded flex justify-center"><Pie data={pieData} options={{ responsive: true }} /></div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader><CardTitle className="text-xl">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {info.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button variant="outline" className="w-full"><MapPin className="h-4 w-4 mr-2" /> Find Specialists</Button>
              <Button variant="outline" className="w-full"><Calendar className="h-4 w-4 mr-2" /> Book Appointment</Button>
              <Button variant="outline" className="w-full" onClick={() => navigator.share?.()}><Share2 className="h-4 w-4 mr-2" /> Share Results</Button>
            </div>
          </CardContent>
        </Card>

        {/* --- FEATURE 2: REPORT VIEW (DOWNLOAD PDF) --- */}
        {imageUrl && (
          <ReportView 
            result={result} 
            patientName="Patient" 
            originalImage={imageUrl} 
          />
        )}

        {/* --- FEATURE 3: FEEDBACK LOOP --- */}
        <Feedback />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This AI analysis is for screening only and should not replace professional medical advice.
          </AlertDescription>
        </Alert>
      </motion.div>

      <ChatWidget initialSystemPrompt={chatSystemPrompt} />
    </div>
  );
};

export default ResultsPage;