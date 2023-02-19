import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { FormTimeline } from '../common/FormTimeline';
import { TransferableSelectStepItem } from './step-items/TransferableSelectStepItem';
import { UpdateDisallowedStepItem } from './step-items/UpdateDisallowedStepItem';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function UpdateDisallowedTimeline({
    collection, //collection is the information about the actual badge collection that is being distributed/minted
}: {
    collection: BitBadgeCollection;
}) {
    const chain = useChainContext();

    //The MsgNewCollection Cosmos message that will be sent to the chain
    const [newCollectionMsg, setNewCollectionMsg] = useState<MessageMsgNewCollection>({
        creator: chain.cosmosAddress,
        badgeUri: '',
        collectionUri: '',
        bytes: '',
        permissions: 0,
        standard: 0,
        badgeSupplys: [],
        transfers: [],
        disallowedTransfers: [],
        claims: [],
        managerApprovedTransfers: [],
    });

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
