import { DistributionMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';

//See TxTimeline for explanations and documentation

export function DistributeTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const collection = txTimelineProps.simulatedCollection;
    const distributionMethod = txTimelineProps.distributionMethod;
    const setDistributionMethod = txTimelineProps.setDistributionMethod;
    const claimItems = txTimelineProps.claimItems;
    const setClaimItems = txTimelineProps.setClaimItems;
    const manualSend = txTimelineProps.manualSend;
    const setManualSend = txTimelineProps.setManualSend;
    const fungible = txTimelineProps.fungible;
    const nonFungible = txTimelineProps.nonFungible;


    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collection.collectionMetadata, collection, collection.claims.length + 1)

    return (
        <FormTimeline
            items={[

                DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible, false, false),
                distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems) : EmptyStepItem,
                distributionMethod !== DistributionMethod.Unminted
                    ? CreateClaimsStepItem(collection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, manualSend, collection.unmintedSupplys) : EmptyStepItem,
                claimItems.length > 0 && claimItems.find((claimItem) => claimItem.codes.length > 0 || claimItem.hasPassword)
                    ? DownloadCodesStep : EmptyStepItem,
            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
