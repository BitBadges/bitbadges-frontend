import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { MSG_PREVIEW_ID, EmptyStepItem } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { useState } from "react";

export function DefaultToApprovedSelectStepItem(
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [updatelag, setUpdateFlag] = useState<boolean>(true);

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  const forcefulOption = [{
    approvedIncomingTransfers: [{
      fromMappingId: "AllWithMint",
      fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
      initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
      initiatedByMappingId: "AllWithMint",
      transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      allowedCombinations: [{
        isApproved: true,
        initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
        fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
        badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
        ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
        transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
      }],
      approvalDetails: []
    }],
    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  }]

  return {
    title: `Default Incoming Approvals`,
    description: ``,
    node: <UpdateSelectWrapper
      updateFlag={updatelag}
      setUpdateFlag={setUpdateFlag}
      existingCollectionId={existingCollectionId}
      jsonPropertyPath='defaultUserApprovedIncomingTransfersTimeline'
      permissionName='canUpdateDefaultUserApprovedIncomingTransfers'
      validationErr={undefined}
      node={
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Forceful Transfers Allowed',
              message: `For all users, by default, all incoming transfers (including mints) will be approved. Users can opt-out of this in the future.`,
              isSelected: JSON.stringify(collection.defaultUserApprovedIncomingTransfersTimeline) === JSON.stringify(forcefulOption)
            },
            {
              title: 'Opt-In Only',
              message: 'For all users, by default, users must be the initiator or explicitly approve a transfer for it to be successful. Transferring to this user forcefully without prior approval will fail (including mints).',
              isSelected: collection.defaultUserApprovedIncomingTransfersTimeline.length === 0
            },
          ]}
          onSwitchChange={(idx) => {
            collections.updateCollection({
              ...collection,
              defaultUserApprovedIncomingTransfersTimeline: idx === 0 ? forcefulOption : [],
            });
          }}

        />

      }
    />

  }
}