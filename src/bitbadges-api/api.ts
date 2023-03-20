import axiosApi from 'axios';
import { ChallengeParams } from "blockin";
import Joi from 'joi';
import { BACKEND_URL, NODE_URL } from '../constants';
import { stringify } from "../utils/preserveJson";
import { convertToCosmosAddress } from './chains';
import { GetPermissions } from './permissions';
import { GetAccountByNumberRoute, GetAccountRoute, GetAccountsRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetCollectionsRoute, GetMetadataRoute, GetOwnersResponse, GetOwnersRoute, GetPortfolioResponse, GetPortfolioRoute, GetSearchRoute, GetStatusRoute } from './routes';
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, CosmosAccountInformation, IndexerStatus } from './types';
import { convertToBitBadgesUserInfo } from './users';

const axios = axiosApi.create({
    withCredentials: true,
    headers: {
        "Content-type": "application/json",
    },
});

//Get account by address
export async function getAccountInformation(address: string) {
    const bech32Address = convertToCosmosAddress(address);
    const accountObject: CosmosAccountInformation = await axios.get(BACKEND_URL + GetAccountRoute(bech32Address.toLowerCase())).then((res) => res.data);
    return accountObject;
}

//Get indexer status
export async function getStatus() {
    const status: IndexerStatus = await axios.get(BACKEND_URL + GetStatusRoute()).then((res) => res.data);
    return status;
}

//Get account by account number
export async function getAccountInformationByAccountNumber(id: number) {
    const accountObject: CosmosAccountInformation = await axios.get(BACKEND_URL + GetAccountByNumberRoute(id)).then((res) => res.data);
    return accountObject;
}

export async function getAccounts(accountNums: number[], addresses: string[]) {
    const accountObjects: { accounts: CosmosAccountInformation[] } = await axios.post(BACKEND_URL + GetAccountsRoute(), { accountNums, addresses }).then((res) => res.data);
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

    // Convert the returned manager (bech32Address) to a BitBadgesUserInfo object for easier use
    let managerAccountNumber: any = badgeData.manager;
    let managerAccountInfo = await getAccountInformationByAccountNumber(managerAccountNumber);
    badgeData.manager = convertToBitBadgesUserInfo(managerAccountInfo);

    badgeData.activity.reverse(); //get the most recent activity first; this should probably be done on the backend

    if (fetchAllMetadata) {
        const promises = [];

        //Backend batch limit == 100, so 0 will get batches 0-99
        for (let j = 0; j < badgeData.badgeUris.length; j += 100) {
            promises.push(updateMetadata(badgeData, j));
        }

        await Promise.all(promises).then((values) => {
            for (const res of values) {
                badgeData.collectionMetadata = res.collectionMetadata;
                badgeData.badgeMetadata = {
                    ...badgeData.badgeMetadata,
                    ...res.badgeMetadata
                };
            }
        });
    } else {
        //Backend batch limit == 100, so 0 will get batches 0-99
        badgeData = await updateMetadata(badgeData, 0);
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

export async function getCollections(collectionIds: number[], fetchAllMetadata: boolean = false): Promise<BitBadgeCollection[]> {
    for (const collectionId of collectionIds) {
        await validatePositiveNumber(collectionId);
    }

    let collections: BitBadgeCollection[] = [];
    const badgeDataResponse = await axios.post(BACKEND_URL + GetCollectionsRoute(), {
        collections: collectionIds.map((x) => Number(x))
    }).then((res) => res.data);

    for (const collection of badgeDataResponse.collections) {
        let badgeData: BitBadgeCollection = collection;
        badgeData = await cleanCollection(badgeData, fetchAllMetadata);
        collections.push(badgeData);
    }

    return collections;
}

//Get a specific badge collection and all metadata
export async function getBadgeCollection(collectionId: number): Promise<GetCollectionResponse> {
    await validatePositiveNumber(collectionId);

    const badgeDataResponse = await axios.get(BACKEND_URL + GetCollectionRoute(collectionId)).then((res) => res.data);
    let badgeData: BitBadgeCollection = badgeDataResponse;
    badgeData = await cleanCollection(badgeData);
    return {
        collection: badgeData
    };
}

export async function updateMetadata(collection: BitBadgeCollection, startBatchId?: number) {
    let metadataRes = await axios.post(BACKEND_URL + GetMetadataRoute(collection.collectionId), { startBatchId }).then((res) => res.data);
    collection.collectionMetadata = metadataRes.collectionMetadata;
    collection.badgeMetadata = {
        ...collection.badgeMetadata,
        ...metadataRes.badgeMetadata
    };

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

//Get portfolio infromation for a specific account
export async function getPortfolio(accountNumber: number) {
    const portfolio: GetPortfolioResponse = await axios.get(BACKEND_URL + GetPortfolioRoute(accountNumber)).then((res) => res.data);
    return portfolio;
}

//Get search results
export async function getSearchResults(searchTerm: string) {
    const searchResults = await axios.get(BACKEND_URL + GetSearchRoute(searchTerm)).then((res) => res.data);
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

export const getCodeForPassword = async (cid: string, password: string) => {
    const res: { code: string } = await axios.get(BACKEND_URL + '/api/password/' + cid + '/' + password).then(res => res.data);
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
        individualBadgeMetadata
    }); //hack to preserve uint8 arrays

    const addToIpfsRes = await axios.post(BACKEND_URL + '/api/addToIpfs', bodyStr).then(res => res.data);
    return addToIpfsRes;
}

export interface GetFromIPFSResponse {
    file: string
}

export const getFromIpfs = async (path: string) => {
    const bodyStr = stringify({ path }); //hack to preserve uint8 arrays

    const addToIpfsRes: GetFromIPFSResponse = await axios.post(BACKEND_URL + '/api/getFromIpfs', bodyStr).then(res => res.data);
    return addToIpfsRes;
}