import { DistributionMethod } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, MSG_PREVIEW_ID, MsgMintAndDistriubteBadgesProps } from './TxTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';

//See TxTimeline for explanations and documentation

export function DistributeTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgMintAndDistriubteBadgesProps
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  const distributionMethod = txTimelineProps.distributionMethod;
  const setDistributionMethod = txTimelineProps.setDistributionMethod;
  const badgeSupplys = txTimelineProps.badgeSupplys;
  const transfers = txTimelineProps.transfers;
  const setTransfers = txTimelineProps.setTransfers;
  const claims = txTimelineProps.claims;
  const setClaims = txTimelineProps.setClaims;

  return (
    <FormTimeline
      items={[
        DistributionMethodStepItem(distributionMethod, setDistributionMethod, badgeSupplys, false, false),
        distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON
          ? CreateClaimsStepItem(transfers, setTransfers, claims, setClaims, distributionMethod, collection?.unmintedSupplys) : EmptyStepItem,
      ]}
      onFinish={() => {
        if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
      }}
    />
  );
}
