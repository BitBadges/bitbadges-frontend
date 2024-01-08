import { deepCopy } from "bitbadgesjs-proto";
import { BigIntify, BitBadgesCollection, BitBadgesUserInfo, batchUpdateBadgeMetadata, convertBitBadgesCollection, convertBitBadgesUserInfo } from "bitbadgesjs-utils";
import { NEW_COLLECTION_ID } from "../contexts/TxTimelineContext";

export function updateCollectionWithResponse(oldCollection: BitBadgesCollection<bigint> | undefined, newCollectionResponse: BitBadgesCollection<bigint>) {
  //TODO: No idea why the deep copy is necessary but it breaks the timeline batch updates for existing collections if not
  //      One place to look: somehow, I think that the indivudal elements in .badgeIds are the same object (cached[0].badgeIds === new[0].badgeIds)
  //      I think the cachedCollection deepCopy is the important one, but I'm not sure
  let cachedCollection = oldCollection ? deepCopy(convertBitBadgesCollection(oldCollection, BigIntify)) : undefined;
  if (!cachedCollection) return newCollectionResponse;

  const newCollection = newCollectionResponse;
  let newBadgeMetadata = newCollection.cachedBadgeMetadata && newCollection.cachedBadgeMetadata.length > 0
    ? batchUpdateBadgeMetadata(cachedCollection.cachedBadgeMetadata, deepCopy(newCollection.cachedBadgeMetadata))
    : cachedCollection.cachedBadgeMetadata;


  const newViews = cachedCollection?.views || {};

  if (newCollection.views) {
    for (const [key, val] of Object.entries(newCollection.views)) {
      if (!val) continue;
      const oldVal = cachedCollection?.views[key];
      const newVal = val;

      newViews[key] = {
        ids: [...(oldVal?.ids || []), ...(newVal?.ids || [])].filter((val, index, self) => self.findIndex(x => x === val) === index),
        pagination: {
          ...val.pagination,
          total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
        },
        type: val.type
      }
    }
  }


  const reviews = cachedCollection.reviews || [];
  for (const newReview of newCollection.reviews || []) {
    //If we already have the review, replace it (we want newer data)
    const existingReview = reviews.findIndex(x => x._legacyId === newReview._legacyId);
    if (existingReview !== -1) {
      reviews[existingReview] = newReview;
    } else {
      reviews.push(newReview);
    }
  }

  const announcements = cachedCollection.announcements || [];
  for (const newAnnouncement of newCollection.announcements || []) {
    //If we already have the announcement, replace it (we want newer data)
    const existingAnnouncement = announcements.findIndex(x => x._legacyId === newAnnouncement._legacyId);
    if (existingAnnouncement !== -1) {
      announcements[existingAnnouncement] = newAnnouncement;
    } else {
      announcements.push(newAnnouncement);
    }
  }

  const activity = cachedCollection.activity || [];
  for (const newActivity of newCollection.activity || []) {
    //If we already have the activity, replace it (we want newer data)
    const existingActivity = activity.findIndex(x => x._legacyId === newActivity._legacyId);
    if (existingActivity !== -1) {
      activity[existingActivity] = newActivity;
    } else {
      activity.push(newActivity);
    }
  }

  const owners = cachedCollection.owners || [];
  for (const newOwner of newCollection.owners || []) {
    //If we already have the owner, replace it (we want newer data)
    const existingOwner = owners.findIndex(x => x._legacyId === newOwner._legacyId);
    if (existingOwner !== -1) {
      owners[existingOwner] = newOwner;
    } else {
      owners.push(newOwner);
    }
  }

  const merkleChallenges = cachedCollection.merkleChallenges || [];
  for (const newMerkleChallenge of newCollection.merkleChallenges || []) {
    //If we already have the merkleChallenge, replace it (we want newer data)
    const existingMerkleChallenge = merkleChallenges.findIndex(x => x._legacyId === newMerkleChallenge._legacyId);
    if (existingMerkleChallenge !== -1) {
      merkleChallenges[existingMerkleChallenge] = newMerkleChallenge;
    } else {
      merkleChallenges.push(newMerkleChallenge);
    }
  }

  const approvalsTrackers = cachedCollection.approvalsTrackers || [];
  for (const newApprovalsTracker of newCollection.approvalsTrackers || []) {
    //If we already have the approvalsTracker, replace it (we want newer data)
    const existingApprovalsTracker = approvalsTrackers.findIndex(x => x._legacyId === newApprovalsTracker._legacyId);
    if (existingApprovalsTracker !== -1) {
      approvalsTrackers[existingApprovalsTracker] = newApprovalsTracker;
    } else {
      approvalsTrackers.push(newApprovalsTracker);
    }
  }


  //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
  cachedCollection = {
    ...cachedCollection,
    ...newCollection,
    cachedCollectionMetadata: newCollection.cachedCollectionMetadata || cachedCollection?.cachedCollectionMetadata,
    cachedBadgeMetadata: newBadgeMetadata,
    reviews,
    announcements,
    activity,
    owners,
    merkleChallenges,
    approvalsTrackers,
    views: newViews,
  };

  if (cachedCollection.collectionId === NEW_COLLECTION_ID) {
    //Filter out fetchedAt and fetchedAtBlock for preview collections
    delete cachedCollection.cachedCollectionMetadata?.fetchedAt;
    delete cachedCollection.cachedCollectionMetadata?.fetchedAtBlock;
    for (const metadataDetails of cachedCollection.cachedBadgeMetadata) {
      delete metadataDetails.metadata?.fetchedAt;
      delete metadataDetails.metadata?.fetchedAtBlock;
    }
  }

  return cachedCollection
}

