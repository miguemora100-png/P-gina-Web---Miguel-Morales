export interface InterviewContent {
  headline: string;
  source: string;
  category: string;
  bioIntro: string[];
  qa: {
    question: string;
    answer: string;
  }[];
  footerNote: string;
}

export const interviewData: { es: InterviewContent; en: InterviewContent } = {
  es: {
    headline: "Miguel Morales Moshiashvili: «Lo más peligroso es no saber cuántos pasos lleva el otro de ventaja»",
    source: "Letras de Misterio",
    category: "Entrevista Exclusiva · Thriller Psicológico",
    bioIntro: [
      "Miguel Morales Moshiashvili nació en Járkov, Ucrania, en 1984. Es escritor de thriller psicológico y doctorando en neuroepigenética. Su fascinación por la memoria y por los mecanismos ocultos de la mente atraviesa su obra, en la que explora esa frontera incierta donde la realidad puede confundirse con la percepción.",
      "En El efecto Strauss, su nueva novela, combina una investigación periodística, un asesino en serie y un inquietante juego de manipulación psicológica. En el centro de la historia se encuentra Catherine Collins, una mujer corriente que se adentra en el universo de Robert Strauss, un escritor tan célebre como enigmático. Lo que comienza como una oportunidad extraordinaria pronto se convierte en una búsqueda de la verdad mucho más peligrosa de lo que ella imaginaba.",
      "Hablamos con Miguel sobre Catherine, los secretos de la novela y el personaje con el que preferiría no cruzarse a oscuras."
    ],
    qa: [
      {
        question: "Eres doctorando en neuroepigenética y escritor de thriller psicológico. ¿Existe alguna conexión entre ambas facetas?",
        answer: "Sí, aunque no escribo mis novelas como una extensión directa de mi trabajo científico. En ambos casos me interesa comprender qué se esconde detrás de lo que vemos: cómo funciona la mente, de qué manera construimos nuestros recuerdos y hasta qué punto podemos confiar en nuestra propia percepción. La ciencia busca respuestas mediante la evidencia; el thriller, en cambio, permite explorar las dudas. Creo que ambas facetas nacen de la misma necesidad de comprender."
      },
      {
        question: "¿Qué encontrará el lector en El efecto Strauss?",
        answer: "Una historia de suspense psicológico en la que nada es exactamente lo que parece. Hay un asesino en serie, una investigación periodística, manipulación y una verdad aterradora que se va revelando poco a poco. Pero, por encima de todo, la novela plantea una pregunta: ¿qué sucede cuando aquello que creemos saber sobre una persona —o incluso sobre nuestra propia vida— comienza a desmoronarse?"
      },
      {
        question: "¿Qué tiene Catherine Collins que no posea ningún otro personaje de la novela?",
        answer: "Catherine no parte desde una posición de poder. No tiene una preparación especial ni cuenta con todas las respuestas. Su motor es la necesidad de comprender. Es una mujer corriente enfrentándose a algo muchísimo más grande que ella, y precisamente eso la hace tan humana.\n\nSu mayor fortaleza también puede convertirse en su mayor peligro: no sabe mirar hacia otro lado cuando percibe que algo no encaja. Necesita llegar hasta el final, incluso cuando hacerlo significa acercarse demasiado a una verdad que quizá habría sido mejor no descubrir."
      },
      {
        question: "¿Cuál fue la escena más difícil de escribir?",
        answer: "La escena en la que Catherine cruza una puerta y descubre que la historia que creía estar viviendo no era lo que imaginaba. Era un momento decisivo porque el giro debía sorprender al lector sin parecer arbitrario ni forzado.\n\nEl desafío consistía en ocultar la verdad a plena vista. Las pistas tenían que estar presentes desde el principio, pero integradas de tal manera que solo adquirieran su verdadero significado después de la revelación. Quería que, al llegar a ese punto, el lector sintiera la necesidad de volver atrás y comprobara que todo había estado allí desde el comienzo."
      },
      {
        question: "¿Planificas tus novelas o te lanzas a escribir sin saber adónde te llevará la historia?",
        answer: "Necesito conocer el final antes de escribir la primera página. En un thriller, la estructura es fundamental: cada revelación, cada silencio y cada pista deben conducir hacia algún lugar.\n\nSin embargo, no planifico hasta el último detalle. También me gusta dejarles cierto margen a los personajes para que me sorprendan. Conozco el destino, pero durante el recorrido pueden surgir decisiones, escenas o relaciones que no había previsto inicialmente. Ese equilibrio entre control y descubrimiento es una de las partes que más disfruto de la escritura."
      },
      {
        question: "¿Café, té o chocolate caliente para escribir?",
        answer: "Café, sin duda. Muchos capítulos de El efecto Strauss nacieron de madrugada, con la casa en silencio y una taza al lado del teclado. Esas horas tienen algo especial: desaparecen las interrupciones y parece que uno puede entrar con mayor facilidad en la atmósfera de la historia."
      },
      {
        question: "Si tus personajes cobraran vida, ¿con cuál preferirías no cruzarte a oscuras?",
        answer: "Elegiría a Clayton Turner. Con Strauss sabes que existe algo inquietante; percibes que hay algo detrás de su forma de actuar. Con Turner, en cambio, nunca estás seguro de qué sabe, qué oculta o cuántos pasos lleva de ventaja.\n\nY eso es mucho más peligroso. El villano que se anuncia permite que te prepares. El que nunca levanta la voz puede estar controlándolo todo antes de que siquiera comprendas que formas parte de su juego."
      },
      {
        question: "Para terminar, ¿con qué sensación te gustaría que se quedara el lector después de cerrar el libro?",
        answer: "Me gustaría que sintiera que la historia ha terminado, pero que la inquietud permanece. Que recuerde ciertos detalles y se pregunte cómo pudo interpretarlos de otra manera. Para mí, un buen thriller no concluye por completo en la última página: continúa en la mente del lector durante un tiempo."
      }
    ],
    footerNote: "El efecto Strauss es una novela sobre la verdad, la manipulación y los riesgos de adentrarse en la mente de alguien que siempre parece llevar varios movimientos de ventaja."
  },
  en: {
    headline: "Miguel Morales Moshiashvili: «The most dangerous thing is not knowing how many steps ahead the other person is»",
    source: "Mystery Letters",
    category: "Exclusive Interview · Psychological Thriller",
    bioIntro: [
      "Miguel Morales Moshiashvili was born in Kharkiv, Ukraine, in 1984. He is a psychological thriller author and a PhD candidate in neuroepigenetics. His fascination with memory and the hidden mechanisms of the human mind runs through his entire body of work, exploring that fragile boundary where reality blurs into perception.",
      "In The Strauss Effect, his new novel, he blends an investigative journalism quest, a serial killer, and an unsettling game of psychological manipulation. At the core of the story is Catherine Collins, an ordinary woman who enters the secretive world of Robert Strauss, an author as acclaimed as he is enigmatic. What starts as an extraordinary opportunity quickly turns into a search for truth far more perilous than she ever imagined.",
      "We spoke with Miguel about Catherine, the secrets of the novel, and the character he would least want to run into in the dark."
    ],
    qa: [
      {
        question: "You are a PhD researcher in neuroepigenetics and a psychological thriller author. Is there a connection between these two worlds?",
        answer: "Yes, although I don't write my novels as a direct extension of my scientific research. In both cases, I am fascinated by understanding what lies beneath what we observe: how the mind operates, how we reconstruct our memories, and how far we can genuinely trust our own perceptions. Science seeks definitive answers through empirical evidence; the thriller genre, by contrast, gives us freedom to explore doubt. I believe both pursuits stem from the exact same hunger to understand."
      },
      {
        question: "What will readers find in The Strauss Effect?",
        answer: "A psychological suspense story where nothing is quite what it seems. There is a serial killer, an investigative reporting probe, manipulation, and a terrifying truth that unravels layer by layer. Above all, the novel asks a fundamental question: what happens when what you thought you knew about someone—or even about your own life—begins to crumble?"
      },
      {
        question: "What does Catherine Collins possess that no other character in the novel has?",
        answer: "Catherine doesn't start from a position of power. She has no special training, nor does she possess all the answers. Her engine is the pure necessity to comprehend. She is an ordinary woman confronting something overwhelmingly larger than herself, and that is precisely what makes her so deeply human.\n\nHer greatest strength is also her greatest danger: she cannot look away when something doesn't fit. She must see it through to the end, even if doing so means getting dangerously close to a truth that might have been safer left undiscovered."
      },
      {
        question: "What was the most challenging scene to write?",
        answer: "The scene where Catherine steps across a doorway and realizes the reality she thought she was living was completely different from what she imagined. It was a pivotal moment because the plot twist had to shock the reader without ever feeling arbitrary or unearned.\n\nThe challenge was hiding the truth in plain sight. Every clue had to be planted from the very beginning, yet woven in such a way that their true meaning would only become clear after the reveal. I wanted readers, upon reaching that scene, to feel the urge to flip back and see that it was all right there from page one."
      },
      {
        question: "Do you meticulously outline your plots or do you jump into writing to see where the story leads?",
        answer: "I need to know the ending before writing the very first line. In a psychological thriller, structural architecture is everything: every revelation, every silence, and every clue must lead purposefully somewhere.\n\nHowever, I do not map out every minute detail. I like to leave space for the characters to surprise me. I know the destination, but during the journey, unforeseen choices, scenes, or relationships often emerge. That dynamic balance between control and discovery is one of the aspects I cherish most about writing."
      },
      {
        question: "Coffee, tea, or hot chocolate while writing?",
        answer: "Coffee, without hesitation. Many chapters of The Strauss Effect were born in the dead of night, with the house dead silent and a steaming mug right beside the keyboard. Those nocturnal hours carry something rare: interruptions vanish, and you immerse yourself with far greater depth into the atmosphere of the story."
      },
      {
        question: "If your characters came to life, who would you least want to cross paths with in the dark?",
        answer: "I would choose Clayton Turner. With Strauss, you already sense something eerie; you perceive something lurking behind his demeanor. With Turner, on the other hand, you never know what he knows, what he conceals, or how many steps ahead he really is.\n\nAnd that is far more dangerous. The villain who announces himself allows you to brace for impact. The one who never raises his voice can already control everything before you even realize you are playing his game."
      },
      {
        question: "To wrap up: what lingering feeling do you hope readers are left with when they close the book?",
        answer: "I want them to feel that while the story has reached its conclusion, the psychological tension lingers on. I want them to remember specific details and wonder how they could have interpreted them differently. For me, a truly great thriller doesn't end on the final page—it continues echoing in the reader's mind."
      }
    ],
    footerNote: "The Strauss Effect is a novel about truth, manipulation, and the peril of stepping inside the mind of someone who always seems several moves ahead."
  }
};
