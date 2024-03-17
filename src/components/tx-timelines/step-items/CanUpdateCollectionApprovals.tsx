import { EditOutlined, InfoCircleFilled, MinusOutlined, UndoOutlined } from '@ant-design/icons';
import {
  AddressList,
  BitBadgesCollection,
  CollectionApprovalPermissionWithDetails,
  CollectionApprovalWithDetails,
  UintRangeArray
} from 'bitbadgesjs-sdk';
import { useMemo, useState } from 'react';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { getBadgesWithUnlockedSupply } from '../../../bitbadges-api/utils/badges';
import { getDetailsForPermission } from '../../../bitbadges-api/utils/permissions';
import { getBadgeIdsString } from '../../../utils/badgeIds';
import { compareObjects } from '../../../utils/compare';
import { AddressListSelect } from '../../address/AddressListsSelect';
import { PermissionsOverview } from '../../collection-page/PermissionsInfo';
import { ApprovalsDisplay } from '../../collection-page/transferability/ApprovalsDisplay';
import { TransferabilityDisplay } from '../../collection-page/transferability/TransferabilityDisplay';
import { TransferabilityTab } from '../../collection-page/transferability/TransferabilityTab';
import { ErrDisplay } from '../../common/ErrDisplay';
import { Pagination } from '../../common/Pagination';
import { Divider } from '../../display/Divider';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { BadgeIDSelectWithSwitch } from '../../inputs/BadgeIdRangesInput';
import { DateSelectWithSwitch } from '../../inputs/DateRangeInput';
import { RadioGroup } from '../../inputs/Selects';
import { Tabs } from '../../navigation/Tabs';
import { PermissionUpdateSelectWrapper } from '../form-items/PermissionUpdateSelectWrapper';
import { SwitchForm } from '../form-items/SwitchForm';

const AlwaysPermittedPermission = new CollectionApprovalPermissionWithDetails<bigint>({
  fromList: AddressList.AllAddresses(),
  fromListId: 'All',
  toList: AddressList.AllAddresses(),
  toListId: 'All',
  initiatedByList: AddressList.AllAddresses(),
  initiatedByListId: 'All',
  approvalId: 'All',
  amountTrackerId: 'All',
  challengeTrackerId: 'All',
  transferTimes: UintRangeArray.FullRanges(),
  badgeIds: UintRangeArray.FullRanges(),
  ownershipTimes: UintRangeArray.FullRanges(),
  permanentlyPermittedTimes: UintRangeArray.FullRanges(),
  permanentlyForbiddenTimes: UintRangeArray.From([])
});

const AlwaysLockedPermission = new CollectionApprovalPermissionWithDetails<bigint>({
  fromList: AddressList.AllAddresses(),
  fromListId: 'All',
  toList: AddressList.AllAddresses(),
  toListId: 'All',
  initiatedByList: AddressList.AllAddresses(),
  initiatedByListId: 'All',
  approvalId: 'All',
  amountTrackerId: 'All',
  challengeTrackerId: 'All',
  transferTimes: UintRangeArray.FullRanges(),
  badgeIds: UintRangeArray.FullRanges(),
  ownershipTimes: UintRangeArray.FullRanges(),
  permanentlyPermittedTimes: UintRangeArray.From([]),
  permanentlyForbiddenTimes: UintRangeArray.FullRanges()
});

export const isApprovalNonUpdatableAndExpectsSameValue = (
  approval: CollectionApprovalWithDetails<bigint>,
  collection: Readonly<BitBadgesCollection<bigint>>
) => {
  const permissions = collection?.collectionPermissions.canUpdateCollectionApprovals ?? [];
  const isEntireApprovalNotUpdatable = isEntireApprovalNonUpdatable(approval, permissions);
  if (!isEntireApprovalNotUpdatable) return false;

  const [needToFreezeChallengeTracker, needToFreezeAmountTracker] = keepsExpectedBehavior(approval, permissions);
  if (needToFreezeChallengeTracker || needToFreezeAmountTracker) return false;

  return true;
};

