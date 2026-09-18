export interface BlogReviewContent {
  title: string;
  source: string;
  author: string;
  rating: string;
  stars: number;
  bookTitle: string;
  bookAuthor: string;
  introGreeting: string;
  introSynopsisNote: string;
  opinionTitle: string;
  paragraphs: string[];
  conclusionRecommendation: string;
  scoreText: string;
}

export const blogReviewData: { es: BlogReviewContent; en: BlogReviewContent } = {
  es: {
    title: "Reseña destacada en el blog",
    source: "Blog Literario / Bookstagram",
    author: "Rocío (@romanticoslibros)",
    rating: "5/5",
    stars: 5,
    bookTitle: "El efecto Strauss",
    bookAuthor: "@miguel_m.moshiashvili",
    introGreeting: "¡Hola mis románticos! ¡Feliz Viernes! 💜",
    introSynopsisNote: "Hoy os traigo reseña de una historia que acabé anoche justo. Deslizando tenéis la sinopsis ✨",
    opinionTitle: "OPINIÓN PERSONAL",
    paragraphs: [
      "Nos encontramos ante un thriller psicológico lleno de misterios, dudas, asesinatos y locura.",
      "Tenemos por un lado a nuestra prota, Catherine (Kate o Katy como más suelen llamarla), trabaja de pasante y cuando su jefa la Gorgona le da la tarea de escribir un relato a raíz de una frase y ella lo consigue entregar a tiempo, es cuando su vida cambiará drásticamente. Sin saberlo y por su obsesión por un escritor del cual todo es anónimo, se ha metido sola en la boca del lobo y no lo sabrá hasta que ya sea tarde.",
      "Por otro lado está nuestro chico, es el principal aunque salen más chicos que tienen cierto tipo de relación con este o con la prota. Es frío, déspota y a veces le dan cambios de humor de repente. Esa actitud es algo que pone en alerta a Kate de forma constante, pero él sabrá jugar muy bien sus cartas hasta el final (no os digo el nombre, os invito a leerlo) 🤭",
      "Aparecen algunos secundarios con peso aunque a destacar están: Sam, Robert, Lori (Dolores), Lisa y alguno que estaba más de paso pero no tienen relevancia como Black por ejemplo.",
      "La historia está narrada todo el tiempo desde el punto de vista de Catherine (excepto algunos trocitos de capítulos que son fragmentos de un manuscrito pero...) y en esta ocasión lo agradezco porque meterme en la mente de los asesinos me hubiese vuelto loca.",
      "Me ha gustado mucho descubrir la pluma del escritor, tiene una narración impecable y además hila muy bien la trama, aunque en cierta forma se ve quién es el malo no te ves venir el giro dramático de los acontecimientos (porque lo hay y bien grande)."
    ],
    conclusionRecommendation: "Esta historia la recomiendo mucho a los amantes del género, es una historia que hace que te metas tanto en la piel de la prota que hay ciertos momentos en los que tuve que parar de leer porque me daba angustia.",
    scoreText: "Le doy 5/5 ⭐"
  },
  en: {
    title: "Featured Blog Review",
    source: "Literary Blog / Bookstagram",
    author: "Rocío (@romanticoslibros)",
    rating: "5/5",
    stars: 5,
    bookTitle: "The Strauss Effect",
    bookAuthor: "@miguel_m.moshiashvili",
    introGreeting: "Hello my romantic book lovers! Happy Friday! 💜",
    introSynopsisNote: "Today I bring you a review of a story I finished just last night. Swipe for the synopsis ✨",
    opinionTitle: "PERSONAL REVIEW",
    paragraphs: [
      "We find ourselves before a psychological thriller brimming with mysteries, doubts, murders, and madness.",
      "On one hand we have our protagonist, Catherine (Kate or Katy as she is often called), who works as an intern. When her boss, 'The Gorgon', gives her the assignment to write a story based on an opening prompt and she manages to deliver it on time, her life changes drastically. Unwittingly, driven by her obsession with an author whose identity remains anonymous, she steps directly into the lion's den and won't realize it until it's far too late.",
      "On the other hand is our main male lead, though other men appear who share connections with him or Catherine. He is cold, despotic, and prone to sudden mood swings. His behavior keeps Kate constantly on guard, yet he plays his cards masterfully right to the end (I won't reveal his name—I invite you to read it!) 🤭",
      "Several key supporting characters make appearances, notably Sam, Robert, Lori (Dolores), Lisa, and a few others passing through without as much bearing, like Black.",
      "The entire story is narrated from Catherine's perspective (except for a few chapter snippets that are excerpts from a manuscript), and this time I truly appreciate that choice—stepping inside the mind of the killers would have driven me mad.",
      "I truly enjoyed discovering this author's voice: the storytelling is impeccable and weaves the plot with remarkable skill. While in some ways you suspect who the villain is, you will never foresee the dramatic twist in events (because there is one, and it is monumental)."
    ],
    conclusionRecommendation: "I highly recommend this book to all lovers of the genre. It immerses you so deeply in the protagonist's skin that there were moments I had to pause reading from sheer suspense.",
    scoreText: "I give it 5/5 ⭐"
  }
};
