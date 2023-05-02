import axiosApi from 'axios';
import { AccountResponse, AnnouncementActivityItem, BadgeMetadata, BadgeMetadataMap, BalancesMap, BitBadgeCollection, GetAccountByNumberRoute, GetAccountRoute, GetAccountsRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetCollectionsRoute, GetMetadataRoute, GetOwnersResponse, GetOwnersRoute, GetPermissions, GetPortfolioResponse, GetPortfolioRoute, GetSearchRoute, GetStatusRoute, IdRange, IndexerStatus, METADATA_PAGE_LIMIT, PaginationInfo, SearchResponse, StoredBadgeCollection, TransferActivityItem, convertToCosmosAddress, getMaxBatchId, isAddressValid, updateMetadataMap } from "bitbadgesjs-utils";
import { ChallengeParams } from "blockin";
import Joi from 'joi';
import { BACKEND_URL } from '../constants';
import { stringify } from "../utils/preserveJson";

const axios = axiosApi.create({
  withCredentials: true,
  headers: {
    "Content-type": "application/json",
  },
});

//Get account by address
export async function getAccountInformation(address: string) {
  const bech32Address = convertToCosmosAddress(address);
  const accountObject: AccountResponse = await axios.post(BACKEND_URL + GetAccountRoute(bech32Address.toLowerCase())).then((res) => res.data);
  return accountObject;
}

//Get indexer status
export async function getStatus() {
  const status: IndexerStatus = await axios.post(BACKEND_URL + GetStatusRoute()).then((res) => res.data);
  return status;
}

//Get account by account number
export async function getAccountInformationByAccountNumber(id: number) {
  const accountObject: AccountResponse = await axios.post(BACKEND_URL + GetAccountByNumberRoute(id)).then((res) => res.data);
  return accountObject;
}

export async function getAccounts(accountNums: number[], addresses: string[]) {
  accountNums = accountNums.filter((x) => x !== undefined && x !== -1);
  addresses = addresses.filter((x) => x !== undefined && x !== '' && isAddressValid(x));
  if (accountNums.length === 0 && addresses.length === 0) {
    return [];
  }

  const accountObjects: { accounts: AccountResponse[] } = await axios.post(BACKEND_URL + GetAccountsRoute(), { accountNums, addresses }).then((res) => res.data);
  return accountObjects.accounts;
}

//Query owners for a specific badge
export async function getBadgeOwners(collectionId: number, badgeId: number) {
  const owners: GetOwnersResponse = await axios.post(BACKEND_URL + GetOwnersRoute(collectionId, badgeId)).then((res) => res.data);
  return owners;
}

async function cleanCollection(badgeData: BitBadgeCollection, fetchAllMetadata: boolean = false) {
  // Convert the returned permissions (uint) to a Permissions object for easier use
  let permissionsNumber: any = badgeData.permissions;
  badgeData.permissions = GetPermissions(permissionsNumber);

  //Forcefully fetch all metadata
  if (fetchAllMetadata) {
    const idxs = [];

    //Backend batch limit == METADATA_PAGE_LIMIT, so 0 will get batches 0-99
    for (let j = 0; j < getMaxBatchId(badgeData); j += METADATA_PAGE_LIMIT) {
      idxs.push(j);
    }

    badgeData = await updateMetadata(badgeData, idxs);
  }

  return badgeData;
}

function validatePositiveNumber(collectionId: number, fieldName?: string) {
  if (collectionId === undefined || collectionId === -1) {
    return Promise.reject((fieldName ? fieldName : 'ID') + " is invalid");
  }

  let error = Joi.number().integer().min(-1).required().validate(collectionId).error
  if (error) {
    return Promise.reject(error);
  }
}

