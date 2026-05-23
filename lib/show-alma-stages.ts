/** Stages hvor børn kan vise Alma et billede */
export const SHOW_ALMA_STAGE_IDS = ['fyrrum', 'keramik', 'ude', 'loft'] as const;

export type ShowAlmaStageId = (typeof SHOW_ALMA_STAGE_IDS)[number];

export function canShowAlma(stageId: string): stageId is ShowAlmaStageId {
  return (SHOW_ALMA_STAGE_IDS as readonly string[]).includes(stageId);
}
