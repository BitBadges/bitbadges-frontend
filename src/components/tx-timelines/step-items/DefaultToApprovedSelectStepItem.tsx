import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function DefaultToApprovedSelectStepItem(
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection || existingCollectionId) return EmptyStepItem; //Only for new collections

  return {
    title: `Default Incoming Approvals`,
    description: ``,
    node:

      <SwitchForm
        options={[
          {
            title: 'Forceful Transfers Allowed',
            message: `For all users, by default, all incoming transfers (including mints) will be approved. Users can opt-out of this in the future.`,
            isSelected: collection.defaultUserApprovedIncomingTransfersTimeline.length > 0
          },
          {
            title: 'Opt-In Only',
            message: 'For all users, by default, users must be the initiator of the transfer (to must equal initiated by) or first explicitly approve the transfer in their approvals. Transferring to this user forcefully without prior approval will fail (including mints).',
            isSelected: collection.defaultUserApprovedIncomingTransfersTimeline.length === 0
          },
        ]}
        onSwitchChange={(idx) => {
          collections.updateCollection({
            ...collection,
            defaultUserApprovedIncomingTransfersTimeline: idx === 0 ? [{
              approvedIncomingTransfers: [{
                fromMappingId: "AllWithMint",
                fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                initiatedByMappingId: "AllWithMint",
                transferTimes: [{ start: 1n, end: FOREVER_DATE }],
                badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
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
              timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
            }] : [],
          });
        }}

      />

  }
}