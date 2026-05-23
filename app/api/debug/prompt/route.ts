import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/build-system-prompt';
import { getStage, isValidStageId, type StageId } from '@/lib/stages';
import type { SceneState } from '@/lib/scene-state';
import { isSceneInteractive } from '@/lib/scene-state';

/** Dev-only: preview systemprompt for et stage */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stageRaw = req.nextUrl.searchParams.get('stage') ?? 'intro';
  const hintLevelRaw = req.nextUrl.searchParams.get('hintLevel') ?? '0';
  const stuckRaw = req.nextUrl.searchParams.get('stuck') === '1';

  if (!isValidStageId(stageRaw)) {
    return NextResponse.json({ error: 'Ukendt stage' }, { status: 400 });
  }

  const stageId = stageRaw as StageId;
  const stage = getStage(stageId);
  if (!stage) {
    return NextResponse.json({ error: 'Ukendt stage' }, { status: 400 });
  }

  const hintLevel = Math.max(0, parseInt(hintLevelRaw, 10) || 0);
  const sceneStateRaw = req.nextUrl.searchParams.get('sceneState') ?? 'search';
  const clueFound = req.nextUrl.searchParams.get('clueFound') === '1';
  const searchUserMessages = Math.max(
    0,
    parseInt(req.nextUrl.searchParams.get('searchUserMessages') ?? '0', 10) || 0,
  );
  const briefingUserMessages = Math.max(
    0,
    parseInt(req.nextUrl.searchParams.get('briefingUserMessages') ?? '0', 10) || 0,
  );

  let sceneState: SceneState = 'search';
  if (
    sceneStateRaw === 'search' ||
    sceneStateRaw === 'briefing' ||
    sceneStateRaw === 'arrival' ||
    sceneStateRaw === 'reaction' ||
    sceneStateRaw === 'transition' ||
    sceneStateRaw === 'completed'
  ) {
    sceneState = sceneStateRaw;
  } else if (sceneStateRaw === 'discovery') {
    sceneState = 'search';
  }

  const systemPrompt = buildSystemPrompt({
    stageId,
    hintLevel,
    isStuckRequest: stuckRaw,
    sceneState: isSceneInteractive(sceneState) ? sceneState : 'search',
    clueFound,
    searchUserMessages,
    briefingUserMessages,
  });

  return NextResponse.json({
    stageId,
    hintLevel,
    isStuckRequest: stuckRaw,
    systemPrompt,
    stage,
  });
}
