import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, MapPin, Building2, Clock, ExternalLink, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { eventData } from "../data/event";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "es" | "en";
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, language }) => {
  const content = eventData[language] || eventData.es;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.article 
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#0a1020] border border-cyan-500/30 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.85)] my-auto max-h-[92vh] flex flex-col overflow-hidden text-neutral-200"
          >
            {/* Header banner */}
            <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-[#0a1224] to-blue-950/30 flex-shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer z-20"
                aria-label={language === "es" ? "Cerrar evento" : "Close event"}
              >
                <X size={20} />
              </button>

              <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
                <span className="flex items-center gap-1.5 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                  <Calendar size={12} />
                  {content.datesShort}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{content.city}</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
                {content.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-400 font-sans">
                {content.subtitle}
              </p>
            </div>

            {/* Scrollable Event Content */}
            <div className="overflow-y-auto px-6 sm:px-10 py-8 space-y-8 flex-1 text-neutral-200">
              {/* Event Key Facts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fechas */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5">
                      {language === "es" ? "Fechas oficiales" : "Official dates"}
                    </span>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      {content.dates}
                    </p>
                    <span className="text-xs text-cyan-400/90 font-mono mt-1 block">
                      {content.timeEstimate}
                    </span>
                  </div>
                </div>

                {/* Lugar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5">
                      {language === "es" ? "Lugar y ciudad" : "Venue & City"}
                    </span>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      {content.location}
                    </p>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      {content.city}
                    </span>
                  </div>
                </div>

                {/* Organización */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5 sm:col-span-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-0.5">
                      {language === "es" ? "Organización del evento" : "Event organizer"}
                    </span>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      {content.organizer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold mb-1">
                  <Sparkles size={15} />
                  <span>{language === "es" ? "Sobre la presentación" : "About the event"}</span>
                </div>
                {content.description.map((para, i) => (
                  <p key={i} className="text-sm sm:text-base leading-relaxed text-neutral-300 font-serif text-justify">
                    {para}
                  </p>
                ))}
              </div>

              {/* Highlights List */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block font-bold">
                  {language === "es" ? "Actividades destacadas" : "Featured activities"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-neutral-300">
                      <CheckCircle2 size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-10 py-5 border-t border-white/10 bg-[#070c18] flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <MapPin size={15} className="text-amber-400" />
                  <span>{language === "es" ? "Ver mapa" : "View map"}</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>

                <a
                  href={content.calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 px-5 py-2.5 text-xs sm:text-sm font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                >
                  <Calendar size={15} />
                  <span>{language === "es" ? "Añadir a Google Calendar" : "Add to Google Calendar"}</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              </div>

              <button 
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white px-6 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
};
