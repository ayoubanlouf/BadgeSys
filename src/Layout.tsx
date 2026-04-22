import { ReactNode, useState } from "react";
import { ShieldCheck, BadgeCheck, ScanSearch, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "./AuthContext";

type Page = "badge" | "validate";

interface LayoutProps {
  page: Page;
  onNavigate: (p: Page) => void;
  children: ReactNode;
}

export default function Layout({ page, onNavigate, children }: LayoutProps) {
  const { username, clearAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: ReactNode }[] = [
    { id: "badge", label: "My Badge", icon: <BadgeCheck className="w-4 h-4" /> },
    { id: "validate", label: "Validate", icon: <ScanSearch className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-black/30 backdrop-blur-xl border-r border-white/10">
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base leading-none">AccessBadge</span>
              <p className="text-slate-500 text-xs mt-0.5">Identity System</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 mx-3 mt-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Signed in as</p>
          <p className="text-white text-sm font-medium mt-0.5 truncate">{username}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                page === item.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={clearAuth}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">AccessBadge</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="relative w-64 h-full bg-slate-900 border-r border-white/10 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2 bg-white/5 rounded-xl">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Signed in as</p>
              <p className="text-white text-sm font-medium mt-0.5">{username}</p>
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  page === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              onClick={clearAuth}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
