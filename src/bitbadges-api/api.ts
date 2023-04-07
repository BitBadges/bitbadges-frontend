import axiosApi from 'axios';
import { ChallengeParams } from "blockin";
import Joi from 'joi';
import { stringify } from "../utils/preserveJson";
import { AccountResponse, StoredBadgeCollection, BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, GetAccountByNumberRoute, GetAccountRoute, GetAccountsRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetCollectionsRoute, GetMetadataRoute, GetOwnersResponse, GetOwnersRoute, GetPermissions, GetPortfolioResponse, GetPortfolioRoute, GetSearchRoute, GetStatusRoute, IndexerStatus, METADATA_PAGE_LIMIT, SearchResponse, convertToCosmosAddress, getMaxBatchId, updateMetadataMap, TransferActivityItem, AnnouncementActivityItem, PaginationInfo } from "bitbadges-sdk"
import { BACKEND_URL, NODE_URL } from '../constants';

const axios = axiosApi.create({
    withCredentials: true,
    headers: {
        "Content-type": "application/json",
    },
});

//Get account by address
export async function getAccountInformation(address: string) {
    const bech32Address = convertToCosmosAddress(address);
    const accountObject: AccountResponse = await axios.get(BACKEND_URL + GetAccountRoute(bech32Address.toLowerCase())).then((res) => res.data);
    return accountObject;
}

//Get indexer status
export async function getStatus() {
    const status: IndexerStatus = await axios.get(BACKEND_URL + GetStatusRoute()).then((res) => res.data);
    return status;
}

//Get account by account number
export async function getAccountInformationByAccountNumber(id: number) {
    const accountObject: AccountResponse = await axios.get(BACKEND_URL + GetAccountByNumberRoute(id)).then((res) => res.data);
    return accountObject;
}

export async function getAccounts(accountNums: number[], addresses: string[]) {
    const accountObjects: { accounts: AccountResponse[] } = await axios.post(BACKEND_URL + GetAccountsRoute(), { accountNums, addresses }).then((res) => res.data);
    return accountObjects.accounts;
}

//Get L1 token balance
export async function getBalance(bech32Address: string) {
    const balance = await axios.get(NODE_URL + GetBalanceRoute(bech32Address)).then((res) => res.data);
    return balance;
}

//Query owners for a specific badge
export async function getBadgeOwners(collectionId: number, badgeId: number) {
    const owners: GetOwnersResponse = await axios.get(BACKEND_URL + GetOwnersRoute(collectionId, badgeId)).then((res) => res.data);
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
    paginations: { activity: PaginationInfo, announcements: PaginationInfo }[],
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

export async function updateCollectionActivity(collectionId: number, bookmark?: string) {
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
    } = await axios.post(BACKEND_URL + GetCollectionRoute(collectionId), {
        bookmark
    }).then((res) => res.data);

    return {
        announcements: badgeDataResponse.collection.announcements,
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

        const badgeResValues = Object.values(metadataRes.badgeMetadata as BadgeMetadataMap);
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

    const balanceRes: GetBadgeBalanceResponse = await axios.get(BACKEND_URL + GetBadgeBalanceRoute(collectionId, accountNumber)).then((res) => res.data);
    return balanceRes;
}

export async function updatePortfolioCollections(accountNumber: number, bookmark: string) {
    const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(accountNumber), { collectedBookmark: bookmark }).then((res) => res.data);
    return portfolio;
}

export async function updateUserAnnouncements(accountNumber: number, bookmark: string) {
    const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(accountNumber), { announcementsBookmark: bookmark }).then((res) => res.data);
    return portfolio;
}

export async function updateUserActivity(accountNumber: number, bookmark: string) {
    const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(accountNumber), { userActivityBookmark: bookmark }).then((res) => res.data);
    return portfolio;
}

//Get portfolio infromation for a specific account
export async function getPortfolio(accountNumber: number) {
    const portfolio: GetPortfolioResponse = await axios.post(BACKEND_URL + GetPortfolioRoute(accountNumber)).then((res) => res.data);
    return portfolio;
}

export async function addAnnouncement(announcement: string, collectionId: number) {
    const res = await axios.post(BACKEND_URL + `/api/collection/${collectionId}/addAnnouncement`, { announcement }).then((res) => res.data);
    return res;
}

