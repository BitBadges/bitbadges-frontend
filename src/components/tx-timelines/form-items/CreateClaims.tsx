import { useCollectionsContext } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DevMode } from '../../common/DevMode';

import { AddressMapping } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, DistributionMethod, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { ApprovalSelect } from '../../transfers/ApprovalSelect';

export function CreateClaims({ setVisible, nonMintApproval, defaultApproval }: { setVisible: (visible: boolean) => void, nonMintApproval?: boolean, defaultApproval?: CollectionApprovalWithDetails<bigint> }) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);


  //We can either specify specific badges to distribute or distribute the whole collection if blank


  const isOffChainBalances = collection?.balancesType === "Off-Chain";

  return <div style={{ justifyContent: 'center', width: '100%' }}>
    <br />
    <div>
      <ApprovalSelect
        defaultFromMapping={nonMintApproval ? getReservedAddressMapping("AllWithoutMint") as AddressMapping : getReservedAddressMapping("Mint") as AddressMapping}
        fromMappingLocked={!nonMintApproval}
        collectionId={MSG_PREVIEW_ID}
        hideTransferDisplay={true}
        setVisible={setVisible}
        defaultApproval={defaultApproval}
        distributionMethod={isOffChainBalances ? DistributionMethod.OffChainBalances : distributionMethod}
        setDistributionMethod={setDistributionMethod}
        showMintingOnlyFeatures={!nonMintApproval}
        approvalsToAdd={txTimelineContext.approvalsToAdd}
        setApprovalsToAdd={txTimelineContext.setApprovalsToAdd}
      />
    </div>
    <DevMode obj={txTimelineContext.approvalsToAdd} />
  </div >
}