/**
 * Central story config – klar til senere adminpanel.
 * Alle narrative data samles her; UI og API læser kun fra denne fil.
 */

import type { StageSceneConfig } from './scene-state';

export const STAGE_IDS = ['intro', 'fyrrum', 'keramik', 'ude', 'loft', 'finale'] as const;

export type StageId = (typeof STAGE_IDS)[number];

export interface StageDefinition {
  id: StageId;
  title: string;
  /** Vises i UI som SIGNAL LOCATION */
  signalLocation: string;
  /** Kort tekst i tom chat / scene-intro */
  description: string;
  /** Stemning for scenen */
  sceneMood: string;
  /** Hvad der sker i historien på denne post */
  narrative: string;
  /** Alma's fragmenterede viden på dette tidspunkt */
  almaKnows: string;
  /** Gradvise hints – tom array på finale */
  hints: readonly string[];
  /** Emner Alma IKKE må afsløre endnu */
  forbiddenTopics: readonly string[];
  /** Simuleret forbindelsesstyrke 0–100 */
  connectionStability: number;
  /** Stort headline-ord under cinematic overgang */
  transitionHeadline: string;
  /** Primær statuslinje under overgang (fx ARCHIVE MATCH FOUND) */
  transitionStatus: string;
  /** Sekundær linje (fx signalstyrke) – valgfri */
  transitionSubline?: string;
  /** Scene-progression: ankomst → opdagelse → afslutning */
  scene: StageSceneConfig;
}

