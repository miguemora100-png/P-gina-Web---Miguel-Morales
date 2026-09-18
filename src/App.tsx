/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ChangeEvent, Component, ErrorInfo, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Instagram, BookOpen, Star, Menu, X, Globe, Linkedin, Facebook, Music2, Send, Play, Twitter, ChevronDown, LogIn, LogOut, Camera, Quote, ChevronLeft, ChevronRight, Pause, Sparkles, ExternalLink, ArrowRight, Newspaper, Calendar, MapPin } from "lucide-react";
import { db, auth } from "./firebase";
import { doc, onSnapshot, setDoc, serverTimestamp, getDocFromServer, collection } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { Book3DMockup } from "./components/Book3DMockup";
import { InterviewModal } from "./components/InterviewModal";
import { BlogReviewModal } from "./components/BlogReviewModal";
import { EventModal } from "./components/EventModal";

// --- Firebase Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<any, any> {
  props: any;
  state = { hasError: false, errorInfo: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
          <p className="text-neutral-400 mb-6">Ha ocurrido un error inesperado en la aplicación.</p>
          <pre className="bg-neutral-900 p-4 rounded-xl text-xs overflow-auto max-w-full text-red-400">
            {this.state.errorInfo}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-white text-black rounded-full font-bold"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Subtle atmospheric particle dust for cinematic motion in Hero
const HeroAtmosphereParticles: React.FC = () => {
  const particles = [
    { left: "8%", delay: 0, duration: 16, size: 2.5, opacity: 0.4 },
    { left: "16%", delay: 3, duration: 20, size: 2, opacity: 0.35 },
    { left: "25%", delay: 7, duration: 15, size: 3.5, opacity: 0.25 },
    { left: "34%", delay: 1.5, duration: 18, size: 2, opacity: 0.45 },
    { left: "43%", delay: 5, duration: 22, size: 3, opacity: 0.3 },
    { left: "52%", delay: 8, duration: 17, size: 2.5, opacity: 0.4 },
    { left: "61%", delay: 2, duration: 19, size: 3.5, opacity: 0.2 },
    { left: "70%", delay: 6, duration: 16, size: 2, opacity: 0.45 },
    { left: "79%", delay: 4, duration: 21, size: 3, opacity: 0.35 },
    { left: "88%", delay: 9, duration: 15, size: 2.5, opacity: 0.4 },
    { left: "94%", delay: 2.5, duration: 23, size: 2, opacity: 0.3 },
    { left: "12%", delay: 11, duration: 18, size: 3, opacity: 0.25 },
    { left: "38%", delay: 10, duration: 17, size: 2, opacity: 0.35 },
    { left: "67%", delay: 13, duration: 20, size: 2.5, opacity: 0.3 },
    { left: "84%", delay: 12, duration: 19, size: 2, opacity: 0.35 }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3]">
      {particles.map((p, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
          style={{
            left: p.left,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: ["0vh", "-110vh"],
            x: [0, (idx % 2 === 0 ? 25 : -25), 0],
            opacity: [0, p.opacity, p.opacity * 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedSynopsis, setSelectedSynopsis] = useState<{ title: string; subtitle?: string; content: string; amazonLink?: string } | null>(null);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [isBlogReviewOpen, setIsBlogReviewOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [bookFilter, setBookFilter] = useState<"all" | "new" | "soon">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [authorPhoto, setAuthorPhoto] = useState<string | null>("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400");
  const [publisherSeal, setPublisherSeal] = useState<string | null>(null);
  const [bookData, setBookData] = useState<Record<string, { coverUrl?: string; spineColor?: string; coverUrlEn?: string; spineColorEn?: string }>>({});

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener for Author Photo
  useEffect(() => {
    if (!isAuthReady) return;

    const path = "author/profile";
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAuthorPhoto(data.photoUrl);
        setPublisherSeal(data.publisherSealUrl);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Firestore Listener for Book Covers
  useEffect(() => {
    if (!isAuthReady) return;

    const path = "books";
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const data: Record<string, { coverUrl?: string; spineColor?: string; coverUrlEn?: string; spineColorEn?: string }> = {};
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data[doc.id] = {
          coverUrl: docData.coverUrl,
          spineColor: docData.spineColor,
          coverUrlEn: docData.coverUrlEn,
          spineColorEn: docData.spineColorEn
        };
      });
      setBookData(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const compressImage = (base64: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.floor((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        const base64 = await compressImage(originalBase64, 400, 0.8);
        
        // Optimistic update
        setAuthorPhoto(base64);

        const path = "author/profile";
        try {
          await setDoc(doc(db, path), {
            photoUrl: base64,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublisherSealUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        const base64 = await compressImage(originalBase64, 300, 0.8);
        
        // Optimistic update
        setPublisherSeal(base64);

        const path = "author/profile";
        try {
          await setDoc(doc(db, path), {
            publisherSealUrl: base64,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const extractDominantColor = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#171717"); // Fallback to neutral-900
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Sample a few points on the left edge (spine side)
        const samples = [
          ctx.getImageData(0, 0, 1, 1).data,
          ctx.getImageData(0, Math.floor(img.height / 2), 1, 1).data,
          ctx.getImageData(0, img.height - 1, 1, 1).data
        ];
        
        let r = 0, g = 0, b = 0;
        samples.forEach(s => {
          r += s[0];
          g += s[1];
          b += s[2];
        });
        
        r = Math.floor(r / samples.length);
        g = Math.floor(g / samples.length);
        b = Math.floor(b / samples.length);
        
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        resolve(hex);
      };
      img.onerror = () => resolve("#171717");
      img.src = base64;
    });
  };

  const handleBookCoverUpload = async (e: ChangeEvent<HTMLInputElement>, bookId: string, isEn: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        const base64 = await compressImage(originalBase64, 600, 0.7);
        const dominantColor = await extractDominantColor(base64);
        
        // Optimistic update
        setBookData(prev => ({ 
          ...prev, 
          [bookId]: { 
            ...prev[bookId],
            [isEn ? 'coverUrlEn' : 'coverUrl']: base64, 
            [isEn ? 'spineColorEn' : 'spineColor']: dominantColor 
          } 
        }));

        const path = `books/${bookId}`;
        try {
          await setDoc(doc(db, "books", bookId), {
            [isEn ? 'coverUrlEn' : 'coverUrl']: base64,
            [isEn ? 'spineColorEn' : 'spineColor']: dominantColor,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdmin = user?.email === "miguemora100@gmail.com";

  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);

  const t = {
    es: {
      nav: ["Inicio", "Libros", "Autor", "Trailers", "Prensa", "Reseñas", "Contacto"],
      ids: ["inicio", "libros", "autor", "trailers", "prensa", "resenas", "contacto"],
      label: "BIENVENIDOS, QUERIDOS LECTORES",
      heroTitle1: "Miguel Morales",
      heroTitle2: "Moshiashvili",
      heroText:
        "Escritor de thriller psicológico. Una voz que explora los límites de la mente, la memoria y la identidad a través del suspense.",
      cta1: "Descubrir libros",
      cta2: "Sobre el autor",
      cta3: "Contacto",
      featured: "Novedad",
      featuredText:
        "Una novela de identidad, obsesión y memoria, construida con una atmósfera envolvente y una tensión que no da tregua.",
      booksEyebrow: "Libros",
      booksTitle: "",
      booksText: "",
      synopsis: "Leer sinopsis",
      aboutEyebrow: "Sobre el autor",
      aboutTitle: "",
      aboutText1:
        "Miguel Morales Moshiashvili es escritor de thriller psicológico. Su fascinación por los mecanismos ocultos de la memoria, la identidad y la percepción de la realidad influye profundamente en sus historias.",
      aboutText2:
        "En sus novelas, la mente humana se convierte en un territorio lleno de sombras, donde los recuerdos pueden engañar, la verdad se fragmenta y cada secreto puede cambiarlo todo. A través de tramas intensas y atmósferas inquietantes, sus libros exploran los límites entre la realidad y la percepción, invitando al lector a adentrarse en historias donde nada es exactamente lo que parece.",
      aboutText3:
        "Cuando no está investigando los misterios del cerebro o escribiendo nuevas historias, Miguel se dedica a explorar la literatura, la psicología y las fuerzas invisibles que impulsan el comportamiento humano. Sus novelas buscan no solo entretener, sino también provocar una pregunta inquietante en el lector: ¿Qué ocurre cuando la mente deja de distinguir entre la verdad y la ilusión?",
      trailersEyebrow: "Booktrailers",
      trailersTitle: "",
      pressEyebrow: "Prensa y actualidad",
      pressTitle: "",
      pressCards: [
        "Entrevista exclusiva en 'Letras de Misterio': «Lo más peligroso es no saber cuántos pasos lleva el otro de ventaja».",
        "Reseña destacada en el blog: «El efecto Strauss» de @miguel_m.moshiashvili (5/5 ⭐).",
        "15.ª Primavera del Libro (9, 10 y 11 de octubre de 2026): Centro Cultural Estación Mapocho, Santiago de Chile. Organiza: Editoriales de Chile.",
      ],
      reviewsEyebrow: "Reseñas",
      reviewsTitle: "",
      contactEyebrow: "Contacto",
      contactTitle: "Hablemos.",
      contactText: "Puedes escribirme directamente a miguemora100@gmail.com o utilizar el formulario.",
      name: "Nombre",
      email: "Email",
      message: "Mensaje",
      send: "Enviar mensaje",
      footer: "Thriller psicológico · Novelas · Web oficial",
      newsletterTitle: "Newsletter",
      newsletterText: "Suscríbete para recibir noticias sobre nuevos lanzamientos y eventos exclusivos.",
      newsletterPlaceholder: "Tu email",
      newsletterButton: "Suscribirse",
      newsletterSuccess: "¡Gracias por suscribirte! Pronto recibirás novedades.",
      shareLabel: "Compartir:",
      filterAll: "Todos",
      filterNew: "Novedades",
      filterSoon: "Próximamente",
      privacyPolicy: "Política de Privacidad",
      sitemap: "Mapa del Sitio",
      followMe: "Sígueme en redes",
    },
    en: {
      nav: ["Home", "Books", "Author", "Trailers", "Press", "Reviews", "Contact"],
      ids: ["inicio", "libros", "autor", "trailers", "prensa", "resenas", "contacto"],
      label: "WELCOME, DEAR READERS",
      heroTitle1: "Miguel Morales",
      heroTitle2: "Moshiashvili",
      heroText:
        "Psychological thriller writer. A voice exploring the limits of the mind, memory, and identity through suspense.",
      cta1: "Discover books",
      cta2: "About the author",
      cta3: "Contact",
      featured: "New Release",
      featuredText:
        "A novel of identity, obsession and memory, built with an immersive atmosphere and relentless tension.",
      booksEyebrow: "Books",
      booksTitle: "",
      booksText: "",
      synopsis: "Read synopsis",
      aboutEyebrow: "About the author",
      aboutTitle: "",
      aboutText1:
        "Miguel Morales Moshiashvili is a psychological thriller writer. His fascination with the hidden mechanisms of memory, identity, and the perception of reality deeply influences his stories.",
      aboutText2:
        "In his novels, the human mind becomes a territory full of shadows, where memories can deceive, truth is fragmented, and every secret can change everything. Through intense plots and unsettling atmospheres, his books explore the boundaries between reality and perception, inviting the reader to enter stories where nothing is exactly what it seems.",
      aboutText3:
        "When he is not investigating the mysteries of the brain or writing new stories, Miguel is dedicated to exploring literature, psychology, and the invisible forces that drive human behavior. His novels seek not only to entertain but also to provoke a disturbing question in the reader: What happens when the mind stops distinguishing between truth and illusion?",
      trailersEyebrow: "Booktrailers",
      trailersTitle: "",
      pressEyebrow: "Press & updates",
      pressTitle: "",
      pressCards: [
        "Exclusive interview in 'Mystery Letters': «The most dangerous thing is not knowing how many steps ahead the other person is».",
        "Featured blog review: «The Strauss Effect» by @miguel_m.moshiashvili (5/5 ⭐).",
        "15th Primavera del Libro (October 9, 10 & 11, 2026): Centro Cultural Estación Mapocho, Santiago, Chile. Organized by: Editoriales de Chile.",
      ],
      reviewsEyebrow: "Reviews",
      reviewsTitle: "",
      contactEyebrow: "Contact",
      contactTitle: "Let’s talk.",
      contactText: "You can write to me directly at miguemora100@gmail.com or use the form below.",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      footer: "Psychological thriller · Novels · Official website",
      newsletterTitle: "Newsletter",
      newsletterText: "Subscribe to receive news about new releases and exclusive events.",
      newsletterPlaceholder: "Your email",
      newsletterButton: "Subscribe",
      newsletterSuccess: "Thank you for subscribing! You will receive updates soon.",
      shareLabel: "Share:",
      filterAll: "All",
      filterNew: "New",
      filterSoon: "Coming Soon",
      privacyPolicy: "Privacy Policy",
      sitemap: "Sitemap",
      followMe: "Follow me",
    },
  };

  const books = [
    {
      id: "el-senuelo",
      title: "El Señuelo",
      titleEn: "The Decoy",
      subtitle: "Un thriller psicológico inquietante",
      subtitleEn: "An unsettling psychological thriller",
      description:
        "Una historia de secretos, manipulación y verdad fragmentada, donde cada página empuja al lector a dudar de todo.",
      descriptionEn:
        "A story of secrets, manipulation and fractured truth, where every page pushes the reader to doubt everything.",
      synopsis: "Clara sabía que toda fantasía tiene un precio. Pero nunca imaginó que el suyo sería un cadáver en la alfombra y una botella de vino envenenada. De la noche a la mañana, la escort de lujo más cotizada de la ciudad se convierte en la presa más buscada. Su única esperanza es Luis: un policía que ha perdido su placa, su familia y sus ganas de vivir. Juntos, deberán desentrañar una red de mentiras que nace en los despachos del poder y termina en los pasillos de una clínica psiquiátrica. Una red donde el verdadero asesino no usa armas, sino que manipula las heridas del pasado. En este juego de espejos, nadie es inocente. Y la verdad... la verdad es el señuelo más peligroso de todos. ¿Hasta dónde llegarías para dejar de huir?",
      synopsisEn: "Clara Stein wakes up covered in blood. Beside her lies the lifeless body of Andrés Artiaga—the charismatic heir to one of the most powerful and influential families in the city. She remembers nothing. No memory of the night. No memory of the murder. Yet every piece of evidence points directly at her. Within hours, the police begin to close in, and the powerful Artiaga family starts pulling strings behind the scenes, determined to control the narrative and protect their legacy. Suddenly, Clara finds herself trapped inside a dangerous web of suspicion, power, and deception. With no one she can trust, she has only one choice left: run. But escaping is only the beginning. As Clara retraces the final hours before Andrés’s death, she uncovers a world hidden beneath the city’s polished surface—a world of secrets, manipulation, jealousy, forbidden relationships, and dark business deals where loyalty is fragile and betrayal is never far away. Someone knew about their secret affair. Someone had a reason to want Andrés dead. And someone is making sure the blame falls squarely on her. What begins as a desperate search for the truth quickly turns into a tense psychological thriller where every discovery leads deeper into danger and every answer raises new questions. Because in a world ruled by power, lies, and hidden motives, nothing is ever as it seems. And the most dangerous secret of all… may be the truth about what really happened that night.",
      cta: "Comprar en Amazon",
      ctaEn: "Buy on Amazon",
      note: "Disponible en Kindle y tapa blanda",
      noteEn: "Available in Kindle and paperback",
      link: "https://www.amazon.com/dp/B0GR1DZ5JC",
      linkEn: "https://www.amazon.com/dp/B0GSCGFBS8?dplnkId=f65997f5-f5e3-42ad-bc43-bc96204486b1&nodl=1",
      image: "/el_senuelo_mockup.png",
      imageEn: "/el_senuelo_mockup.png",
      status: "new"
    },
    {
      id: "el-efecto-strauss",
      title: "El Efecto Strauss",
      titleEn: "The Strauss Effect",
      subtitle: "Oscuro. Elegante. Adictivo.",
      subtitleEn: "Dark. Elegant. Addictive.",
      description:
        "Una novela de identidad, obsesión y memoria, construida con una atmósfera envolvente y una tensión que no da tregua.",
      descriptionEn:
        "A novel of identity, obsession and memory, built with immersive atmosphere and relentless tension.",
      synopsis: "Un escritor famoso, en la cima de su carrera, interrumpe de pronto su actividad creativa. Durante cinco años no sale de su pluma ni un solo libro nuevo. A pesar de su éxito mundial, nadie ha visto jamás el rostro del popular autor. Sus intereses siempre y en todas partes han sido representados por un agente literario no menos enigmático. Hubo un tiempo en que en los círculos bohemios circulaban rumores de que se trataba de la misma persona. A una colaboradora externa de una gran editorial, devota admiradora del misterioso escritor, se le presenta la oportunidad de averiguar cuán ciertos son esos rumores. Pero para entrar en la casa del autor como asistente personal, la joven, al igual que los demás aspirantes, deberá superar una pequeña prueba: escribir un relato que comience con las palabras: «Deténme, o todo se repetirá».",
      synopsisEn: "A famous writer, at the peak of his career, suddenly interrupts his creative activity. For five years, not a single new book has come from his pen. Despite his worldwide success, no one has ever seen the popular author's face. His interests have always and everywhere been represented by a no less enigmatic literary agent. There was a time when rumors circulated in bohemian circles that they were the same person. An external collaborator of a major publishing house, a devoted admirer of the mysterious writer, is presented with the opportunity to find out how true those rumors are. But to enter the author's house as a personal assistant, the young woman, like the other applicants, must pass a small test: write a story that begins with the words: 'Stop me, or everything will repeat itself'.",
      cta: "Comprar en Amazon",
      ctaEn: "Buy on Amazon",
      note: "Disponible en Kindle y tapa blanda",
      noteEn: "Available in Kindle and paperback",
      link: "https://www.amazon.com/dp/B0H38TPVHL",
      linkEn: "https://www.amazon.com/dp/B0H38TPVHL",
      image: "/el_efecto_strauss_mockup.png",
      imageEn: "/el_efecto_strauss_mockup.png",
      status: "new"
    },
  ];

  const reviews = [
    {
      author: "@ladybooksdreamer",
      role: { es: "Bookstagram · Reseña literaria", en: "Bookstagram · Literary Review" },
      stars: 5,
      es: "Un thriller psicológico que se adentra en la mente humana y sorprende con numerosos giros argumentales. El misterio, los secretos y la tensión convierten la novela en una lectura difícil de abandonar hasta llegar al final.",
      en: "A psychological thriller that delves into the human mind and surprises with numerous plot twists. The mystery, secrets, and tension make the novel a read that is difficult to put down until reaching the end."
    },
    {
      author: "Julietha",
      role: { es: "Lectora · Reseña destacada", en: "Reader · Featured Review" },
      stars: 5,
      es: "Una lectura adictiva, emocionante y tremendamente entretenida, capaz de despertar la misma fascinación que sus primeros thrillers. La necesidad de descubrir qué sucederá y las teorías que plantea la historia la acompañaron hasta el final, convirtiéndola en una de sus mejores lecturas del año.",
      en: "An addictive, thrilling, and tremendously entertaining read, capable of awakening the same fascination as his first thrillers. The need to discover what will happen and the theories raised by the story accompanied her until the end, making it one of her best reads of the year."
    },
    {
      author: "Eva Casal Hortas",
      role: { es: "Lectora y escritora · Valoración", en: "Reader & Writer · Review" },
      stars: 5,
      es: "Una novela maravillosa que la conquistó por completo y que, en su opinión, merece plenamente sus cinco estrellas.",
      en: "A wonderful novel that completely captivated her and, in her opinion, fully deserves its five stars."
    },
    {
      author: "Rocío (@romanticoslibros)",
      role: { es: "Bookstagram · Reseña literaria", en: "Bookstagram · Literary Review" },
      stars: 5,
      es: "Un escalofriante thriller psicológico lleno de misterios, asesinatos y locura. Destaca la obsesión de Catherine por un escritor enigmático y la inquietante relación entre los personajes, cuyas verdaderas intenciones permanecen ocultas hasta el final.",
      en: "A chilling psychological thriller full of mystery, murder, and madness. Highlights include Catherine's obsession with an enigmatic writer and the unsettling relationship between the characters, whose true intentions remain hidden until the end."
    }
  ];

  const bookTrailers = [
    {
      title: "El Señuelo",
      videoUrl: "https://drive.google.com/file/d/1YkKdgBMEkYGrgbTXQsc0G59RCT6Ew8Ho/preview",
      thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1280&h=720"
    },
    {
      title: "El Efecto Strauss",
      videoUrl: "https://www.youtube.com/embed/pS9wBsvAbgI",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1280&h=720"
    }
  ];

  const ui = t[language];

  // Hero carousel slides & motion state (inspired by perezreverte.com dynamic hero banner)
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  const heroSlides = [
    {
      id: "el-efecto-strauss",
      badge: "Best Seller",
      badgeHighlight: true,
      category: language === "es" ? "THRILLER PSICOLÓGICO" : "PSYCHOLOGICAL THRILLER",
      title: language === "es" ? "El Efecto Strauss" : "The Strauss Effect",
      subtitle: language === "es" ? "Oscuro · Elegante · Adictivo" : "Dark · Elegant · Addictive",
      quote: language === "es" ? "«Deténme, o todo se repetirá»" : "«Stop me, or everything will repeat itself»",
      desc: language === "es"
        ? "Un célebre escritor desaparecido en la cumbre de su carrera. Un misterioso concurso para entrar en su mansión. Una verdad oculta en un laberinto de identidad y obsesión."
        : "A celebrated writer vanished at the peak of his career. A secretive test to enter his secluded estate. A truth buried inside a maze of identity and obsession.",
      bgImage: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1920",
      accentGlow: "rgba(217, 119, 6, 0.22)",
      bookId: "el-efecto-strauss",
      amazonUrl: "https://www.amazon.com/dp/B0H38TPVHL",
      trailerUrl: "https://www.youtube.com/embed/pS9wBsvAbgI",
      isBook: true,
    },
    {
      id: "el-senuelo",
      badge: language === "es" ? "Novedad 2025" : "New Release 2025",
      badgeHighlight: true,
      category: language === "es" ? "THRILLER PSICOLÓGICO" : "PSYCHOLOGICAL THRILLER",
      title: language === "es" ? "El Señuelo" : "The Decoy",
      subtitle: language === "es" ? "Un thriller psicológico inquietante" : "An unsettling psychological thriller",
      quote: language === "es" ? "«En este juego de espejos, nadie es inocente»" : "«In this game of mirrors, no one is innocent»",
      desc: language === "es"
        ? "Un cadáver en la alfombra, una acusada sin recuerdos de esa noche y un expolicía al límite. Una red de engaños que nace en los despachos del poder."
        : "A body on the rug, an accused woman with no memories, and a disgraced detective. A tangled web of deception reaching high corridors of power.",
      bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1920",
      accentGlow: "rgba(14, 165, 233, 0.22)",
      bookId: "el-senuelo",
      amazonUrl: language === "es" ? "https://www.amazon.com/dp/B0GR1DZ5JC" : "https://www.amazon.com/dp/B0GSCGFBS8?dplnkId=f65997f5-f5e3-42ad-bc43-bc96204486b1&nodl=1",
      trailerUrl: "https://drive.google.com/file/d/1YkKdgBMEkYGrgbTXQsc0G59RCT6Ew8Ho/preview",
      isBook: true,
    },
    {
      id: "autor",
      badge: language === "es" ? "Sobre el Autor" : "About the Author",
      badgeHighlight: false,
      category: language === "es" ? "THRILLER PSICOLÓGICO" : "PSYCHOLOGICAL THRILLER",
      title: "Miguel Morales",
      titleSpan: "Moshiashvili",
      subtitle: language === "es" ? "Explorando los límites de la mente y la memoria" : "Exploring the boundaries of the mind and memory",
      quote: language === "es" ? "«¿Qué ocurre cuando la mente deja de distinguir entre la verdad y la ilusión?»" : "«What happens when the mind ceases to distinguish between truth and illusion?»",
      desc: language === "es"
        ? "Escritor de thriller psicológico. Su fascinación por los mecanismos ocultos de la memoria y la identidad forja novelas de suspense con una profundidad psicológica única."
        : "Psychological thriller writer. His fascination with the hidden mechanisms of memory and identity crafts suspense novels with singular psychological depth.",
      bgImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920",
      accentGlow: "rgba(168, 85, 247, 0.22)",
      isAuthor: true,
    }
  ];

  useEffect(() => {
    if (isHeroPaused) return;
    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setHeroSlide((curr) => (curr + 1) % heroSlides.length);
          return 0;
        }
        return prev + 100 / 70; // 7 seconds total
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroSlides.length]);

  const goToSlide = (idx: number) => {
    setHeroSlide(idx);
    setSlideProgress(0);
  };

  const prevSlide = () => {
    setHeroSlide((curr) => (curr - 1 + heroSlides.length) % heroSlides.length);
    setSlideProgress(0);
  };

  const nextSlide = () => {
    setHeroSlide((curr) => (curr + 1) % heroSlides.length);
    setSlideProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#0c1017] text-neutral-100 font-sans selection:bg-amber-400 selection:text-black scroll-smooth">
      {/* Page Reveal Overlay */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        onAnimationComplete={() => document.body.style.overflow = "auto"}
        className="fixed inset-0 z-[100] bg-[#0c1017] pointer-events-none"
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c1017]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4" 
          >
            <div className="group relative h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-neutral-800 cursor-pointer">
              <img 
                src={authorPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400"} 
                alt="Miguel Morales" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isAdmin && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={12} className="text-white" />
                  <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                </label>
              )}
            </div>
            <div className="flex flex-col text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-white font-serif whitespace-nowrap">
              <span className="leading-none">Miguel Morales</span>
              <span className="leading-none font-light opacity-70 mt-1">Moshiashvili</span>
            </div>
          </motion.div>

            <div className="flex items-center gap-4 md:gap-8">
              <nav className="hidden md:flex gap-8 text-sm text-neutral-400 font-medium">
                {ui.nav.map((item, index) => (
                  <a 
                    key={item} 
                    href={`#${ui.ids[index]}`} 
                    className="hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                ))}
              </nav>
              
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Admin
                  </div>
                )}
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                    title={language === "es" ? "Cerrar sesión" : "Logout"}
                  >
                    <LogOut size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                    title={language === "es" ? "Iniciar sesión" : "Login"}
                  >
                    <LogIn size={18} />
                  </button>
                )}
                
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-[10px] font-bold">
                  <button
                    onClick={() => setLanguage("es")}
                    className={`rounded-full px-2.5 py-1 transition-all duration-300 ${language === "es" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`rounded-full px-2.5 py-1 transition-all duration-300 ${language === "en" ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white"}`}
                  >
                    EN
                  </button>
                </div>
              </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-neutral-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/10 bg-neutral-950 px-6 py-8 space-y-6"
          >
            {ui.nav.map((item, index) => (
              <a 
                key={item} 
                href={`#${ui.ids[index]}`} 
                onClick={() => setIsMenuOpen(false)}
                className="block text-xl font-medium text-neutral-300 hover:text-white"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </header>

      {/* Hero Section with Cinematic Motion & Dynamic Carousel (inspired by perezreverte.com) */}
      <section 
        id="inicio" 
        className="relative overflow-hidden border-b border-white/10 pt-10 pb-12 md:pt-16 md:pb-20 select-none min-h-[660px] md:min-h-[720px] flex flex-col justify-between"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Cinematic Motion Background with Ken-Burns pan/zoom & Atmospheric overlays */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={heroSlides[heroSlide].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          >
            {/* Ken Burns moving photo */}
            <motion.img 
              src={heroSlides[heroSlide].bgImage} 
              alt="Cinematic Background"
              initial={{ scale: 1, x: 0 }}
              animate={{ 
                scale: [1, 1.09, 1],
                x: [0, -22, 0]
              }}
              transition={{ 
                duration: 26, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="h-full w-full object-cover opacity-25 grayscale-[20%] brightness-[0.7]"
              referrerPolicy="no-referrer"
            />

            {/* Depth Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.85)_100%)]" />
            
            {/* Dynamic Accent Ambient Spotlight */}
            <div 
              className="absolute inset-0 transition-all duration-1000" 
              style={{ background: `radial-gradient(ellipse at 70% 35%, ${heroSlides[heroSlide].accentGlow}, transparent 65%)` }} 
            />
            
            {/* Subtle moving fog texture */}
            <motion.div 
              animate={{ 
                x: [-30, 30, -30],
                opacity: [0.08, 0.16, 0.08]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fog.png')] opacity-10 pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Atmospheric Dust / Floating Particles */}
        <HeroAtmosphereParticles />

        {/* Side Floating Carousel Navigation Controls (Desktop) */}
        <div className="hidden lg:flex absolute inset-y-0 left-4 z-40 items-center pointer-events-none">
          <button
            onClick={prevSlide}
            aria-label="Anterior"
            className="pointer-events-auto h-12 w-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all transform hover:-translate-x-1 shadow-xl"
          >
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="hidden lg:flex absolute inset-y-0 right-4 z-40 items-center pointer-events-none">
          <button
            onClick={nextSlide}
            aria-label="Siguiente"
            className="pointer-events-auto h-12 w-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all transform hover:translate-x-1 shadow-xl"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Slide Content */}
        <div className="mx-auto w-full max-w-7xl px-6 relative z-10 flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={heroSlides[heroSlide].id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="grid gap-10 md:gap-16 lg:grid-cols-12 items-center"
            >
              {/* Left Column: Text & CTAs */}
              <div className="lg:col-span-7 space-y-6">
                {/* Badge & Category */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border ${
                    heroSlides[heroSlide].badgeHighlight
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      : "bg-white/10 border-white/20 text-neutral-300"
                  }`}>
                    <Sparkles size={11} className={heroSlides[heroSlide].badgeHighlight ? "text-amber-400" : "text-neutral-400"} />
                    {heroSlides[heroSlide].badge}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
                    {heroSlides[heroSlide].category}
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight text-white leading-[1.05]">
                  {heroSlides[heroSlide].title}
                  {heroSlides[heroSlide].titleSpan && (
                    <span className="block text-neutral-400 font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-1">
                      {heroSlides[heroSlide].titleSpan}
                    </span>
                  )}
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl font-serif italic text-amber-200/90 font-medium">
                  {heroSlides[heroSlide].subtitle}
                </p>

                {/* Quote */}
                <blockquote className="border-l-2 border-amber-500/60 pl-4 py-1 text-base md:text-lg text-neutral-300 italic font-serif leading-relaxed bg-white/[0.02] rounded-r-lg max-w-xl">
                  {heroSlides[heroSlide].quote}
                </blockquote>

                {/* Synopsis / Description */}
                <p className="max-w-xl text-sm md:text-base leading-relaxed text-neutral-400">
                  {heroSlides[heroSlide].desc}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {heroSlides[heroSlide].isBook ? (
                    <>
                      {heroSlides[heroSlide].amazonUrl && (
                        <a 
                          href={heroSlides[heroSlide].amazonUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-xs sm:text-sm font-bold text-neutral-950 shadow-xl shadow-white/10 transition hover:scale-105 hover:bg-neutral-100"
                        >
                          <BookOpen size={16} />
                          {language === "es" ? "Comprar en Amazon" : "Buy on Amazon"}
                          <ExternalLink size={12} className="opacity-60" />
                        </a>
                      )}
                      {heroSlides[heroSlide].trailerUrl && (
                        <button
                          onClick={() => setSelectedTrailer(heroSlides[heroSlide].trailerUrl!)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-white/15 hover:border-white/40 hover:scale-105"
                        >
                          <Play size={14} className="fill-white" />
                          {language === "es" ? "Ver booktrailer" : "Watch booktrailer"}
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          const currentBook = books.find(b => b.id === heroSlides[heroSlide].bookId);
                          if (currentBook) {
                            setSelectedSynopsis({
                              title: language === "es" ? currentBook.title : (currentBook.titleEn || currentBook.title),
                              subtitle: language === "es" ? currentBook.subtitle : (currentBook.subtitleEn || currentBook.subtitle),
                              content: language === "es" ? (currentBook.synopsis || "") : (currentBook.synopsisEn || currentBook.synopsis || ""),
                              amazonLink: language === "es" ? currentBook.link : (currentBook.linkEn || currentBook.link)
                            });
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-5 py-3.5 text-xs sm:text-sm font-semibold text-neutral-200 transition hover:text-white hover:bg-white/15 hover:border-white/40 hover:scale-105 cursor-pointer shadow-lg"
                      >
                        <BookOpen size={15} className="text-amber-400" />
                        {language === "es" ? "Sinopsis completa" : "Full synopsis"}
                        <ArrowRight size={13} className="opacity-60" />
                      </button>
                    </>
                  ) : (
                    <>
                      <a 
                        href="#libros" 
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-xs sm:text-sm font-bold text-neutral-950 shadow-xl shadow-white/10 transition hover:scale-105 hover:bg-neutral-100"
                      >
                        <BookOpen size={16} />
                        {ui.cta1}
                      </a>
                      <a 
                        href="#autor" 
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-white/15 hover:scale-105"
                      >
                        {ui.cta2}
                      </a>
                      <a 
                        href="#contacto" 
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 text-xs sm:text-sm font-medium text-neutral-300 transition hover:text-white hover:bg-white/5"
                      >
                        {ui.cta3}
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: 3D Book Mockup or Author Portrait */}
              <div className="lg:col-span-5 flex justify-center py-6">
                {heroSlides[heroSlide].isBook ? (() => {
                  const bookId = heroSlides[heroSlide].bookId!;
                  const currentBook = books.find(b => b.id === bookId) || books[1];
                  const heroCoverUrl = language === "es" 
                    ? (bookData[bookId]?.coverUrl || currentBook.image) 
                    : (bookData[bookId]?.coverUrlEn || currentBook.imageEn || currentBook.image);
                  const heroSpineColor = language === "es" 
                    ? bookData[bookId]?.spineColor 
                    : bookData[bookId]?.spineColorEn;

                  return (
                    <div className="w-full max-w-[270px] sm:max-w-[300px] flex justify-center">
                      <Book3DMockup
                        id={bookId}
                        title={currentBook.title}
                        titleEn={currentBook.titleEn}
                        subtitle={currentBook.subtitle}
                        subtitleEn={currentBook.subtitleEn}
                        synopsis={currentBook.synopsis}
                        synopsisEn={currentBook.synopsisEn}
                        coverUrl={heroCoverUrl}
                        spineColor={heroSpineColor}
                        language={language}
                        isAdmin={isAdmin}
                        onCoverUpload={(e, isEn) => handleBookCoverUpload(e, bookId, isEn)}
                        isHero={true}
                      />
                    </div>
                  );
                })() : (
                  /* Author Portrait Presentation */
                  <div className="relative group/hero-author w-full max-w-[280px] sm:max-w-[320px]">
                    <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)]">
                      <img 
                        src={authorPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400"} 
                        alt="Miguel Morales Moshiashvili"
                        className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover/hero-author:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                      
                      {isAdmin && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/hero-author:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm z-30">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                              <Camera size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-white">Cambiar foto</span>
                          </div>
                          <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                        </label>
                      )}

                      <div className="absolute bottom-0 inset-x-0 p-5 z-20">
                        <div className="text-lg font-serif font-bold text-white leading-tight">
                          Miguel Morales Moshiashvili
                        </div>
                        <div className="text-xs text-amber-300/90 font-medium mt-1">
                          {language === "es" ? "Escritor de thriller psicológico" : "Psychological thriller writer"}
                        </div>
                      </div>
                    </div>
                    {/* Shadow */}
                    <div className="absolute -bottom-6 left-6 right-6 h-8 bg-black/85 blur-3xl rounded-full opacity-60" />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Cintillo continuo en movimiento - Novela en curso (Continuous Marquee Ticker) */}
      <div className="relative z-30 border-y border-amber-500/30 bg-[#0e1422] py-4 overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Soft edge fade masks for seamless entering/exiting */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-36 bg-gradient-to-r from-[#0c1017] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-36 bg-gradient-to-l from-[#0c1017] to-transparent z-10 pointer-events-none" />
        
        {/* Amber cinematic undertone */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-900/10 to-amber-500/5 pointer-events-none" />

        <motion.div
          className="flex w-max items-center whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 34,
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 md:gap-12 pr-8 md:pr-12 text-xs md:text-sm tracking-[0.25em] font-serif uppercase">
              <span className="inline-flex items-center gap-2.5 font-bold text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <Sparkles size={14} className="text-amber-400" />
                {language === "es" ? "PRÓXIMAMENTE: NUEVA NOVELA EN CURSO" : "COMING SOON: NEW NOVEL IN PROGRESS"}
              </span>
              <span className="text-amber-500/40 font-sans text-xs">✦</span>
              <span className="text-slate-200 font-medium tracking-[0.3em]">
                {language === "es" ? "THRILLER PSICOLÓGICO · EN FASE DE CREACIÓN" : "PSYCHOLOGICAL THRILLER · IN PROGRESS"}
              </span>
              <span className="text-amber-500/40 font-sans text-xs">✦</span>
              <span className="text-slate-400 tracking-[0.25em]">
                MIGUEL MORALES MOSHIASHVILI
              </span>
              <span className="text-amber-500/40 font-sans text-xs">✦</span>
              <span className="text-amber-200/90 italic font-serif tracking-[0.15em] lowercase first-letter:uppercase">
                {language === "es" ? "«Donde los recuerdos se quiebran, comienza el juego»" : "«Where memories shatter, the game begins»"}
              </span>
              <span className="text-amber-500/40 font-sans text-xs">✦</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Secciones inferiores con fondos atmosféricos distintivos de thriller psicológico (estilo Mikel Santiago) */}
      <div className="relative text-neutral-100">

      {/* SECCIÓN 1: LIBROS - Atmósfera: Niebla y misterio atlántico-costero estilo thriller psicológico */}
      <section id="libros" className="relative py-32 overflow-hidden bg-[#070b14] border-b border-slate-800/80">
        {/* Fondo evocador transparente de thriller: Costa y acantilados brumosos */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=2000" 
            alt="Atmospheric Coastline Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo y mantenga total legibilidad */}
          <div className="absolute inset-0 bg-[#070b14]/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070b14] via-transparent to-[#070b14]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.booksEyebrow}</p>
            {ui.booksTitle && <h2 className="text-4xl font-bold md:text-6xl tracking-tight mb-6">{ui.booksTitle}</h2>}
            {ui.booksText && <p className="text-lg text-neutral-400 leading-relaxed">{ui.booksText}</p>}
          </motion.div>

          <div className="relative self-start md:self-auto z-40">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all duration-300"
            >
              <span>{bookFilter === "all" ? ui.filterAll : bookFilter === "new" ? ui.filterNew : ui.filterSoon}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 md:left-auto md:right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl z-50 overflow-hidden"
                >
                  {(["all", "new", "soon"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setBookFilter(f);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        bookFilter === f 
                          ? "bg-white text-neutral-950" 
                          : "text-neutral-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {f === "all" ? ui.filterAll : f === "new" ? ui.filterNew : ui.filterSoon}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          {books
            .filter(book => bookFilter === "all" || book.status === bookFilter)
            .map((book, idx) => (
            <motion.article 
              key={book.title} 
              id={book.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group rounded-[2.5rem] border border-slate-700/60 bg-[#0d1527]/85 backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition hover:bg-[#121d36]/90 hover:border-slate-500/70"
            >
              {(() => {
                const coverUrlVal = language === "es" ? (bookData[book.id]?.coverUrl || book.image) : (bookData[book.id]?.coverUrlEn || book.imageEn || book.image);
                const spineColorVal = language === "es" ? bookData[book.id]?.spineColor : bookData[book.id]?.spineColorEn;
                
                return (
                  <div className="grid gap-10 md:grid-cols-[240px_1fr] md:items-start">
                    {/* 3D Interactive Book Mockup with 360° rotation */}
                    <div className="w-full max-w-[240px] mx-auto md:mx-0 flex justify-center">
                      <Book3DMockup
                        id={book.id}
                        title={book.title}
                        titleEn={book.titleEn}
                        subtitle={book.subtitle}
                        subtitleEn={book.subtitleEn}
                        synopsis={book.synopsis}
                        synopsisEn={book.synopsisEn}
                        coverUrl={coverUrlVal}
                        spineColor={spineColorVal}
                        language={language}
                        isAdmin={isAdmin}
                        onCoverUpload={(e, isEn) => handleBookCoverUpload(e, book.id, isEn)}
                      />
                    </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className={`text-3xl font-bold tracking-tight font-serif ${book.id === 'el-efecto-strauss' ? 'bg-gradient-to-r from-white via-white/80 to-white bg-clip-text text-transparent' : ''}`}>
                      {language === "es" ? book.title : book.titleEn}
                    </h3>
                    {book.id === "el-senuelo" && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        {language === "es" ? "Novedad 2025" : "New Release 2025"}
                      </span>
                    )}
                    {book.id === "el-efecto-strauss" && (
                      <span className="px-3 py-1 rounded-full bg-white text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        Best Seller
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-black">
                    {language === "es" ? book.subtitle : book.subtitleEn}
                  </p>
                  <p className="mt-6 text-base leading-relaxed text-neutral-400">
                    {language === "es" ? book.description : book.descriptionEn}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    {book.status === "soon" ? (
                      <span className={`inline-block rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-neutral-500 cursor-not-allowed ${book.id === 'el-efecto-strauss' ? 'shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}`}>
                        {language === "es" ? book.cta : book.ctaEn}
                      </span>
                    ) : (
                      <a 
                        href={language === "es" ? book.link : (book.linkEn || book.link)} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-neutral-950 transition hover:scale-105"
                      >
                        {language === "es" ? book.cta : book.ctaEn}
                      </a>
                    )}
                    {(book.synopsis || book.synopsisEn) && (
                      <button 
                        onClick={() => setSelectedSynopsis({
                          title: language === "es" ? book.title : book.titleEn,
                          subtitle: language === "es" ? book.subtitle : book.subtitleEn,
                          content: language === "es" ? (book.synopsis || "") : (book.synopsisEn || ""),
                          amazonLink: language === "es" ? book.link : (book.linkEn || book.link)
                        })}
                        className="text-sm font-bold text-neutral-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <BookOpen size={16} className="text-amber-400" />
                        {ui.synopsis}
                      </button>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 font-bold">{ui.shareLabel}</span>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const url = book.link === "#" ? window.location.href : book.link;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="p-2 rounded-full bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                        title="Facebook"
                      >
                        <Facebook size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          const url = book.link === "#" ? window.location.href : book.link;
                          const text = `${language === "es" ? book.title : book.titleEn}: ${language === "es" ? book.description : book.descriptionEn}`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="p-2 rounded-full bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                        title="Twitter"
                      >
                        <Twitter size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          const url = book.link === "#" ? window.location.href : book.link;
                          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="p-2 rounded-full bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                        title="LinkedIn"
                      >
                        <Linkedin size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-neutral-600 font-medium uppercase tracking-widest">
                    {language === "es" ? book.note : book.noteEn}
                  </p>
                </div>
              </div>
            );
          })()}
        </motion.article>
      ))}
        </div>
        </div>
      </section>

      {/* SECCIÓN 2: AUTOR - Atmósfera: Bosque brumoso y misterio psicológico */}
      <section id="autor" className="relative py-32 overflow-hidden bg-[#070911] border-b border-amber-950/40">
        {/* Fondo evocador transparente de thriller: Bosque en la niebla nocturna */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&q=80&w=2000" 
            alt="Misty Forest Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#070911]/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070911] via-transparent to-[#070911]" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-[1fr_1.2fr] md:items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="group relative aspect-square max-w-md mx-auto md:mx-0">
              <div className="absolute -inset-4 border border-white/10 rounded-[3rem] rotate-3" />
              <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-neutral-900">
                <img 
                  src={authorPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800&h=800"} 
                  alt="Miguel Morales Moshiashvili" 
                  className="h-full w-full object-cover hover:scale-105 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
                {isAdmin && (
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                    <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
                      <Camera size={32} className="text-white" />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-white">
                      {language === "es" ? "Cambiar foto" : "Change photo"}
                    </span>
                    <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                  </label>
                )}
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          >
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.aboutEyebrow}</p>
            {ui.aboutTitle && <h2 className="text-4xl font-bold md:text-6xl tracking-tight mb-8 font-serif">{ui.aboutTitle}</h2>}
              <div className="p-6 text-lg text-neutral-400 leading-relaxed space-y-6 font-serif text-left">
                <p className="font-light tracking-wide">{ui.aboutText1}</p>
                <p className="font-light tracking-wide">{ui.aboutText2}</p>
                <p className="font-light tracking-wide">{ui.aboutText3}</p>
              </div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 3: BOOKTRAILERS - Atmósfera: Sala de proyección noir de suspense */}
      <section id="trailers" className="relative py-32 overflow-hidden bg-[#05080f] border-b border-cyan-950/50">
        {/* Fondo evocador transparente de thriller: Proyección cinematográfica noir */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2000" 
            alt="Cinematic Screening Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#05080f]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05080f] via-transparent to-[#05080f]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.trailersEyebrow}</p>
            {ui.trailersTitle && <h2 className="text-4xl font-bold md:text-6xl tracking-tight">{ui.trailersTitle}</h2>}
          </motion.div>
          <div className="grid gap-12 md:grid-cols-2">
            {bookTrailers.map((trailer, idx) => (
              <motion.div
                key={trailer.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => trailer.videoUrl && setSelectedTrailer(trailer.videoUrl)}
                className={`group relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl ${trailer.videoUrl ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <img 
                  src={trailer.thumbnail} 
                  alt={trailer.title}
                  className={`absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-700 group-hover:scale-110 ${trailer.title === "El Efecto Strauss" ? "animate-pulse" : ""}`}
                />
                {trailer.title === "El Efecto Strauss" && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[30deg] animate-shine" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  {trailer.videoUrl ? (
                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <Play size={32} fill="currentColor" />
                    </div>
                  ) : (
                    <div className="px-6 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs uppercase tracking-widest text-white/50">
                      Próximamente
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-8">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight font-serif">{trailer.title}</h3>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-bold mt-2">Official Booktrailer</p>
                  </div>
                </div>
                {/* Overlay for the actual video if needed, but for now just a cinematic preview */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-white pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: PRENSA - Atmósfera: Archivo de casos / hemeroteca y crónica literaria */}
      <section id="prensa" className="relative py-32 overflow-hidden bg-[#060913] border-b border-slate-800/70">
        {/* Fondo evocador transparente de thriller: Hemeroteca y archivo de casos */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=2000" 
            alt="Press Archive Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter grayscale contrast-130 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#060913]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060913] via-transparent to-[#060913]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.pressEyebrow}</p>
            {ui.pressTitle && <h2 className="text-4xl font-bold md:text-6xl tracking-tight">{ui.pressTitle}</h2>}
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {ui.pressCards.map((card, idx) => {
              const isInterview = idx === 0;
              const isBlogReview = idx === 1;
              const isEvent = idx === 2;
              const isInteractive = isInterview || isBlogReview || isEvent;
              
              const handleClick = () => {
                if (isInterview) setIsInterviewOpen(true);
                if (isBlogReview) setIsBlogReviewOpen(true);
                if (isEvent) setIsEventOpen(true);
              };

              let cardBgClasses = "border-slate-700/60 bg-[#0d1628]/75 hover:bg-[#121f3a]/85";
              if (isInterview) {
                cardBgClasses = "border-amber-500/40 bg-gradient-to-b from-[#131d35]/90 to-[#0c1426]/90 hover:border-amber-400/80 hover:bg-[#152342] hover:shadow-[0_15px_40px_rgba(245,158,11,0.18)] hover:-translate-y-1.5 cursor-pointer relative";
              } else if (isBlogReview) {
                cardBgClasses = "border-purple-500/40 bg-gradient-to-b from-[#181232]/90 to-[#0d1024]/90 hover:border-purple-400/80 hover:bg-[#1f1640] hover:shadow-[0_15px_40px_rgba(168,85,247,0.18)] hover:-translate-y-1.5 cursor-pointer relative";
              } else if (isEvent) {
                cardBgClasses = "border-cyan-500/40 bg-gradient-to-b from-[#0e1e36]/90 to-[#091224]/90 hover:border-cyan-400/80 hover:bg-[#112644] hover:shadow-[0_15px_40px_rgba(6,182,212,0.18)] hover:-translate-y-1.5 cursor-pointer relative";
              }

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={isInteractive ? handleClick : undefined}
                  className={`group p-8 sm:p-10 rounded-[2.5rem] border backdrop-blur-xl transition-all shadow-xl flex flex-col justify-between ${cardBgClasses}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isInterview 
                          ? "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-black" 
                          : isBlogReview
                          ? "bg-purple-500/15 text-purple-300 group-hover:bg-purple-500 group-hover:text-white"
                          : isEvent
                          ? "bg-cyan-500/15 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black"
                          : "bg-white/5 text-neutral-500 group-hover:text-white"
                      }`}>
                        {isInterview ? <Newspaper size={24} /> : isBlogReview ? <Star size={24} /> : isEvent ? <Calendar size={24} /> : <Globe size={24} />}
                      </div>
                      {isInterview && (
                        <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                          {language === "es" ? "Exclusiva" : "Exclusive"}
                        </span>
                      )}
                      {isBlogReview && (
                        <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm flex items-center gap-1">
                          <Sparkles size={11} />
                          {language === "es" ? "Reseña 5/5" : "Review 5/5"}
                        </span>
                      )}
                      {isEvent && (
                        <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1">
                          <Calendar size={11} />
                          9-11 Oct 2026
                        </span>
                      )}
                    </div>
                    {isEvent ? (
                      <div className="space-y-3">
                        <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold block">
                          {language === "es" ? "Próxima presentación" : "Upcoming event"}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
                          15.ª Primavera del Libro
                        </h3>
                        <div className="space-y-2 text-xs sm:text-sm text-neutral-300 pt-1">
                          <p className="flex items-center gap-2">
                            <Calendar size={14} className="text-cyan-400 flex-shrink-0" />
                            <span className="font-medium">{language === "es" ? "Viernes 9, sábado 10 y domingo 11 de octubre de 2026" : "Friday 9, Saturday 10 & Sunday 11 October 2026"}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={14} className="text-amber-400 flex-shrink-0" />
                            <span>Centro Cultural Estación Mapocho, Santiago de Chile</span>
                          </p>
                          <p className="text-[11px] sm:text-xs text-neutral-400 font-mono pt-1">
                            {language === "es" ? "Organización: Editoriales de Chile" : "Organized by: Editoriales de Chile"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg text-neutral-200 leading-relaxed font-serif">
                        {card}
                      </p>
                    )}
                  </div>

                  {isInterview && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-amber-400 group-hover:text-amber-300 transition-colors">
                      <span className="flex items-center gap-2">
                        <BookOpen size={15} />
                        {language === "es" ? "Leer entrevista completa" : "Read full interview"}
                      </span>
                      <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  )}

                  {isBlogReview && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-purple-300 group-hover:text-purple-200 transition-colors">
                      <span className="flex items-center gap-2">
                        <BookOpen size={15} />
                        {language === "es" ? "Leer reseña completa" : "Read full review"}
                      </span>
                      <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  )}

                  {isEvent && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-cyan-300 group-hover:text-cyan-200 transition-colors">
                      <span className="flex items-center gap-2">
                        <MapPin size={15} />
                        {language === "es" ? "Ver detalles de la presentación" : "View event details"}
                      </span>
                      <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: RESEÑAS - Atmósfera: Noche de lluvia y suspense / Veredicto de lectores y crítica */}
      <section id="resenas" className="relative py-28 overflow-hidden bg-[#060812] border-b border-slate-800/70">
        {/* Fondo evocador transparente de thriller: Noche de lluvia y reflejos en asfalto */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&q=80&w=2000" 
            alt="Rainy Night Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#060812]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060812] via-transparent to-[#060812]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center"
        >
          <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.reviewsEyebrow}</p>
          {ui.reviewsTitle && <h2 className="text-4xl font-bold md:text-6xl tracking-tight">{ui.reviewsTitle}</h2>}
        </motion.div>
        <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="relative p-8 md:p-10 rounded-3xl border border-slate-700/60 bg-[#0d1529]/80 backdrop-blur-xl hover:bg-[#131f3c]/90 transition-colors flex flex-col justify-between shadow-2xl shadow-black/50"
            >
              <Quote size={36} className="text-white/[0.04] absolute top-8 right-8 pointer-events-none" />
              <div>
                <div className="flex items-center gap-1.5 mb-6 text-amber-400">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                  <span className="text-xs font-semibold text-amber-400/80 ml-2">5/5</span>
                </div>
                <p className="text-base md:text-lg font-normal text-neutral-200 leading-relaxed italic">
                  “{language === "es" ? review.es : review.en}”
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base font-semibold text-white tracking-wide">
                    {review.author}
                  </p>
                  <p className="text-xs text-neutral-500 font-medium mt-1">
                    {language === "es" ? review.role.es : review.role.en}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-amber-400/90 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  ★★★★★
                </span>
              </div>

              {review.author.includes("romanticoslibros") && (
                <button
                  type="button"
                  onClick={() => setIsBlogReviewOpen(true)}
                  className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors w-full cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} />
                    {language === "es" ? "Leer reseña completa del blog" : "Read full blog review"}
                  </span>
                  <ArrowRight size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* SECCIÓN 6: CONTACTO - Atmósfera: Despacho confidencial / correspondencia directa con el autor */}
      <section id="contacto" className="relative py-28 overflow-hidden bg-[#05070d] border-b border-slate-800/70">
        {/* Fondo evocador transparente de thriller: Escritorio de autor y notas a la luz tenue */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=2000" 
            alt="Author Desk Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter sepia-[0.25] contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#05070d]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070d] via-transparent to-[#05070d]" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 items-start relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-6">{ui.contactEyebrow}</p>
            {ui.contactText && (
              <p className="text-lg text-neutral-400 leading-relaxed mb-6">
                {ui.contactText}
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">Email</p>
                  <a href="mailto:miguemora100@gmail.com" className="text-xs font-medium truncate max-w-[150px] hover:text-white transition-colors">miguemora100@gmail.com</a>
                </div>
              </div>
              <a href="https://instagram.com/miguel_m.moshiashvili" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Instagram size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">Instagram</p>
                  <p className="text-xs font-medium">@miguel_m.moshiashvili</p>
                </div>
              </a>
              <a href="https://linkedin.com/in/miguel-morales-moshiashvili" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Linkedin size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">LinkedIn</p>
                  <p className="text-xs font-medium">miguel-morales-moshiashvili</p>
                </div>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Facebook size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">Facebook</p>
                  <p className="text-xs font-medium">Perfil oficial</p>
                </div>
              </a>
              <a href="https://tiktok.com/@miguel_m.moshiashvili" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Music2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">TikTok</p>
                  <p className="text-xs font-medium">@miguel_m.moshiashvili</p>
                </div>
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] border border-slate-700/60 bg-[#0c1425]/85 backdrop-blur-xl shadow-2xl shadow-black/60"
          >
            {isSent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold font-serif">{language === "es" ? "¡Mensaje enviado!" : "Message sent!"}</h3>
                <p className="text-neutral-400">
                  {language === "es" ? "Gracias por contactar. Te responderé lo antes posible." : "Thanks for reaching out. I'll get back to you as soon as possible."}
                </p>
                <button 
                  onClick={() => setIsSent(false)}
                  className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                  {language === "es" ? "Enviar otro mensaje" : "Send another message"}
                </button>
              </div>
            ) : (
              <form 
                className="space-y-6" 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSending(true);
                  setTimeout(() => {
                    setIsSending(false);
                    setIsSent(true);
                  }, 1500);
                }}
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black ml-2">{ui.name}</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-4 outline-none placeholder:text-neutral-700 focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black ml-2">{ui.email}</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-4 outline-none placeholder:text-neutral-700 focus:border-white/20 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-black ml-2">{ui.message}</label>
                  <textarea
                    required
                    placeholder="..."
                    rows={4}
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-4 outline-none placeholder:text-neutral-700 focus:border-white/20 transition-colors resize-none"
                  />
                </div>
                <button 
                  disabled={isSending}
                  className="w-full rounded-full bg-white py-5 text-sm font-bold text-neutral-950 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
                      {language === "es" ? "Enviando..." : "Sending..."}
                    </>
                  ) : (
                    ui.send
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 7: NEWSLETTER - Atmósfera: Círculo secreto de lectores de suspense */}
      <section className="relative py-24 overflow-hidden bg-[#070a14] border-y border-amber-500/25">
        {/* Fondo evocador transparente de thriller: Sendero nocturno en la bruma */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=2000" 
            alt="Nocturnal Foggy Road Thriller" 
            className="w-full h-full object-cover object-center opacity-30 md:opacity-35 filter contrast-125 brightness-95"
            referrerPolicy="no-referrer"
          />
          {/* Capa de contraste transparente para que sirva únicamente de fondo */}
          <div className="absolute inset-0 bg-[#070a14]/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070a14] via-transparent to-[#070a14]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-serif">{ui.newsletterTitle}</h2>
            <p className="text-neutral-400 mb-10 text-lg">{ui.newsletterText}</p>
            
            {isSubscribed ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 max-w-md mx-auto"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="text-white" size={24} fill="currentColor" />
                </div>
                <p className="text-white font-medium">{ui.newsletterSuccess}</p>
                <button 
                  onClick={() => setIsSubscribed(false)}
                  className="mt-6 text-xs uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                >
                  {language === "es" ? "Volver" : "Back"}
                </button>
              </motion.div>
            ) : (
              <form 
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) {
                    setIsSubscribing(true);
                    setTimeout(() => {
                      setIsSubscribing(false);
                      setIsSubscribed(true);
                      setNewsletterEmail("");
                    }, 1200);
                  }
                }}
              >
                <input 
                  type="email" 
                  required
                  disabled={isSubscribing}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={ui.newsletterPlaceholder}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={isSubscribing}
                  className="rounded-2xl bg-white px-8 py-4 text-sm font-bold text-neutral-950 hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? (
                    <div className="w-4 h-4 border-2 border-neutral-950/20 border-t-neutral-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      {ui.newsletterButton}
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedTrailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedTrailer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedTrailer(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
              >
                <X size={24} />
              </button>
              <iframe
                src={selectedTrailer}
                title="Booktrailer"
                className="w-full h-full border-none"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER - Obsidiana y grafito elegante */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="border-t border-slate-800/80 py-12 bg-[#05070d] text-neutral-400"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Column */}
            <div className="text-center md:text-left">
              <div className="flex flex-col text-xs font-bold tracking-[0.2em] uppercase font-serif mb-4">
                <span className="leading-none">Miguel Morales</span>
                <span className="leading-none font-light opacity-70 mt-1">Moshiashvili</span>
              </div>
              
              <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] leading-relaxed max-w-[200px] mx-auto md:mx-0">
                {ui.footer}
              </p>
            </div>

            {/* Social Column */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 font-black mb-3">{ui.followMe}</p>
              <div className="flex justify-center gap-4 mb-6">
                <a href="https://instagram.com/miguel_m.moshiashvili" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
                  <Facebook size={18} />
                </a>
                <a href="https://linkedin.com/in/miguel-morales-moshiashvili" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
                  <Linkedin size={18} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
                  <Twitter size={18} />
                </a>
                <a href="https://tiktok.com/@miguel_m.moshiashvili" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
                  <Music2 size={18} />
                </a>
              </div>

              {/* Publisher Seal */}
              <div className="flex justify-center">
                <div className="group relative w-16 h-16 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden">
                  {publisherSeal ? (
                    <img src={publisherSeal} alt="Editorial" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[8px] text-neutral-600 uppercase tracking-widest text-center px-1">Sello Editorial</div>
                  )}
                  {isAdmin && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={14} className="text-white" />
                      <input type="file" className="hidden" onChange={handlePublisherSealUpload} accept="image/*" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Links Column */}
            <div className="text-center md:text-right">
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 font-black mb-3">Legal</p>
              <div className="flex flex-col gap-3">
                <a href="#" className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                  {ui.privacyPolicy}
                </a>
                <a href="#" className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                  {ui.sitemap}
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-neutral-700 uppercase tracking-widest">
              © {new Date().getFullYear()} — All rights reserved
            </p>
            <div className="flex gap-6">
              <a href="#inicio" className="text-[10px] text-neutral-700 uppercase tracking-widest hover:text-white transition-colors">Top</a>
            </div>
          </div>
        </div>
      </motion.footer>
      </div>

      {/* Synopsis Modal */}
      {selectedSynopsis && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedSynopsis(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#0d1424] border border-slate-700/80 p-6 sm:p-10 md:p-12 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button 
              onClick={() => setSelectedSynopsis(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold">
                {language === "es" ? "Sinopsis Oficial" : "Official Synopsis"}
              </span>
              {selectedSynopsis.subtitle && (
                <span className="text-[11px] text-neutral-400 font-medium border-l border-white/20 pl-3">
                  {selectedSynopsis.subtitle}
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6 font-serif text-white">
              {selectedSynopsis.title}
            </h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-base sm:text-lg leading-relaxed font-serif text-neutral-300 whitespace-pre-line text-justify">
                {selectedSynopsis.content || (language === "es" ? "Sinopsis no disponible." : "Synopsis not available.")}
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              {selectedSynopsis.amazonLink ? (
                <a
                  href={selectedSynopsis.amazonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-neutral-950 hover:bg-neutral-200 transition-colors shadow-lg"
                >
                  <BookOpen size={16} />
                  {language === "es" ? "Comprar en Amazon" : "Buy on Amazon"}
                  <ExternalLink size={12} className="opacity-60" />
                </a>
              ) : <div />}
              <button 
                onClick={() => setSelectedSynopsis(null)}
                className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-colors"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exclusive Interview Modal */}
      <InterviewModal 
        isOpen={isInterviewOpen} 
        onClose={() => setIsInterviewOpen(false)} 
        language={language} 
      />

      {/* Featured Blog Review Modal */}
      <BlogReviewModal
        isOpen={isBlogReviewOpen}
        onClose={() => setIsBlogReviewOpen(false)}
        language={language}
      />

      {/* Upcoming Presentation / Event Modal */}
      <EventModal
        isOpen={isEventOpen}
        onClose={() => setIsEventOpen(false)}
        language={language}
      />
    </div>
  );
}