const isEntireApprovalNonUpdatable = (
  approval: CollectionApprovalWithDetails<bigint>,
  newPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>
) => {
  const {
    nonUpdatableApprovalIds,
    nonUpdatableBadgeIds,
    nonUpdatableTransferTimes,
    nonUpdatableOwnershipTimes,
    nonUpdatableFromAddresses,
    nonUpdatableToAddresses,
    nonUpdatableInitiatedByAddresses,
    nonUpdatableAmountTrackerIds,
    nonUpdatableChallengeTrackerIds
  } = getNonUpdatableValues(newPermissions);

  let isEntireApprovalNonUpdatable = false;

  //if 1+ value in the approval tuple is COMPLETELY non-updatable, then the entire tuple is non-updatable
  const [remaining] = approval.badgeIds.getOverlapDetails(nonUpdatableBadgeIds);
  if (remaining.length === 0) isEntireApprovalNonUpdatable = true; //all badge ids are frozen

  const [remaining2] = approval.transferTimes.getOverlapDetails(nonUpdatableTransferTimes);
  if (remaining2.length === 0) isEntireApprovalNonUpdatable = true; //all transfer times are frozen

  const [remaining3] = approval.ownershipTimes.getOverlapDetails(nonUpdatableOwnershipTimes);
  if (remaining3.length === 0) isEntireApprovalNonUpdatable = true; //all ownership times are frozen

  const [remaining4] = approval.fromList.getOverlapDetails(nonUpdatableFromAddresses);
  if (remaining4.addresses.length === 0 && remaining4.whitelist) isEntireApprovalNonUpdatable = true; //all from addresses are frozen

  const [remaining5] = approval.toList.getOverlapDetails(nonUpdatableToAddresses);
  if (remaining5.addresses.length === 0 && remaining5.whitelist) isEntireApprovalNonUpdatable = true; //all to addresses are frozen

  const [remaining6] = approval.initiatedByList.getOverlapDetails(nonUpdatableInitiatedByAddresses);
  if (remaining6.addresses.length === 0 && remaining6.whitelist) isEntireApprovalNonUpdatable = true; //all initiated by addresses are frozen

  if (nonUpdatableApprovalIds.checkAddress(approval.approvalId)) isEntireApprovalNonUpdatable = true; //approval ID is frozen

  if (nonUpdatableAmountTrackerIds.checkAddress(approval.amountTrackerId)) isEntireApprovalNonUpdatable = true; //amount tracker ID is frozen

  if (nonUpdatableChallengeTrackerIds.checkAddress(approval.challengeTrackerId)) isEntireApprovalNonUpdatable = true; //challenge tracker ID is frozen

  return isEntireApprovalNonUpdatable;
};

const keepsExpectedBehavior = (
  approval: CollectionApprovalWithDetails<bigint>,
  newPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>,
  simulate?: boolean
) => {
  const isEntireApprovalNotUpdatable = isEntireApprovalNonUpdatable(approval, newPermissions);

  const { nonUpdatableAmountTrackerIds, nonUpdatableChallengeTrackerIds } = getNonUpdatableValues(newPermissions);

  //If we wanted to, we could leave as is if it does not rely on trackers, but this goes
  //against best practices and is not recommended. We also don't support breakdowns in the UI.
  const reliesOnChallengeTracker = true;
  const reliesOnAmountTracker = true;

  // let reliesOnChallengeTracker = false;
  // if (approval.approvalCriteria?.merkleChallenge?.root) {
  //   reliesOnChallengeTracker = true;
  // }

  // let reliesOnAmountTracker = false;
  // if (approvalCriteriaUsesPredeterminedBalances(approval.approvalCriteria)
  //   && approval.approvalCriteria?.predeterminedBalances
  //   && !approval.approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex) {
  //   reliesOnAmountTracker = true;
  // }

  // if (approvalHasApprovalAmounts(approval.approvalCriteria?.approvalAmounts)
  //   || approvalHasMaxNumTransfers(approval.approvalCriteria?.maxNumTransfers)) {
  //   reliesOnAmountTracker = true;
  // }

  const isChallengeScoped = approval.challengeTrackerId === approval.approvalId;
  const isAmountScoped = approval.amountTrackerId === approval.approvalId;

  if (simulate) {
    return [true, true];
  }

  return [
    reliesOnChallengeTracker &&
      !(isEntireApprovalNotUpdatable && isChallengeScoped) &&
      !nonUpdatableChallengeTrackerIds.checkAddress(approval.challengeTrackerId),
    reliesOnAmountTracker && !(isEntireApprovalNotUpdatable && isAmountScoped) && !nonUpdatableAmountTrackerIds.checkAddress(approval.amountTrackerId)
  ];
};

