/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ChangeEvent, Component, ErrorInfo, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Instagram, BookOpen, Star, Menu, X, Globe, Linkedin, Facebook, Music2, Send, Play, Twitter, ChevronDown, LogIn, LogOut, Camera } from "lucide-react";
import { db, auth } from "./firebase";
import { doc, onSnapshot, setDoc, serverTimestamp, getDocFromServer, collection } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";

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
  const [selectedSynopsis, setSelectedSynopsis] = useState<{ title: string; content: string } | null>(null);
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
        "Escritor de thriller psicológico y doctorando en neuro-epigenética. Una voz que explora los límites de la mente, la memoria y la identidad a través del suspense.",
      cta1: "Descubrir libros",
      cta2: "Sobre el autor",
      cta3: "Contacto",
      featured: "Título destacado",
      featuredText:
        "Una novela diseñada para atrapar desde la primera impresión: misterio, atmósfera y una identidad visual de autor contemporáneo.",
      booksEyebrow: "Libros",
      booksTitle: "",
      booksText: "",
      synopsis: "Leer sinopsis",
      aboutEyebrow: "Sobre el autor",
      aboutTitle: "",
      aboutText1:
        "Miguel Morales Moshiashvili es escritor de thriller psicológico y doctorando en neuro-epigenética, un campo que estudia cómo las experiencias pueden modificar el cerebro y moldear la mente humana. Su fascinación por los mecanismos ocultos de la memoria, la identidad y la percepción de la realidad influye profundamente en sus historias.",
      aboutText2:
        "En sus novelas, la mente humana se convierte en un territorio lleno de sombras, donde los recuerdos pueden engañar, la verdad se fragmenta y cada secreto puede cambiarlo todo. A través de tramas intensas y atmósferas inquietantes, sus libros exploran los límites entre la realidad y la percepción, invitando al lector a adentrarse en historias donde nada es exactamente lo que parece.",
      aboutText3:
        "Cuando no está investigando los misterios del cerebro o escribiendo nuevas historias, Miguel se dedica a explorar la literatura, la psicología y las fuerzas invisibles que impulsan el comportamiento humano. Sus novelas buscan no solo entretener, sino también provocar una pregunta inquietante en el lector: ¿Qué ocurre cuando la mente deja de distinguir entre la verdad y la ilusión?",
      trailersEyebrow: "Booktrailers",
      trailersTitle: "",
      pressEyebrow: "Prensa y actualidad",
      pressTitle: "",
      pressCards: [
        "Entrevista exclusiva en 'Letras de Misterio': El proceso creativo tras El Señuelo.",
        "Reseña destacada en el Blog de Suspense: 'Una voz fresca en el thriller psicológico'.",
        "Próxima presentación en la Feria del Libro: Firma de ejemplares y charla con lectores.",
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
        "Psychological thriller writer and PhD candidate in neuro-epigenetics. A voice exploring the limits of the mind, memory, and identity through suspense.",
      cta1: "Discover books",
      cta2: "About the author",
      cta3: "Contact",
      featured: "Featured title",
      featuredText:
        "A novel crafted to captivate from the very first impression: mystery, atmosphere and a contemporary author identity.",
      booksEyebrow: "Books",
      booksTitle: "",
      booksText: "",
      synopsis: "Read synopsis",
      aboutEyebrow: "About the author",
      aboutTitle: "",
      aboutText1:
        "Miguel Morales Moshiashvili is a psychological thriller writer and a PhD candidate in neuro-epigenetics, a field that studies how experiences can modify the brain and shape the human mind. His fascination with the hidden mechanisms of memory, identity, and the perception of reality deeply influences his stories.",
      aboutText2:
        "In his novels, the human mind becomes a territory full of shadows, where memories can deceive, truth is fragmented, and every secret can change everything. Through intense plots and unsettling atmospheres, his books explore the boundaries between reality and perception, inviting the reader to enter stories where nothing is exactly what it seems.",
      aboutText3:
        "When he is not investigating the mysteries of the brain or writing new stories, Miguel is dedicated to exploring literature, psychology, and the invisible forces that drive human behavior. His novels seek not only to entertain but also to provoke a disturbing question in the reader: What happens when the mind stops distinguishing between truth and illusion?",
      trailersEyebrow: "Booktrailers",
      trailersTitle: "",
      pressEyebrow: "Press & updates",
      pressTitle: "",
      pressCards: [
        "Exclusive interview in 'Mystery Letters': The creative process behind The Decoy.",
        "Featured review in The Suspense Blog: 'A fresh voice in psychological thrillers'.",
        "Upcoming book fair presentation: Book signing and reader meet-up.",
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
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600&h=800",
      imageEn: "https://ais-dev-v3wxidfdcu2aht5txbgd4h-258365610213.europe-west2.run.app/decoy_en_cover.png",
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
      cta: "Próximamente",
      ctaEn: "Coming soon",
      note: "Disponible próximamente",
      noteEn: "Coming soon",
      link: "#",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600&h=800",
      status: "soon"
    },
  ];

  const reviews = [
    { es: "Atrapante desde el principio.", en: "Gripping from the very beginning." },
    { es: "Una lectura intensa, elegante y muy adictiva.", en: "An intense, elegant and highly addictive read." },
    { es: "Ideal para quienes disfrutan del thriller psicológico con personalidad.", en: "Perfect for readers who enjoy psychological thrillers with personality." },
  ];

  const bookTrailers = [
    {
      title: "El Señuelo",
      videoUrl: "https://drive.google.com/file/d/1YkKdgBMEkYGrgbTXQsc0G59RCT6Ew8Ho/preview",
      thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1280&h=720"
    },
    {
      title: "El Efecto Strauss",
      videoUrl: "", // Removed placeholder
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1280&h=720"
    }
  ];

  const ui = t[language];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-white selection:text-black scroll-smooth">
      {/* Page Reveal Overlay */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        onAnimationComplete={() => document.body.style.overflow = "auto"}
        className="fixed inset-0 z-[100] bg-black pointer-events-none"
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-md">
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

      {/* Hero Section */}
      <motion.section 
        id="inicio" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative overflow-hidden border-b border-white/10 py-12 md:py-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_left,rgba(255,255,255,0.08),transparent_22%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 md:gap-24 px-6 md:grid-cols-2 md:items-start">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="relative z-20 pt-8 md:pt-10"
          >
            <h1 className="max-w-2xl text-5xl font-light leading-tight md:text-6xl lg:text-7xl xl:text-8xl tracking-[-0.04em] font-serif">
              <span className="block text-white/60 tracking-[0.4em] font-bold uppercase text-[10px] md:text-xs mb-8">{ui.label}</span>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="block leading-[0.85] text-white whitespace-nowrap"
              >
                {ui.heroTitle1}
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="block leading-[0.85] text-neutral-500 mt-1"
              >
                {ui.heroTitle2}
              </motion.span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-neutral-400">{ui.heroText}</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex gap-4">
                <a href="#libros" className="rounded-2xl border border-white/20 bg-white px-8 py-4 text-sm font-bold text-neutral-950 shadow-lg shadow-white/10 transition hover:scale-[1.02]">
                  {ui.cta1}
                </a>
                <a href="#autor" className="rounded-2xl border border-white/20 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/5">
                  {ui.cta2}
                </a>
              </div>
              <a href="#contacto" className="rounded-2xl border border-white/20 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/5">
                {ui.cta3}
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="relative z-10 flex justify-center md:justify-end pt-16 md:pt-12 pb-12"
          >
            <div className="relative group/hero-book [perspective:3000px] w-full max-w-[280px]">
              <div className="relative aspect-[3/4.2] w-full transition-all duration-1000 [transform-style:preserve-3d] group-hover/hero-book:[transform:rotateY(-15deg)_rotateX(2deg)_rotateZ(-1deg)]">
                {/* Front Cover */}
                <div className="absolute inset-0 z-20 rounded-r-[2px] overflow-hidden border-y border-r border-white/10 bg-neutral-900 shadow-2xl [transform:translateZ(20px)]">
                  <img 
                    src={language === "es" ? (bookData["el-senuelo"]?.coverUrl || books[0].image) : (bookData["el-senuelo"]?.coverUrlEn || books[0].imageEn || books[0].image)} 
                    alt={language === "es" ? "El Señuelo" : "The Decoy"} 
                    className="h-full w-full object-cover transition-all duration-700" 
                    referrerPolicy="no-referrer"
                  />
                  {/* Spine Crease */}
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-black/30 z-30" />
                  <div className="absolute inset-y-0 left-[3px] w-[1px] bg-white/5 z-30" />

                  {isAdmin && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover/hero-book:opacity-100 transition-opacity cursor-pointer backdrop-blur-md z-40 gap-6">
                      <label className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group/upload-es">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover/upload-es:bg-white group-hover/upload-es:text-black transition-colors">
                          <Globe size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Portada ES</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleBookCoverUpload(e, "el-senuelo", false)} 
                          accept="image/*" 
                        />
                      </label>
                      <div className="w-12 h-px bg-white/20" />
                      <label className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group/upload-en">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover/upload-en:bg-white group-hover/upload-en:text-black transition-colors">
                          <Globe size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Portada EN</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleBookCoverUpload(e, "el-senuelo", true)} 
                          accept="image/*" 
                        />
                      </label>
                    </div>
                  )}
                  
                  {/* Lighting overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none" />
                </div>
                
                {/* Spine depth */}
                <div 
                  className="absolute inset-y-0 left-0 w-[40px] [transform:rotateY(-90deg)_translateZ(20px)] origin-left border-r border-white/10 shadow-inner overflow-hidden" 
                  style={{ backgroundColor: (language === "es" ? bookData["el-senuelo"]?.spineColor : bookData["el-senuelo"]?.spineColorEn) || '#171717' }}
                >
                  {/* Spine Texture & Lighting */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                  <div className="absolute inset-x-0 top-4 h-px bg-white/5" />
                  <div className="absolute inset-x-0 bottom-4 h-px bg-white/5" />
                  <div className="absolute inset-0 flex items-center justify-center [writing-mode:vertical-rl] rotate-180 py-8">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] whitespace-nowrap">
                      {language === "es" ? "El Señuelo" : "The Decoy"}
                    </span>
                  </div>
                </div>
                
                {/* Pages depth (Right) */}
                <div className="absolute inset-y-[2px] right-0 w-[36px] bg-[#f4f1ea] [transform:rotateY(90deg)_translateZ(2px)] origin-right border-l border-black/5">
                  <div className="w-full h-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 1px, #000 2px)' }} />
                </div>

                {/* Top Pages */}
                <div className="absolute inset-x-[2px] top-0 h-[36px] bg-[#f4f1ea] [transform:rotateX(90deg)_translateZ(2px)] origin-top border-b border-black/5">
                  <div className="w-full h-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #000 2px)' }} />
                </div>

                {/* Back Cover */}
                <div 
                  className="absolute inset-0 rounded-sm [transform:translateZ(-20px)] shadow-2xl border border-white/5" 
                  style={{ backgroundColor: (language === "es" ? bookData["el-senuelo"]?.spineColor : bookData["el-senuelo"]?.spineColorEn) || '#171717' }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              </div>

              {/* Shelf Shadow */}
              <div className="absolute -bottom-12 left-8 right-8 h-8 bg-black/80 blur-3xl rounded-full opacity-0 group-hover/hero-book:opacity-100 transition-opacity duration-1000" />
              
              <div className="mt-16 p-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl relative z-30">
                <div className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 font-black">{ui.featured}</div>
                <div className="mt-4 text-3xl font-semibold leading-none tracking-tight font-serif">
                  {language === "es" ? "El Señuelo" : "The Decoy"}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">
                  {language === "es" ? "Thriller psicológico" : "Psychological thriller"}
                </div>
                <div className="mt-6 h-px w-full bg-white/10" />
                <p className="mt-5 text-sm leading-relaxed text-neutral-400 italic">{ui.featuredText}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Books Section */}
      <section id="libros" className="mx-auto max-w-7xl px-6 py-32">
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 shadow-xl shadow-black/20 transition hover:bg-white/[0.04] hover:border-white/10"
            >
              <div className="grid gap-12 md:grid-cols-[200px_1fr] md:items-start">
                <div className={`relative group/book-card [perspective:3000px] w-full max-w-[220px] mx-auto md:mx-0 py-8 ${book.id === 'el-efecto-strauss' ? 'after:absolute after:inset-0 after:bg-white/5 after:blur-3xl after:rounded-full after:opacity-20 after:pointer-events-none' : ''}`}>
                  <div className={`relative aspect-[2/3.2] w-full transition-all duration-1000 [transform-style:preserve-3d] [transform:rotateY(-8deg)_rotateX(1deg)] group-hover/book-card:[transform:rotateY(-18deg)_rotateX(3deg)_translateZ(30px)] ${book.id === 'el-efecto-strauss' ? 'ring-1 ring-white/20' : ''}`}>
                    {/* Front Cover */}
                    <div className="absolute inset-0 z-20 rounded-r-[2px] overflow-hidden border-y border-r border-white/10 shadow-2xl [transform:translateZ(20px)]">
                      <img
                        src={language === "es" ? (bookData[book.id]?.coverUrl || book.image) : (bookData[book.id]?.coverUrlEn || book.imageEn || book.image)}
                        alt={language === "es" ? book.title : (book.titleEn || book.title)}
                        className="h-full w-full object-cover transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      {/* Spine Crease */}
                      <div className="absolute inset-y-0 left-0 w-[2px] bg-black/40 z-30" />
                      <div className="absolute inset-y-0 left-[2px] w-[1px] bg-white/10 z-30" />

                      {isAdmin && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 opacity-0 group-hover/book-card:opacity-100 transition-opacity cursor-pointer backdrop-blur-md z-40 gap-6">
                          <label className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group/upload-es">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover/upload-es:bg-white group-hover/upload-es:text-black transition-colors">
                              <Globe size={18} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Portada ES</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleBookCoverUpload(e, book.id, false)} 
                              accept="image/*" 
                            />
                          </label>
                          <div className="w-10 h-px bg-white/20" />
                          <label className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform group/upload-en">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover/upload-en:bg-white group-hover/upload-en:text-black transition-colors">
                              <Globe size={18} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Portada EN</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleBookCoverUpload(e, book.id, true)} 
                              accept="image/*" 
                            />
                          </label>
                        </div>
                      )}
                      {/* Lighting effects */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
                      
                      {/* Special Shine for El Efecto Strauss */}
                      {book.id === "el-efecto-strauss" && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[30deg] animate-shine" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" />
                        </div>
                      )}
                    </div>
                    
                    {/* Spine */}
                    <div 
                      className="absolute inset-y-0 left-0 w-[40px] [transform:rotateY(-90deg)_translateZ(20px)] origin-left border-r border-white/10 shadow-inner overflow-hidden"
                      style={{ backgroundColor: (language === "es" ? bookData[book.id]?.spineColor : bookData[book.id]?.spineColorEn) || '#171717' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                      <div className="absolute inset-x-0 top-4 h-px bg-white/5" />
                      <div className="absolute inset-x-0 bottom-4 h-px bg-white/5" />
                      <div className="absolute inset-0 flex items-center justify-center [writing-mode:vertical-rl] rotate-180 py-4">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] whitespace-nowrap">
                          {language === "es" ? book.title : book.titleEn}
                        </span>
                      </div>
                    </div>
                    
                    {/* Pages (Right side) */}
                    <div className="absolute inset-y-[2px] right-0 w-[36px] bg-[#f4f1ea] [transform:rotateY(90deg)_translateZ(2px)] origin-right border-l border-black/5">
                      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 1px, #000 2px)' }} />
                    </div>

                    {/* Top Pages */}
                    <div className="absolute inset-x-[2px] top-0 h-[36px] bg-[#f4f1ea] [transform:rotateX(90deg)_translateZ(2px)] origin-top border-b border-black/5">
                      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #000 2px)' }} />
                    </div>

                    {/* Back Cover */}
                    <div 
                      className="absolute inset-0 rounded-sm [transform:translateZ(-20px)] shadow-2xl border border-white/5" 
                      style={{ backgroundColor: (language === "es" ? bookData[book.id]?.spineColor : bookData[book.id]?.spineColorEn) || '#171717' }}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                  </div>
                  
                  {/* Shelf Shadow */}
                  <div className="absolute -bottom-4 left-0 right-0 h-12 bg-black/90 blur-3xl rounded-full opacity-40 group-hover/book-card:opacity-70 transition-opacity duration-1000 scale-x-110" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-3xl font-bold tracking-tight font-serif ${book.id === 'el-efecto-strauss' ? 'bg-gradient-to-r from-white via-white/80 to-white bg-clip-text text-transparent' : ''}`}>
                      {language === "es" ? book.title : book.titleEn}
                    </h3>
                    {book.status === "new" && (
                      <span className="px-2 py-0.5 rounded-full bg-white text-neutral-950 text-[8px] font-black uppercase tracking-wider">New</span>
                    )}
                    {book.status === "soon" && (
                      <span className={`px-2 py-0.5 rounded-full border border-white/20 text-white text-[8px] font-black uppercase tracking-wider ${book.id === 'el-efecto-strauss' ? 'bg-white/10 animate-pulse' : ''}`}>
                        {language === "es" ? "Próximamente" : "Soon"}
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
                          content: language === "es" ? (book.synopsis || "") : (book.synopsisEn || "")
                        })}
                        className="text-sm font-bold text-neutral-500 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <BookOpen size={16} />
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
            </motion.article>
          ))}
        </div>
      </section>

      {/* Author Section */}
      <section id="autor" className="relative py-32 overflow-hidden bg-white/[0.01] border-y border-white/5">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
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

      {/* Booktrailers Section */}
      <section id="trailers" className="py-32 bg-neutral-900/30">
        <div className="mx-auto max-w-7xl px-6">
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

      {/* Press Section */}
      <section id="prensa" className="py-32 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
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
            {ui.pressCards.map((card, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-8 text-neutral-500 group-hover:text-white transition-colors">
                  <Globe size={24} />
                </div>
                <p className="text-lg text-neutral-300 leading-relaxed">{card}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="resenas" className="mx-auto max-w-7xl px-6 py-16">
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
        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative p-10 rounded-[3rem] border border-white/5 bg-white/[0.02] flex flex-col items-center text-center"
            >
              <div className="flex gap-1 mb-8 text-white/40">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-xl font-medium text-neutral-200 leading-relaxed italic">
                “{language === "es" ? review.es : review.en}”
              </p>
              <div className="mt-8 pt-8 border-t border-white/5 w-full">
                <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 font-black">
                  {language === "es" ? "Lector de Amazon" : "Amazon Reader"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="relative py-16 bg-white/[0.01] border-t border-white/5 overflow-hidden">
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
              <div className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Instagram size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">Instagram</p>
                  <p className="text-xs font-medium">@genomics4u</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Linkedin size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">LinkedIn</p>
                  <p className="text-xs font-medium">miguel-morales-moshiashvili</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Facebook size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">Facebook</p>
                  <p className="text-xs font-medium">Perfil oficial</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-neutral-300 group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Music2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-black">TikTok</p>
                  <p className="text-xs font-medium">@genomics4u</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-[3rem] border border-white/10 bg-neutral-950 shadow-2xl"
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

      {/* Newsletter Section */}
      <section className="py-12 bg-white/[0.02] border-y border-white/5">
        <div className="mx-auto max-w-3xl px-6 text-center">
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

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="border-t border-white/5 py-10 bg-black"
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
                <a href="https://instagram.com/genomics4u" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
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
                <a href="https://tiktok.com/@genomics4u" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all duration-300">
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

      {/* Synopsis Modal */}
      {selectedSynopsis && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button 
              onClick={() => setSelectedSynopsis(null)}
              className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="text-xs uppercase tracking-[0.5em] text-neutral-500 font-bold mb-4">{ui.synopsis}</div>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 font-serif">{selectedSynopsis.title}</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg md:text-xl text-neutral-300 leading-relaxed font-serif italic">
                {selectedSynopsis.content || (language === "es" ? "Sinopsis no disponible." : "Synopsis not available.")}
              </p>
            </div>
            <div className="mt-12 flex justify-end">
              <button 
                onClick={() => setSelectedSynopsis(null)}
                className="rounded-full bg-white px-8 py-4 text-sm font-bold text-neutral-950 hover:scale-105 transition-transform"
              >
                {language === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
