import { FormTimeline } from '../common/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { TransferableSelectStepItem } from './step-items/TransferableSelectStepItem';
import { UpdateDisallowedStepItem } from './step-items/UpdateDisallowedStepItem';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function UpdateDisallowedTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const collection = txTimelineProps.existingCollection;

    //All mint timeline step items
    const UpdateDisallowedStep = UpdateDisallowedStepItem(newCollectionMsg, setNewCollectionMsg, collection);

    const TransferableSelectStep = TransferableSelectStepItem(newCollectionMsg, setNewCollectionMsg);

    return (
        <FormTimeline
            items={[
                TransferableSelectStep,
                UpdateDisallowedStep
            ]}
        />
    );
}
