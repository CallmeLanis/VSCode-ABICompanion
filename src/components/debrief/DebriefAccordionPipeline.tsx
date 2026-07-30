import { Check } from 'lucide-react';
import { ExpandPanel } from '../motion';
import { Caption, MetaLabel } from '../ui';
import { DebriefStepContent } from './DebriefStepContent';
import {
  DEBRIEF_STEPS,
  type MissionDebriefForm,
  type StepId,
} from './useMissionDebriefForm';

interface DebriefAccordionPipelineProps {
  form: MissionDebriefForm;
}

export function DebriefAccordionPipeline({ form }: DebriefAccordionPipelineProps) {
  const { step, maxReachable, getStepState, getCollapsedSummary, goToStep } = form;

  const handleHeaderClick = (id: StepId) => {
    if (id === step) return;
    if (id > maxReachable) return;
    goToStep(id);
  };

  return (
    <div className="debrief-pipeline" role="list" aria-label="Mission debrief pipeline">
      {DEBRIEF_STEPS.map((s, index) => {
        const state = getStepState(s.id);
        const isActive = state === 'active';
        const isCompleted = state === 'completed';
        const isStandby = state === 'standby';
        const canSelect = s.id <= maxReachable;
        const connectorLit = s.id - 1 > 0 && s.id - 1 < maxReachable;

        return (
          <div
            key={s.id}
            role="listitem"
            className={`debrief-pipeline-step debrief-pipeline-step--${state}`}
            data-state={state}
          >
            {index > 0 && (
              <div
                className={`debrief-pipeline-connector ${connectorLit || isCompleted || (isActive && s.id > 1) ? 'is-lit' : ''}`}
                aria-hidden="true"
              />
            )}

            <button
              type="button"
              className="debrief-pipeline-header"
              onClick={() => handleHeaderClick(s.id)}
              aria-disabled={!canSelect && !isActive}
              aria-expanded={isActive}
              aria-controls={`debrief-step-panel-${s.id}`}
              id={`debrief-step-header-${s.id}`}
            >
              <span className="debrief-pipeline-index" aria-hidden="true">
                {isCompleted ? <Check size={12} strokeWidth={2.5} /> : String(s.id).padStart(2, '0')}
              </span>
              <span className="debrief-pipeline-title-wrap">
                <MetaLabel tone={isActive ? 'accent' : isCompleted ? 'positive' : 'muted'}>
                  {s.label}
                </MetaLabel>
                {!isActive && (
                  <Caption
                    tone={isStandby ? 'muted' : 'secondary'}
                    className="debrief-pipeline-summary block truncate"
                  >
                    {isStandby ? 'Standby' : getCollapsedSummary(s.id)}
                  </Caption>
                )}
              </span>
              <span className="debrief-pipeline-state-tag">
                {isActive ? 'Active' : isCompleted ? 'Complete' : 'Standby'}
              </span>
            </button>

            <div id={`debrief-step-panel-${s.id}`} role="region" aria-labelledby={`debrief-step-header-${s.id}`}>
              <ExpandPanel open={isActive} className="debrief-pipeline-body">
                <div className="debrief-pipeline-body-inner">
                  <DebriefStepContent form={form} stepId={s.id} />
                </div>
              </ExpandPanel>
            </div>
          </div>
        );
      })}
    </div>
  );
}
