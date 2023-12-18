import { Divider } from "antd";
import { deepCopy } from "bitbadgesjs-proto";
import { CollectionApprovalWithDetails, getReservedAddressMapping } from "bitbadgesjs-utils";
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
    title: `Transferability - Post-Minting`,
    description: <>{`Excluding transfers from the Mint address, should badges be transferable or non-transferable?`}</>,
    node: <UpdateSelectWrapper
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
      node={
        <div className="primary-text">
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
                  && approvalCriteriaHasNoAdditionalRestrictions(getNonMintApprovals(collection)[0].approvalCriteria)
                  && approvalCriteriaHasNoAmountRestrictions(getNonMintApprovals(collection)[0].approvalCriteria)
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