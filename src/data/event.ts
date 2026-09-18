export interface EventDetails {
  title: string;
  subtitle: string;
  dates: string;
  datesShort: string;
  timeEstimate: string;
  location: string;
  city: string;
  organizer: string;
  description: string[];
  highlights: string[];
  mapQuery: string;
  calendarUrl: string;
}

export const eventData: { es: EventDetails; en: EventDetails } = {
  es: {
    title: "15.ª Primavera del Libro",
    subtitle: "Feria del libro independiente y encuentro con lectores",
    dates: "Viernes 9, sábado 10 y domingo 11 de octubre de 2026",
    datesShort: "9 - 11 Oct 2026",
    timeEstimate: "11:00 a 20:00 hrs",
    location: "Centro Cultural Estación Mapocho",
    city: "Santiago de Chile",
    organizer: "Editoriales de Chile",
    description: [
      "Miguel Morales Moshiashvili participará en la 15.ª edición de la Primavera del Libro en Santiago de Chile, uno de los encuentros literarios más destacados del cono sur.",
      "El autor estará presente durante las tres jornadas firmando ejemplares de «El efecto Strauss» y «El Señuelo», y participará en un conversatorio especial sobre los mecanismos psicológicos del suspense, la neuroepigenética y el arte de ocultar la verdad a plena vista."
    ],
    highlights: [
      "Firma de ejemplares de «El efecto Strauss» y «El Señuelo»",
      "Conversatorio y charla abierta con lectores sobre thriller psicológico",
      "Stands de editoriales independientes y novedades literarias",
      "Entrada libre y gratuita sujeta a aforo del recinto"
    ],
    mapQuery: "Centro Cultural Estación Mapocho, Santiago, Chile",
    calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=15.%C2%AA+Primavera+del+Libro+-+Miguel+Morales&dates=20261009T140000Z/20261011T230000Z&details=Firma+de+libros+y+presentacion+de+Miguel+Morales+Moshiashvili+(El+efecto+Strauss)&location=Centro+Cultural+Estacion+Mapocho,+Santiago+de+Chile"
  },
  en: {
    title: "15th Primavera del Libro",
    subtitle: "Independent book fair and reader meet-up",
    dates: "Friday Oct 9, Saturday Oct 10 & Sunday Oct 11, 2026",
    datesShort: "Oct 9 - 11, 2026",
    timeEstimate: "11:00 AM - 8:00 PM",
    location: "Centro Cultural Estación Mapocho",
    city: "Santiago, Chile",
    organizer: "Editoriales de Chile",
    description: [
      "Miguel Morales Moshiashvili will take part in the 15th edition of Primavera del Libro in Santiago, Chile, one of the foremost literary gatherings in the region.",
      "The author will be present across all three days signing copies of «The Strauss Effect» and «The Decoy», alongside a featured talk on the psychological mechanisms of suspense, neuroepigenetics, and the craft of concealing truth in plain sight."
    ],
    highlights: [
      "Book signing for «The Strauss Effect» and «The Decoy»",
      "Q&A session and open discussion with thriller readers",
      "Independent publisher showcases and new releases",
      "Free admission subject to venue capacity"
    ],
    mapQuery: "Centro Cultural Estación Mapocho, Santiago, Chile",
    calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=15th+Primavera+del+Libro+-+Miguel+Morales&dates=20261009T140000Z/20261011T230000Z&details=Book+signing+and+presentation+with+Miguel+Morales+Moshiashvili+(The+Strauss+Effect)&location=Centro+Cultural+Estacion+Mapocho,+Santiago+de+Chile"
  }
};