//Get search results
export async function getSearchResults(searchTerm: string) {
    const searchResults: SearchResponse = await axios.get(BACKEND_URL + GetSearchRoute(searchTerm)).then((res) => res.data);
    return searchResults;
}

//Blockin API Routes
export const getChallengeParams = async (chain: string, address: string): Promise<ChallengeParams> => {
    const data: { params: ChallengeParams } = await axios.post(BACKEND_URL + '/api/getChallengeParams', {
        address,
        chain
    }).then(res => res.data);

    return data.params;
}

export const verifyChallengeOnBackend = async (chain: string, originalBytes: Uint8Array, signatureBytes: Uint8Array) => {
    const bodyStr = stringify({ originalBytes, signatureBytes, chain }); //hack to preserve uint8 arrays
    const verificationRes = await axios.post(BACKEND_URL + '/api/verifyChallenge', bodyStr).then(res => res.data);
    return verificationRes;
}

export const logout = async () => {
    await axios.post(BACKEND_URL + '/api/logout').then(res => res.data);
}

export const getCodeForPassword = async (collectionId: number, claimId: number, password: string) => {
    const res: { code: string } = await axios.get(BACKEND_URL + '/api/password/' + collectionId + '/' + claimId + '/' + password).then(res => res.data);
    return res;
}

export const fetchCodes = async (collectionId: number) => {
    const res: { codes: string[][], passwords?: string[] } = await axios.get(BACKEND_URL + '/api/collection/codes/' + collectionId).then(res => res.data);
    return res;
}

export const getBrowseInfo = async () => {
    const res: {
        [categoryName: string]: StoredBadgeCollection[]
    } = await axios.get(BACKEND_URL + '/api/browse').then(res => res.data);
    return res;
}

export const updateAccountSettings = async (settingsToUpdate: {
    twitter?: string,
    discord?: string,
    telegram?: string,
    github?: string,
}) => {
    const res: { success: string } = await axios.post(BACKEND_URL + '/api/user/updateAccount', settingsToUpdate).then(res => res.data);
    return res;
}

export const updateLastSeenActivity = async () => {
    const res: { success: string } = await axios.post(BACKEND_URL + '/api/user/updateAccount', {
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
    } = await axios.get(BACKEND_URL + '/api/user/activity/' + accountNum).then(res => res.data);

    return res;
}

//Fetches metadata directly from a URI (only to be used when creating badges with new self-hosted metadata)
export const fetchMetadata = async (uri: string) => {
    //Check if valid uri regex
    const error = Joi.string().uri().required().validate(uri).error;
    if (error) {
        return Promise.reject(error);
    }

    const res: { metadata: BadgeMetadata } = await axios.post(BACKEND_URL + '/api/metadata', { uri }).then(res => res.data);
    return res;
}

export const getBadgeActivity = async (collectionId: number, badgeId: number, bookmark?: string) => {
    const res: {
        activity: TransferActivityItem[], pagination: {
            activity: PaginationInfo
        }
    } = await axios.post(BACKEND_URL + '/api/collection/activity/' + collectionId + '/' + badgeId, { bookmark }).then(res => res.data);
    return res;
}

//Refreshes the metadata on the backend by adding it to the queue
export const refreshMetadataOnBackend = async (collectionId: number, badgeId?: number) => {
    const res = await axios.post(BACKEND_URL + '/api/collection/refreshMetadata', { collectionId, badgeId }).then(res => res.data);
    return res;
}

export const addMerkleTreeToIpfs = async (leaves: string[], addresses: string[], codes: string[], hashedCodes: string[], password?: string) => {
    const bodyStr = stringify({
        leaves,
        addresses,
        hashedCodes,
        codes,
        password
    }); //hack to preserve uint8 arrays

    const addToIpfsRes = await axios.post(BACKEND_URL + '/api/addMerkleTreeToIpfs', bodyStr).then(res => res.data);
    return addToIpfsRes;
}

export const addToIpfs = async (collectionMetadata: BadgeMetadata, individualBadgeMetadata: BadgeMetadataMap) => {
    const bodyStr = stringify({
        collectionMetadata,
        individualBadgeMetadata: Object.values(individualBadgeMetadata).map(x => x.metadata)
    }); //hack to preserve uint8 arrays

    const addToIpfsRes = await axios.post(BACKEND_URL + '/api/addToIpfs', bodyStr).then(res => res.data);
    return addToIpfsRes;
}
