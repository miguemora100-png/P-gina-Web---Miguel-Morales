import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { RotateCw, RotateCcw, Play, Pause, Globe, RefreshCw, Eye } from "lucide-react";

export interface Book3DMockupProps {
  id: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  synopsis?: string;
  synopsisEn?: string;
  coverUrl: string;
  spineColor?: string;
  language: "es" | "en";
  isAdmin?: boolean;
  onCoverUpload?: (e: React.ChangeEvent<HTMLInputElement>, isEn: boolean) => void;
  className?: string;
  isHero?: boolean;
}

export const Book3DMockup: React.FC<Book3DMockupProps> = ({
  id,
  title,
  titleEn,
  subtitle,
  subtitleEn,
  synopsis,
  synopsisEn,
  coverUrl,
  spineColor,
  language,
  isAdmin,
  onCoverUpload,
  className = "",
  isHero = false,
}) => {
  // 3D rotation state
  // Default presentation angle: -18deg on Y, 2deg on X gives a rich 3/4 perspective
  const [rotY, setRotY] = useState(-18);
  const [rotX, setRotX] = useState(3);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showBackHint, setShowBackHint] = useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startRotYRef = useRef(-18);
  const animFrameRef = useRef<number | null>(null);

  const displayTitle = language === "es" ? title : (titleEn || title);
  const displaySubtitle = language === "es" ? subtitle : (subtitleEn || subtitle);
  const displaySynopsis = language === "es" ? synopsis : (synopsisEn || synopsis);

  // Derive sensible fallback spine color if none provided
  const resolvedSpineColor = spineColor || (id === "el-senuelo" ? "#1a1614" : id === "el-efecto-strauss" ? "#0f172a" : "#171a22");

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotate) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const animate = () => {
      setRotY((prev) => (prev + 0.65) % 360);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotate]);

  // Pointer drag to spin 360 degrees smoothly
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Avoid interfering with admin file upload inputs or control buttons
    if ((e.target as HTMLElement).closest("button, label, input, a")) return;
    
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startRotYRef.current = rotY;

    if (isAutoRotate) {
      setIsAutoRotate(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    // Map movement to full 360 degree rotation
    setRotY(startRotYRef.current + deltaX * 0.9);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const spinFull360 = () => {
    setIsAutoRotate(false);
    setRotY((prev) => prev + 360);
  };

  const resetView = () => {
    setIsAutoRotate(false);
    setRotY(-18);
    setRotX(3);
  };

  const toggleBackView = () => {
    setIsAutoRotate(false);
    // Snap to back cover (~180 deg) or front cover (~0 deg)
    const normalized = ((rotY % 360) + 360) % 360;
    if (normalized > 90 && normalized < 270) {
      setRotY(0);
    } else {
      setRotY(180);
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Viewport container with perspective */}
      <div 
        className="relative w-full py-4 flex items-center justify-center [perspective:2400px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Book Container Box - exact 3D preserve-3d coordinate space */}
        <div
          className={`relative aspect-[1/1.5] w-full max-w-[215px] sm:max-w-[235px] ${isHero ? 'md:max-w-[260px]' : ''} [transform-style:preserve-3d] transition-transform ${isDragging ? 'duration-0' : isAutoRotate ? 'duration-75 ease-linear' : 'duration-700 ease-out'}`}
          style={{
            transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          }}
        >
          {/* ========================================================= */}
          {/* 1. FRONT COVER (translateZ: +21px) */}
          {/* ========================================================= */}
          <div 
            className="absolute inset-0 rounded-r-[3px] overflow-hidden border-y border-r border-white/10 shadow-2xl [transform:translateZ(21px)] bg-[#121620] backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <img
              src={coverUrl}
              alt={displayTitle}
              className="h-full w-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Hardcover hinge crease line */}
            <div className="absolute inset-y-0 left-0 w-[3px] bg-black/40 z-30 pointer-events-none" />
            <div className="absolute inset-y-0 left-[3px] w-[1px] bg-white/15 z-30 pointer-events-none" />

            {/* Specular lighting highlights */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/15 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

            {/* Special shine for El Efecto Strauss */}
            {id === "el-efecto-strauss" && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-[30deg] animate-shine" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_50%)] animate-pulse" />
              </div>
            )}

            {/* Admin Upload overlay */}
            {isAdmin && onCoverUpload && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 opacity-0 hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-md z-40 gap-4 p-4">
                <label className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1 text-white hover:bg-white hover:text-black transition-colors">
                    <Globe size={18} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Portada ES</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onCoverUpload(e, false)}
                    accept="image/*"
                  />
                </label>
                <div className="w-8 h-px bg-white/20" />
                <label className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-1 text-white hover:bg-white hover:text-black transition-colors">
                    <Globe size={18} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Portada EN</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onCoverUpload(e, true)}
                    accept="image/*"
                  />
                </label>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. SPINE (EL LOMO) - Mathematically exact geometry       */}
          {/* Width = 42px, centered at left edge (left: -21px)         */}
          {/* rotateY(-90deg) connects perfectly to front and back cover*/}
          {/* ========================================================= */}
          <div
            className="absolute inset-y-0 w-[42px] overflow-hidden border-r border-white/15 shadow-inner"
            style={{
              left: "-21px",
              transform: "rotateY(-90deg)",
              transformOrigin: "center center",
              backgroundColor: resolvedSpineColor,
            }}
          >
            {/* Spine curvature 3D shading (cylindrical gradient) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />
            
            {/* Top and bottom embossed gold/white foil lines */}
            <div className="absolute inset-x-0 top-3 h-px bg-white/20" />
            <div className="absolute inset-x-0 top-3.5 h-px bg-black/40" />
            <div className="absolute inset-x-0 bottom-3 h-px bg-white/20" />
            <div className="absolute inset-x-0 bottom-3.5 h-px bg-black/40" />

            {/* Spine Author & Title (Vertical orientation) */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-1 pointer-events-none">
              {/* Publisher brand top mark */}
              <div className="w-2.5 h-2.5 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-[5px] text-white/50 font-serif">M</span>
              </div>

              {/* Vertical book title and author */}
              <div className="flex-1 flex items-center justify-center [writing-mode:vertical-rl] rotate-180 py-2">
                <span className="text-[8px] sm:text-[9px] font-black text-white/90 uppercase tracking-[0.35em] whitespace-nowrap font-serif drop-shadow-sm">
                  {displayTitle}
                </span>
                <span className="text-[7px] text-amber-400/80 uppercase tracking-[0.25em] whitespace-nowrap mt-3 font-medium">
                  MIGUEL MORALES
                </span>
              </div>

              {/* Publisher seal bottom mark */}
              <div className="text-[6px] font-mono tracking-widest text-white/40 uppercase">
                NOVELA
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. PAGES (RIGHT SIDE / FORE-EDGE)                        */}
          {/* Width = 38px, indented 2px inside hardcover bounds       */}
          {/* ========================================================= */}
          <div
            className="absolute inset-y-[2px] w-[38px] bg-[#f5f1e6] overflow-hidden border-l border-black/10"
            style={{
              right: "-19px",
              transform: "rotateY(90deg)",
              transformOrigin: "center center",
            }}
          >
            {/* Realistic paper page lines */}
            <div 
              className="absolute inset-0 opacity-40" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(to bottom, #d4ccb8 0px, #f5f1e6 1px, #f5f1e6 3px)' 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/15 pointer-events-none" />
          </div>

          {/* ========================================================= */}
          {/* 4. TOP PAGES (HEAD)                                      */}
          {/* ========================================================= */}
          <div
            className="absolute inset-x-[2px] h-[38px] bg-[#f2ede0] overflow-hidden border-b border-black/10"
            style={{
              top: "-19px",
              transform: "rotateX(90deg)",
              transformOrigin: "center center",
            }}
          >
            <div 
              className="absolute inset-0 opacity-40" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(to right, #d4ccb8 0px, #f2ede0 1px, #f2ede0 3px)' 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/15 pointer-events-none" />
          </div>

          {/* ========================================================= */}
          {/* 5. BOTTOM PAGES (TAIL)                                   */}
          {/* ========================================================= */}
          <div
            className="absolute inset-x-[2px] h-[38px] bg-[#eee8d8] overflow-hidden border-t border-black/10"
            style={{
              bottom: "-19px",
              transform: "rotateX(-90deg)",
              transformOrigin: "center center",
            }}
          >
            <div 
              className="absolute inset-0 opacity-40" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(to right, #d4ccb8 0px, #eee8d8 1px, #eee8d8 3px)' 
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none" />
          </div>

          {/* ========================================================= */}
          {/* 6. BACK COVER (rotateY: 180deg, translateZ: +21px)       */}
          {/* Fully styled with realistic thriller synopsis & barcode   */}
          {/* ========================================================= */}
          <div
            className="absolute inset-0 rounded-l-[3px] overflow-hidden border-y border-l border-white/10 shadow-2xl p-4 flex flex-col justify-between"
            style={{
              transform: "rotateY(180deg) translateZ(21px)",
              backgroundColor: resolvedSpineColor,
              backfaceVisibility: "hidden",
            }}
          >
            {/* Background texture & dark vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-[3px] bg-black/40 z-30 pointer-events-none" />
            <div className="absolute inset-y-0 right-[3px] w-[1px] bg-white/10 z-30 pointer-events-none" />

            {/* Back content */}
            <div className="relative z-10">
              {/* Header quote / tagline */}
              <div className="text-[8px] uppercase tracking-[0.25em] text-amber-400 font-bold mb-2">
                {displaySubtitle || "THRILLER PSICOLÓGICO"}
              </div>
              <h4 className="text-[11px] sm:text-xs font-bold text-white font-serif tracking-tight leading-snug line-clamp-2 mb-2">
                «{displayTitle}»
              </h4>
              
              {/* Synopsis excerpt */}
              <p className="text-[7.5px] sm:text-[8px] text-neutral-300 leading-relaxed line-clamp-6 font-serif opacity-90 text-justify">
                {displaySynopsis || "Una trama vertiginosa donde la obsesión, la verdad fragmentada y el suspense psicológico mantienen al lector al límite."}
              </p>
            </div>

            {/* Bottom: Realistic Barcode */}
            <div className="relative z-10 pt-2 border-t border-white/15 flex items-end justify-between">
              {/* Barcode representation */}
              <div className="bg-white px-2 py-1 rounded-[2px] shadow-sm flex flex-col items-center">
                <div className="flex items-center gap-[1.5px] h-6">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="text-[5.5px] font-mono font-bold text-black tracking-tighter mt-0.5">
                  978-84-666-7123-9
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Shelf Shadow that shifts with 3D rotation */}
        <div 
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] h-8 bg-black/95 blur-2xl rounded-full opacity-60 pointer-events-none transition-transform duration-300"
          style={{
            transform: `translateX(-50%) scaleX(${0.9 + Math.abs(Math.cos((rotY * Math.PI) / 180)) * 0.25})`,
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 360° INTERACTIVE CONTROL DOCK                             */}
      {/* Allows rotating 360°, continuous play, reset, flip view  */}
      {/* ========================================================= */}
      <div className="mt-3 flex items-center gap-2 bg-[#0d1424]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg text-xs z-30">
        {/* Full 360 spin button */}
        <button
          type="button"
          onClick={spinFull360}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white text-white hover:text-black font-bold tracking-wider text-[10px] uppercase transition-all"
          title={language === "es" ? "Giro completo 360°" : "Full 360° spin"}
        >
          <RotateCw size={12} className="animate-spin-slow" />
          <span>360°</span>
        </button>

        {/* Auto-rotation play/pause toggle */}
        <button
          type="button"
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`p-1.5 rounded-full transition-colors ${isAutoRotate ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
          title={isAutoRotate ? (language === "es" ? "Pausar giro automático" : "Pause auto-spin") : (language === "es" ? "Giro automático continuo" : "Continuous auto-spin")}
        >
          {isAutoRotate ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* Front / Back flip view */}
        <button
          type="button"
          onClick={toggleBackView}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-medium"
          title={language === "es" ? "Ver contraportada / frontal" : "View back / front cover"}
        >
          <Eye size={12} />
          <span className="hidden sm:inline">
            {((((rotY % 360) + 360) % 360) > 90 && (((rotY % 360) + 360) % 360) < 270) 
              ? (language === "es" ? "Frontal" : "Front") 
              : (language === "es" ? "Reverso" : "Back")}
          </span>
        </button>

        {/* Reset view angle button */}
        <button
          type="button"
          onClick={resetView}
          className="p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
          title={language === "es" ? "Restablecer ángulo" : "Reset angle"}
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Subtle drag hint */}
      <span className="text-[9px] text-neutral-500 tracking-wider mt-1.5 uppercase font-mono">
        {language === "es" ? "⇄ Arrastra para girar en 360°" : "⇄ Drag to rotate 360°"}
      </span>
    </div>
  );
};
