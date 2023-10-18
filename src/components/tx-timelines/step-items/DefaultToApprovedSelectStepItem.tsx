import { AddressMapping } from "bitbadgesjs-proto";
import { appendDefaultForIncoming, castIncomingTransfersToCollectionTransfers, getReservedAddressMapping } from "bitbadgesjs-utils";
import { useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { compareObjects } from "../../../utils/compare";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { ApprovalsDisplay } from "../../collection-page/ApprovalsTab";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function DefaultToApprovedSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const chain = useChainContext();

  const [updatelag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  const forcefulOption = [{
    fromMappingId: "AllWithMint",
    fromMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
    initiatedByMappingId: "AllWithMint",
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    approvalId: "default-incoming-allowed",
    amountTrackerId: "default-incoming-allowed",
    challengeTrackerId: "default-incoming-allowed",
  }]

  return {
    title: `Default Incoming Approvals`,
    description: `If not forcefully overriden, all badge transfers need to satisfy the recipient's icnoming approvals. What should they be by default?`,
    node: <UpdateSelectWrapper
      updateFlag={updatelag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath='defaultUserIncomingApprovals'
      permissionName='canUpdateDefaultUserIncomingApprovals'
      validationErr={undefined}
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Approved by Default',
              message: `For all users, all incoming transfers (including mints) will be approved by default. Users can opt-out of this in the future.`,
              isSelected: compareObjects(collection.defaultUserIncomingApprovals, forcefulOption)

            },
            {
              title: 'Opt-In Only',
              message: 'By default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints).',
              isSelected: collection.defaultUserIncomingApprovals.length === 0
            },
          ]}
          onSwitchChange={(idx) => {
            collections.updateCollection({
              ...collection,
              defaultUserIncomingApprovals: idx === 0 ? forcefulOption : [],
            });
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <ApprovalsDisplay
            approvals={
              castIncomingTransfersToCollectionTransfers(
                collection.defaultUserIncomingApprovals.length > 0 ? collection.defaultUserIncomingApprovals : appendDefaultForIncoming([], chain.address)

                , chain.address)}
            collection={collection}
            approvalLevel='incoming'
            approverAddress={chain.address}
            title="Incoming Approvals"
          />
        </div>
      </>
      }
    />

  }
}