//IMPORTANT: Non updatable values just means any approval will not be able to be edited with these values.
//However, you also need to check expected behavior for truly "frozen" values.
function getNonUpdatableValues(permissions: Array<CollectionApprovalPermissionWithDetails<bigint>>) {
  const details = getDetailsForPermission(permissions, 'canUpdateCollectionApprovals');
  const nonUpdatableBadgeIds = UintRangeArray.FullRanges();
  const nonUpdatableTransferTimes = UintRangeArray.FullRanges();
  const nonUpdatableOwnershipTimes = UintRangeArray.FullRanges();

  for (const item of details.dataSource.filter((x) => !x.forbidden)) {
    nonUpdatableBadgeIds.remove(item.badgeIds);
    nonUpdatableTransferTimes.remove(item.transferTimes);
    nonUpdatableOwnershipTimes.remove(item.ownershipTimes);
  }

  //start with all addresses
  const nonUpdatableFromAddresses = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });
  const nonUpdatableToAddresses = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });
  const nonUpdatableInitiatedByAddresses = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });
  const nonUpdatableAmountTrackerIds = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });
  const nonUpdatableChallengeTrackerIds = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });
  const nonUpdatableApprovalIds = new AddressList({
    listId: '',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: ''
  });

  for (const item of details.dataSource.filter((x) => !x.forbidden)) {
    nonUpdatableFromAddresses.remove(item.fromList);
    nonUpdatableToAddresses.remove(item.toList);
    nonUpdatableInitiatedByAddresses.remove(item.initiatedByList);
    nonUpdatableAmountTrackerIds.remove(item.amountTrackerIdList);
    nonUpdatableChallengeTrackerIds.remove(item.challengeTrackerIdList);
    nonUpdatableApprovalIds.remove(item.approvalIdList);
  }

  return {
    nonUpdatableApprovalIds,
    nonUpdatableBadgeIds,
    nonUpdatableTransferTimes,
    nonUpdatableOwnershipTimes,
    nonUpdatableFromAddresses,
    nonUpdatableToAddresses,
    nonUpdatableInitiatedByAddresses,
    nonUpdatableAmountTrackerIds,
    nonUpdatableChallengeTrackerIds
  };
}