export async function getCollections(collectionIds: number[], fetchAllMetadata: boolean = false): Promise<{
  collections: BitBadgeCollection[],
  paginations: { activity: PaginationInfo, announcements: PaginationInfo, reviews: PaginationInfo }[],
}> {
  for (const collectionId of collectionIds) {
    await validatePositiveNumber(collectionId);
  }

  const collections: BitBadgeCollection[] = [];
  const badgeDataResponse = await axios.post(BACKEND_URL + GetCollectionsRoute(), {
    collections: collectionIds.map((x) => Number(x)),
    startBatchIds: collectionIds.map(() => 0)
  }).then((res) => res.data);

  const promises = [];
  for (const collection of badgeDataResponse.collections) {
    promises.push(cleanCollection(collection, fetchAllMetadata));
  }

  const cleanedCollections = await Promise.all(promises);
  for (const collection of cleanedCollections) {
    collections.push(collection);
  }

  return {
    collections,
    paginations: badgeDataResponse.paginations
  };
}

export async function updateCollectionReviews(collectionId: number, bookmark: string) {
  await validatePositiveNumber(collectionId);

  const badgeDataResponse: {
    collection: BitBadgeCollection,
    pagination: {
      reviews: {
        bookmark: string,
        hasMore: boolean
      }
    }
  } = await axios.post(BACKEND_URL + GetCollectionRoute(collectionId), {
    bookmark
  }).then((res) => res.data);

  return {
    reviews: badgeDataResponse.collection.reviews,
    pagination: badgeDataResponse.pagination
  };
}


export async function updateCollectionAnnouncements(collectionId: number, announcementsBookmark: string) {
  await validatePositiveNumber(collectionId);

  const badgeDataResponse: {
    collection: BitBadgeCollection,
    pagination: {
      announcements: {
        bookmark: string,
        hasMore: boolean
      }
    }
  } = await axios.post(BACKEND_URL + GetCollectionRoute(collectionId), {
    announcementsBookmark
  }).then((res) => res.data);

  return {
    announcements: badgeDataResponse.collection.announcements,
    pagination: badgeDataResponse.pagination
  };
}

export async function updateCollectionActivity(collectionId: number, activityBookmark: string) {
  await validatePositiveNumber(collectionId);

  const badgeDataResponse: {
    collection: BitBadgeCollection,
    pagination: {
      activity: {
        bookmark: string,
        hasMore: boolean
      }
    }
  } = await axios.post(BACKEND_URL + GetCollectionRoute(collectionId), {
    activityBookmark
  }).then((res) => res.data);

  return {
    activity: badgeDataResponse.collection.activity,
    pagination: badgeDataResponse.pagination
  };
}

//Get a specific badge collection and all metadata
export async function getBadgeCollection(collectionId: number): Promise<GetCollectionResponse> {
  await validatePositiveNumber(collectionId);

  const badgeDataResponse: {
    collection: BitBadgeCollection,
    pagination: {
      activity: {
        bookmark: string,
        hasMore: boolean
      },
      announcements: {
        bookmark: string,
        hasMore: boolean
      }
    }
  } = await axios.post(BACKEND_URL + GetCollectionRoute(collectionId)).then((res) => res.data);

  const collectionRes = await cleanCollection(badgeDataResponse.collection);
  return {
    collection: collectionRes,
    pagination: badgeDataResponse.pagination
  };
}

//Gets metadata batches for a collection starting from startBatchId ?? 0 and incrementing METADATA_PAGE_LIMIT times
export async function updateMetadata(collection: BitBadgeCollection, startBatchIds?: number[]) {
  const promises = [];
  if (!startBatchIds) {
    startBatchIds = [0];
  }
  for (let startBatchId of startBatchIds) {
    startBatchId = startBatchId < 0 ? 0 : startBatchId

    promises.push(axios.post(BACKEND_URL + GetMetadataRoute(collection.collectionId), { startBatchId }).then((res) => res.data));
  }

  const metadataResponses = await Promise.all(promises);

  for (const metadataRes of metadataResponses) {
    const isCollectionMetadataResEmpty = Object.keys(metadataRes.collectionMetadata).length === 0;
    collection.collectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.collectionMetadata;

    const badgeResValues: {
      badgeIds: IdRange[];
      metadata: BadgeMetadata;
      uri: string;
    }[] = Object.values(metadataRes.badgeMetadata as BadgeMetadataMap);
    for (const val of badgeResValues) {
      for (const badgeId of val.badgeIds) {
        collection.badgeMetadata = updateMetadataMap(collection.badgeMetadata, val.metadata, badgeId, val.uri);
      }
    }
  }

  return collection;
}

