import axiosApi from 'axios';
import { AccountResponse, AnnouncementActivityItem, BadgeMetadata, BadgeMetadataMap, BalancesMap, BitBadgeCollection, GetAccountByNumberRoute, GetAccountRoute, GetAccountsRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetCollectionRoute, GetCollectionsRoute, GetOwnersResponse, GetOwnersRoute, GetPermissions, GetPortfolioResponse, GetPortfolioRoute, GetSearchRoute, GetStatusRoute, IndexerStatus, METADATA_PAGE_LIMIT, PaginationInfo, SearchResponse, StoredBadgeCollection, TransferActivityItem, convertToCosmosAddress, getMaxBatchId, isAddressValid } from "bitbadgesjs-utils";
import { ChallengeParams } from "blockin";
import Joi from 'joi';
import { BACKEND_URL } from '../constants';
import { stringify } from "../utils/preserveJson";
import { updateMetadata, validatePositiveNumber } from './helpers';

export const axios = axiosApi.create({
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

//Get multiple accounts by either account number or address
export async function getAccounts(accountNums: number[], addresses: string[]) {
  //Filter out undefined and -1 values
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

async function cleanCollection(collectionData: BitBadgeCollection, fetchAllMetadata: boolean = false) {
  // Convert the returned permissions (uint) to a Permissions type for easier use
  let permissionsNumber: any = collectionData.permissions;
  collectionData.permissions = GetPermissions(permissionsNumber);

  //Forcefully fetch all metadata
  if (fetchAllMetadata) {
    const idxs = [];
    //Backend batch limit == METADATA_PAGE_LIMIT, so 0 will get batches 0-99
    for (let j = 0; j < getMaxBatchId(collectionData); j += METADATA_PAGE_LIMIT) {
      idxs.push(j);
    }
    collectionData = await updateMetadata(collectionData, idxs);
  }

  return collectionData;
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

// Fetches the next reviews, starting with the provided bookmark returned from previous call
export async function fetchNextReviewsForCollection(collectionId: number, bookmark: string) {
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


export async function fetchNextAnnouncementsForCollection(collectionId: number, announcementsBookmark: string) {
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

export async function fetchNextActivityForCollection(collectionId: number, activityBookmark: string) {
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

export async function getBadgeBalance(
  collectionId: number,
  accountNumber: number
): Promise<GetBadgeBalanceResponse> {
  await validatePositiveNumber(collectionId);
  await validatePositiveNumber(accountNumber);

  const balanceRes: GetBadgeBalanceResponse = await axios.post(BACKEND_URL + GetBadgeBalanceRoute(collectionId, accountNumber)).then((res) => res.data);
  return balanceRes;
}

export async function updatePortfolioCollected(cosmosAddress: string, bookmark: string) {
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
  const bodyStr = stringify({ originalBytes, signatureBytes, chain });

  const verificationRes = await axios.post(BACKEND_URL + '/api/v0/auth/verify', bodyStr).then(res => res.data);
  return verificationRes;
}

export const logout = async () => {
  await axios.post(BACKEND_URL + '/api/v0/auth/logout').then(res => res.data);
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
  name?: string,
  readme?: string
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

export const addClaimToIpfs = async (name: string, description: string, leaves: string[], addresses: string[], codes: string[], hashedCodes: string[], password?: string) => {
  const bodyStr = stringify({
    leaves,
    addresses,
    hashedCodes,
    codes,
    password,
    name,
    description
  }); //hack to preserve uint8 arrays

  const addClaimToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addClaimToIpfs', bodyStr).then(res => res.data);
  return addClaimToIpfsRes;
}

export const addMetadataToIpfs = async (collectionMetadata: BadgeMetadata, individualBadgeMetadata: BadgeMetadataMap) => {
  const bodyStr = stringify({
    collectionMetadata,
    individualBadgeMetadata: Object.values(individualBadgeMetadata).map(x => x.metadata)
  }); //hack to preserve uint8 arrays

  const addMetadataToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addMetadataToIpfs', bodyStr).then(res => res.data);
  return addMetadataToIpfsRes;
}

export const addBalancesToIpfs = async (balances: BalancesMap) => {
  const bodyStr = stringify({
    balances
  }); //hack to preserve uint8 arrays

  const addMetadataToIpfsRes = await axios.post(BACKEND_URL + '/api/v0/addMetadataToIpfs', bodyStr).then(res => res.data);
  return addMetadataToIpfsRes;
}