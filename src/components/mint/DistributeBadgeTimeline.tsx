import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { BitBadgeCollection, ClaimItem, DistributionMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { FormTimeline } from '../common/FormTimeline';
import { EmptyStepItem } from './MintCollectionTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { SubmitNewMintMsgStepItem } from './step-items/SubmitNewMintMsgStepItem';


export function MintAndDistributeTimeline({
    collection, //collection is the information about the actual badge collection that is being distributed/minted
}: {
    collection: BitBadgeCollection;
}) {
    const chain = useChainContext();

    //For this, we use MessageMsgNewCollection because it has all the fields we need and has compatibility with the created components from the MintCollectionTimeline
    //During the final submit step, we will convert this to a MessageMsgMintBadge
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

    //See MintCollectionTimeline for explanations
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);
    const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
    const [manualSend, setManualSend] = useState<boolean>(false);




    const SubmitStepItem = SubmitNewMintMsgStepItem(newCollectionMsg, setNewCollectionMsg, collection, claimItems, distributionMethod);

    //TODO: think how to handle first come first serve on redistribute; current solution will not work and is not possible
    const fungible = collection.maxSupplys[0].badgeIds[0].end === 0; //TODO: probably not the right way to handle this
    //fungible variable currently does nothing meaningful

    return (
        <FormTimeline
            items={[
                DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, true, true),
                distributionMethod === DistributionMethod.FirstComeFirstServe && fungible ? FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible) : EmptyStepItem,
                distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist
                    ? CreateClaimsStepItem(collection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, collection.badgeMetadata, collection.collectionMetadata, collection.unmintedSupplys) : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Whitelist ? ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, distributionMethod) : EmptyStepItem,
                SubmitStepItem,
            ]}
        />
    );
}
