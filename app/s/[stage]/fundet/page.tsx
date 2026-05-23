import AlmaChat from '@/components/AlmaChat';
import SignalLost from '@/components/SignalLost';
import { getStage, isValidStageId } from '@/lib/stages';

interface StageFoundPageProps {
  params: Promise<{ stage: string }>;
}

export default async function StageFoundPage({ params }: StageFoundPageProps) {
  const { stage: stageSlug } = await params;

  if (!isValidStageId(stageSlug)) {
    return <SignalLost attemptedStage={stageSlug} />;
  }

  const stage = getStage(stageSlug);
  if (!stage) {
    return <SignalLost attemptedStage={stageSlug} />;
  }

  if (!stage.scene.requiresClueQr) {
    return <SignalLost attemptedStage={`${stageSlug}/fundet`} />;
  }

  return <AlmaChat stage={stage} initialQrMode="fundet" />;
}
