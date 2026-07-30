// Shared rendering for deterministic tactical recommendations.

// Used by Overview (quick recommendations) and Economy (recommendation panel).



import type { ReactNode } from 'react';

import { Activity, Radar, ShieldAlert, Target, Wallet } from 'lucide-react';

import { Caption, MetaLabel } from '../ui';

import type { RecommendationCategory, TacticalRecommendation } from '../../utils/intelligence';

import { StaggerContainer, StaggerItem, AnimatedEmptyStateIcon } from '../motion';



const categoryIcons: Record<RecommendationCategory, ReactNode> = {

  risk: <ShieldAlert size={14} />,

  economy: <Wallet size={14} />,

  performance: <Activity size={14} />,

  opportunity: <Target size={14} />,

};



export function RecommendationCard({ recommendation }: { recommendation: TacticalRecommendation }) {

  const toneClass =

    recommendation.tone === 'negative'

      ? 'text-negative'

      : recommendation.tone === 'warning'

        ? 'text-warning'

        : 'text-positive';



  return (

    <article className="flex flex-col gap-2 bg-abi-bg-card p-4 h-full">

      <div className={`flex items-center gap-1.5 ${toneClass}`}>

        {categoryIcons[recommendation.category]}

        <MetaLabel tone={recommendation.tone}>{recommendation.category}</MetaLabel>

      </div>

      <h3 className="type-body text-primary">{recommendation.observation}</h3>

      <Caption tone="muted" className="block">{recommendation.evidence}</Caption>

      <Caption tone="secondary" className="mt-auto block border-t border-abi-border/70 pt-2">

        {recommendation.action}

      </Caption>

    </article>

  );

}



/** Grid wrapper + shared empty/nominal states for recommendation panels. */

export function RecommendationList({

  recommendations,

  hasEnoughHistory,

  insufficientDescription,

}: {

  recommendations: TacticalRecommendation[];

  hasEnoughHistory: boolean;

  insufficientDescription: string;

}) {

  if (!hasEnoughHistory) {

    return (

      <div className="grid min-h-[160px] place-items-center border border-dashed border-abi-border bg-abi-bg/35 p-6 text-center">

        <div className="max-w-sm">

          <AnimatedEmptyStateIcon className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-abi-orange/35 bg-abi-orange/10 text-accent">

            <Radar size={30} />

          </AnimatedEmptyStateIcon>

          <h3 className="type-heading text-primary">Not enough operational history.</h3>

          <p className="mt-2 type-caption text-secondary">{insufficientDescription}</p>

        </div>

      </div>

    );

  }



  if (recommendations.length === 0) {

    return (

      <div className="flex items-center gap-3 border border-abi-border bg-abi-bg/35 p-4">

        <Radar size={16} className="text-positive shrink-0" aria-hidden />

        <Caption tone="secondary">

          All indicators nominal. No active advisories from current field data.

        </Caption>

      </div>

    );

  }



  const sorted = [...recommendations].sort((a, b) => {

    const priority = { negative: 0, warning: 1, positive: 2 };

    return (priority[a.tone] ?? 2) - (priority[b.tone] ?? 2);

  });



  return (

    <StaggerContainer className="grid grid-cols-1 gap-px border border-abi-border bg-abi-border md:grid-cols-2 xl:grid-cols-4" immediate>

      {sorted.map((rec) => (

        <StaggerItem key={rec.id}>

          <RecommendationCard recommendation={rec} />

        </StaggerItem>

      ))}

    </StaggerContainer>

  );

}