export async function getBadgeBalance(
  collectionId: number,
  accountNumber: number
): Promise<GetBadgeBalanceResponse> {
  await validatePositiveNumber(collectionId);
  await validatePositiveNumber(accountNumber);

  const balanceRes: GetBadgeBalanceResponse = await axios.post(BACKEND_URL + GetBadgeBalanceRoute(collectionId, accountNumber)).then((res) => res.data);
  return balanceRes;
}

export async function updatePortfolioCollections(cosmosAddress: string, bookmark: string) {
  const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(cosmosAddress), { collectedBookmark: bookmark }).then((res) => res.data);
  return portfolio;
}

export async function updateUserAnnouncements(cosmosAddress: string, bookmark: string) {
  const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(cosmosAddress), { announcementsBookmark: bookmark }).then((res) => res.data);
  return portfolio;
}

export async function updateUserActivity(cosmosAddress: string, bookmark: string) {
  const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(cosmosAddress), { userActivityBookmark: bookmark }).then((res) => res.data);
  return portfolio;
}

export async function updateUserReviews(cosmosAddress: string, bookmark: string) {
  const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(cosmosAddress), { reviewsBookmark: bookmark }).then((res) => res.data);
  return portfolio;
}

//Get portfolio infromation for a specific account
export async function getPortfolio(cosmosAddr: string) {
  const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(cosmosAddr)).then((res) => res.data);
  return portfolio;
}

export async function addAnnouncement(announcement: string, collectionId: number) {
  const res = await axios.post(BACKEND_URL + `/api/v0/collection/${collectionId}/addAnnouncement`, { announcement }).then((res) => res.data);
  return res;
}

export async function addReview(review: string, stars: number, collectionId: number) {
  const res = await axios.post(BACKEND_URL + `/api/v0/collection/${collectionId}/addReview`, { review, stars }).then((res) => res.data);
  return res;
}

export async function addReviewForUser(review: string, stars: number, cosmosAddress: string) {
  const res = await axios.post(BACKEND_URL + `/api/v0/user/${cosmosAddress}/addReview`, { review, stars }).then((res) => res.data);
  return res;
}

//Get search results
export async function getSearchResults(searchTerm: string) {
  const searchResults: SearchResponse = await axios.post(BACKEND_URL + GetSearchRoute(searchTerm)).then((res) => res.data);
  return searchResults;
}

//Blockin API Routes
export const getChallengeParams = async (chain: string, address: string, hours?: number): Promise<ChallengeParams> => {
  const data: { params: ChallengeParams } = await axios.post(BACKEND_URL + '/api/v0/auth/getChallenge', {
    address,
    chain,
    hours: hours ? hours : 24
  }).then(res => res.data);

  return data.params;
}

export const verifyChallengeOnBackend = async (chain: string, originalBytes: Uint8Array, signatureBytes: Uint8Array) => {

  const bodyStr = stringify({ originalBytes, signatureBytes, chain }); //hack to preserve uint8 arrays

  const verificationRes = await axios.post(BACKEND_URL + '/api/v0/auth/verify', bodyStr).then(res => res.data);
  return verificationRes;
}

export const logout = async () => {
  await axios.post(BACKEND_URL + '/api/v0/auth/logout').then(res => res.data);
}

export const sendEmails = async (emails: any[]) => {
  await axios.post(BACKEND_URL + '/api/v0/email', { emails: emails }).then(res => res.data);
}

export const getCodeForPassword = async (collectionId: number, claimId: number, password: string) => {
  const res: { code: string } = await axios.post(BACKEND_URL + '/api/v0/collection/' + collectionId + '/password/' + claimId + '/' + password).then(res => res.data);
  return res;
}

export const fetchCodes = async (collectionId: number) => {
  const res: { codes: string[][], passwords?: string[] } = await axios.post(BACKEND_URL + '/api/v0/collection/' + collectionId + '/codes').then(res => res.data);
  return res;
}

