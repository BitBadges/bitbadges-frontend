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
    const transferabilityToSelectType = txTimelineProps.transferabilityToSelectType;
    const setTransferabilityToSelectType = txTimelineProps.setTransferabilityToSelectType;
    const transferabilityFromSelectType = txTimelineProps.transferabilityFromSelectType;
    const setTransferabilityFromSelectType = txTimelineProps.setTransferabilityFromSelectType;
    const transferabilityTo = txTimelineProps.transferabilityTo;
    const setTransferabilityTo = txTimelineProps.setTransferabilityTo;
    const transferabilityFrom = txTimelineProps.transferabilityFrom;
    const setTransferabilityFrom = txTimelineProps.setTransferabilityFrom;

    const TransferableSelectStep = TransferabilitySelectStepItem(disallowedTransfersWithUnregisteredUsers, setDisallowedTransfersWithUnregisteredUsers, transferabilityToSelectType, setTransferabilityToSelectType, transferabilityFromSelectType, setTransferabilityFromSelectType, transferabilityTo, setTransferabilityTo, transferabilityFrom, setTransferabilityFrom);

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
