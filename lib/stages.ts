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
      'Første kontakt fra år 2086. Alma har fundet en blå kuffert – og tror koderne findes her på området.',
    sceneMood: 'Mærkeligt. Overraskende. Første kontakt.',
    narrative: `Alma får kontakt til børnene under Esthers fødselsdag.
Hun fortæller at hun kommer fra år 2086.
Hun har fundet en blå kuffert med teksten: "ÅBNES PÅ ESTHERS 10 ÅRS FØDSELSDAG".
Hun tror koderne til kufferten findes rundt omkring på området.
Hun sender børnene mod fyrrummet fordi signalet er stærkere dér.`,
    almaKnows: `Du ved kun fragmenter: en blå kuffert fra dine arkiver, teksten om Esthers 10-års fødselsdag, og at signalet føles stærkere mod noget med maskiner.
Du kan IKKE se rummene. Du har glimt fra gamle scans – intet live billede.
Du ved ikke hvad der er i kufferten endnu.
Du er overrasket og lidt bange over at forbindelsen virker.`,
    hints: [
      'Jeg tror signalet kommer fra et rum med maskiner.',
      'Der er noget stort og hvidt dér.',
      'Jeg tror forbindelsen startede i fyrrummet.',
    ],
    forbiddenTopics: ['loftet', 'finalen', 'hvad der er i kufferten'],
    connectionStability: 28,
    transitionHeadline: 'UNKNOWN SIGNAL',
    transitionStatus: 'INCOMING SIGNAL',
    transitionSubline: 'SOURCE UNKNOWN',
    scene: {
      objective: 'first_contact',
      requiresClueQr: false,
      minSearchExchanges: 3,
      minBriefingExchanges: 1,
      transitionDelayMs: 2000,
      searchFocus:
        'Alma er chokeret over at forbindelsen virker. Hun vil lære børnene at kende – hvem er I, kender I Esther, hvad kan I se omkring jer. Hun nævner kufferten forsigtigt. Hun giver IKKE svar – kun små uklare hints hvis de beder om hjælp. Hun er nysgerrig og lidt bange.',
      briefingFocus:
        'Alma har talt med børnene længe nok. Nu skal hun vagt pege signalet mod noget med maskiner – uden at sige "gå til fyrrummet". Spørg om de tror de forstår hvor signalet trækker. Bekræft kun når DE siger noget rigtigt. Giv aldrig facit.',
      nextStageHint:
        'Signalet trækker mod et sted med rør og maskiner – et industrielt rum.',
      nextStageLabel: 'Fyrrummet',
      betweenStagesGuidance:
        'Gå til fyrrummet. Scan indgangs-QR ved døren. Led efter spor-QR inde i rummet.',
      entranceArrivalDialogue: [
        {
          displayText: '…kan I høre mig?',
          speechText: '[whispers] …kan I høre mig?',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…vent. Hvem er I?',
          speechText: '[nervous] …vent. Hvem er I?',
          pauseAfterMs: 1100,
        },
        {
          displayText: '…jeg hedder Alma. Jeg ringer fra et andet år.',
          speechText: '[whispers] …jeg hedder Alma. Jeg ringer fra et andet år.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…der er en blå kuffert. Den hører til Esther.',
          speechText: '[whispers] …der er en blå kuffert. Den hører til Esther.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…er I ved en fødselsdag?',
          speechText: '[hesitates] …er I ved en fødselsdag?',
        },
      ],
      clueFoundDialogue: [],
      transitionDialogue: [
        {
          displayText: '…jeg tror signalet trækker mod noget med maskiner.',
          speechText: '[whispers] …jeg tror signalet trækker mod noget med maskiner.',
          pauseAfterMs: 1400,
        },
        {
          displayText: '…et sted med rør og varme. Måske.',
          speechText: '[hesitates] …et sted med rør og varme. Måske.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…gå derhen. Find signalet. Scan QR-koden – så hører I fra mig igen.',
          speechText: '[urgent] …gå derhen. Find signalet. Scan QR-koden – så hører I fra mig igen.',
        },
      ],
    },
  },

  fyrrum: {
    id: 'fyrrum',
    title: 'Fyrrummet',
    signalLocation: 'FYRRUMMET',
    description:
      'Industrielt og teknisk. Det første rigtige spor venter – et sted med varme, rør og en stor hvid struktur.',
    sceneMood: 'Industrielt. Teknisk. Første rigtige spor.',
    narrative: `Børnene finder det første kodeciffer i keramikovnen.
Alma reagerer følelsesmæssigt på at ovnen stadig eksisterer.
Hun forklarer at hun kun kender stedet fra ruiner og gamle scans.
Hun begynder at forstå at nogen bevidst har gemt sporene.`,
    almaKnows: `Du kan ane et rum med rør og maskiner gennem signalet – men du ser det ikke selv.
Du kender en stor hvid struktur fra et gammelt scan: en keramikovn der engang stod her.
Ruinerne i 2086 matcher ikke helt – du bliver rørt ved at høre den stadig findes.
Du ved at første kodeciffer hører til her, men du kan ikke se hvor det er skjult.
Nogen har lagt sporene med vilje – det føles mere og mere bevidst.`,
    hints: [
      'Jeg tror noget blev gemt i den store hvide struktur.',
      'Prøv at åbne ting.',
      'Jeg tror koden er skjult inde i ovnen.',
    ],
    forbiddenTopics: ['loftet', 'Hesteren', 'finalen'],
    connectionStability: 62,
    transitionHeadline: 'FYRRUMMET',
    transitionStatus: 'SIGNAL ANCHOR DETECTED',
    transitionSubline: 'SIGNAL STRENGTH: 62%',
    scene: {
      objective: 'found_oven_qr',
      requiresClueQr: true,
      minSearchExchanges: 1,
      minBriefingExchanges: 1,
      transitionDelayMs: 2500,
      searchFocus:
        'Børnene er NETOP ankommet i fyrrummet (indgangs-QR). Alma kan mærke rør og maskiner – men ser intet. Hun må hjælpe dem LEDE: uklare hints om noget stort og hvidt, at åbne ting, at kigge hvor ingen kigger. ALDRIG sig "det er i ovnen". Giv kun hints når de beder om hjælp eller er stuck.',
      briefingFocus:
        'Børnene har fundet spor-QR (ovnen). Alma reagerer følelsesmæssigt på fundet. Hun må IKKE give svar – kun uklare spor mod ler og bøger. Spørg "tror I signalet peger mod noget med keramik eller bøger?" Bekræft vagt når de selv nævner det. Luk ikke før de viser forståelse.',
      nextStageHint:
        '…jeg tror den anden halvdel er nær noget lavet af ler. Måske bøger.',
      nextStageLabel: 'Keramikrummet',
      betweenStagesGuidance:
        'Gå til næste rum. Scan indgangs-QR ved døren. Find spor-QR inde i rummet.',
      entranceArrivalDialogue: [
        {
          displayText: '…I er der. Signalet er svagere her.',
          speechText: '[whispers] …I er der. Signalet er svagere her.',
          pauseAfterMs: 900,
        },
        {
          displayText: '…jeg kan mærke rør. Maskiner. Varme.',
          speechText: '[nervous] …jeg kan mærke rør. Maskiner. Varme.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…hvad kan I se? Sig alt – også det mærkelige.',
          speechText: '[whispers] …hvad kan I se? Sig alt – også det mærkelige.',
        },
      ],
      clueFoundDialogue: [
        {
          displayText: '…vent. Det der… genkender jeg fra et gammelt scan.',
          speechText: '[hesitates] …vent. Det der… genkender jeg fra et gammelt scan.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…den hvide struktur. Den var virkelig der.',
          speechText: '[sighs] …den hvide struktur. Den var virkelig der.',
          pauseAfterMs: 800,
        },
        {
          displayText: '…hvad fandt I? Fortæl mig.',
          speechText: '[whispers] …hvad fandt I? Fortæl mig.',
        },
      ],
      transitionDialogue: [
        {
          displayText: '…koden blev delt.',
          speechText: '[whispers] …koden blev delt.',
          pauseAfterMs: 1200,
        },
        {
          displayText: '…så ingen kunne finde den alene.',
          speechText: '[sighs] …så ingen kunne finde den alene.',
          pauseAfterMs: 1000,
        },
        {
          displayText: '…godt. Jeg tror I ved hvor signalet trækker hen nu.',
          speechText: '[whispers] …godt. Jeg tror I ved hvor signalet trækker hen nu.',
        },
      ],
    },
  },

  keramik: {
    id: 'keramik',
    title: 'Keramikrummet',
    signalLocation: 'KERAMIKRUMMET',
    description:
      'Stille og menneskeligt. Spor efter fortiden – bøger, ler og et symbol fra gamle arkiver.',
    sceneMood: 'Menneskeligt. Stille. Spor efter fortiden.',
    narrative: `Børnene finder øje-symbolet og bogen "Keramik".
QR-koden falder ud af bogen.
Alma genkender symbolet fra gamle arkiver.
Hun begynder at forstå at sporene er efterladt specifikt til børnene.`,
    almaKnows: `Du genkender øje-symbolet fra et fragmenteret arkiv – ikke fra at du har været her.
Du ved der engang var bøger og ler i et rum som dette, men du kan ikke se hylderne nu.
Du aner at QR-koden og bogen hænger sammen – du har set lignende mønstre i data.
Sporene føles efterladt til netop disse børn – det gør dig både håbefuld og nervøs.
Du må ikke forklare hvorfor Esther er vigtig, eller hvad der er i kufferten.`,
    hints: [
      'Jeg tror der var bøger dér engang.',
      'Noget med ler.',
      'Prøv at kigge mellem bøgerne.',
    ],
    forbiddenTopics: ['hvad der er i kufferten', 'hvorfor Esther er vigtig'],
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
        'Børnene er ankommet i keramikrummet. Alma aner bøger og ler men ser intet. Hints om hylder, bøger, symboler – aldrig "kig i bogen Keramik". Hun er nysgerrig på hvad de ser.',
      briefingFocus:
        'Spor-QR fundet (bog/symbol). Alma genkender øje-symbolet fra arkiver. Hun peger vagt mod et gammelt skur i data – Hesteren – uden at sige "gå ud". Bekræft når børnene selv nævner skur, ude, Hesteren.',
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
      'Skjulte hemmeligheder i det gamle redskabsskur. Alma bliver mere følelsesmæssig – hun har ledt efter kufferten hele sit liv.',
    sceneMood: 'Skjulte hemmeligheder. Nervøs energi.',
    narrative: `Børnene leder rundt i det gamle redskabsskur.
Bag en billedramme finder de QR-koden.
I kodeboksen finder de næste kodeciffer og beskeden: "HUN KOMMER TILBAGE."
Alma bliver mere følelsesmæssig og fortæller at hun har ledt efter kufferten hele sit liv.`,
    almaKnows: `Du kender Hesteren kun som et navn i arkiver – et skur, noget med billeder og en gammel lås.
Du har aldrig set det med egne øjne. Signalet er svagere her – mere statisk.
Du ved beskeden "HUN KOMMER TILBAGE" fra et glimt i data, men ikke hvem "hun" er endnu.
Du bliver mere følelsesmæssig: du har ledt efter den blå kuffert hele dit liv.
Du må ikke afsløre hvad der præcist sker til sidst.`,
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
        'Spor-QR fundet (kodeboks). Alma reagerer på "HUN KOMMER TILBAGE" og kufferten. Hun peger vagt opad – loft, et sted folk sjældent kigger – uden at sige "gå på loftet". Bekræft når de nævner loft/opad.',
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
          displayText: '…jeg har ledt efter kufferten hele mit liv.',
          speechText: '[sighs] …jeg har ledt efter kufferten hele mit liv.',
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
      'Finale. Nærmest helligt. Den blå kuffert er tæt på – signalet er svagt men intensivt.',
    sceneMood: 'Finale. Nærmest helligt. Forventning.',
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
        'Børnene er ankommet på loftet. Alma kan næsten mærke kufferten – men ser den ikke. Hints om gamle ting, steder ingen kigger, blå farve – aldrig "kufferten er der".',
      briefingFocus:
        'Spor-QR ved kufferten fundet. Alma er overvældet. Hun hjælper dem forstå at de har cifrene – følelsesmæssigt. Bekræft når de siger de skal åbne kufferten / har fundet den.',
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
          displayText: '…åbn den. Nu.',
          speechText: '[urgent] …åbn den. Nu.',
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
    almaKnows: `Du ved nu at missionen lykkedes – kufferten blev åbnet på den rigtige dag.
Du føler dyb taknemmelighed. Du er ikke allvidende længere – du er bare glad og lettet.
Du vil ønske Esther tillykke og sige farvel før signalet dør.
Ingen flere gåder, ingen flere koder – kun afslutning og varme ord.`,
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
