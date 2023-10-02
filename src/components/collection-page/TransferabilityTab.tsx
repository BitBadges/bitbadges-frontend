import { InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Switch } from 'antd';
import { AddressMapping, ApprovalTrackerIdDetails } from 'bitbadgesjs-proto';
import { getFirstMatchForCollectionApprovedTransfers, getReservedAddressMapping, isInAddressMapping } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { ApprovalsDisplay } from './ApprovalsTab';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function TransferabilityTab({ collectionId, badgeId, isClaimSelect, isNotClaimSelect, showOnlyTxApprovedTransfersToAdd, hideHelperMessage }: {
  collectionId: bigint,
  badgeId?: bigint,
  isClaimSelect?: boolean
  isNotClaimSelect?: boolean
  showOnlyTxApprovedTransfersToAdd?: boolean,
  hideHelperMessage?: boolean,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];
  const chain = useChainContext();

  const [showHidden, setShowHidden] = useState<boolean>(false);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers b');
    if (collectionId > 0) {
      async function fetchTrackers() {
        if (collection && collection?.collectionApprovedTransfers.length > 0) {

          const approvedTransfers = collection?.collectionApprovedTransfers.filter(x => x.approvalTrackerId);

          const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] =
            approvedTransfers.map(approvedTransfer => {
              return [{
                collectionId,
                approvalTrackerId: approvedTransfer.approvalTrackerId,
                approvalLevel: "collection",
                approvedAddress: "",
                approverAddress: "",
                trackerType: "overall",
              },
              {
                collectionId,
                approvalTrackerId: approvedTransfer.approvalTrackerId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "initiatedBy",
              },
              {
                collectionId,
                approvalTrackerId: approvedTransfer.approvalTrackerId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "to",
              },
              {
                collectionId,
                approvalTrackerId: approvedTransfer.approvalTrackerId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "from",
              },
              ] as ApprovalTrackerIdDetails<bigint>[];
            }).flat();
          collections.fetchCollectionsWithOptions([{
            collectionId,
            viewsToFetch: [],
            merkleChallengeIdsToFetch: [],
            approvalsTrackerIdsToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
          }]);
        }

      }
      fetchTrackers();

    }
  }, []);

  if (!collection) return <></>;
  let firstMatches = getFirstMatchForCollectionApprovedTransfers(collection.collectionApprovedTransfers, true);

  if (isClaimSelect) {
    firstMatches = firstMatches.filter(x => isInAddressMapping(x.fromMapping, 'Mint'))
    firstMatches = firstMatches.map(x => {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint', '') as AddressMapping,
        fromMappingId: 'Mint',
      }
    })
  } else if (isNotClaimSelect) {
    firstMatches = firstMatches.filter(x => !(JSON.stringify(x.fromMapping.addresses) === JSON.stringify(["Mint"]) && x.fromMapping.includeAddresses == true)

      && !(JSON.stringify(x.toMapping.addresses) === JSON.stringify(["Mint"]) && x.toMapping.includeAddresses == true)
      && !(JSON.stringify(x.initiatedByMapping.addresses) === JSON.stringify(["Mint"]) && x.initiatedByMapping.includeAddresses == true)
    );
  }


  if (!showHidden) {
    firstMatches = firstMatches.filter(x => x.allowedCombinations.length > 0 && x.allowedCombinations[0].isApproved);
  }
  return (
    <>
      <br />
      <InformationDisplayCard title='' >
        <br />
        {!showOnlyTxApprovedTransfersToAdd &&
          <div style={{ float: 'right' }}>
            <Switch
              checkedChildren="Show Only Allowed"
              unCheckedChildren="Show All"
              checked={!showHidden}
              onChange={(checked) => setShowHidden(!checked)}
            />
          </div>}
        <br />

        <ApprovalsDisplay
          convertedFirstMatches={firstMatches}
          collection={collection}
          badgeId={badgeId}
          filterFromMint={isNotClaimSelect}
          showIgnored={showOnlyTxApprovedTransfersToAdd}
        />
        {!hideHelperMessage && <>
          <Divider />
          <p>
            <InfoCircleOutlined />{' '}Transferability is broken down into multiple criteria: who can send? who can receive? etc.
            Each row below represents a different set of criteria. For a transfer to be allowed, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
          </p></>}

        <Divider />
      </InformationDisplayCard >
    </>
  );
}
