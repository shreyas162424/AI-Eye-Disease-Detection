import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { saveScan } from "../lib/scanStorage";
import { ArrowLeft, AlertCircle, CheckCircle, Info, Calendar, MapPin, Share2, ZoomIn } from "lucide-react";
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
import { useUser } from "@clerk/clerk-react";

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

// --- Helper: Validates and constructs proper Image Sources ---
// Handles File Paths (/image.png), http URLs, data:image/... and raw base64 strings.
const getValidImageSrc = (source: string | undefined | null): string | null => {
  if (!source || source.trim().length === 0) return null;

  const s = source.trim();

  if (s.startsWith("/") || s.startsWith("http")) return s;
  if (s.startsWith("data:image")) return s;

  // treat as raw base64 (no header)
  return `data:image/png;base64,${s}`;
};

// Utility to check if a path is a video (basic)
const isVideoPath = (src: string | null | undefined) => {
  if (!src) return false;
  const lower = src.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg");
};

function ImageModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  const videoMode = isVideoPath(src);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-5xl w-full bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-white/90 text-slate-800 hover:bg-white p-2 rounded-full shadow-lg transition-all">✕</button>
        <div className="flex justify-center bg-black p-4">
          {videoMode ? (
            <video src={src} controls className="max-h-[85vh] w-auto object-contain" />
          ) : (
            <img src={src} alt="Zoomed scan" className="max-h-[85vh] w-auto object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoaded } = useUser();

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [opacity, setOpacity] = useState<number>(0.55);

  // === Developer-specified uploaded file fallback (from conversation history)
  // Your tooling will convert this local path to a usable URL when the app runs.
  const UPLOADED_LOCAL_FILE = "/mnt/data/360d963e-d961-4969-8f61-39a53ac5e714.mp4";

  useEffect(() => {
    const state = (location.state as LocationState | undefined);
    if (state?.result) {
      setResult(state.result);
      // prefer provided imageUrl, otherwise fallback to the uploaded local file
      setImageUrl(state.imageUrl ?? UPLOADED_LOCAL_FILE);
    } else {
      // If no state, we still set fallback to uploaded file so page can render for preview/testing
      // (If you want strict redirect, uncomment the navigate line below)
      // navigate("/upload", { replace: true });
      setImageUrl(UPLOADED_LOCAL_FILE);
    }
  }, [location.state, navigate]);

  // Persist scan locally (once)
  useEffect(() => {
    if (!result || saved || !isLoaded) return;
    try {
      const heatSrc = getValidImageSrc(result.heatmap_png_base64);
      const maskSrc = getValidImageSrc(result.mask_png_base64);

      const rec = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        imageDataUrl: imageUrl ?? "",
        prediction: result.predicted_disease ?? "unknown",
        probability: result.confidence ?? 0,
        gradcamDataUrl: heatSrc || undefined,
        maskDataUrl: maskSrc || undefined,
        notes: "",
      };

      const userId = user ? user.id : "guest";
      saveScan(userId, rec);
      setSaved(true);
    } catch (err) {
      console.warn("Failed to save scan:", err);
    }
  }, [result, imageUrl, saved, user, isLoaded]);

  const normalizePredKey = (s?: string | null) => {
    if (!s) return "normal";
    return String(s).trim().toLowerCase().replace(/[-\s]+/g, "_").replace(/[^\w_]/g, "");
  };

  const predKey = result ? normalizePredKey(result.predicted_disease) : "normal";
  const friendlyLabel = predKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const isNormal = predKey === "normal";
  const confidence = result ? (Number(result.confidence || 0) * 100).toFixed(1) : "0";

  // === SAFE IMAGE SOURCES (Uses helper)
  const gradcamSrc = getValidImageSrc(result?.heatmap_png_base64);
  const maskSrc = getValidImageSrc(result?.mask_png_base64);

  const probabilities = (result?.probabilities && typeof result.probabilities === "object") ? result.probabilities : {};
  const chartLabels = useMemo(() => Object.keys(probabilities).map((k) => String(k).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())), [probabilities]);
  const chartValues = useMemo(() => Object.values(probabilities).map((v) => Number(v) || 0), [probabilities]);
  const hasChartData = chartValues.length > 0;
  const chartColors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

  const barData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{ label: "Probability", data: chartValues, backgroundColor: chartColors.slice(0, chartValues.length), borderRadius: 6 }],
  }), [chartLabels, chartValues]);

  const pieData = useMemo(() => ({
    labels: chartLabels,
    datasets: [{ data: chartValues, backgroundColor: chartColors.slice(0, chartValues.length), borderColor: "#fff", borderWidth: 2 }],
  }), [chartLabels, chartValues]);

  const diseaseInfo: Record<string, any> = {
    normal: { title: "Normal", description: "No signs of eye disease detected. Your retinal scan appears healthy.", severity: "None", color: "text-green-600", urgency: "Routine follow-up", recommendations: ["Regular check-ups", "UV protection"] },
    cataract: { title: "Cataract", description: "Clouding of the lens.", severity: "Moderate", color: "text-amber-500", urgency: "Consult in 2-4 weeks", recommendations: ["Ophthalmologist visit", "Surgery evaluation"] },
    glaucoma: { title: "Glaucoma", description: "Optic nerve damage.", severity: "High", color: "text-red-600", urgency: "Seek consultation 1-2 weeks", recommendations: ["Immediate referral", "Eye drops"] },
    diabetic_retinopathy: { title: "Diabetic Retinopathy", description: "Retinal blood vessel damage.", severity: "Moderate-Severe", color: "text-red-500", urgency: "Consult 1-2 weeks", recommendations: ["Retina specialist", "Blood sugar control"] },
  };

  const info = diseaseInfo[predKey] ?? diseaseInfo["normal"];
  const chatSystemPrompt = `Medical assistant. Diagnosis: ${friendlyLabel} (${confidence}%). Explain simply.`;

  if (!result && !imageUrl) return <div className="flex items-center justify-center min-h-[24rem]"><p className="text-muted-foreground">Loading...</p></div>;

  // Helper to render original media (image or video)
  const renderOriginalMedia = (src: string | null) => {
    if (!src) return null;
    if (isVideoPath(src)) {
      return (
        <div className="rounded-lg overflow-hidden border border-slate-300">
          <video src={src} controls className="w-full h-64 object-cover" />
        </div>
      );
    }
    return <div className="rounded-lg overflow-hidden border border-slate-300"><img src={src} alt="Original" className="w-full h-64 object-cover" /></div>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/upload")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered detection</p>
          </div>
        </div>

        {/* Main Result Card */}
        <Card className={`shadow-lg border-2 ${isNormal ? "border-green-200 bg-green-50 text-slate-900" : "border-yellow-200 bg-yellow-50 text-slate-900"}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isNormal ? <CheckCircle className="h-8 w-8 text-green-600" /> : <AlertCircle className="h-8 w-8 text-yellow-600" />}
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">{t(result?.predicted_disease ?? "") || friendlyLabel}</CardTitle>
                <CardDescription className="text-slate-600 font-medium">Confidence: {confidence}% • Analysis completed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Description</h3>
                <p className="text-sm text-slate-700">{info.description}</p>

                <h3 className="font-semibold text-slate-900">Severity Level</h3>
                <Badge variant={isNormal ? "secondary" : "destructive"}>{info.severity}</Badge>

                <h3 className="font-semibold text-slate-900">Urgency</h3>
                <p className={`text-sm font-bold ${isNormal ? 'text-green-700' : 'text-yellow-800'}`}>{info.urgency}</p>
              </div>

              {/* Compare Slider or media preview */}
              {(imageUrl && maskSrc) ? (
                <div className="space-y-4">
                  <h3 className="font-semibold flex gap-2 text-slate-900"><Info size={16} /> Lesion Detection</h3>

                  {/* CompareSlider expects images; if original is video, we show static media + mask below */}
                  {!isVideoPath(imageUrl) ? (
                    <CompareSlider original={imageUrl!} overlay={maskSrc} />
                  ) : (
                    <div className="rounded-lg overflow-hidden border border-slate-300">
                      {renderOriginalMedia(imageUrl)}
                    </div>
                  )}

                  <Button variant="ghost" size="sm" onClick={() => setModalSrc(maskSrc)} className="w-full text-xs text-slate-700 hover:bg-slate-200">
                    <ZoomIn size={14} className="mr-1" /> View Fullscreen
                  </Button>
                </div>
              ) : imageUrl ? (
                <div>{renderOriginalMedia(imageUrl)}</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Grad-CAM and Mask */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gradcamSrc && (
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Info className="h-5 w-5" /> AI Focus Heatmap</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-lg border rounded-lg overflow-hidden">
                    {/* If original is a video, show video and overlay heatmap as image */}
                    {isVideoPath(imageUrl || "") ? (
                      <div className="relative">
                        <video src={imageUrl || ""} controls className="w-full h-auto object-cover" />
                        <img src={gradcamSrc} alt="Heatmap" className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none" style={{ opacity }} />
                      </div>
                    ) : (
                      <>
                        <img src={imageUrl || ""} alt="Original" className="w-full h-auto object-cover" />
                        <img src={gradcamSrc} alt="Heatmap" className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none" style={{ opacity }} />
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center w-full max-w-md">
                    <label className="text-sm font-medium text-slate-600 mb-2">Heatmap Intensity — {Math.round(opacity * 100)}%</label>
                    <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {maskSrc && (
            <Card>
              <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Info className="h-5 w-5" /> Lesion Mask</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-lg border rounded-lg overflow-hidden bg-black">
                    <img src={maskSrc} alt="Mask" className="w-full h-auto object-contain" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200">
            <CardHeader><CardTitle className="text-xl text-slate-900">Probability</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 p-4 rounded">
                {hasChartData ? <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} /> : <div className="text-center text-sm text-gray-500">No data</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader><CardTitle className="text-xl text-slate-900">Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 p-4 rounded flex justify-center">
                {hasChartData ? <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} /> : <div className="text-center text-sm text-gray-500">No data</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {info.recommendations?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm text-slate-600">{r}</span>
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

        {/* Report + Feedback */}
        {imageUrl && <ReportView result={result} patientName={user?.fullName || "Patient"} originalImage={imageUrl} />}
        <Feedback />
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> AI screening only. Consult a doctor.
          </AlertDescription>
        </Alert>
      </motion.div>

      <ChatWidget initialSystemPrompt={chatSystemPrompt} />
      <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />
    </div>
  );
};

export default ResultsPage;
