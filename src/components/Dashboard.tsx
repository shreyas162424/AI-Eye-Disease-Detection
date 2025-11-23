// src/components/Dashboard.tsx
import React, { useMemo, useState } from "react";
import { loadScans, clearScans } from "../lib/scanStorage";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Scan = {
  id: string;
  timestamp: string;
  imageDataUrl?: string;
  thumbDataUrl?: string;
  prediction: string;
  probability: number;
};

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#A78BFA"];

function formatDate(ts?: string) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

// Inline ImageModal component
function ImageModal({ src, alt, onClose }: { src: string | null; alt?: string; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded shadow-lg max-w-3xl w-full mx-4">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="text-gray-600 hover:text-black px-3 py-1">Close</button>
        </div>
        <div className="p-4">
          <img src={src} alt={alt ?? "scan"} className="w-full h-auto max-h-[80vh] object-contain" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard(): JSX.Element {
  const scans = (loadScans() as Scan[]) || [];

  // state MUST be inside the component
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  const total = scans.length;
  const avgConfidence = total === 0 ? 0 : (scans.reduce((s, r) => s + r.probability, 0) / total) * 100;
  const latestDate = scans.length ? scans[0].timestamp : null;

  const lineData = useMemo(() => {
    return scans
      .slice(0, 20)
      .slice()
      .reverse()
      .map((s) => ({
        date: new Date(s.timestamp).toLocaleDateString(),
        score: Number((s.probability * 100).toFixed(1)),
      }));
  }, [scans]);

  const counts: Record<string, number> = {};
  scans.forEach((s) => (counts[s.prediction] = (counts[s.prediction] || 0) + 1));
  const pieData = Object.keys(counts).map((k, i) => ({ name: k.replace(/_/g, " "), value: counts[k], color: COLORS[i % COLORS.length] }));

  const exportCsv = () => {
    if (!scans.length) {
      alert("No scans to export.");
      return;
    }
    const rows = scans.map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      prediction: s.prediction,
      confidence: (s.probability * 100).toFixed(2),
    }));
    const header = Object.keys(rows[0]).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eye_scans_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleClear = () => {
    if (!confirm("Clear all scan history? This cannot be undone.")) return;
    clearScans();
    location.reload();
  };

  return (
    <div className="space-y-6 px-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">Scan History & Trends</h3>
          <p className="text-sm text-slate-300">Overview of recent scans and risk trends</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center text-slate-200">
            <div className="text-sm text-slate-400">Total scans</div>
            <div className="text-xl font-bold">{total}</div>
          </div>

          <div className="text-center text-slate-200">
            <div className="text-sm text-slate-400">Average confidence</div>
            <div className="text-xl font-bold">{avgConfidence.toFixed(1)}%</div>
          </div>

          <div className="text-center text-slate-200">
            <div className="text-sm text-slate-400">Latest scan</div>
            <div className="text-sm">{latestDate ? formatDate(latestDate) : "-"}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={exportCsv} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Export CSV</button>
            <button onClick={handleClear} className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700">Clear History</button>
          </div>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-white/5 rounded p-6 text-slate-300">No scans yet.</div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded shadow p-4">
              <h4 className="text-md font-medium mb-2 text-slate-800">Risk trend (last scans)</h4>
              <div style={{ height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={lineData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e6edf3" opacity={0.35} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "#475569" }} axisLine={false} />
                    <Tooltip formatter={(value: any) => `${value}%`} contentStyle={{ background: "#0b1220", border: "none", color: "#fff" }} />
                    <Area type="monotone" dataKey="score" stroke="#6366F1" fill="url(#colorScore)" dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded shadow p-4">
              <h4 className="text-md font-medium mb-2 text-slate-800">Condition distribution</h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={48} paddingAngle={6} label>
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" layout="horizontal" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-3">
                      <span style={{ width: 12, height: 12, background: p.color }} className="inline-block rounded" />
                      <span>{p.name}</span>
                    </div>
                    <div className="font-medium">{p.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent scans */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-slate-800">Recent scans</h4>
              <div className="text-sm text-slate-500">{total} total</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
              {scans.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 border rounded-lg p-3 hover:shadow-lg transition-shadow bg-white"
                  aria-label={`Scan ${s.id}`}
                >
                  {/* THUMBNAIL */}
                  <div className="w-20 h-16 flex-shrink-0 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center">
                    {s.thumbDataUrl || s.imageDataUrl ? (
                      <img
                        src={s.thumbDataUrl ?? s.imageDataUrl!}
                        alt={`thumb-${s.id}`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-xs text-slate-400">No image</div>
                    )}
                  </div>

                  {/* MAIN TEXT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{s.prediction.replace(/_/g, " ")}</div>
                      </div>

                      {/* CONFIDENCE */}
                      <div className="ml-2">
                        <div className="text-sm font-semibold inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200">
                          {(s.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Date/time */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7H3v12a2 2 0 0 0 2 2z"></path>
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-600">{formatDate(s.timestamp)}</span>
                        <span className="text-xs text-slate-400">Scan ID: <span className="text-slate-500">{s.id.slice(0, 8)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(s));
                        const t = document.createElement("div");
                        t.innerText = "Copied JSON";
                        t.className = "fixed bottom-6 right-6 bg-slate-800 text-white px-3 py-2 rounded shadow";
                        document.body.appendChild(t);
                        setTimeout(() => t.remove(), 1500);
                      }}
                      className="text-xs px-3 py-1 border rounded text-slate-700 hover:bg-slate-50"
                    >
                      Copy
                    </button>

                    <button
                      onClick={() => {
                        const url = s.imageDataUrl ?? s.thumbDataUrl;
                        if (!url) { alert("No image available."); return; }
                        const safeUrl = url.startsWith("data:") ? url : url.startsWith("http") ? url : `data:image/png;base64,${url}`;
                        setModalSrc(safeUrl);
                      }}
                      className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* <-- Render modal once at the bottom */}
      {modalSrc && <ImageModal src={modalSrc} alt="Scan image" onClose={() => setModalSrc(null)} />}
    </div>
  );
}
