import { DistributionMethod } from 'bitbadgesjs-utils';
import { useEffect } from 'react';
import { FormTimeline } from '../navigation/FormTimeline';
import { MsgUpdateBalancesProps } from './TxTimeline';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';

//See TxTimeline for explanations and documentation

export function UpdateUserBalancesTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgUpdateBalancesProps
}) {
  
  useEffect(() => {
    txTimelineProps.setDistributionMethod(DistributionMethod.OffChainBalances);
  }, [txTimelineProps]);

  const transfers = txTimelineProps.transfers;
  const setTransfers = txTimelineProps.setTransfers;
  const claims = txTimelineProps.claims;
  const setClaims = txTimelineProps.setClaims;
  const distributionMethod = txTimelineProps.distributionMethod;

  const CreateClaimsStep = CreateClaimsStepItem(transfers, setTransfers, claims, setClaims, distributionMethod);

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
