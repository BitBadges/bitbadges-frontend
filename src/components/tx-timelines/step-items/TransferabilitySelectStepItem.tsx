import { AddressList, CollectionApprovalWithDetails, UintRangeArray } from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAdditionalRestrictions, approvalCriteriaHasNoAmountRestrictions } from '../../../bitbadges-api/utils/claims';
import { getMintApprovals, getNonMintApprovals } from '../../../bitbadges-api/utils/mintVsNonMint';
import { TransferabilityTab } from '../../collection-page/transferability/TransferabilityTab';
import { SwitchForm } from '../form-items/SwitchForm';
import { UpdateSelectWrapper } from '../form-items/UpdateSelectWrapper';

export const transferableApproval = new CollectionApprovalWithDetails({
  fromListId: '!Mint',
  fromList: AddressList.getReservedAddressList('!Mint'),
  toListId: 'All',
  toList: AddressList.AllAddresses(),
  initiatedByListId: 'All',
  initiatedByList: AddressList.AllAddresses(),
  transferTimes: UintRangeArray.FullRanges(),
  ownershipTimes: UintRangeArray.FullRanges(),
  badgeIds: UintRangeArray.FullRanges(),
  approvalId: 'transferable-approval',
  amountTrackerId: 'transferable-approval',
  challengeTrackerId: 'transferable-approval'
});

export function TransferabilitySelectStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const collection = useCollection(NEW_COLLECTION_ID);
  const setApprovalsToAdd = (approvalsToAdd: Array<CollectionApprovalWithDetails<bigint>>) => {
    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionApprovals: approvalsToAdd
    });
  };
  const startingCollection = txTimelineContext.startingCollection;
  const updateCollectionApprovals = txTimelineContext.updateCollectionApprovals;
  const setUpdateCollectionApprovals = txTimelineContext.setUpdateCollectionApprovals;

  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  return {
    title: `Collection Approvals (Transferability) - Post-Minting`,
    description: (
      <>{`Excluding transfers from the Mint address, set the collection level approvals for who can transfer badges.
    Use the advanced view to implement more complex transfer restrictions.`}</>
    ),
    node: () => (
      <UpdateSelectWrapper
        documentationLink={'https://docs.bitbadges.io/overview/how-it-works/transferability'}
        err={err}
        updateFlag={updateCollectionApprovals}
        setUpdateFlag={setUpdateCollectionApprovals}
        jsonPropertyPath="collectionApprovals"
        permissionName="canUpdateCollectionApprovals"
        setErr={(err) => {
          setErr(err);
        }}
        advancedNode={() => (
          <>
            <div className="flex-center" style={{ textAlign: 'center' }}>
              <TransferabilityTab collectionId={NEW_COLLECTION_ID} onlyShowNotFromMint hideHelperMessage showDeletedGrayedOut editable />
            </div>
          </>
        )}
        customRevertFunction={() => {
          const prevNonMint = startingCollection ? getNonMintApprovals(startingCollection) : [];
          const currentMint = getMintApprovals(collection);

          updateCollection({
            collectionId: NEW_COLLECTION_ID,
            collectionApprovals: [...currentMint, ...prevNonMint]
          });
        }}
        nonMintOnly
        node={() => (
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
                  isSelected:
                    getNonMintApprovals(collection).length === 1 &&
                    getNonMintApprovals(collection).every(
                      (x) =>
                        approvalCriteriaHasNoAdditionalRestrictions(x.approvalCriteria) &&
                        approvalCriteriaHasNoAmountRestrictions(x.approvalCriteria) &&
                        x.badgeIds.isFull() &&
                        x.transferTimes.isFull() &&
                        x.ownershipTimes.isFull() &&
                        x.fromListId === '!Mint' &&
                        x.toListId === 'All' &&
                        x.initiatedByListId === 'All'
                    )
                }
              ]}
              onSwitchChange={(idx) => {
                if (idx === 0) {
                  setApprovalsToAdd(getMintApprovals(collection));
                } else if (idx == 1) {
                  setApprovalsToAdd([...getMintApprovals(collection), transferableApproval.clone()]);
                }
              }}
            />
          </div>
        )}
      />
    ),
    disabled: !!err
  };
}