export function updateAccountWithResponse(oldAccount: BitBadgesUserInfo<bigint> | undefined, newAccountResponse: BitBadgesUserInfo<bigint>) {
  const cachedAccount = oldAccount ? convertBitBadgesUserInfo(oldAccount, BigIntify) : undefined;
  if (!cachedAccount) return newAccountResponse;

  const account = newAccountResponse;

  let publicKey = cachedAccount?.publicKey ? cachedAccount.publicKey : account.publicKey ? account.publicKey : '';

  //Append all views to the existing views
  const views = cachedAccount?.views || {};
  for (const [key, newVal] of Object.entries(account.views)) {
    if (!newVal) continue;
    const oldVal = views[key];

    views[key] = {
      ids: [
        ...new Set([
          ...(oldVal?.ids || []),
          ...(newVal?.ids || []),
        ]),
      ].filter((x, index, self) => index === self.findIndex((t) => t === x)),
      pagination: newVal.pagination,
      type: newVal.type,
    };
  }

  //Merge the rest
  const newAccount = {
    ...cachedAccount,
    ...account,

    reviews: [...(cachedAccount?.reviews || []), ...(account.reviews || [])],
    collected: [...(cachedAccount?.collected || []), ...(account.collected || [])],
    activity: [...(cachedAccount?.activity || []), ...(account.activity || []),],
    announcements: [...(cachedAccount?.announcements || []), ...(account.announcements || []),],
    addressMappings: [...(cachedAccount?.addressMappings || []), ...(account.addressMappings || []),],
    claimAlerts: [...(cachedAccount?.claimAlerts || []), ...(account.claimAlerts || []),],
    authCodes: [...(cachedAccount?.authCodes || []), ...(account.authCodes || []),],
    listsActivity: [...(cachedAccount?.listsActivity || []), ...(account.listsActivity || []),],
    views: views,
    publicKey,
    airdropped: account.airdropped ? account.airdropped : cachedAccount?.airdropped ? cachedAccount.airdropped : false,
    sequence: account.sequence ?? cachedAccount?.sequence ?? 0n,
    accountNumber:
      account &&
        account.accountNumber !== undefined &&
        account.accountNumber >= 0n
        ? account.accountNumber
        : cachedAccount &&
          cachedAccount.accountNumber !== undefined &&
          cachedAccount.accountNumber >= 0n
          ? cachedAccount.accountNumber
          : -1n,
    resolvedName: account.resolvedName
      ? account.resolvedName
      : cachedAccount?.resolvedName
        ? cachedAccount.resolvedName
        : '',
  };

  //Filter duplicates
  newAccount.reviews = newAccount.reviews.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.collected = newAccount.collected.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.activity = newAccount.activity.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.announcements = newAccount.announcements.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.addressMappings = newAccount.addressMappings.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t.mappingId === x.mappingId)
  );
  newAccount.claimAlerts = newAccount.claimAlerts.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.authCodes = newAccount.authCodes.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );
  newAccount.listsActivity = newAccount.listsActivity.filter(
    (x, index, self) =>
      index === self.findIndex((t) => t._legacyId === x._legacyId)
  );

  //sort in descending order
  newAccount.activity = newAccount.activity.sort((a, b) =>
    b.timestamp - a.timestamp > 0 ? -1 : 1
  );
  newAccount.announcements = newAccount.announcements.sort((a, b) =>
    b.timestamp - a.timestamp > 0 ? -1 : 1
  );
  newAccount.reviews = newAccount.reviews.sort((a, b) =>
    b.timestamp - a.timestamp > 0 ? -1 : 1
  );
  newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) =>
    b.createdTimestamp - a.createdTimestamp > 0 ? -1 : 1
  );
  newAccount.authCodes = newAccount.authCodes.sort((a, b) =>
    b.createdAt - a.createdAt > 0 ? -1 : 1
  );
  newAccount.listsActivity = newAccount.listsActivity.sort((a, b) =>
    b.timestamp - a.timestamp > 0 ? -1 : 1
  );

  return newAccount;
}