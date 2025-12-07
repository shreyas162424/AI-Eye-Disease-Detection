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

function ImageModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/90 text-slate-800 hover:bg-white p-2 rounded-full shadow-lg transition-all"
        >
          ✕
        </button>
        <div className="flex justify-center bg-black">
          <img src={src} alt="Zoomed scan" className="max-h-[85vh] w-auto object-contain" />
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
  const [opacity, setOpacity] = useState<number>(0.55); // Heatmap opacity state

  useEffect(() => {
    const state = location.state as LocationState | undefined;
    if (state?.result) {
      setResult(state.result);
      setImageUrl(state.imageUrl ?? null);
    } else {
      navigate("/upload", { replace: true });
    }
  }, [location.state, navigate]);

  // Persist scan locally
  useEffect(() => {
    if (!result || saved || !isLoaded) return;
    try {
      const rec = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        imageDataUrl: imageUrl ?? "",
        prediction: result.predicted_disease ?? "unknown",
        probability: result.confidence ?? 0,
        gradcamDataUrl: result.heatmap_png_base64
          ? `data:image/png;base64,${result.heatmap_png_base64}`
          : undefined,
        maskDataUrl: result.mask_png_base64 ? `data:image/png;base64,${result.mask_png_base64}` : undefined,
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
    return String(s)
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_")
      .replace(/[^\w]/g, "");
  };

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[24rem]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // 🆕 detect invalid image case from backend
  const isInvalid =
    result.predicted_disease === "Invalid / Non-retinal Image" ||
    normalizePredKey(result.predicted_disease) === "invalid_nonretinal_image";

  const backendMessage = (result as any)?.message as string | undefined;

  // build predKey with awareness of invalid case
  const rawLabelForKey = isInvalid ? "invalid_nonretinal_image" : result.predicted_disease || "normal";
  const predKey = normalizePredKey(rawLabelForKey);
  const friendlyLabel = isInvalid
    ? "Invalid / Non-retinal Image"
    : predKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const isNormal = predKey === "normal";
  const confidence = result ? (Number(result.confidence || 0) * 100).toFixed(1) : "0";

  const ensureDataUrl = (val?: string | null) => {
    if (!val) return null;
    if (val.startsWith("data:")) return val;
    return `data:image/png;base64,${val}`;
  };

  const gradcamSrc = ensureDataUrl(result?.heatmap_png_base64 || null);
  const maskSrc = ensureDataUrl(result?.mask_png_base64 || null);

  const probabilities =
    result?.probabilities && typeof result.probabilities === "object" ? result.probabilities : {};

  const chartLabels = useMemo(
    () =>
      Object.keys(probabilities).map((k) =>
        String(k)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      ),
    [probabilities]
  );
  const chartValues = useMemo(
    () => Object.values(probabilities).map((v) => Number(v) || 0),
    [probabilities]
  );
  const hasChartData = chartValues.length > 0;
  const chartColors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

  const barData = useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          label: "Probability",
          data: chartValues,
          backgroundColor: chartColors.slice(0, chartValues.length),
          borderRadius: 6,
        },
      ],
    }),
    [chartLabels, chartValues]
  );

  const pieData = useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          backgroundColor: chartColors.slice(0, chartValues.length),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    }),
    [chartLabels, chartValues]
  );

  const diseaseInfo: Record<string, any> = {
    normal: {
      title: "Normal",
      description: "No signs of eye disease detected.",
      severity: "None",
      color: "text-green-600",
      urgency: "Routine follow-up",
      recommendations: ["Regular check-ups", "UV protection"],
    },
    cataract: {
      title: "Cataract",
      description: "Clouding of the lens.",
      severity: "Moderate",
      color: "text-amber-500",
      urgency: "Consult in 2-4 weeks",
      recommendations: ["Ophthalmologist visit", "Surgery evaluation"],
    },
    glaucoma: {
      title: "Glaucoma",
      description: "Optic nerve damage.",
      severity: "High",
      color: "text-red-600",
      urgency: "Seek consultation 1-2 weeks",
      recommendations: ["Immediate referral", "Eye drops"],
    },
    diabetic_retinopathy: {
      title: "Diabetic Retinopathy",
      description: "Retinal blood vessel damage.",
      severity: "Moderate-Severe",
      color: "text-red-500",
      urgency: "Consult 1-2 weeks",
      recommendations: ["Retina specialist", "Blood sugar control"],
    },
    // 🆕 special entry for invalid images
    invalid_nonretinal_image: {
      title: "Invalid / Non-retinal Image",
      description:
        "The uploaded image does not appear to be a valid retinal fundus scan. The AI system cannot safely analyse this image.",
      severity: "N/A",
      color: "text-slate-700",
      urgency: "Please upload a proper retinal fundus image taken with a fundus camera.",
      recommendations: [
        "Ensure the image clearly shows the retina (back of the eye).",
        "Avoid selfies, external eye photos, documents, or random images.",
        "Use a clinical fundus image for screening.",
      ],
    },
  };

  const info = diseaseInfo[predKey] ?? diseaseInfo["normal"];

  // 🆕 Adjust chat system prompt for invalid vs valid
  const chatSystemPrompt = isInvalid
    ? "You are an AI assistant for an ophthalmology screening app. The uploaded image appears to be invalid or non-retinal. Politely explain to the user that a proper retinal fundus image is required for analysis and give brief instructions on what such an image looks like."
    : `Medical assistant. Screening output: ${friendlyLabel} (${confidence}%). Explain results in simple language, emphasise that this is not a final diagnosis and encourage consulting an eye specialist.`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/upload")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered detection</p>
          </div>
        </div>

        {/* 🆕 Show a red alert if image is invalid */}
        {isInvalid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Invalid Image:</strong>{" "}
              {backendMessage || "Please upload a valid retinal fundus image for accurate analysis."}
            </AlertDescription>
          </Alert>
        )}

        <Card
          className={`shadow-lg border-2 ${
            isInvalid
              ? "border-red-200 bg-red-50 text-slate-900" // 🆕 special styling for invalid
              : isNormal
              ? "border-green-200 bg-green-50 text-slate-900"
              : "border-yellow-200 bg-yellow-50 text-slate-900"
          }`}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              {isInvalid ? (
                <AlertCircle className="h-8 w-8 text-red-600" />
              ) : isNormal ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <CardTitle className="text-2xl">{info.title}</CardTitle>
                {!isInvalid && <CardDescription>Confidence: {confidence}%</CardDescription>}
                {isInvalid && (
                  <CardDescription>
                    The system could not reliably interpret this image as a retinal scan.
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground">{info.description}</p>
                <h3 className="font-semibold">Severity</h3>
                <Badge variant={isNormal || isInvalid ? "secondary" : "destructive"}>
                  {info.severity}
                </Badge>
                <h3 className="font-semibold">Urgency</h3>
                <p className="text-sm font-medium text-yellow-700">{info.urgency}</p>
              </div>

              {/* Compare Slider – only meaningful if not invalid */}
              {!isInvalid && imageUrl && maskSrc ? (
                <div className="space-y-4">
                  <h3 className="font-semibold flex gap-2">
                    <Info size={16} /> Lesion Segmentation
                  </h3>
                  <CompareSlider original={imageUrl} overlay={maskSrc} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setModalSrc(maskSrc)}
                    className="w-full text-xs"
                  >
                    <ZoomIn size={14} className="mr-1" /> View Fullscreen
                  </Button>
                </div>
              ) : imageUrl ? (
                <div className="rounded-lg overflow-hidden border">
                  <img src={imageUrl} alt="Original" className="w-full h-64 object-cover" />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* ORIGINAL GRAD-CAM & MASK SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grad-CAM Heatmap – only if not invalid */}
          {!isInvalid && gradcamSrc && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="h-5 w-5" /> AI Focus Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-full max-w-lg border rounded-lg overflow-hidden">
                    <img
                      src={imageUrl || ""}
                      alt="Original"
                      className="w-full h-auto object-cover"
                    />
                    <img
                      src={gradcamSrc}
                      alt="Heatmap"
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none"
                      style={{ opacity }}
                    />
                  </div>
                  <div className="flex flex-col items-center w-full max-w-md">
                    <label className="text-sm font-medium text-slate-600 mb-2">
                      Heatmap Intensity — {Math.round(opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segmentation Mask – only if not invalid */}
          {!isInvalid && maskSrc && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Info className="h-5 w-5" /> Lesion Mask
                </CardTitle>
              </CardHeader>
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

        {/* Probability charts – hide for invalid */}
        {!isInvalid && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Probability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-white p-4 rounded">
                  {hasChartData ? (
                    <Bar data={barData} options={{ responsive: true }} />
                  ) : (
                    <div className="text-center text-sm text-gray-500">No data</div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-white p-4 rounded flex justify-center">
                  {hasChartData ? (
                    <Pie data={pieData} options={{ responsive: true }} />
                  ) : (
                    <div className="text-center text-sm text-gray-500">No data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {info.recommendations?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{r}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            {!isInvalid && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" /> Find Specialists
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigator.share?.()}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {imageUrl && !isInvalid && (
          <ReportView
            result={result}
            patientName={user?.fullName || "Patient"}
            originalImage={imageUrl}
          />
        )}

        <Feedback />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This AI tool is for screening and educational purposes only.
            It does not replace a professional diagnosis. Always consult a qualified eye
            specialist.
          </AlertDescription>
        </Alert>
      </motion.div>

      <ChatWidget initialSystemPrompt={chatSystemPrompt} />
      <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />
    </div>
  );
};

export default ResultsPage;
