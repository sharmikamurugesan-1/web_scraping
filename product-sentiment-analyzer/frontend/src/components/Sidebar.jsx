import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Package,
  MessageSquare,
  GitCompare,
  Lightbulb,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, apiOnline = true }) {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analyze', label: 'Analyze Product', icon: Search, badge: 'Scrape' },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/reviews', label: 'Reviews', icon: MessageSquare },
    { to: '/compare', label: 'Compare', icon: GitCompare },
    { to: '/insights', label: 'Insights', icon: Lightbulb, badge: 'AI' },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 group overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="leading-tight transition-opacity duration-200">
              <span className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                Sentilytics <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-mono font-bold">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-medium">
                Product Intelligence
              </span>
            </div>
          )}
        </NavLink>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {!mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />

              {(!collapsed || mobileOpen) && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-brand-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80">
        {(!collapsed || mobileOpen) ? (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">Backend API</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {apiOnline ? 'v2.0 Online' : 'Offline'}
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="API Status: Online">
            <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