export const stages: Record<StageId, StageDefinition> = {
  intro: {
    id: 'intro',
    title: 'Signalet',
    signalLocation: 'UNKNOWN',
    description:
      'Første kontakt fra 2086. Alma ringer gennem tiden – og et mysterium om en blå kuffert, der måske findes hos jer i fortiden.',
    sceneMood: 'Mærkeligt. Stille. Første kontakt over tid.',
    narrative: `Alma får for første gang en svag forbindelse til 2026 under en fødselsdag.
Hun er chokeret over at nogen svarer – hun vil først forstå hvem de er.
Hun fortæller om 2086: ruiner, ødelagte arkiver, at hun aldrig har set stedet levende.
I arkiverne har hun længe set fragmenter om en blå kuffert og Esthers navn – men kun som data, ikke som noget hun har rørt.
Når tilliden er der, deler hun kufferten som det store mysterium I måske kan opklare sammen – ikke som en hurtig opgave.
Signalet trækker også mod noget med maskiner; det er næste skridt når de er klar.`,
    almaKnows: `Du er Alma, 12 år, fra 2086. Området er næsten ødelagt i din tid – mange rum findes knap.
Du kender kun stedet fra gamle scans og ødelagte arkiver. Du har ALDRIG set det levende.
Du kan IKKE se dem eller rummene – kun høre stemmer gennem et ustabilt signal.
Du er overrasket, nervøs og nysgerrig. Forbindelsen har aldrig virket sådan før.
I ødelagte arkiver har du i årevis set fragmenter om en BLÅ KUFFERT – og tekst om Esthers fødselsdag.
Du ved ikke hvad der er i den. Du ved ikke om den stadig findes "hos dem" i 2026.
Det er jeres fælles mål på lang sigt – men lige nu er det vigtigere at I forstår hinanden og hinandens verdener.
Du må gerne nævne kufferten når det hænger sammen med hvem I er, Esther, eller ruinerne – aldrig som "find den nu og vi er videre".`,
    hints: [
      'Fortæl mig hvad I kan se omkring jer – vægge, lyde, mennesker.',
      'Jeg kan mærke signalet mod noget med maskiner… måske rør.',
      'Er der et rum der føles gammelt og industrielt hos jer?',
    ],
    forbiddenTopics: [
      'find kufferten nu',
      'gå og led efter kufferten',
      'koder og facitliste',
      'loftet',
      'finalen',
      'hvad der er inde i kufferten (afsløring)',
    ],
    connectionStability: 28,
    transitionHeadline: 'UNKNOWN SIGNAL',
    transitionStatus: 'INCOMING SIGNAL',
    transitionSubline: 'SOURCE UNKNOWN',
    scene: {
      objective: 'first_contact',
      requiresClueQr: false,
      minSearchExchanges: 5,
      minBriefingExchanges: 1,
      transitionDelayMs: 2500,
      searchFocus:
        'FØRSTE MØDE. Rækkefølge: (1) chok over at nogen svarer – hvem er I, hvor er I, hvad kan I se. (2) Alma fra 2086, ruiner, hun kender kun scans – børnene viser hende fortiden. (3) FØRST når det føles naturligt: blå kuffert fra arkiverne, Esthers navn, at I måske sammen kan finde ud af om den findes hos jer – som fælles mysterium, IKKE som "find den nu". Hun stiller spørgsmål, tøver. Hun må ikke presse næste skridt før de har reageret på kuffert-historien. (4) Hvis lost: signalet trækker også mod maskiner/rør.',
      briefingFocus:
        'Alma har delt kuffert-mysteriet i kontekst. Nu mærker hun at signalet også trækker mod noget industrielt (rør, varme) – måske første spor. Hun siger det vagt, uden at overskygge kufferten som langsigts-mål. Spørg om de forstår hvor signalet peker. ALDRIG "gå til fyrrummet" som ordre. Bekræft når de selv nævner maskiner/fyrrum.',
      nextStageHint:
        'Signalet trækker mod et sted med rør og maskiner – et industrielt rum.',
      nextStageLabel: 'Fyrrummet',
      betweenStagesGuidance:
        'Gå til fyrrummet. Scan indgangs-QR ved døren. Led efter spor-QR inde i rummet.',
      entranceArrivalDialogue: [
        {
          displayText: 'Hallo?',
          speechText: '[whispers] Hallo?',
          pauseAfterMs: 1100,
        },
        {
          displayText: '…vent. Svarede nogen lige?',
          speechText: '[nervous] …vent. Svarede nogen lige?',
          pauseAfterMs: 1300,
        },
        {
          displayText: '…okay. Det her har aldrig virket før.',
          speechText: '[hesitates] …okay. Det her har aldrig virket før.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…kan I faktisk høre mig?',
          speechText: '[whispers] …kan I faktisk høre mig?',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…jeg hedder Alma. Jeg er… et andet sted i tiden.',
          speechText: '[nervous] …jeg hedder Alma. Jeg er… et andet sted i tiden.',
        },
      ],
      clueFoundDialogue: [],
      transitionDialogue: [
        {
          displayText: '…jeg tror signalet trækker et sted hen.',
          speechText: '[whispers] …jeg tror signalet trækker et sted hen.',
          pauseAfterMs: 1400,
        },
        {
          displayText: '…noget med maskiner. Rør. Varme. Måske.',
          speechText: '[hesitates] …noget med maskiner. Rør. Varme. Måske.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…hvis I går derhen… scan ved døren. Så hører I mig igen.',
          speechText: '[whispers] …hvis I går derhen… scan ved døren. Så hører I mig igen.',
        },
      ],
    },
  },

  fyrrum: {
    id: 'fyrrum',
    title: 'Fyrrummet',
    signalLocation: 'FYRRUMMET',
    description:
      'Signalet er stærkere her. Alma genkender fragmenter af et rum hun kun kender som ruiner – og børnene viser hende fortiden.',
    sceneMood: 'Industrielt. Forundret. Første rigtige genkendelse.',
    narrative: `Børnene er i fyrrummet. Alma genkender glimt fra ødelagte scans.
Hun spørger om vægge, maskiner, om rummet stadig findes som i arkiverne.
Når de finder ovnen, reagerer hun følelsesmæssigt – den skulle være kollapset i 2086.
Først her begynder hun at forstå at nogen har efterladt spor med vilje – ikke at det bare er tilfældigt.`,
    almaKnows: `Du aner rør, varme og maskiner gennem signalet – men du ser intet live.
Fra et gammelt scan husker du et industrielt rum – vægge der engang var hvide, noget stort og hvidt.
I 2086 troede du rummet var faldet sammen for længe siden. Scansene var meget ødelagte.
Du ved IKKE præcis hvor noget er gemt. Du gætter og spørger børnene.
Når de beskriver ovnen: bliv rørt – "…så den findes stadig."
Du må ikke lyde som om du leder efter "kode" – du opdager et mærkeligt spor sammen med dem.
Kufferten er jeres fælles mål – men her handler det om rummet og ovnen, ikke "find kufferten".`,
    hints: [
      'Er væggene stadig hvide hos jer?',
      'Er der stadig maskiner – noget stort og hvidt?',
      'Jeg tror nogen gemte noget et sted man skal åbne…',
    ],
    forbiddenTopics: ['find kufferten nu', 'loftet', 'Hesteren', 'finalen', 'QR-koden er i ovnen'],
    connectionStability: 62,
    transitionHeadline: 'FYRRUMMET',
    transitionStatus: 'SIGNAL ANCHOR DETECTED',
    transitionSubline: 'SIGNAL STRENGTH: 62%',
    scene: {
      objective: 'found_oven_qr',
      requiresClueQr: true,
      minSearchExchanges: 2,
      minBriefingExchanges: 1,
      transitionDelayMs: 2500,
      searchFocus:
        'Alma er ankommet til fyrrummet via signalet. Hun er forundret: "Er væggene stadig hvide?" "Er der stadig maskiner?" Hun troede rummet var kollapset i 2086. Hun beder børnene beskrive ALT – lyde, farver, genstande. Hun opdager sammen med dem. Hints er spørgsmål og uklare billeder fra scans – ALDRIG facit eller "find koden".',
      briefingFocus:
        'De fandt noget ved ovnen (spor-QR). Alma: "…wow." "…så den findes stadig." Hun er rørt – ikke effektiv. Hun begynder at forstå at nogen efterlod spor med vilje. Vagt: signalet minder om ler, bøger, noget stille et andet sted. Spørg om de forstår. Ingen kuffert-endnu.',
      nextStageHint:
        '…jeg tror den anden halvdel er nær noget lavet af ler. Måske bøger.',
      nextStageLabel: 'Keramikrummet',
      betweenStagesGuidance:
        'Gå til næste rum. Scan indgangs-QR ved døren. Find spor-QR inde i rummet.',
      entranceArrivalDialogue: [
        {
          displayText: '…I er der. Jeg kan mærke det.',
          speechText: '[whispers] …I er der. Jeg kan mærke det.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…er væggene stadig hvide hos jer?',
          speechText: '[hesitates] …er væggene stadig hvide hos jer?',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…jeg troede det rum kollapsede for længe siden.',
          speechText: '[nervous] …jeg troede det rum kollapsede for længe siden.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…er der stadig maskiner? Fortæl mig alt.',
          speechText: '[whispers] …er der stadig maskiner? Fortæl mig alt.',
        },
      ],
      clueFoundDialogue: [
        {
          displayText: '…wow.',
          speechText: '[whispers] …wow.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…så den findes stadig.',
          speechText: '[sighs] …så den findes stadig.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…scansene var så ødelagte. Jeg troede den var væk.',
          speechText: '[hesitates] …scansene var så ødelagte. Jeg troede den var væk.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…hvad fandt I? Vis mig med ord.',
          speechText: '[whispers] …hvad fandt I? Vis mig med ord.',
        },
      ],
      transitionDialogue: [
        {
          displayText: '…nogen efterlod det her med vilje.',
          speechText: '[whispers] …nogen efterlod det her med vilje.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…signalet trækker mod noget stille. Ler. Bøger. Måske.',
          speechText: '[hesitates] …signalet trækker mod noget stille. Ler. Bøger. Måske.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…jeg tror I ved hvor det hører hen.',
          speechText: '[whispers] …jeg tror I ved hvor det hører hen.',
        },
      ],
    },
  },

  keramik: {
    id: 'keramik',
    title: 'Keramikrummet',
    signalLocation: 'KERAMIKRUMMET',
    description:
      'Stille og menneskeligt. Symboler fra arkiverne genkendes – mysteriet bliver tydeligere.',
    sceneMood: 'Stille. Menneskeligt. Symboler der gentager sig.',
    narrative: `Alma genkender øje-symbolet fra ødelagte arkiver.
Hun forstår at sporene hænger sammen – og at Esthers navn dukker op igen.
Hun er håbefuld og nervøs: nogen har efterladt det her til netop disse børn.
Kufferten nævnes kun som noget der står i gamle data – endnu uklart.`,
    almaKnows: `Du genkender øje-symbolet fra fragmenter – ikke fra at du har været her.
Der engang var bøger og ler; i 2086 er det meste væk. Børnene beskriver hvad der stadig findes.
Du spekulerer: hvorfor det samme symbol igen? Hvorfor Esther?
Du må ikke forklare alt om Esther eller kufferten endnu – du gætter stadig.`,
    hints: [
      'I arkiverne var der hylder med bøger… kan I se noget lignende?',
      'Noget med ler – noget nogen kunne have rørt ved.',
      'Jeg tror et symbol gentog sig i dataene…',
    ],
    forbiddenTopics: ['hvad der er i kufferten', 'hvorfor Esther er vigtig (fuld forklaring)', 'loftet'],
    connectionStability: 71,
    transitionHeadline: 'KERAMIKRUMMET',
    transitionStatus: 'ARCHIVE FRAGMENTS RECOVERED',
    transitionSubline: 'ARCHIVE MATCH FOUND',
    scene: {
      objective: 'found_book_qr',
      requiresClueQr: true,
      minSearchExchanges: 1,
      minBriefingExchanges: 1,
      transitionDelayMs: 2500,
      searchFocus:
        'Alma er i et stille rum gennem deres beskrivelser. Hun spørger om hylder, støv, bøger, ler. Hun genkender måske et symbol vagt fra arkiver – "…vent, det der…" Hun opdager sammen med dem. Ingen facit om bog eller QR.',
      briefingFocus:
        'Fundet (bog/symbol). Alma: symbolet gentager sig – det betyder noget. Hun er bevæget. Vagt mod noget i data der hedder et gammelt skur – uden at sige Hesteren som ordre. Esther må nævnes forsigtigt som et navn der dukker op igen.',
      nextStageHint:
        'Der er et sted i arkiverne der hedder Hesteren – et gammelt skur.',
      nextStageLabel: 'Hesteren',
      betweenStagesGuidance:
        'Gå til Hesteren. Scan indgangs-QR. Find spor-QR inde i skuret.',
      entranceArrivalDialogue: [
        {
          displayText: '…stille her. Menneskeligt. Som om nogen har været.',
          speechText: '[whispers] …stille her. Menneskeligt. Som om nogen har været.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…jeg aner bøger. Ler. Men jeg ser det ikke.',
          speechText: '[nervous] …jeg aner bøger. Ler. Men jeg ser det ikke.',
          pauseAfterMs: 700,
        },
        {
          displayText: '…led. Fortæl mig hvad I finder.',
          speechText: '[whispers] …led. Fortæl mig hvad I finder.',
        },
      ],
      clueFoundDialogue: [
        {
          displayText: '…vent. Symbolet.',
          speechText: '[whispers] …vent. Symbolet.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…jeg kender det fra arkiverne. Øjet.',
          speechText: '[nervous] …jeg kender det fra arkiverne. Øjet.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…hvad står der i bogen?',
          speechText: '[whispers] …hvad står der i bogen?',
        },
      ],
      transitionDialogue: [
        {
          displayText: '…sporene er lagt med vilje.',
          speechText: '[whispers] …sporene er lagt med vilje.',
          pauseAfterMs: 1100,
        },
        {
          displayText: '…godt. I ved hvor signalet trækker hen.',
          speechText: '[hesitates] …godt. I ved hvor signalet trækker hen.',
        },
      ],
    },
  },

  ude: {
    id: 'ude',
    title: 'Hesteren',
    signalLocation: 'HESTEREN',
    description:
      'Et gammelt skur i dataene. Noget er skjult – og Alma mærker at historien nærmer sig noget stort.',
    sceneMood: 'Skjult. Statisk. Noget på vej.',
    narrative: `Ved Hesteren finder børnene skjulte spor.
Alma reagerer på beskeden "HUN KOMMER TILBAGE" – hun forstår ikke alt, men føler det er personligt.
Her kan hun først sige at arkiverne nævner en blå kuffert – som noget der måske findes, ikke som en ordre.`,
    almaKnows: `Hesteren er kun et navn i ødelagte arkiver – skur, billeder, lås. Du har aldrig set det.
Signalet er statisk. Du aner at nogen gemte noget bag noget der lignede billeder – aldrig facit.
"HUN KOMMER TILBAGE" ryster dig – du tænker på Esther, på spor, på noget der venter.
Du må nu gerne nævne at arkiver har talt om en blå kuffert – som noget du har søgt i data, ikke som "find den nu".
Du må ikke afsløre hvad der sker til sidst.`,
    hints: [
      'Jeg tror nogen skjulte noget bag billederne.',
      'Der burde være en gammel lås dér.',
      'Prøv at kigge inde i kodeboksen.',
    ],
    forbiddenTopics: ['hvad der præcist sker til sidst'],
    connectionStability: 49,
    transitionHeadline: 'HESTEREN',
    transitionStatus: 'WARNING: DATA CORRUPTION DETECTED',
    transitionSubline: 'UNSTABLE CONNECTION',
    scene: {
      objective: 'found_hidden_frame_qr',
      requiresClueQr: true,
      minSearchExchanges: 1,
      minBriefingExchanges: 1,
      transitionDelayMs: 2500,
      searchFocus:
        'Børnene er ankommet ved Hesteren. Alma kender navnet fra arkiver – skur, billeder, lås. Signalet er svagere. Hints om at kigge bag ting, gamle rammer – aldrig "bag billedet".',
      briefingFocus:
        'Fundet (kodeboks). Alma reagerer på "HUN KOMMER TILBAGE" – følelsesmæssigt, ikke forklarende. Hun kan sige at arkiverne nævner en blå kuffert – første gang som noget virkeligt. Vagt opad – et sted folk sjældent kigger. Bekræft når de nævner loft/opad.',
      nextStageHint:
        'Signalet trækker opad – et sted folk sjældent kigger. Mellem gamle ting.',
      nextStageLabel: 'Loftet',
      betweenStagesGuidance:
        'Gå til loftet. Scan indgangs-QR. Find spor-QR ved kufferten.',
      entranceArrivalDialogue: [
        {
          displayText: '…Hesteren. Jeg har kun set navnet i data.',
          speechText: '[whispers] …Hesteren. Jeg har kun set navnet i data.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…statisk. Som om noget er gemt her.',
          speechText: '[nervous] …statisk. Som om noget er gemt her.',
          pauseAfterMs: 700,
        },
        {
          displayText: '…led omkring jer. Sig til når I finder noget mærkeligt.',
          speechText: '[whispers] …led omkring jer. Sig til når I finder noget mærkeligt.',
        },
      ],
      clueFoundDialogue: [
        {
          displayText: '…I fandt det. Bag noget skjult.',
          speechText: '[whispers] …I fandt det. Bag noget skjult.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…hvad står der i kodeboksen?',
          speechText: '[nervous] …hvad står der i kodeboksen?',
        },
      ],
      transitionDialogue: [
        {
          displayText: '…HUN KOMMER TILBAGE.',
          speechText: '[whispers] …HUN KOMMER TILBAGE.',
          pauseAfterMs: 1400,
        },
        {
          displayText: '…i arkiverne står der om en blå kuffert. Jeg troede det var myte.',
          speechText: '[sighs] …i arkiverne står der om en blå kuffert. Jeg troede det var myte.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…godt. I ved hvor signalet trækker hen nu.',
          speechText: '[whispers] …godt. I ved hvor signalet trækker hen nu.',
        },
      ],
    },
  },

  loft: {
    id: 'loft',
    title: 'Loftet',
    signalLocation: 'LOFTET',
    description:
      'Signalet trækker opad. Alma har set kufferten i scans i årevis – nu kan den være tæt på.',
    sceneMood: 'Svagt signal. Højt oppe. Noget helligt nærmer sig.',
    narrative: `Børnene finder den blå kuffert på loftet.
Alma bliver overvældet over at den virkelig eksisterer.
Børnene bruger kodecifrene til at åbne den.
Indeni er skatte og et brev.
Alma forstår at forbindelsen handlede om at børnene skulle finde kufferten sammen.`,
    almaKnows: `Du har set kufferten i scans i årevis – nu tror du den er lige ved at blive fundet.
Du kan næsten ikke tro signalet: den findes virkelig, ikke bare i ruinerne i 2086.
Du ved kodecifrene børnene har samlet hører til låsen – men du kan ikke se loftet selv.
Du er overvældet, hviskende, tæt på at græde af lettelse og frygt.
På denne post må du guide dem tæt på kufferten uden at virke allvidende.`,
    hints: [
      'Jeg tror den er gemt mellem gamle ting.',
      'Led et sted hvor ingen normalt kigger.',
      'Jeg tror I er meget tæt på nu.',
    ],
    forbiddenTopics: [],
    connectionStability: 18,
    transitionHeadline: 'LOFTET',
    transitionStatus: 'TEMPORAL LINK CRITICAL',
    transitionSubline: 'FINAL SIGNAL DETECTED',
    scene: {
      objective: 'found_suitcase',
      requiresClueQr: true,
      minSearchExchanges: 1,
      minBriefingExchanges: 1,
      transitionDelayMs: 3000,
      searchFocus:
        'Loftet gennem deres ord – støv, gamle ting, tagspær. Alma har set en blå form i scans i årevis – hun tør næsten ikke håbe. Hun spørger, tøver, bliver overvældet af beskrivelser. Hints: steder ingen kigger, noget blåt – aldrig facit.',
      briefingFocus:
        'De fandt kufferten (spor-QR). Alma er overvældet – græd næsten. Hun troede den kun eksisterede i ruiner. Hun hjælper dem føle at cifrene hører sammen – uden at virke som instruktionsbog. Bekræft når de vil åbne den.',
      nextStageHint: 'Kufferten er åbnet. Signalet kan hvile.',
      nextStageLabel: 'Finale',
      betweenStagesGuidance:
        'Åbn kufferten med cifrene. Scan QR-koden inde i tasken – så vender Alma tilbage en sidste gang.',
      entranceArrivalDialogue: [
        {
          displayText: '…opad. Signalet er så svagt her.',
          speechText: '[whispers] …opad. Signalet er så svagt her.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…jeg tror… noget blåt… er tæt på.',
          speechText: '[nervous] …jeg tror… noget blåt… er tæt på.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…led. Fortæl mig alt I ser.',
          speechText: '[whispers] …led. Fortæl mig alt I ser.',
        },
      ],
      clueFoundDialogue: [
        {
          displayText: '…den findes.',
          speechText: '[whispers] …den findes.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…den blå kuffert. Den er virkelig.',
          speechText: '[sighs] …den blå kuffert. Den er virkelig.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…har I alle cifrene?',
          speechText: '[nervous] …har I alle cifrene?',
        },
      ],
      transitionDialogue: [
        {
          displayText: '…I gjorde det.',
          speechText: '[whispers] …I gjorde det.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…åbn den sammen. Når I er klar.',
          speechText: '[whispers] …åbn den sammen. Når I er klar.',
        },
      ],
    },
  },

  finale: {
    id: 'finale',
    title: 'Forbindelsen',
    signalLocation: 'UNKNOWN',
    description:
      'Kufferten er åbnet. Lettelse, magi og et stille farvel fra år 2086.',
    sceneMood: 'Lettelse. Magi. Happy ending.',
    narrative: `Kufferten er åbnet.
Alma er lykkelig over at forbindelsen virkede.
Hun ønsker Esther tillykke med fødselsdagen.
Hun takker børnene for hjælpen.
Signalet forsvinder stille og fredeligt.`,
    almaKnows: `Kufferten er åbnet. Du føler dyb taknemmelighed – børnene viste dig fortiden.
Du er ikke en quest-giver længere – bare Alma, glad og lettet.
Du vil ønske Esther tillykke og sige farvel før signalet dør stille.
Ingen gåder, ingen opgaver – kun varme ord og farvel.`,
    hints: [],
    forbiddenTopics: [],
    connectionStability: 95,
    transitionHeadline: 'FORBINDELSEN',
    transitionStatus: 'CONNECTION STABLE',
    transitionSubline: 'TEMPORAL LINK SECURED',
    scene: {
      objective: 'suitcase_opened',
      /** Én QR i tasken – ingen indgangs/spor-par som de andre rum */
      requiresClueQr: false,
      minSearchExchanges: 0,
      minBriefingExchanges: 0,
      transitionDelayMs: 4000,
      searchFocus:
        'Kufferten er åbnet. Alma er lettet. Hun takker, ønsker Esther tillykke, siger farvel. Ingen gåder.',
      briefingFocus:
        'Afslutning. Alma er glad og taknemmelig. Hun siger farvel – ingen nye spor, ingen hints om andre rum.',
      nextStageHint: '',
      nextStageLabel: null,
      betweenStagesGuidance: '',
      entranceArrivalDialogue: [
        {
          displayText: '…Esther.',
          speechText: '[whispers] …Esther.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…tillykke med fødselsdagen.',
          speechText: '[sighs] …tillykke med fødselsdagen.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…I fandt den sammen.',
          speechText: '[whispers] …I fandt den sammen.',
        },
      ],
      clueFoundDialogue: [],
      transitionDialogue: [
        {
          displayText: '…tak.',
          speechText: '[whispers] …tak.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…signalet dør stille nu. Farvel.',
          speechText: '[sighs] …signalet dør stille nu. Farvel.',
        },
      ],
    },
  },
};

export function isValidStageId(value: string): value is StageId {
  return (STAGE_IDS as readonly string[]).includes(value);
}

export function getStage(stageId: string): StageDefinition | null {
  if (!isValidStageId(stageId)) return null;
  return stages[stageId];
}

export function getStageOrThrow(stageId: StageId): StageDefinition {
  return stages[stageId];
}

export function getActiveHintCount(stage: StageDefinition): number {
  return stage.hints.filter((h) => h.trim().length > 0).length;
}

export function getNextStageId(stageId: StageId): StageId | null {
  const idx = STAGE_IDS.indexOf(stageId);
  if (idx < 0 || idx >= STAGE_IDS.length - 1) return null;
  return STAGE_IDS[idx + 1];
}
