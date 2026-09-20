import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";

export interface VisitRecord {
  id: string;
  visitorId: string;
  timestamp: Timestamp | null;
  language: string;
  device: string;
  browser?: string;
  os?: string;
  referrer?: string;
  path?: string;
}

// Helper to get or generate anonymous persistent visitor identifier
function getOrCreateVisitorId(): string {
  try {
    const storageKey = "miguel_author_vid";
    let vid = localStorage.getItem(storageKey);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(storageKey, vid);
    }
    return vid;
  } catch {
    return "v_anon_" + Math.random().toString(36).substring(2, 8);
  }
}

// Detect client device category
function detectDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);
  
  if (isTablet || (window.innerWidth >= 768 && window.innerWidth <= 1024 && 'ontouchstart' in window)) {
    return "tablet";
  }
  if (isMobile || window.innerWidth < 768) {
    return "mobile";
  }
  return "desktop";
}

// Detect user browser
function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Google Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("OPR/") || ua.includes("Opera/")) return "Opera";
  return "Otro navegador";
}

// Detect operating system
function detectOS(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Desconocido";
}

// Detect clean referrer
function detectReferrer(): string {
  if (!document.referrer) return "Directo";
  try {
    const url = new URL(document.referrer);
    if (url.hostname === window.location.hostname) return "Navegación interna";
    if (url.hostname.includes("google")) return "Google";
    if (url.hostname.includes("instagram")) return "Instagram";
    if (url.hostname.includes("twitter") || url.hostname.includes("t.co") || url.hostname.includes("x.com")) return "X / Twitter";
    if (url.hostname.includes("facebook")) return "Facebook";
    if (url.hostname.includes("tiktok")) return "TikTok";
    if (url.hostname.includes("linkedin")) return "LinkedIn";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Directo";
  }
}

/**
 * Records a page visit in Firestore anonymously.
 * Throttles visits within the same browser session (e.g. 15 minutes) to prevent accidental duplicate counts on re-renders.
 */
export async function recordVisit(currentLang: "es" | "en"): Promise<void> {
  try {
    const sessionKey = "miguel_visit_logged_time";
    const lastLogged = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    // Only log if no visit recorded in this tab/session in the last 15 minutes
    if (lastLogged && now - parseInt(lastLogged, 10) < 15 * 60 * 1000) {
      return;
    }

    sessionStorage.setItem(sessionKey, now.toString());

    const visitorId = getOrCreateVisitorId();
    const device = detectDevice();
    const browser = detectBrowser();
    const os = detectOS();
    const referrer = detectReferrer();
    const path = window.location.pathname || "/";

    await addDoc(collection(db, "visits"), {
      visitorId,
      language: currentLang,
      device,
      browser,
      os,
      referrer,
      path: path.slice(0, 100),
      timestamp: serverTimestamp()
    });
  } catch (err) {
    // Fail silently so visitors never experience errors
    console.debug("Visit logging notice:", err);
  }
}

/**
 * Subscribes to recent visits in Firestore.
 * Requires admin authorization (miguemora100@gmail.com).
 */
export function subscribeToVisits(
  onUpdate: (visits: VisitRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  try {
    const q = query(
      collection(db, "visits"),
      orderBy("timestamp", "desc"),
      limit(250)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: VisitRecord[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            visitorId: data.visitorId || "anon",
            timestamp: data.timestamp || null,
            language: data.language || "es",
            device: data.device || "desktop",
            browser: data.browser,
            os: data.os,
            referrer: data.referrer,
            path: data.path
          });
        });
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}
