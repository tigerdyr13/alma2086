/** Børn viser at de forstår hvor signalet peger hen (i deres egne ord) */
export function isBriefingConfirmation(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  if (t.length < 2) return false;

  const confirms = [
    /\b(ja|jo|okay|ok|yes)\b/,
    /\b(forstår|forstået|forstaaet|ved (hvor|hvad)|vi (går|ved)|lad os)\b/,
    /\b(keramik|fyrrum|hesteren|loft|bøger|ler|maskin|ovn|skur|signalet)\b/,
    /\b(dérhen|derhen|det giver mening|så går vi)\b/,
  ];

  return confirms.some((re) => re.test(t));
}