export const getTokensFromFaucet = async () => {
  const res: { result: any } = await axios.post(BACKEND_URL + '/api/v0/faucet').then(res => res.data);
  return res;
}

export const getBrowseInfo = async () => {
  const res: {
    [categoryName: string]: StoredBadgeCollection[]
  } = await axios.post(BACKEND_URL + '/api/v0/browse').then(res => res.data);
  return res;
}

export const broadcastTx = async (body: any) => {
  const res = await axios.post(BACKEND_URL + '/api/v0/broadcast', body);
  return res;
}

export const simulateTx = async (body: any) => {
  const res = await axios.post(BACKEND_URL + '/api/v0/simulate', body);
  return res;
}

export const updateAccountSettings = async (settingsToUpdate: {
  twitter?: string,
  discord?: string,
  telegram?: string,
  github?: string,
  name?: string
}) => {
  const res: { success: string } = await axios.post(BACKEND_URL + '/api/v0/user/updateAccount', settingsToUpdate).then(res => res.data);
  return res;
}

export const updateLastSeenActivity = async () => {
  const res: { success: string } = await axios.post(BACKEND_URL + '/api/v0/user/updateAccount', {
    seenActivity: Date.now()
  }).then(res => res.data);
  return res;
}

export const getAccountActivity = async (accountNum: number) => {
  const res: {
    activity: TransferActivityItem[], announcements: AnnouncementActivityItem[], pagination: {
      announcements: PaginationInfo,
      activity: PaginationInfo
    }
  } = await axios.post(BACKEND_URL + '/api/v0/user/' + accountNum + '/activity').then(res => res.data);

  return res;
}

//Fetches metadata directly from a URI (only to be used when creating badges with new self-hosted metadata)
export const fetchMetadata = async (uri: string) => {
  //Check if valid uri regex
  const error = Joi.string().uri().required().validate(uri).error;
  if (error) {
    return Promise.reject(error);
  }

  const res: { metadata: BadgeMetadata } = await axios.post(BACKEND_URL + '/api/v0/metadata', { uri }).then(res => res.data);
  return res;
}

export const getBadgeActivity = async (collectionId: number, badgeId: number, bookmark?: string) => {
  const res: {
    activity: TransferActivityItem[], pagination: {
      activity: PaginationInfo
    }
  } = await axios.post(BACKEND_URL + '/api/v0/collection/' + collectionId + '/' + badgeId + '/activity', { bookmark }).then(res => res.data);
  return res;
}

//Refreshes the metadata on the backend by adding it to the queue
export const refreshMetadataOnBackend = async (collectionId: number, badgeId?: number) => {
  const res = await axios.post(BACKEND_URL + '/api/v0/collection/' + collectionId + `${badgeId ? '/' + badgeId : ''}/refreshMetadata`).then(res => res.data);
  return res;
}

export const addMerkleTreeToIpfs = async (name: string, description: string, leaves: string[], addresses: string[], codes: string[], hashedCodes: string[], password?: string) => {
  const bodyStr = stringify({
    leaves,
    addresses,
    hashedCodes,
    codes,
    password,
    name, description
  }); //hack to preserve uint8 arrays

  const addToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addMerkleTreeToIpfs', bodyStr).then(res => res.data);
  return addToIpfsRes;
}

export const addToIpfs = async (collectionMetadata: BadgeMetadata, individualBadgeMetadata: BadgeMetadataMap) => {
  const bodyStr = stringify({
    collectionMetadata,
    individualBadgeMetadata: Object.values(individualBadgeMetadata).map(x => x.metadata)
  }); //hack to preserve uint8 arrays

  const addToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addToIpfs', bodyStr).then(res => res.data);
  return addToIpfsRes;
}

export const addBalancesToIpfs = async (balances: BalancesMap) => {
  const bodyStr = stringify({
    balances
  }); //hack to preserve uint8 arrays

  const addToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addToIpfs', bodyStr).then(res => res.data);
  return addToIpfsRes;
}