export function FreezeSelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const [checked, setChecked] = useState<boolean>(!txTimelineContext.existingCollectionId);
  const [err, setErr] = useState<Error | null>(null);

  const [editIsVisible, setEditIsVisible] = useState<boolean>(false);
  const [editTab, setEditTab] = useState('approvalIds');
  const [editUintRanges, setEditUintRanges] = useState<UintRangeArray<bigint>>(UintRangeArray.FullRanges());
  const [editAddressList, setEditAddressList] = useState<AddressList>(
    new AddressList({ listId: '', addresses: [], whitelist: false, uri: '', customData: '' })
  );
  const [editApprovalId, setEditApprovalId] = useState<string>('');
  const [viewTab, setViewTab] = useState('permission');
  const [currPage, setCurrPage] = useState(1);
  const [customView, setCustomView] = useState(false);

  const applyPermissions = (
    newPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>,
    matches: Array<CollectionApprovalWithDetails<bigint>>,
    simualte?: boolean
  ) => {
    const amountTrackerIdsToFreeze: string[] = [];
    const challengeTrackerIdsToFreeze: string[] = [];
    const approvalIdsToFreeze: string[] = [];
    const trackerIdsToFreeze: Array<{
      amountTrackerId?: string;
      challengeTrackerId?: string;
      approvalId?: string;
    }> = [];
    for (const match of matches) {
      getOtherIdsToForbid(
        match,
        [...(collection?.collectionPermissions.canUpdateCollectionApprovals ?? []), ...newPermissions],
        amountTrackerIdsToFreeze,
        challengeTrackerIdsToFreeze,
        approvalIdsToFreeze,
        trackerIdsToFreeze,
        simualte
      );
    }

    const amountTrackerIds: string[] = [];
    const challengeTrackerIds: string[] = [];
    const approvalIds: string[] = [];
    for (const trackerId of trackerIdsToFreeze) {
      if (trackerId.amountTrackerId) amountTrackerIds.push(trackerId.amountTrackerId);
      if (trackerId.challengeTrackerId) challengeTrackerIds.push(trackerId.challengeTrackerId);
      if (trackerId.approvalId) approvalIds.push(trackerId.approvalId);
    }

    if (amountTrackerIds.length > 0) {
      const newPerm = AlwaysLockedPermission.clone();
      newPerm.amountTrackerId = amountTrackerIds.join(':');
      newPermissions.push(newPerm);
    }
    if (challengeTrackerIds.length > 0) {
      const newPerm = AlwaysLockedPermission.clone();
      newPerm.challengeTrackerId = challengeTrackerIds.join(':');
      newPermissions.push(newPerm);
    }
    if (approvalIds.length > 0) {
      const newPerm = AlwaysLockedPermission.clone();
      newPerm.approvalId = approvalIds.join(':');
      newPermissions.push(newPerm);
    }

    if (!simualte) {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        collectionPermissions: {
          canUpdateCollectionApprovals: [...(collection?.collectionPermissions.canUpdateCollectionApprovals ?? []), ...newPermissions]
        }
      });
    }

    return trackerIdsToFreeze;
  };

  const forbidAddressListUpdates = (addressList: AddressList, key: string, simulate?: boolean) => {
    const newPermissionsToPush: Array<CollectionApprovalPermissionWithDetails<bigint>> = [];
    newPermissionsToPush.push(
      new CollectionApprovalPermissionWithDetails<bigint>({
        ...AlwaysLockedPermission.clone(),
        [key]: addressList
      })
    );

    const matches: Array<CollectionApprovalWithDetails<bigint>> = [];
    for (const approval of collection?.collectionApprovals ?? []) {
      const removed = addressList.getOverlaps(approval[key as keyof CollectionApprovalWithDetails<bigint>] as AddressList);
      if (!removed.isEmpty()) {
        //scan those that potentially have cross-approval logic
        matches.push(approval);
      }
    }

    return applyPermissions(newPermissionsToPush, matches, simulate);
  };

  const forbidApprovalIdUpdates = (approvalId: string, simulate?: boolean) => {
    const newPermissionsToPush: Array<CollectionApprovalPermissionWithDetails<bigint>> = [];
    newPermissionsToPush.push(
      new CollectionApprovalPermissionWithDetails<bigint>({
        ...AlwaysLockedPermission.clone(),
        approvalId: approvalId
      })
    );

    const matches: Array<CollectionApprovalWithDetails<bigint>> = [];
    for (const approval of collection?.collectionApprovals ?? []) {
      if (approval.approvalId === approvalId) {
        //scan those that potentially have cross-approval logic
        matches.push(approval);
      }
    }

    return applyPermissions(newPermissionsToPush, matches, simulate);
  };

  const forbidUintRangeUpdates = (uintRanges: UintRangeArray<bigint>, key: string, simulate?: boolean) => {
    const newPermissionsToPush: Array<CollectionApprovalPermissionWithDetails<bigint>> = [];
    newPermissionsToPush.push(
      new CollectionApprovalPermissionWithDetails<bigint>({
        ...AlwaysLockedPermission.clone(),
        [key]: uintRanges
      })
    );

    const matches: Array<CollectionApprovalWithDetails<bigint>> = [];
    for (const approval of collection?.collectionApprovals ?? []) {
      const removed = uintRanges.getOverlapDetails(approval[key as keyof CollectionApprovalWithDetails<bigint>] as UintRangeArray<bigint>);
      if (removed.length > 0) {
        //scan those that potentially have cross-approval logic
        matches.push(approval);
      }
    }

    return applyPermissions(newPermissionsToPush, matches, simulate);
  };

  const getOtherIdsToForbid = (
    approval: CollectionApprovalWithDetails<bigint>,
    newPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>,
    amountTrackerIdsToFreeze: string[],
    challengeTrackerIdsToFreeze: string[],
    approvalIdsToFreeze: string[],
    trackerIdsToFreeze: Array<{
      amountTrackerId?: string;
      challengeTrackerId?: string;
      approvalId?: string;
    }>,
    simulate?: boolean
  ) => {
    const [needToFreezeChallengeTracker, needToFreezeAmountTracker] = keepsExpectedBehavior(approval, newPermissions, simulate);

    const isChallengeScoped = approval.challengeTrackerId === approval.approvalId;
    const isAmountScoped = approval.amountTrackerId === approval.approvalId;

    trackerIdsToFreeze.push({
      amountTrackerId: needToFreezeAmountTracker && !isAmountScoped ? approval.amountTrackerId : undefined,
      challengeTrackerId: needToFreezeChallengeTracker && !isChallengeScoped ? approval.challengeTrackerId : undefined,
      approvalId:
        (needToFreezeChallengeTracker && isChallengeScoped) || (needToFreezeAmountTracker && isAmountScoped) ? approval.approvalId : undefined
    });

    if (needToFreezeChallengeTracker) {
      if (!challengeTrackerIdsToFreeze.includes(approval.challengeTrackerId)) challengeTrackerIdsToFreeze.push(approval.challengeTrackerId);
      if (!approvalIdsToFreeze.includes(approval.approvalId)) approvalIdsToFreeze.push(approval.approvalId);
    }

    if (needToFreezeAmountTracker) {
      if (!amountTrackerIdsToFreeze.includes(approval.amountTrackerId)) amountTrackerIdsToFreeze.push(approval.amountTrackerId);
      if (!approvalIdsToFreeze.includes(approval.approvalId)) approvalIdsToFreeze.push(approval.approvalId);
    }

    if (needToFreezeChallengeTracker) {
      if (!amountTrackerIdsToFreeze.includes(approval.amountTrackerId)) {
        const matches = (collection?.collectionApprovals ?? []).filter((x) => x.amountTrackerId === approval.amountTrackerId);
        for (const match of matches) {
          getOtherIdsToForbid(match, newPermissions, amountTrackerIdsToFreeze, challengeTrackerIdsToFreeze, approvalIdsToFreeze, trackerIdsToFreeze);
        }
      }
    }

    //also freeze all other approvals that use the challenge tracker if necessary
    if (needToFreezeAmountTracker) {
      if (!challengeTrackerIdsToFreeze.includes(approval.challengeTrackerId)) {
        const matches = (collection?.collectionApprovals ?? []).filter((x) => x.challengeTrackerId === approval.challengeTrackerId);
        for (const match of matches) {
          getOtherIdsToForbid(match, newPermissions, amountTrackerIdsToFreeze, challengeTrackerIdsToFreeze, approvalIdsToFreeze, trackerIdsToFreeze);
        }
      }
    }
  };

  const currAffeectedApprovals = useMemo(() => {
    if (!collection) return;
    let idsToFreeze: any[] = [];
    if (editTab === 'approvalIds') {
      idsToFreeze = forbidApprovalIdUpdates(editApprovalId, true);
    } else if (editTab === 'from' || editTab === 'to' || editTab === 'initiatedBy') {
      idsToFreeze = forbidAddressListUpdates(
        editAddressList,
        editTab === 'from' ? 'fromList' : editTab === 'to' ? 'toList' : 'initiatedByList',
        true
      );
    } else if (editTab === 'badgeIds' || editTab === 'transferTimes' || editTab === 'ownershipTimes') {
      idsToFreeze = forbidUintRangeUpdates(editUintRanges, editTab, true);
    } else if (editTab === 'all') {
      idsToFreeze = forbidUintRangeUpdates(UintRangeArray.FullRanges(), 'badgeIds', true);
    } else {
      throw new Error('');
    }

    return collection.collectionApprovals.filter((x) => {
      const hasApprovalId = idsToFreeze.find((y) => y.approvalId === x.approvalId);
      const hasAmountTrackerId = idsToFreeze.find((y) => y.amountTrackerId === x.amountTrackerId);
      const hasChallengeTrackerId = idsToFreeze.find((y) => y.challengeTrackerId === x.challengeTrackerId);
      return hasApprovalId || hasAmountTrackerId || hasChallengeTrackerId;
    });
  }, [editTab, editUintRanges, editAddressList, editApprovalId, collection]);

  if (!collection) return EmptyStepItem;

  const badgesIdsWithUnlockedSupply = getBadgesWithUnlockedSupply(collection, undefined, true, 'always'); //Get badge IDs that will have unlocked supply moving forward

  const completelyFrozen = getDetailsForPermission(
    collection.collectionPermissions.canUpdateCollectionApprovals,
    'canUpdateCollectionApprovals'
  ).dataSource.every((x) => x.forbidden);

  const postMintFrozen =
    !completelyFrozen &&
    getDetailsForPermission(collection.collectionPermissions.canUpdateCollectionApprovals, 'canUpdateCollectionApprovals')
      .dataSource.filter((x) => !x.forbidden)
      .every((x) => x.fromList.addresses.length === 1 && x.fromList.whitelist && x.fromList.addresses[0] === 'Mint');
  const mintFrozen =
    !completelyFrozen &&
    getDetailsForPermission(collection.collectionPermissions.canUpdateCollectionApprovals, 'canUpdateCollectionApprovals')
      .dataSource.filter((x) => !x.forbidden)
      .every((x) => !x.fromList.checkAddress('Mint'));

  return {
    title: `Update transferability?`,
    description: `After this transaction, can the collection-level transferability be updated by the manager? This includes everything from how badges are distributed, freezing addresses, revoking badges, etc.`,
    node: () => (
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName="canUpdateCollectionApprovals"
        node={() => (
          <>
            <br />
            {badgesIdsWithUnlockedSupply.length > 0 && (
              <>
                <ErrDisplay
                  warning
                  err={`You have selected to be able to increment supply / create more of the following badges: ${getBadgeIdsString(badgesIdsWithUnlockedSupply)}.
              Please make sure you do not end up in a scenario where you can create new badges but cannot distribute them due to frozen transferability.`}
                />
                <br />
              </>
            )}
            <SwitchForm
              options={[
                {
                  title: 'Completely Frozen',
                  message: 'Freeze the transferability entirely for the collection for all badge IDs and from all addresses.',
                  isSelected: !customView && completelyFrozen,
                  additionalNode: () => (
                    <div className="flex-center">
                      <PermissionsOverview
                        span={24}
                        collectionId={collection.collectionId}
                        permissionName="canUpdateCollectionApprovals"
                        onFreezePermitted={() => {
                          //N/A
                        }}
                      />
                    </div>
                  )
                },
                {
                  title: 'Freeze Post-Mint Transferability',
                  message: `Freeze the transferability of the collection for all badge IDs AFTER the badges have been transferred from the Mint address (i.e. revoking, transferable vs non-transferable, frozen addresses, etc).`,
                  isSelected: !customView && postMintFrozen,
                  additionalNode: () => (
                    <PermissionsOverview
                      span={24}
                      collectionId={collection.collectionId}
                      permissionName="canUpdateCollectionApprovals"
                      onFreezePermitted={(frozen: boolean) => {
                        updateCollection({
                          collectionId: NEW_COLLECTION_ID,
                          collectionPermissions: {
                            canUpdateCollectionApprovals: frozen
                              ? [...collection.collectionPermissions.canUpdateCollectionApprovals, AlwaysPermittedPermission]
                              : //pop off the last element
                                collection.collectionPermissions.canUpdateCollectionApprovals.slice(
                                  0,
                                  collection.collectionPermissions.canUpdateCollectionApprovals.length - 1
                                )
                          }
                        });
                      }}
                    />
                  )
                },
                {
                  title: 'Freeze Mint Transferability',
                  message: `Freeze the transferability of the collection for all transfers from the Mint address.`,
                  isSelected: !customView && mintFrozen,
                  additionalNode: () => (
                    <PermissionsOverview
                      span={24}
                      collectionId={collection.collectionId}
                      permissionName="canUpdateCollectionApprovals"
                      onFreezePermitted={(frozen: boolean) => {
                        updateCollection({
                          collectionId: NEW_COLLECTION_ID,
                          collectionPermissions: {
                            canUpdateCollectionApprovals: frozen
                              ? [...collection.collectionPermissions.canUpdateCollectionApprovals, AlwaysPermittedPermission]
                              : //pop off the last element
                                collection.collectionPermissions.canUpdateCollectionApprovals.slice(
                                  0,
                                  collection.collectionPermissions.canUpdateCollectionApprovals.length - 1
                                )
                          }
                        });
                      }}
                    />
                  )
                },
                {
                  title: 'Editable',
                  message:
                    'The collection manager can edit any of the collection transferability. If left non-frozen, this can be disabled in the future..',
                  isSelected:
                    !customView &&
                    getDetailsForPermission(
                      collection.collectionPermissions.canUpdateCollectionApprovals,
                      'canUpdateCollectionApprovals'
                    ).dataSource.every((x) => !x.forbidden),
                  additionalNode: () => (
                    <div className="flex-center">
                      <PermissionsOverview
                        span={24}
                        collectionId={collection.collectionId}
                        permissionName="canUpdateCollectionApprovals"
                        onFreezePermitted={(frozen: boolean) => {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            collectionPermissions: {
                              canUpdateCollectionApprovals: frozen
                                ? [...collection.collectionPermissions.canUpdateCollectionApprovals, AlwaysPermittedPermission]
                                : //pop off the last element
                                  collection.collectionPermissions.canUpdateCollectionApprovals.slice(
                                    0,
                                    collection.collectionPermissions.canUpdateCollectionApprovals.length - 1
                                  )
                            }
                          });
                        }}
                      />
                    </div>
                  )
                },
                {
                  title: 'Custom',
                  message:
                    'Set custom restrictions for updating transferability, such as locking certain badge IDs or locking all Mint transferability.',
                  isSelected: customView
                }
              ]}
              onSwitchChange={(idx) => {
                if (idx === 0) {
                  setCustomView(false);
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      canUpdateCollectionApprovals: [AlwaysLockedPermission]
                    }
                  });
                } else if (idx === 3) {
                  setCustomView(false);
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      canUpdateCollectionApprovals: []
                    }
                  });
                } else if (idx === 4) {
                  setCustomView(true);
                } else if (idx == 1) {
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      canUpdateCollectionApprovals: [
                        new CollectionApprovalPermissionWithDetails<bigint>({
                          ...AlwaysLockedPermission.clone(),
                          fromListId: '!Mint',
                          fromList: AddressList.Reserved('!Mint')
                        })
                      ]
                    }
                  });
                } else if (idx == 2) {
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: {
                      canUpdateCollectionApprovals: [
                        new CollectionApprovalPermissionWithDetails<bigint>({
                          ...AlwaysLockedPermission,
                          fromListId: 'Mint',
                          fromList: AddressList.Reserved('Mint')
                        })
                      ]
                    }
                  });
                }
              }}
            />

            {customView && (
              <>
                <Divider />
                <div className="flex-center">
                  <Tabs
                    type="underline"
                    tab={viewTab}
                    setTab={setViewTab}
                    tabInfo={[
                      {
                        key: 'permission',
                        content: 'Permission'
                      },
                      {
                        key: 'approvals',
                        content: 'Transferability'
                      }
                    ]}
                  />
                </div>

                {viewTab === 'permission' && (
                  <>
                    <br />
                    <div className="flex-center">
                      <PermissionsOverview
                        span={24}
                        collectionId={collection.collectionId}
                        permissionName="canUpdateCollectionApprovals"
                        onFreezePermitted={(frozen: boolean) => {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            collectionPermissions: {
                              canUpdateCollectionApprovals: frozen
                                ? [...collection.collectionPermissions.canUpdateCollectionApprovals, AlwaysPermittedPermission]
                                : //pop off the last element
                                  collection.collectionPermissions.canUpdateCollectionApprovals.slice(
                                    0,
                                    collection.collectionPermissions.canUpdateCollectionApprovals.length - 1
                                  )
                            }
                          });
                        }}
                      />
                    </div>

                    <div className="flex-center">
                      <IconButton
                        src={editIsVisible ? <MinusOutlined /> : <EditOutlined />}
                        text={editIsVisible ? 'Hide' : 'Edit'}
                        onClick={() => {
                          setEditIsVisible(!editIsVisible);
                        }}
                      />
                      {!editIsVisible && (
                        <IconButton
                          disabled={compareObjects(
                            collection.collectionPermissions.canUpdateCollectionApprovals,
                            txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals
                          )}
                          src={<UndoOutlined />}
                          text={'Reset'}
                          onClick={() => {
                            updateCollection({
                              collectionId: NEW_COLLECTION_ID,
                              collectionPermissions: {
                                canUpdateCollectionApprovals:
                                  txTimelineContext.startingCollection?.collectionPermissions.canUpdateCollectionApprovals ?? []
                              }
                            });
                          }}
                        />
                      )}
                    </div>
                    <br />
                    {editIsVisible && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <b className="primary-text">Select Values to Freeze</b>
                          <br />
                          <div className="secondary-text">
                            <InfoCircleFilled /> We will disallow creating, updating, or deleting approvals with the selected values. To ensure
                            expected behavior, we will also freeze approvals that may only partially overlap with the selected values.
                          </div>
                        </div>
                        <br />
                        <RadioGroup
                          label=""
                          value={editTab}
                          onChange={(e) => {
                            setEditTab(e);
                          }}
                          options={[
                            {
                              value: 'all',
                              label: 'All'
                            },
                            {
                              value: 'approvalIds',
                              label: 'Speciifc Approvals'
                            },
                            {
                              value: 'from',
                              label: 'From'
                            },
                            {
                              value: 'to',
                              label: 'To'
                            },
                            {
                              value: 'initiatedBy',
                              label: 'Approved'
                            },
                            {
                              value: 'badgeIds',
                              label: 'Badge IDs'
                            },
                            {
                              value: 'transferTimes',
                              label: 'Transfer Times'
                            },
                            {
                              value: 'ownershipTimes',
                              label: 'Ownership Times'
                            }
                          ]}
                        />
                        <br />
                        <br />
                        {editTab === 'all' && (
                          <div className="full-width flex-center primary-text">Freeze all approvals and everything moving forward.</div>
                        )}

                        {editTab === 'approvalIds' && (
                          <div className="full-width flex-center flex-column">
                            <Pagination
                              currPage={currPage}
                              onChange={(page) => {
                                setCurrPage(page);
                              }}
                              pageSize={1}
                              total={collection.collectionApprovals.length}
                            />
                            <br />
                            {collection.collectionApprovals.length > 0 && (
                              <div className="flex-center">
                                <TransferabilityDisplay
                                  approval={collection.collectionApprovals[currPage - 1]}
                                  collectionId={collection.collectionId}
                                  allApprovals={collection.collectionApprovals}
                                  hideActions={true}
                                  setAddress={() => {}}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {editTab === 'badgeIds' && (
                          <div className="full-width flex-center">
                            <InformationDisplayCard
                              md={12}
                              sm={24}
                              xs={24}
                              title="Badge IDs"
                              subtitle="Forbid updating approval values for the following badge IDs.">
                              <br />
                              <BadgeIDSelectWithSwitch
                                collectionId={collection.collectionId}
                                uintRanges={editUintRanges}
                                setUintRanges={setEditUintRanges}
                              />
                            </InformationDisplayCard>
                          </div>
                        )}
                        {(editTab === 'transferTimes' || editTab === 'ownershipTimes') && (
                          <div className="full-width flex-center">
                            <InformationDisplayCard
                              md={12}
                              sm={24}
                              xs={24}
                              title={editTab === 'transferTimes' ? 'Transfer Times' : 'Ownership Times'}
                              subtitle={`Forbid updating approval values for the following ${editTab === 'transferTimes' ? 'transfer' : 'ownership'} times.`}>
                              <DateSelectWithSwitch timeRanges={editUintRanges} setTimeRanges={setEditUintRanges} />
                            </InformationDisplayCard>
                          </div>
                        )}
                        {(editTab === 'from' || editTab === 'to' || editTab === 'initiatedBy') && (
                          <div className="full-width flex-center">
                            <InformationDisplayCard
                              md={12}
                              sm={24}
                              xs={24}
                              title={editTab === 'from' ? 'From Addresses' : editTab === 'to' ? 'To Addresses' : 'Initiated By Addresses'}
                              subtitle={`Forbid updating approval values for the following ${editTab === 'from' ? 'from' : editTab === 'to' ? 'to' : 'initiated by'} addresses.`}>
                              <div className="flex-center">
                                <AddressListSelect
                                  addressList={editAddressList}
                                  setAddressList={setEditAddressList}
                                  allowMintSearch={editTab === 'from'}
                                />
                              </div>
                            </InformationDisplayCard>
                          </div>
                        )}

                        <Divider />
                        {currAffeectedApprovals && currAffeectedApprovals.length > 0 && (
                          <>
                            <div className="flex-center primary-text" style={{ textAlign: 'center', fontSize: 24 }}>
                              <b className="primary-text">Affected Approvals</b>
                            </div>
                            <div className="secondary-text" style={{ textAlign: 'center' }}>
                              <InfoCircleFilled /> The selected values and the following approvals will be frozen. Please ensure this is okay.
                            </div>
                            <br />
                            <div className="flex-center">
                              <ApprovalsDisplay
                                approvals={currAffeectedApprovals}
                                collectionId={collection.collectionId}
                                approvalLevel="collection"
                                approverAddress=""
                                hideHelperMessage
                                hideActions={true}
                              />
                            </div>
                          </>
                        )}

                        <div className="full-width flex-center">
                          <button
                            className="landing-button full-width"
                            style={{ width: '100%' }}
                            onClick={() => {
                              if (editTab === 'approvalIds') {
                                forbidApprovalIdUpdates(collection.collectionApprovals[currPage - 1].approvalId);
                              } else if (editTab === 'from' || editTab === 'to' || editTab === 'initiatedBy') {
                                forbidAddressListUpdates(
                                  editAddressList,
                                  editTab === 'from' ? 'fromList' : editTab === 'to' ? 'toList' : 'initiatedByList'
                                );
                              } else if (editTab === 'badgeIds' || editTab === 'transferTimes' || editTab === 'ownershipTimes') {
                                forbidUintRangeUpdates(editUintRanges, editTab);
                              } else if (editTab === 'all') {
                                forbidUintRangeUpdates(UintRangeArray.FullRanges(), 'badgeIds');
                              }

                              setEditAddressList(
                                new AddressList({
                                  listId: '',
                                  addresses: [],
                                  whitelist: false,
                                  uri: '',
                                  customData: ''
                                })
                              );
                              setEditApprovalId('');
                              setEditUintRanges(UintRangeArray.FullRanges());
                              setEditIsVisible(false);
                            }}>
                            Freeze
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {viewTab === 'approvals' && (
                  <>
                    <div className="secondary-text my-2" style={{ textAlign: 'center' }}>
                      <InfoCircleFilled /> Frozen, non-updatable ones will have a frozen tag.
                    </div>
                    <TransferabilityTab collectionId={collection.collectionId} hideHelperMessage hideActions={true} />
                  </>
                )}
              </>
            )}
          </>
        )}
      />
    ),
    disabled: !!err
  };
}
