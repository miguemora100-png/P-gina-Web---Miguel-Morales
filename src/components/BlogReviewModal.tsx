import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BookOpen, Star, Heart, ExternalLink, MessageCircle, Sparkles } from "lucide-react";
import { blogReviewData } from "../data/blogReview";

interface BlogReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "es" | "en";
}

export const BlogReviewModal: React.FC<BlogReviewModalProps> = ({ isOpen, onClose, language }) => {
  const content = blogReviewData[language] || blogReviewData.es;

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
            className="relative w-full max-w-3xl bg-[#0b1021] border border-purple-500/30 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.85)] my-auto max-h-[92vh] flex flex-col overflow-hidden text-neutral-200"
          >
            {/* Header banner */}
            <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-white/10 bg-gradient-to-r from-purple-900/40 via-[#0f172a] to-amber-950/30 flex-shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer z-20"
                aria-label={language === "es" ? "Cerrar reseña" : "Close review"}
              >
                <X size={20} />
              </button>

              <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-purple-300 mb-3">
                <span className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                  <Heart size={12} className="text-purple-400 fill-purple-400" />
                  {content.source}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-amber-400 font-semibold">{content.author}</span>
              </div>

              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
                  {content.title}
                </h2>
                <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  {[...Array(content.stars)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                  <span className="text-xs font-bold ml-1.5">{content.rating}</span>
                </div>
              </div>

              {/* Book mention chip */}
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-neutral-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <BookOpen size={13} className="text-amber-400" />
                <span className="font-semibold text-white">«{content.bookTitle}»</span>
                <span className="text-neutral-400">de {content.bookAuthor}</span>
              </div>
            </div>

            {/* Scrollable Review Content */}
            <div className="overflow-y-auto px-6 sm:px-10 py-8 space-y-6 flex-1 text-neutral-200">
              {/* Saludo inicial */}
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                <p className="text-base sm:text-lg font-semibold text-purple-200">
                  {content.introGreeting}
                </p>
                <p className="text-sm text-neutral-300 font-medium">
                  {content.introSynopsisNote}
                </p>
              </div>

              {/* Título de la Opinión Personal */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-px bg-white/15 flex-1" />
                <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] font-bold text-amber-400 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                  📚 {content.opinionTitle} 📚
                </span>
                <div className="h-px bg-white/15 flex-1" />
              </div>

              {/* Párrafos de la reseña */}
              <div className="space-y-4 font-serif text-sm sm:text-base leading-relaxed text-neutral-200">
                {content.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-justify text-neutral-300">
                    {p}
                  </p>
                ))}
              </div>

              {/* Conclusión y valoración */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121c38] to-[#1e1438] border border-amber-400/30 space-y-4 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                  <Sparkles size={15} />
                  <span>{language === "es" ? "Recomendación final" : "Final recommendation"}</span>
                </div>
                <p className="text-sm sm:text-base font-serif italic text-neutral-200 leading-relaxed">
                  «{content.conclusionRecommendation}»
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-white/10 flex-wrap gap-2">
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {content.scoreText}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    @{content.author.split('(')[1]?.replace(')', '') || 'romanticoslibros'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-10 py-5 border-t border-white/10 bg-[#080d18] flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
              <a
                href="https://www.amazon.com/dp/B0H38TPVHL"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 px-6 py-2.5 text-xs sm:text-sm font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                <BookOpen size={16} />
                <span>{language === "es" ? "Comprar El efecto Strauss" : "Get The Strauss Effect"}</span>
                <ExternalLink size={13} className="opacity-70" />
              </a>

              <button 
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {language === "es" ? "Cerrar reseña" : "Close review"}
              </button>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
};
