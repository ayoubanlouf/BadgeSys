import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { ScanSearch, CheckCircle2, XCircle, Upload, Loader2, Hash } from "lucide-react";
import { validateBadgeById, validateBadgeByImage, ValidationResult } from "../api";

type Tab = "id" | "image";

export default function ValidatePage() {
  const [tab, setTab] = useState<Tab>("id");
  const [badgeId, setBadgeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(selected: File) {
    setFile(selected);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }

  async function handleValidate() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let res: ValidationResult;
      if (tab === "id") {
        if (!badgeId.trim()) { setError("Enter a Badge ID"); setLoading(false); return; }
        res = await validateBadgeById(badgeId.trim());
      } else {
        if (!file) { setError("Select an image first"); setLoading(false); return; }
        res = await validateBadgeByImage(file);
      }
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setBadgeId("");
    setFile(null);
    setPreview(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Validate Badge</h2>
        <p className="text-slate-400 text-sm mt-1">
          Verify an access badge by entering its ID or uploading the badge image.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-black/20 p-1">
          <button
            onClick={() => { setTab("id"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              tab === "id" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Hash className="w-4 h-4" />
            Badge ID
          </button>
          <button
            onClick={() => { setTab("image"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              tab === "image" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            Scan QR
          </button>
        </div>

        {/* ID input */}
        {tab === "id" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Badge ID
            </label>
            <input
              type="text"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              placeholder="e.g. A1B2C3D4-…"
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        )}

        {/* Image upload */}
        {tab === "image" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Badge Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-white/10 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              {preview ? (
                <img src={preview} alt="Selected" className="mx-auto max-h-48 rounded-xl object-contain" />
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-400 text-sm">Drop image here or click to browse</p>
                  <p className="text-slate-600 text-xs">PNG, JPG, GIF supported</p>
                </div>
              )}
            </div>
            {file && (
              <p className="text-slate-500 text-xs mt-1.5">{file.name}</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleValidate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all duration-200 shadow-lg shadow-blue-900/30"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Validating…" : "Validate Badge"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-6 border ${
          result.valid
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.valid
              ? <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              : <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            }
            <h3 className={`text-lg font-bold ${result.valid ? "text-emerald-300" : "text-red-300"}`}>
              {result.valid ? "Valid Badge" : "Invalid Badge"}
            </h3>
          </div>

          {result.valid ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Username</p>
                <p className="text-sm text-white font-medium">{result.username}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Badge ID</p>
                <p className="text-xs text-blue-400 font-mono break-all">{result.badge_id}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Issued</p>
                <p className="text-sm text-slate-300">
                  {result.issued_at ? new Date(result.issued_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-400 text-sm">
              {result.message ?? result.error ?? "This badge could not be verified in our system."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
