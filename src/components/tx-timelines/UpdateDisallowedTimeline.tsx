import { FormTimeline } from '../navigation/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem'

//See TxTimeline for explanations and documentation

export function UpdateDisallowedTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;

    const TransferableSelectStep = TransferabilitySelectStepItem(newCollectionMsg, setNewCollectionMsg);

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
