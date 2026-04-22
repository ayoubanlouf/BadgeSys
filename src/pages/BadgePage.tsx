import { useState, useEffect } from "react";
import { BadgeCheck, Download, Loader2, ShieldAlert } from "lucide-react";
import { generateBadge, fetchMyBadge, BadgeData } from "../api";
import { useAuth } from "../AuthContext";

export default function BadgePage() {
  const { token } = useAuth();
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchMyBadge(token)
      .then((res) => {
        if (res.badge) setBadge(res.badge);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleGenerate() {
    if (!token) return;
    setError("");
    setSuccess("");
    setGenerating(true);
    try {
      const data = await generateBadge(token);
      setBadge(data);
      setSuccess("Your badge has been generated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate badge");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!badge) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${badge.image}`;
    link.download = `badge-${badge.badge_id}.png`;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Your Access Badge</h2>
        <p className="text-slate-400 text-sm mt-1">
          Each account is entitled to one unique access badge.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {badge ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Badge image */}
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-2xl shadow-black/40">
              <img
                src={`data:image/png;base64,${badge.image}`}
                alt="Access Badge"
                className="w-full max-w-sm rounded-xl"
              />
            </div>
          </div>

          {/* Badge info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Badge ID</p>
              <p className="text-sm text-blue-400 font-mono break-all">{badge.badge_id}</p>
            </div>
            {badge.created_at && (
              <div className="bg-black/20 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Issued</p>
                <p className="text-sm text-slate-300">
                  {new Date(badge.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            <Download className="w-4 h-4" />
            Download Badge
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 rounded-2xl mb-2">
            <BadgeCheck className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No Badge Yet</h3>
            <p className="text-slate-400 text-sm mt-1">
              Generate your unique access badge. It includes your name, a unique ID, and a QR code.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-8 py-3 text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            {generating ? "Generating…" : "Generate My Badge"}
          </button>
        </div>
      )}
    </div>
  );
}
