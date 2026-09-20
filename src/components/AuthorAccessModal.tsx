import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, ShieldCheck, LogIn, AlertCircle } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

interface AuthorAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: "es" | "en";
}

export const AuthorAccessModal: React.FC<AuthorAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === "miguemora100@gmail.com") {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(
          language === "es"
            ? "Acceso restringido: Esta cuenta no coincide con la cuenta del autor (miguemora100@gmail.com)."
            : "Access restricted: This Google account is not the author account (miguemora100@gmail.com)."
        );
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setErrorMsg(
          language === "es"
            ? "No se pudo completar el inicio de sesión. Inténtalo de nuevo."
            : "Could not complete sign in. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0e1420] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={22} />
          </div>

          <h3 className="text-lg font-bold text-white font-serif tracking-wide mb-1">
            {language === "es" ? "Acceso Privado de Autor" : "Private Author Access"}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            {language === "es"
              ? "Inicia sesión con tu cuenta oficial para desbloquear la visualización confidencial de visitas y estadísticas de la web."
              : "Sign in with your official author account to unlock private visitor analytics and metrics."}
          </p>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400 text-left">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-neutral-950 font-bold text-xs sm:text-sm hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <LogIn size={16} />
            {isLoading
              ? language === "es"
                ? "Conectando..."
                : "Connecting..."
              : language === "es"
              ? "Acceder con Google (miguemora100@gmail.com)"
              : "Sign in with Google"}
          </button>

          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>{language === "es" ? "Completamente oculto para visitantes externos" : "Completely hidden from public visitors"}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
