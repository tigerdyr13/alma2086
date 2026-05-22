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
  description: string;
  /** Hvad Alma ved på dette tidspunkt i historien */
  almaKnows: string;
  /** Gradvise hints – Alma må kun bruge det aktuelle niveau når børn er stuck */
  hints: [string, string, string];
  /** Emner/steder Alma IKKE må afsløre endnu */
  forbiddenTopics: string[];
  /** Stemning til prompt og UI */
  ambience: string;
  /** Simuleret forbindelsesstyrke 0–100 */
  connectionStability: number;
}

export const stages: Record<StageId, StageDefinition> = {
  intro: {
    id: 'intro',
    title: 'Første kontakt',
    signalLocation: 'UKENDT KANAL',
    description: 'Børnene har lige etableret den første tidsforbindelse til Alma.',
    almaKnows:
      'Forbindelsen er netop oprettet. Alma ved at børnene er på et gammelt skoleområde i 2026, men hun kan ikke se det tydeligt endnu. Hun ved at der findes skjulte spor og koder et sted på området.',
    hints: [
      'Lyt efter noget gammelt og officielt – noget der føles som en start.',
      'Det første spor handler om at finde ud af, at forbindelsen er reel – og at I skal bevæge jer mod varme og rør.',
      'I skal mod fyrrummet. Der gemmer sig noget ved det gamle varmesystem.',
    ],
    forbiddenTopics: ['loft', 'finale', 'kuffertens indhold', 'den endelige kode'],
    ambience: 'Statisk, hvisken, ustabil signalstyrke, første nervøse kontakt.',
    connectionStability: 52,
  },

  fyrrum: {
    id: 'fyrrum',
    title: 'Fyrrummet',
    signalLocation: 'FYRRUMMET',
    description: 'Børnene er ved fyrrummet og leder efter det første fysiske spor.',
    almaKnows:
      'Alma kan nu ane varme og rør gennem signalet. Hun ved at et symbol eller en markering sidder tæt på varmesystemet. Hun er overbevist om at fyrrummet er første rigtige post.',
    hints: [
      'Kig hvor det er varmest – og hvor rørene mødes.',
      'Der er et symbol tegnet eller ridset et sted ved rørene. Det ligner noget fra hendes tid.',
      'Søg ved hovedrøret og det gamle termometer – mærket sidder dér.',
    ],
    forbiddenTopics: ['loft', 'finale', 'keramik', 'kuffertens indhold', 'den endelige kode'],
    ambience: 'Dæmpet banken fra rør, echo, varm luft, Alma lyder mere presset.',
    connectionStability: 62,
  },

  keramik: {
    id: 'keramik',
    title: 'Keramikrummet',
    signalLocation: 'KERAMIKRUM',
    description: 'Børnene er i keramikrummet og leder efter næste spor.',
    almaKnows:
      'Alma ved at keramikrummet gemmer noget relateret til form, skjulte tegn og noget der blev lavet og gemt. Hun kan ane ler og gamle hylder gennem signalet.',
    hints: [
      'Tænk på noget der er formet – og noget der er skjult indeni.',
      'Ikke det største objekt – kig på det der ser uafsluttet ud.',
      'Der er et tegn under eller bag det der tørrede sidst – kig på hylden med det krakelerede glasur.',
    ],
    forbiddenTopics: ['loft', 'finale', 'den endelige kode', 'hvad der skete året efter'],
    ambience: 'Støv, stille rum, forsigtige hvisken, mystik om gemte genstande.',
    connectionStability: 58,
  },

  ude: {
    id: 'ude',
    title: 'Udearealet',
    signalLocation: 'UDE / GÅRD',
    description: 'Børnene er udenfor og leder efter spor i det åbne.',
    almaKnows:
      'Alma kan mærke vind, metal og noget der peger mod bygningens yderside. Hun ved at et spor herude forbinder det indendørs med noget højere oppe – men hun må ikke sige for meget endnu.',
    hints: [
      'Kig på det sted hvor mange har gået forbi – men få har set op.',
      'Noget på ydersiden peger videre. Tænk vertikalt.',
      'Find mærket ved den gamle indgang mod gården – det peger mod loftet, men sig det ikke direkte endnu.',
    ],
    forbiddenTopics: ['finale', 'den endelige kode', 'kuffertens præcise indhold'],
    ambience: 'Vind, åben luft, signal der hakker, Alma lyder mere urolig.',
    connectionStability: 48,
  },

  loft: {
    id: 'loft',
    title: 'Loftet',
    signalLocation: 'LOFTET',
    description: 'Børnene er på loftet – tæt på afgørende spor.',
    almaKnows:
      'Alma ved at loftet gemmer noget centralt: en kuffert, et symbol, eller en markering der knytter fortid og fremtid sammen. Signalet er stærkere her, men hun er bange for at blive opdaget.',
    hints: [
      'Noget er gemt hvor ingen normalt går – bag det der ser glemt ud.',
      'Kufferten er tæt på. I skal finde den rigtige markering først.',
      'Kig under tagspærene ved den gamle ventilationsrist – mærket leder til kufferten.',
    ],
    forbiddenTopics: ['finale', 'den præcise endelige kode', 'hvad der sker efter kufferten åbnes'],
    ambience: 'Knirkende træ, støvet lys, hvisken, høj urgency.',
    connectionStability: 71,
  },

  finale: {
    id: 'finale',
    title: 'Finalen',
    signalLocation: 'AFSLUTNING / KUFFERT',
    description: 'Børnene er ved skattejagtens afslutning.',
    almaKnows:
      'Alma ved at kufferten og den sidste kode er tæt på. Forbindelsen er ved at bryde sammen. Hun kan nu tale mere følelsesmæssigt, men må stadig ikke give den endelige løsning direkte – kun lede børnene de sidste skridt.',
    hints: [
      'I har næsten alt. Tænk på hvad der binder alle spor sammen.',
      'Koden er ikke ét tal – det er det I har samlet undervejs.',
      'Læg symbolerne i rækkefølgen I fandt dem – så åbner det sig.',
    ],
    forbiddenTopics: [],
    ambience: 'Maksimal spænding, signal der dør, Alma græder næsten, tidspres.',
    connectionStability: 34,
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
