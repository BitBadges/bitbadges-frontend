import { appendDefaultForIncoming, castIncomingTransfersToCollectionTransfers, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { compareObjects } from "../../../utils/compare";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { EditableApprovalsDisplay } from "../../collection-page/ApprovalsTab";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export  const defaultApprovedOption = [{
  fromMappingId: "AllWithMint",
  fromMapping: getReservedAddressMapping("AllWithMint"),
  initiatedByMapping: getReservedAddressMapping("AllWithMint"),
  initiatedByMappingId: "AllWithMint",
  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  approvalId: "default-incoming-allowed",
  amountTrackerId: "default-incoming-allowed",
  challengeTrackerId: "default-incoming-allowed",
}]


export function DefaultToApprovedSelectStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const chain = useChainContext();

  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  return {
    title: `Default Incoming Approvals`,
    description: `If not overriden by the collection approvals, all badge transfers need to satisfy the recipient's incoming approvals. What should the incoming approvals be by default?`,
    node: () => <UpdateSelectWrapper
      documentationLink={"https://docs.bitbadges.io/overview/how-it-works/transferability"}
      err={null}
      setErr={() => { }}
      updateFlag={updateFlag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath='defaultUserIncomingApprovals'
      permissionName='canUpdateDefaultUserIncomingApprovals'
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Approved by Default',
              message: `For all users, all incoming transfers (including mints) will be approved by default. To block incoming transfers, users must manually set their incoming approvals.`,
              isSelected: compareObjects(collection.defaultBalances.incomingApprovals, defaultApprovedOption)
            },
            {
              title: 'Opt-In Only',
              message: 'By default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints). This is typically only used in specific cases, such as a KYC requirement.',
              isSelected: collection.defaultBalances.incomingApprovals.length === 0
            },
          ]}
          onSwitchChange={(idx) => {
            updateCollection({
              collectionId: NEW_COLLECTION_ID,
              defaultBalances: {
                ...collection.defaultBalances,
                incomingApprovals: idx === 0 ? defaultApprovedOption : []
              }
            });
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <EditableApprovalsDisplay
            approvals={
              castIncomingTransfersToCollectionTransfers(
                collection.defaultBalances.incomingApprovals.length > 0 ?
                  collection.defaultBalances.incomingApprovals :
                  appendDefaultForIncoming([], chain.address), chain.address)}
            collection={collection}
            approvalLevel='incoming'

            editable={true}
            //genesis only so will always not have existing approvals or permissions
            startingApprovals={[]}
            approvalPermissions={[]}
            mintingOnly={false}
            setApprovals={(approvals) => {
              updateCollection({
                collectionId: NEW_COLLECTION_ID,
                defaultBalances: {
                  ...collection.defaultBalances,
                  incomingApprovals: approvals
                }
              })
            }}
            approverAddress={chain.address}
          />
        </div>
      </>
      }
    />

  }
}