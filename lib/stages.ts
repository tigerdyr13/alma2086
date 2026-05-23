/**
 * Central story config – klar til senere adminpanel.
 * Alle narrative data samles her; UI og API læser kun fra denne fil.
 */

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
