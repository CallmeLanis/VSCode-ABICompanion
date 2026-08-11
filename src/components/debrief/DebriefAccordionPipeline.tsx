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

type StepDef = (typeof DEBRIEF_STEPS)[number];

function PipelineStep({
  s,
  form,
  showConnector,
}: {
  s: StepDef;
  form: MissionDebriefForm;
  showConnector: boolean;
}) {
  const { step, maxReachable, getStepState, getCollapsedSummary, goToStep } = form;
  const state = getStepState(s.id);
  const isActive = state === 'active';
  const isCompleted = state === 'completed';
  const isStandby = state === 'standby';
  const canSelect = s.id <= maxReachable;
  const connectorLit = s.id - 1 > 0 && s.id - 1 < maxReachable;

  const handleHeaderClick = () => {
    if (s.id === step) return;
    if (s.id > maxReachable) return;
    goToStep(s.id);
  };

  return (
    <div
      role="listitem"
      className={`debrief-pipeline-step debrief-pipeline-step--${state}`}
      data-state={state}
    >
      {showConnector && (
        <div
          className={`debrief-pipeline-connector ${connectorLit || isCompleted || (isActive && s.id > 1) ? 'is-lit' : ''}`}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="debrief-pipeline-header"
        onClick={handleHeaderClick}
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
}

export function DebriefAccordionPipeline({ form }: DebriefAccordionPipelineProps) {
  const { step } = form;

  const completedSteps = DEBRIEF_STEPS.filter((s) => s.id < step);
  const activeStep = DEBRIEF_STEPS.find((s) => s.id === step)!;
  const pendingSteps = DEBRIEF_STEPS.filter((s) => s.id > step);

  const showConnector = (s: StepDef) => s.id > 1;

  return (
    <div className="debrief-pipeline" role="list" aria-label="Mission debrief pipeline">
      <div className="debrief-pipeline-zone debrief-pipeline-zone-top">
        {completedSteps.map((s) => (
          <PipelineStep key={s.id} s={s} form={form} showConnector={showConnector(s)} />
        ))}
      </div>

      <div className="debrief-pipeline-zone debrief-pipeline-zone-active">
        <PipelineStep s={activeStep} form={form} showConnector={showConnector(activeStep)} />
      </div>

      <div className="debrief-pipeline-zone debrief-pipeline-zone-bottom">
        {pendingSteps.map((s) => (
          <PipelineStep key={s.id} s={s} form={form} showConnector={showConnector(s)} />
        ))}
      </div>
    </div>
  );
}
