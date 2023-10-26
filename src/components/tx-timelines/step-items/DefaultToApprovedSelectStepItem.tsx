import { appendDefaultForIncoming, castIncomingTransfersToCollectionTransfers, getReservedAddressMapping, getUnhandledUserIncomingApprovals } from "bitbadgesjs-utils";
import { useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { approvalCriteriaHasNoAdditionalRestrictions, approvalCriteriaHasNoAmountRestrictions } from "../../../bitbadges-api/utils/claims";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { ApprovalsDisplay } from "../../collection-page/ApprovalsTab";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function DefaultToApprovedSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const chain = useChainContext();

  const [updateFlag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  const forcefulOption = [{
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

  return {
    title: `Default Incoming Approvals`,
    description: `If not forcefully overriden, all badge transfers need to satisfy the recipient's incoming approvals. What should the incoming approvals be by default?`,
    node: <UpdateSelectWrapper
    err={null}
      setErr={() => { }}
      updateFlag={updateFlag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath='defaultUserIncomingApprovals'
      permissionName='canUpdateDefaultUserIncomingApprovals'

      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Approved by Default',
              message: `For all users, all incoming transfers (including mints) will be approved by default. Users can opt-out of this in the future.`,
              isSelected: getUnhandledUserIncomingApprovals(collection.defaultUserIncomingApprovals, chain.address, true).length === 0
                && collection.defaultUserIncomingApprovals.every(x => approvalCriteriaHasNoAmountRestrictions(x.approvalCriteria)
                  && approvalCriteriaHasNoAdditionalRestrictions(x.approvalCriteria))

            },
            {
              title: 'Opt-In Only',
              message: 'By default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints).',
              isSelected: collection.defaultUserIncomingApprovals.length === 0
            },
          ]}
          onSwitchChange={(idx) => {
            collections.updateCollection({
              collectionId: NEW_COLLECTION_ID,
              defaultUserIncomingApprovals: idx === 0 ? forcefulOption : [],
            });
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <ApprovalsDisplay
            approvals={
              castIncomingTransfersToCollectionTransfers(
                collection.defaultUserIncomingApprovals.length > 0 ?
                  collection.defaultUserIncomingApprovals : appendDefaultForIncoming([], chain.address), chain.address)}
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