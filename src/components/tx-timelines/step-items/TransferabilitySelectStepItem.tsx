import { Divider } from "antd";
import { deepCopy } from "bitbadgesjs-proto";
import { CollectionApprovalWithDetails, getReservedAddressMapping, isFullUintRanges } from "bitbadgesjs-utils";
import { useState } from "react";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { approvalCriteriaHasNoAdditionalRestrictions, approvalCriteriaHasNoAmountRestrictions } from "../../../bitbadges-api/utils/claims";
import { getMintApprovals, getNonMintApprovals } from "../../../bitbadges-api/utils/mintVsNonMint";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { TransferabilityTab } from "../../collection-page/TransferabilityTab";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export const transferableApproval = {
  fromMappingId: 'AllWithoutMint',
  fromMapping: getReservedAddressMapping("AllWithoutMint"),
  toMappingId: "AllWithMint",
  toMapping: getReservedAddressMapping("AllWithMint"),
  initiatedByMappingId: "AllWithMint",
  initiatedByMapping: getReservedAddressMapping("AllWithMint"),
  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
  approvalId: 'transferable-approval',
  amountTrackerId: 'transferable-approval',
  challengeTrackerId: 'transferable-approval',
}

export function TransferabilitySelectStepItem() {

  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const setApprovalsToAdd = (approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionApprovals: approvalsToAdd
    })
  }
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  return {
    title: `Collection Approvals (Transferability) - Post-Minting`,
    description: <>{`Excluding transfers from the Mint address, set the collection level approvals for who can transfer badges.
    All transfers must be approved on the collection level.
    For example, should badges be transferable or non-transferable between users? Revokable? Freezable?`}</>,
    node: () => <UpdateSelectWrapper
      documentationLink={"https://docs.bitbadges.io/overview/how-it-works/transferability"}
      err={err}
      updateFlag={updateCollectionApprovals}
      setUpdateFlag={setUpdateCollectionApprovals}
      jsonPropertyPath='collectionApprovals'
      permissionName='canUpdateCollectionApprovals'
      setErr={(err) => { setErr(err) }}
      customRevertFunction={() => {
        const prevNonMint = startingCollection ? getNonMintApprovals(startingCollection) : [];
        const currentMint = getMintApprovals(collection);

        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionApprovals: [
            ...currentMint,
            ...prevNonMint
          ],
        });
      }}
      nonMintOnly
      node={() => <div className="primary-text">
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'Non-Transferable',
              message: 'Badges cannot be transferred between users.',
              isSelected: getNonMintApprovals(collection).length === 0
            },
            {
              title: 'Transferable',
              message: `Badges can be transferred between users.`,
              isSelected: getNonMintApprovals(collection).length === 1
                && getNonMintApprovals(collection).every(x =>
                  approvalCriteriaHasNoAdditionalRestrictions(x.approvalCriteria) &&
                  approvalCriteriaHasNoAmountRestrictions(x.approvalCriteria) &&
                  isFullUintRanges(x.badgeIds) &&
                  isFullUintRanges(x.transferTimes) &&
                  isFullUintRanges(x.ownershipTimes) &&
                  x.fromMappingId === 'AllWithoutMint' &&
                  x.toMappingId === 'AllWithMint' &&
                  x.initiatedByMappingId === 'AllWithMint'
                )
            },
          ]}
          onSwitchChange={(idx) => {
            if (idx === 0) {
              setApprovalsToAdd(getMintApprovals(collection));
            } else if (idx == 1) {
              setApprovalsToAdd([...getMintApprovals(collection), deepCopy(transferableApproval)]);
            }
          }}
        />
        <Divider />
        <div className='flex-center' style={{ textAlign: 'center' }}>
          <TransferabilityTab
            collectionId={NEW_COLLECTION_ID}
            onlyShowNotFromMint
            hideHelperMessage
            showDeletedGrayedOut
            editable
          />
        </div>
      </div >
      }
    />,
    disabled: !!err,
  }
}