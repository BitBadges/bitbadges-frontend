import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { FormTimeline } from '../common/FormTimeline';
import { EmptyStepItem } from './MintCollectionTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { SubmitNewMintMsgStepItem } from './step-items/SubmitNewMintMsgStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';


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


    const SubmitStepItem = SubmitNewMintMsgStepItem(newCollectionMsg, setNewCollectionMsg, collection, collection.collectionMetadata, collection.badgeMetadata, claimItems, setClaimItems, distributionMethod, manualSend, MetadataAddMethod.None, false);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collection.collectionMetadata, collection, collection.claims.length + 1);


    //If all supply amounts are 1, it is fungible
    const fungible = newCollectionMsg.badgeSupplys.length === 1 && newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.amount === 1);
    const nonFungible = newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.supply === 1);


    return (
        <FormTimeline
            items={[
                DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible, true, true),
                distributionMethod === DistributionMethod.FirstComeFirstServe && (fungible) ? FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible, nonFungible) : EmptyStepItem,
                distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist
                    ? CreateClaimsStepItem(collection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, collection.badgeMetadata, collection.collectionMetadata, collection.unmintedSupplys) : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Whitelist ? ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, distributionMethod) : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Codes
                    ? DownloadCodesStep : EmptyStepItem,

                SubmitStepItem,
            ]}
        />
    );
}
