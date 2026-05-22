import AlmaChat from '@/components/AlmaChat';
import SignalLost from '@/components/SignalLost';
import { getStage, isValidStageId } from '@/lib/stages';

interface StagePageProps {
  params: Promise<{ stage: string }>;
}

export default async function StagePage({ params }: StagePageProps) {
  const { stage: stageSlug } = await params;

  if (!isValidStageId(stageSlug)) {
    return <SignalLost attemptedStage={stageSlug} />;
  }

  const stage = getStage(stageSlug);
  if (!stage) {
    return <SignalLost attemptedStage={stageSlug} />;
  }

  return <AlmaChat stage={stage} />;
}
