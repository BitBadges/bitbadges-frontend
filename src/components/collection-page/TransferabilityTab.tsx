import { FieldTimeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Tooltip, Typography } from 'antd';
import { ApprovalTrackerIdDetails } from 'bitbadgesjs-proto';
import { getCurrentIdxForTimeline, getFirstMatchForCollectionApprovedTransfers } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getApprovalsDisplay } from './ApprovalsTab';

export function TransferabilityTab({ collectionId, badgeId }: {
  collectionId: bigint,
  badgeId?: bigint,
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];
  const currTransferabilityIdx = getCurrentIdxForTimeline(collection?.collectionApprovedTransfersTimeline ?? []);
  const [defaultIdx, setDefaultIdx] = useState<number>(Number(currTransferabilityIdx));
  const chain = useChainContext();


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers b');
    if (collectionId > 0) {
      async function fetchTrackers() {
        const idx = getCurrentIdxForTimeline(collection?.collectionApprovedTransfersTimeline ?? []);
        const defaultIdx = idx < 0 ? 0 : idx;

        if (collection && collection?.collectionApprovedTransfersTimeline.length > 0) {

          const approvedTransfers = collection?.collectionApprovedTransfersTimeline[Number(defaultIdx)].collectionApprovedTransfers.filter(x => x.approvalDetails.length > 0);


          const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] =
            approvedTransfers.map(approvedTransfer => {
              return [{
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: "",
                approverAddress: "",
                trackerType: "overall",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "initiatedBy",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
                approvalLevel: "collection",
                approvedAddress: chain.cosmosAddress,
                approverAddress: "",
                trackerType: "to",
              },
              {
                collectionId,
                approvalId: approvedTransfer.approvalDetails[0].approvalId,
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

  const firstMatches = getFirstMatchForCollectionApprovedTransfers(defaultIdx < 0 ? [] : collection.collectionApprovedTransfersTimeline[Number(defaultIdx)].collectionApprovedTransfers, true);


  return (
    <div className='primary-text'>
      <br />
      <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>

        {collection && ((collection?.collectionApprovedTransfersTimeline.length > 1)) ?
          <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
            Transferability <FieldTimeOutlined style={{ marginLeft: 4 }} />
          </Tooltip> : <> </>
        }
      </Typography.Text>

      {getApprovalsDisplay(collection.collectionApprovedTransfersTimeline, firstMatches, defaultIdx, setDefaultIdx, collection, badgeId)}
      <Divider />
      <p>
        <InfoCircleOutlined />{' '}Transferability is broken down into multiple criteria: who can send? who can receive? etc.
        Each row below represents a different set of criteria. For a transfer to be allowed, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
      </p>

      <Divider />
      <p>Note: Go to permissions on the overview tab to see if these currently set values can be changed or not by the manager.</p>
      <br />
    </div >
  );
}
