import { FormTimeline } from '../navigation/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem'

//See TxTimeline for explanations and documentation

export function UpdateDisallowedTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const disallowedTransfersWithUnregisteredUsers = txTimelineProps.disallowedTransfersWithUnregisteredUsers;
    const setDisallowedTransfersWithUnregisteredUsers = txTimelineProps.setDisallowedTransfersWithUnregisteredUsers;

    const TransferableSelectStep = TransferabilitySelectStepItem(disallowedTransfersWithUnregisteredUsers, setDisallowedTransfersWithUnregisteredUsers);

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
