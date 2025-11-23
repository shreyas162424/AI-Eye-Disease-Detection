// src/pages/ResultsPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { v4 as uuidv4 } from "uuid";
import { saveScan } from "../lib/scanStorage";

import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Share2,
  Calendar,
  MapPin,
  ZoomIn,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { PredictionResult } from "@/lib/api";
import { generateReport } from "@/lib/generatereport";

import ChatWidget from "@/components/ChatWidget";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Helper modal for zoomed GradCAM image ---
function ImageModal({ src, alt, onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="relative max-w-4xl w-full bg-white rounded shadow-lg overflow-auto">
        <button
          onClick={onClose}
          aria-label="Close image"
          className="absolute top-3 right-3 z-50 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Close
        </button>

        <div className="p-4 flex justify-center">
          <img src={src} alt={alt ?? "scan"} className="max-h-[80vh] w-full object-contain" />
        </div>
      </div>
    </div>
  );
}

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
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [opacity, setOpacity] = useState<number>(0.55);

  useEffect(() => {
    const state = location.state as LocationState | undefined;
    if (state?.result) {
      setResult(state.result);
      setImageUrl(state.imageUrl ?? null);
    } else {
      navigate("/upload");
    }
  }, [location.state, navigate]);

  // Persist scan locally (adds maskDataUrl too)
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

  // utility to normalize label keys from backend -> canonical keys used in diseaseInfo
  const normalizePredKey = (s?: string | null) => {
    if (!s) return "normal";
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_") // spaces/hyphens -> underscore
      .replace(/[^\w_]/g, ""); // remove punctuation
  };

  // This function is for the ChatWidget parsing; kept as-is
  function parseGeminiResponse(data: any): string {
    try {
      if (Array.isArray(data?.candidates) && data.candidates[0]) {
        const c = data.candidates[0];
        if (c?.content) {
          const parts = c.content.parts;
          if (Array.isArray(parts) && parts.length) {
            return parts.map((p: any) => p.text ?? "").join("\n\n");
          }
          if (typeof c.content === "string") return c.content;
        }
        if (typeof c?.text === "string") return c.text;
        if (typeof c?.message === "string") return c.message;
      }
      if (Array.isArray(data?.output)) {
        for (const out of data.output) {
          if (Array.isArray(out.content)) {
            const p = out.content.map((x:any) => x.text ?? "").filter(Boolean).join("\n\n");
            if (p) return p;
          }
          if (typeof out?.content?.text === "string") return out.content.text;
        }
      }
      if (typeof data === "string") return data;
      if (typeof data?._rawText === "string") return data._rawText;
      return JSON.stringify(data).slice(0, 4000);
    } catch (e) {
      return "Could not parse assistant response.";
    }
  }

  // normalized prediction key and friendly label
  const predKey = normalizePredKey(result.predicted_disease);
  const friendlyLabel = predKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const isNormal = predKey === "normal";
  const confidence = (Number(result.confidence || 0) * 100).toFixed(1);

  const gradcamSrc = result.heatmap_png_base64 ? `data:image/png;base64,${result.heatmap_png_base64}` : null;
  const maskSrc = result.mask_png_base64 ? `data:image/png;base64,${result.mask_png_base64}` : null;

  const probabilities = result.probabilities ?? {};
  const chartLabels = Object.keys(probabilities).map((k) =>
    k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
  const chartValues = Object.values(probabilities).map((v) => Number(v)); // ensure numeric
  const chartColors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Probability",
        data: chartValues,
        backgroundColor: chartColors,
        borderRadius: 6,
      },
    ],
  };
  const pieData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: chartColors,
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => `${v * 100}%` } },
    },
  };
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${(ctx.parsed * 100).toFixed(1)}%`,
        },
      },
    },
  };

  const diseaseInfo: Record<string, any> = {
    normal: {
      title: "Normal",
      description:
        "No signs of eye disease detected. Your retinal scan appears healthy and within normal limits.",
      severity: "None",
      color: "text-green-600",
      urgency: "Routine follow-up in 1–2 years",
      recommendations: [
        "Maintain regular eye check-ups every 12–24 months.",
        "Protect your eyes from excessive UV exposure by wearing sunglasses outdoors.",
        "Eat foods rich in vitamins A, C, and E (e.g., carrots, citrus fruits, spinach).",
        "Stay hydrated and take short breaks when using screens for long periods.",
      ],
    },
    cataract: {
      title: "Cataract",
      description:
        "Cataracts cause clouding of the eye’s natural lens, leading to blurred or hazy vision. They often progress slowly over time.",
      severity: "Moderate",
      color: "text-amber-500",
      urgency: "Consult an ophthalmologist within 2–4 weeks",
      recommendations: [
        "Book an appointment with an ophthalmologist for further evaluation.",
        "Consider cataract surgery if daily activities are affected.",
        "Use anti-glare sunglasses to improve comfort in bright light.",
        "Ensure proper lighting when reading or performing detailed tasks.",
      ],
    },
    glaucoma: {
      title: "Glaucoma",
      description:
        "Glaucoma is caused by increased intraocular pressure that can damage the optic nerve and lead to vision loss if untreated.",
      severity: "High",
      color: "text-red-600",
      urgency: "Seek consultation within 1–2 weeks",
      recommendations: [
        "Consult an ophthalmologist immediately for diagnosis confirmation.",
        "Regularly monitor intraocular pressure as per medical advice.",
        "Adhere strictly to prescribed medication or eye drops.",
        "Avoid self-medicating or skipping follow-up appointments.",
      ],
    },
    diabetic_retinopathy: {
      title: "Diabetic Retinopathy",
      description:
        "Diabetic retinopathy occurs when high blood sugar damages blood vessels in the retina, potentially leading to vision loss if not managed.",
      severity: "Moderate–Severe",
      color: "text-red-500",
      urgency: "Consult an ophthalmologist within 1–2 weeks",
      recommendations: [
        "Schedule an eye exam with a retina specialist soon.",
        "Keep blood sugar levels within your doctor’s recommended range.",
        "Monitor blood pressure and cholesterol regularly.",
        "Avoid smoking and maintain a healthy diet rich in leafy greens.",
      ],
    },
    hypertensive_retinopathy: {
      title: "Hypertensive Retinopathy",
      description:
        "This condition results from long-term high blood pressure damaging retinal blood vessels, affecting vision over time.",
      severity: "Moderate",
      color: "text-orange-600",
      urgency: "Consult a specialist within 2–3 weeks",
      recommendations: [
        "Consult both an ophthalmologist and a physician for blood pressure management.",
        "Monitor your blood pressure daily and take medications as prescribed.",
        "Limit salt intake and adopt a heart-healthy diet.",
        "Exercise regularly and avoid smoking or alcohol overuse.",
      ],
    },
  };

  // Use normalized key to fetch info (fallback to normal)
  const info = diseaseInfo[predKey] ?? diseaseInfo["normal"];

  const downloadHeatmap = () => {
    if (!gradcamSrc) return alert("No heatmap available.");
    const a = document.createElement("a");
    a.href = gradcamSrc;
    a.download = `heatmap_${new Date().toISOString()}.png`;
    a.click();
  };

  const chatSystemPrompt = `You are a medical-explainer assistant. The user has received a model diagnosis: ${friendlyLabel} with probability ${confidence}%. Explain what this means in simple language, suggest basic eye care tips, and tell when to see a specialist.`;

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
        <Card className={`shadow-lg border-2 ${isNormal ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isNormal ? <CheckCircle className="h-8 w-8 text-success" /> : <AlertCircle className="h-8 w-8 text-warning" />}
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
                <p className="text-sm font-medium text-warning">{info.urgency}</p>
              </div>

              {imageUrl && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Original Image</h3>
                  <div className="rounded-lg overflow-hidden border">
                    <img src={imageUrl} alt="Original retinal scan" className="w-full h-64 object-cover" />
                  </div>
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
              <div className="h-80 bg-white p-4 rounded"><Bar data={barData} options={chartOptions} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Disease Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80 bg-white p-4 rounded"><Pie data={pieData} options={pieOptions} /></div>
            </CardContent>
          </Card>
        </div>

        {/* Grad-CAM + Mask grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grad-CAM Section */}
          {gradcamSrc && (
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Info className="h-5 w-5" /> Grad-CAM Heatmap</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-lg border rounded-lg overflow-hidden">
                    <img src={imageUrl || ""} alt="Original" className="w-full h-auto object-cover" />
                    <img src={gradcamSrc} alt="Heatmap" className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none" style={{ opacity }} />
                  </div>

                  <div className="flex flex-col items-center w-full max-w-md">
                    <label className="text-sm font-medium text-slate-600 mb-2">Adjust Heatmap Opacity — {Math.round(opacity * 100)}%</label>
                    <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" onClick={downloadHeatmap} className="w-full"><Download className="h-4 w-4 mr-2" /> Download Heatmap</Button>
                    <Button variant="outline" onClick={() => setModalSrc(gradcamSrc)} className="w-full"><ZoomIn className="h-4 w-4 mr-2" /> Zoom</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segmentation Mask */}
          {maskSrc && (
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Info className="h-5 w-5" /> Segmentation Mask</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-lg border rounded-lg overflow-hidden">
                    <img src={maskSrc} alt="Segmentation Mask" className="w-full h-auto object-cover bg-black" />
                  </div>
                  <p className="text-sm text-muted-foreground">This is the mask predicted by the model's segmentation head.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = maskSrc; a.download = `mask_${new Date().toISOString()}.png`; a.click(); }} className="w-full"><Download className="h-4 w-4 mr-2" /> Download Mask</Button>
                    <Button variant="outline" onClick={() => setModalSrc(maskSrc)} className="w-full"><ZoomIn className="h-4 w-4 mr-2" /> Zoom</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader><CardTitle className="text-xl">Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {info.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button variant="outline" className="w-full"><MapPin className="h-4 w-4 mr-2" /> Find Specialists Nearby</Button>
              <Button variant="outline" className="w-full"><Calendar className="h-4 w-4 mr-2" /> Book Appointment</Button>
              <Button variant="outline" className="w-full" onClick={() => generateReport(result, "Patient Name")}><Download className="h-4 w-4 mr-2" /> Download Report</Button>
              <Button variant="outline" className="w-full" onClick={() => navigator.share?.()}><Share2 className="h-4 w-4 mr-2" /> Share Results</Button>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This AI analysis is for screening only and should not replace professional medical advice.
          </AlertDescription>
        </Alert>
      </motion.div>

      <ChatWidget initialSystemPrompt={chatSystemPrompt} />
      <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />
    </div>
  );
};

export default ResultsPage;
