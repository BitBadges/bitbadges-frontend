import { DistributionMethod } from 'bitbadgesjs-utils';
import { useEffect } from 'react';
import { FormTimeline } from '../navigation/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';

//See TxTimeline for explanations and documentation

export function UpdateUserBalancesTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    //TODO: Make sure manualSend is on
    useEffect(() => {
        txTimelineProps.setManualSend(true);
        txTimelineProps.setDistributionMethod(DistributionMethod.Whitelist);

    }, []);

    const simulatedCollection = txTimelineProps.simulatedCollection;
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const distributionMethod = txTimelineProps.distributionMethod;
    const claimItems = txTimelineProps.claimItems;
    const setClaimItems = txTimelineProps.setClaimItems;
    const manualSend = txTimelineProps.manualSend;
    const updateMetadataForBadgeIdsDirectlyFromUriIfAbsent = txTimelineProps.updateMetadataForBadgeIdsDirectlyFromUriIfAbsent;


    const CreateClaimsStep = CreateClaimsStepItem(simulatedCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, manualSend, undefined, updateMetadataForBadgeIdsDirectlyFromUriIfAbsent);

    return (
        <FormTimeline
            items={[
              CreateClaimsStep
            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
