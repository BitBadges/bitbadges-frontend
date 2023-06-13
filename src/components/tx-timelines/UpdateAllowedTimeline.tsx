import { FormTimeline } from '../navigation/FormTimeline';
import { MsgUpdateAllowedProps } from './TxTimeline';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';

//See TxTimeline for explanations and documentation

export function UpdateAllowedTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgUpdateAllowedProps
}) {

  const TransferableSelectStep = TransferabilitySelectStepItem();

  return (
    <FormTimeline
      items={[
        TransferableSelectStep,
      ]}
      onFinish={() => {
        if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
      }}
    />
  );
}
