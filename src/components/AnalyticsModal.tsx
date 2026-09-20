import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Activity,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  ShieldCheck,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { VisitRecord } from "../utils/analytics";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: VisitRecord[];
  language: "es" | "en";
}

type PeriodFilter = "today" | "7d" | "30d" | "all";

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  visits,
  language
}) => {
  const [period, setPeriod] = useState<PeriodFilter>("7d");
  const [isExporting, setIsExporting] = useState(false);

  // Filter visits based on selected period
  const filteredVisits = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return visits.filter((v) => {
      if (!v.timestamp) return true;
      const visitTime = v.timestamp.toDate().getTime();

      if (period === "today") {
        return visitTime >= startOfToday;
      }
      if (period === "7d") {
        return visitTime >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
      }
      if (period === "30d") {
        return visitTime >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [visits, period]);

  // Compute stats
  const stats = useMemo(() => {
    const total = filteredVisits.length;
    const uniqueVisitorsSet = new Set<string>();
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;
    let esCount = 0;
    let enCount = 0;
    const referrersMap: Record<string, number> = {};
    const browsersMap: Record<string, number> = {};

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let todayCount = 0;

    filteredVisits.forEach((v) => {
      uniqueVisitorsSet.add(v.visitorId);

      if (v.device === "mobile") mobileCount++;
      else if (v.device === "tablet") tabletCount++;
      else desktopCount++;

      if (v.language === "en") enCount++;
      else esCount++;

      const ref = v.referrer || "Directo";
      referrersMap[ref] = (referrersMap[ref] || 0) + 1;

      const brw = v.browser || "Otro";
      browsersMap[brw] = (browsersMap[brw] || 0) + 1;

      if (v.timestamp && v.timestamp.toDate().getTime() >= startOfToday) {
        todayCount++;
      }
    });

    // Top referrers sorted
    const topReferrers = Object.entries(referrersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top browsers
    const topBrowsers = Object.entries(browsersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      unique: uniqueVisitorsSet.size,
      today: todayCount,
      mobile: mobileCount,
      desktop: desktopCount,
      tablet: tabletCount,
      es: esCount,
      en: enCount,
      topReferrers,
      topBrowsers
    };
  }, [filteredVisits]);

  // Daily Chart Data for the last 7 or 14 days
  const chartData = useMemo(() => {
    const daysCount = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 14 : 7;
    const result: { dateLabel: string; count: number; fullDate: string }[] = [];

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const count = visits.filter((v) => {
        if (!v.timestamp) return false;
        const time = v.timestamp.toDate().getTime();
        return time >= dayStart && time < dayEnd;
      }).length;

      const dateLabel = d.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        weekday: "short",
        day: "numeric"
      });

      const fullDate = d.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      result.push({ dateLabel, count, fullDate });
    }

    const maxCount = Math.max(...result.map((r) => r.count), 1);
    return { days: result, maxCount };
  }, [visits, period, language]);

  // Export to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["ID", "Fecha", "Hora", "Visitante_ID", "Idioma", "Dispositivo", "Navegador", "SO", "Origen"];
      const rows = filteredVisits.map((v) => {
        const date = v.timestamp ? v.timestamp.toDate() : new Date();
        return [
          v.id,
          date.toLocaleDateString("es-ES"),
          date.toLocaleTimeString("es-ES"),
          v.visitorId,
          v.language,
          v.device,
          v.browser || "N/A",
          v.os || "N/A",
          v.referrer || "Directo"
        ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `visitas_miguel_morales_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return language === "es" ? "Reciente" : "Recent";
    const date = timestamp.toDate();
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffSec < 60) return language === "es" ? "Hace unos segundos" : "A few seconds ago";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return language === "es" ? `Hace ${diffMin} min` : `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return language === "es" ? `Hace ${diffHours} h` : `${diffHours}h ago`;
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-[#0d131f] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide font-serif">
                    {language === "es" ? "Analítica Privada de Visitas" : "Private Visitor Analytics"}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {language === "es" ? "Privado" : "Private"}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  {language === "es"
                    ? "Solo visible para ti (miguemora100@gmail.com). Los lectores externos no ven ningún contador."
                    : "Visible only to you (miguemora100@gmail.com). External visitors cannot see any count."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={isExporting || visits.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all disabled:opacity-40"
                title={language === "es" ? "Exportar datos a CSV" : "Export data to CSV"}
              >
                <Download size={13} />
                {language === "es" ? "Exportar CSV" : "Export CSV"}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Period Tabs Filter */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
              <Calendar size={13} className="text-cyan-400" />
              <span>{language === "es" ? "Filtrar período:" : "Time period:"}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
              {(
                [
                  { id: "today", labelEs: "Hoy", labelEn: "Today" },
                  { id: "7d", labelEs: "7 días", labelEn: "7 days" },
                  { id: "30d", labelEs: "30 días", labelEn: "30 days" },
                  { id: "all", labelEs: "Todo", labelEn: "All" }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    period === tab.id
                      ? "bg-cyan-500 text-neutral-950 font-extrabold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {language === "es" ? tab.labelEs : tab.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Content (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {language === "es" ? "Total Visitas" : "Total Visits"}
                  </span>
                  <Activity size={15} className="text-cyan-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {stats.total.toLocaleString()}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {period === "today" ? "En el día de hoy" : `En el período seleccionado`}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {language === "es" ? "Visitantes Únicos" : "Unique Visitors"}
                  </span>
                  <Users size={15} className="text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {stats.unique.toLocaleString()}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {language === "es" ? "Navegadores distintos" : "Distinct devices"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {language === "es" ? "Visitas Hoy" : "Visits Today"}
                  </span>
                  <Clock size={15} className="text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {stats.today.toLocaleString()}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {language === "es" ? "Desde medianoche" : "Since midnight"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {language === "es" ? "Tráfico Móvil" : "Mobile Traffic"}
                  </span>
                  <Smartphone size={15} className="text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  {stats.total > 0 ? `${Math.round((stats.mobile / stats.total) * 100)}%` : "0%"}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1">
                  {stats.mobile} {language === "es" ? "desde smartphones" : "from mobile"}
                </span>
              </div>
            </div>

            {/* Daily Visit Trend Chart */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    {language === "es" ? "Evolución de Visitas Diarias" : "Daily Visits Trend"}
                  </h4>
                </div>
                <span className="text-[11px] text-neutral-400">
                  {language === "es" ? "Actualizado en tiempo real" : "Updated in real time"}
                </span>
              </div>

              <div className="h-40 sm:h-48 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-white/5">
                {chartData.days.map((item, idx) => {
                  const heightPercent = chartData.maxCount > 0 ? Math.max((item.count / chartData.maxCount) * 100, 8) : 8;
                  const isZero = item.count === 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 px-2 py-1 rounded bg-neutral-800 border border-white/20 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        {item.fullDate}: {item.count} {language === "es" ? "visitas" : "visits"}
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          isZero
                            ? "bg-white/5 group-hover:bg-white/10"
                            : "bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:brightness-125 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        }`}
                      />

                      {/* Date label */}
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 group-hover:text-white transition-colors mt-2 font-mono truncate max-w-full">
                        {item.dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdowns (Devices, Language, Referrers) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Devices */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Monitor size={14} className="text-purple-400" />
                  {language === "es" ? "Dispositivos" : "Devices"}
                </h5>
                <div className="space-y-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Smartphone size={12} className="text-purple-400" />
                        {language === "es" ? "Móvil" : "Mobile"}
                      </span>
                      <span className="font-mono font-bold">
                        {stats.mobile} ({stats.total > 0 ? Math.round((stats.mobile / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.mobile / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Monitor size={12} className="text-cyan-400" />
                        {language === "es" ? "Ordenador" : "Desktop"}
                      </span>
                      <span className="font-mono font-bold">
                        {stats.desktop} ({stats.total > 0 ? Math.round((stats.desktop / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.desktop / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Tablet size={12} className="text-amber-400" />
                        Tablet
                      </span>
                      <span className="font-mono font-bold">
                        {stats.tablet} ({stats.total > 0 ? Math.round((stats.tablet / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.tablet / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Distribution */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe2 size={14} className="text-emerald-400" />
                  {language === "es" ? "Idioma de Lectores" : "Reader Language"}
                </h5>
                <div className="space-y-2.5 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                      <span>Español (ES)</span>
                      <span className="font-mono font-bold">
                        {stats.es} ({stats.total > 0 ? Math.round((stats.es / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.es / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                      <span>English (EN)</span>
                      <span className="font-mono font-bold">
                        {stats.en} ({stats.total > 0 ? Math.round((stats.en / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${stats.total > 0 ? (stats.en / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Referrers */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight size={14} className="text-amber-400" />
                  {language === "es" ? "Origen de Tráfico" : "Traffic Sources"}
                </h5>
                <div className="space-y-1.5 pt-1">
                  {stats.topReferrers.length === 0 ? (
                    <p className="text-xs text-neutral-500">{language === "es" ? "Sin datos aún" : "No data yet"}</p>
                  ) : (
                    stats.topReferrers.map(([ref, count], i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-neutral-300 py-0.5">
                        <span className="truncate max-w-[140px]">{ref}</span>
                        <span className="font-mono text-neutral-400 font-semibold">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Visits Live Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity size={13} className="text-cyan-400" />
                  {language === "es" ? "Registro en Vivo de Últimas Visitas" : "Live Recent Visits Stream"}
                </h4>
                <span className="text-[10px] text-neutral-400">
                  {filteredVisits.length} {language === "es" ? "registradas" : "logged"}
                </span>
              </div>

              {filteredVisits.length === 0 ? (
                <div className="text-center py-8 bg-white/[0.01] rounded-xl border border-white/5">
                  <p className="text-xs text-neutral-400">
                    {language === "es"
                      ? "Aún no hay visitas registradas en este período. A medida que las personas visiten tu página, aparecerán aquí automáticamente."
                      : "No visits recorded in this period yet. As readers visit your website, they will appear here automatically."}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.01]">
                  <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
                    {filteredVisits.slice(0, 20).map((v) => (
                      <div
                        key={v.id}
                        className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-white/5 text-neutral-400">
                            {v.device === "mobile" ? (
                              <Smartphone size={13} />
                            ) : v.device === "tablet" ? (
                              <Tablet size={13} />
                            ) : (
                              <Monitor size={13} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              <span>{v.browser || "Navegador"}</span>
                              {v.os && <span className="text-neutral-500 text-[10px]">({v.os})</span>}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {language === "es" ? "Origen:" : "Source:"} {v.referrer || "Directo"} · {v.language.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono text-cyan-400 font-medium">
                            {formatRelativeTime(v.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Security Note */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-[11px] text-cyan-200/80">
              <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">
                  {language === "es" ? "Privacidad Total Garantizada: " : "Complete Privacy Guaranteed: "}
                </span>
                {language === "es"
                  ? "Este icono y panel están protegidos exclusivamente para tu cuenta (miguemora100@gmail.com). Las reglas de seguridad de Firestore impiden que cualquier visitante externo o motor de búsqueda consulte tus estadísticas."
                  : "This icon and dashboard are protected exclusively for your account (miguemora100@gmail.com). Firestore security rules prevent any outside visitors or crawlers from querying your stats."}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
