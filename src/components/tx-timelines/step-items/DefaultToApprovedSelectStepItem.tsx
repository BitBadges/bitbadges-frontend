import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { MSG_PREVIEW_ID, EmptyStepItem, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { useState } from "react";
import { compareObjects } from "../../../utils/compare";

export function DefaultToApprovedSelectStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;

  const [updatelag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  const forcefulOption = [{
    fromMappingId: "AllWithMint",
    fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    initiatedByMappingId: "AllWithMint",
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    approvalId: "default-incoming-allowed",
    approvalTrackerId: "",
    challengeTrackerId: "",
    allowedCombinations: [{
      isApproved: true,
    }]
  }]

  return {
    title: `Default Incoming Approvals`,
    description: `Can badges be sent to users without approval, or should approval be required by default?`,
    node: <UpdateSelectWrapper
      updateFlag={updatelag}
      setUpdateFlag={setUpdateFlag}
      jsonPropertyPath='defaultUserApprovedIncomingTransfers'
      permissionName='canUpdateDefaultUserApprovedIncomingTransfers'
      validationErr={undefined}
      node={
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Forceful Transfers Allowed',
              message: `For all users, all incoming transfers (including mints) will be approved by default. Users can opt-out of this in the future.`,
              isSelected: compareObjects(collection.defaultUserApprovedIncomingTransfers, forcefulOption)

            },
            {
              title: 'Opt-In Only',
              message: 'By default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints).',
              isSelected: collection.defaultUserApprovedIncomingTransfers.length === 0
            },
          ]}
          onSwitchChange={(idx) => {
            collections.updateCollection({
              ...collection,
              defaultUserApprovedIncomingTransfers: idx === 0 ? forcefulOption : [],
            });
          }}
        />
      }
    />

  }
}