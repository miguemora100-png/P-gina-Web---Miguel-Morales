import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Quote, Sparkles, ExternalLink, Calendar, Newspaper, User } from "lucide-react";
import { interviewData } from "../data/interview";

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "es" | "en";
}

export const InterviewModal: React.FC<InterviewModalProps> = ({ isOpen, onClose, language }) => {
  const content = interviewData[language] || interviewData.es;

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
            className="relative w-full max-w-4xl bg-[#0a0f1d] border border-slate-700/80 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.85)] my-auto max-h-[92vh] flex flex-col overflow-hidden text-neutral-200"
          >
            {/* Top decorative header bar */}
            <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 flex-shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer z-20"
                aria-label={language === "es" ? "Cerrar entrevista" : "Close interview"}
              >
                <X size={20} />
              </button>

              <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-amber-400 mb-3">
                <span className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full font-bold">
                  <Newspaper size={13} />
                  {content.source}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">{content.category}</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-snug">
                {content.headline}
              </h2>
            </div>

            {/* Scrollable Interview Body */}
            <div className="overflow-y-auto px-6 sm:px-10 py-8 space-y-8 flex-1">
              {/* Biographical context / Lead in */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 border-l-4 border-l-amber-500 space-y-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-neutral-400 mb-1">
                  <Quote size={16} className="text-amber-400" />
                  <span>{language === "es" ? "Nota editorial" : "Editorial note"}</span>
                </div>
                {content.bioIntro.map((paragraph, idx) => (
                  <p key={idx} className="text-sm sm:text-base leading-relaxed text-neutral-300 font-serif">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Q&A Section */}
              <div className="space-y-8 divide-y divide-white/10 pt-2">
                {content.qa.map((item, idx) => (
                  <div key={idx} className={`${idx > 0 ? 'pt-8' : ''} space-y-4`}>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold font-serif text-white leading-snug">
                        {item.question}
                      </h3>
                    </div>

                    <div className="pl-10 text-neutral-300 text-sm sm:text-base leading-relaxed font-serif whitespace-pre-line space-y-3">
                      {item.answer.split('\n\n').map((subPara, sIdx) => (
                        <p key={sIdx} className="text-neutral-300 text-justify">
                          {subPara}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conclusion callout */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0d1424] to-cyan-500/10 border border-amber-500/30 text-center space-y-3">
                <p className="text-base sm:text-lg font-serif italic text-amber-200 leading-relaxed max-w-2xl mx-auto">
                  «{content.footerNote}»
                </p>
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-neutral-400">
                  Miguel Morales Moshiashvili · El efecto Strauss
                </p>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="px-6 sm:px-10 py-5 border-t border-white/10 bg-[#080d18] flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
              <a
                href="https://www.amazon.com/dp/B0H38TPVHL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-2.5 text-xs sm:text-sm font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <BookOpen size={16} />
                <span>{language === "es" ? "Conseguir El efecto Strauss" : "Get The Strauss Effect"}</span>
                <ExternalLink size={13} className="opacity-70" />
              </a>

              <button 
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {language === "es" ? "Cerrar entrevista" : "Close interview"}
              </button>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
};
