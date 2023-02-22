import axios from 'axios';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { BACKEND_URL, NODE_URL } from '../constants';
import { convertToCosmosAddress } from './chains';
import { GetPermissions } from './permissions';
import { GetAccountByNumberRoute, GetAccountRoute, GetAccountsRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetCollectionsRoute, GetMetadataRoute, GetOwnersResponse, GetOwnersRoute, GetPortfolioResponse, GetPortfolioRoute, GetSearchRoute } from './routes';
import { BitBadgeCollection, CosmosAccountInformation, DistributionMethod } from './types';
import Joi from 'joi';
import { convertToBitBadgesUserInfo } from './users';
import { ChallengeParams } from "blockin";
import { stringify } from "../utils/preserveJson";
import { BadgeMetadata } from "./types";

//Get account by address
export async function getAccountInformation(address: string) {
    const bech32Address = convertToCosmosAddress(address);
    const accountObject: CosmosAccountInformation = await axios.get(BACKEND_URL + GetAccountRoute(bech32Address.toLowerCase())).then((res) => res.data);
    return accountObject;
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

async function cleanCollection(badgeData: BitBadgeCollection) {
    // Convert the returned permissions (uint) to a Permissions object for easier use
    let permissionsNumber: any = badgeData.permissions;
    badgeData.permissions = GetPermissions(permissionsNumber);

    // Convert the returned manager (bech32) to a BitBadgesUserInfo object for easier use
    let managerAccountNumber: any = badgeData.manager;
    let managerAccountInfo = await getAccountInformationByAccountNumber(managerAccountNumber);
    badgeData.manager = convertToBitBadgesUserInfo(managerAccountInfo);

    //generate MerkleTreeJS objects from fetched leaves
    for (let idx = 0; idx < badgeData.claims.length; idx++) {
        let claim = badgeData.claims[idx];
        const fetchedLeaves: string[] = claim.leaves;

        if (Number(claim.type) === 0 && fetchedLeaves.length > 0) {
            if (badgeData.claims[idx].distributionMethod === DistributionMethod.Codes) {
                const tree = new MerkleTree(fetchedLeaves, SHA256);
                badgeData.claims[idx].tree = tree;
            } else {
                const tree = new MerkleTree(fetchedLeaves.map((x) => SHA256(x)), SHA256);
                badgeData.claims[idx].tree = tree;
            }
        }
    }


    badgeData.activity.reverse(); //get the most recent activity first; this should probably be done on the backend

    badgeData = await updateMetadata(badgeData, 1);

    console.log("BADGEDATA", badgeData);

    return badgeData;
}

export async function getCollections(collectionIds: number[]) {
    for (const collectionId of collectionIds) {
        if (collectionId === undefined || collectionId === -1) {
            return Promise.reject("collectionId is invalid");
        }

        let error = Joi.number().integer().min(-1).required().validate(collectionId).error
        if (error) {
            return Promise.reject(error);
        }
    }

    let collections: BitBadgeCollection[] = [];
    const badgeDataResponse = await axios.post(BACKEND_URL + GetCollectionsRoute(), {
        collections: collectionIds.map((x) => Number(x))
    }).then((res) => res.data);

    for (const collection of badgeDataResponse.collections) {
        console.log("COLLECTION", collection);
        let badgeData: BitBadgeCollection = collection;
        badgeData = await cleanCollection(badgeData);
        collections.push(badgeData);
    }

    return collections;
}

//Get a specific badge collection and all metadata
export async function getBadgeCollection(collectionId: number): Promise<GetCollectionResponse> {
    if (collectionId === undefined || collectionId === -1) {
        return Promise.reject("collectionId is invalid");
    }

    let error = Joi.number().integer().min(-1).required().validate(collectionId).error
    if (error) {
        return Promise.reject(error);
    }

    const badgeDataResponse = await axios.get(BACKEND_URL + GetCollectionRoute(collectionId)).then((res) => res.data);
    let badgeData: BitBadgeCollection = badgeDataResponse;
    badgeData = await cleanCollection(badgeData);
    return {
        collection: badgeData
    };
}

export async function updateMetadata(collection: BitBadgeCollection, startBadgeId?: number) {
    let metadataRes = await axios.post(BACKEND_URL + GetMetadataRoute(collection.collectionId), { startBadgeId }).then((res) => res.data);
    collection.collectionMetadata = metadataRes.collectionMetadata;
    console.log("METADATA RES: ", metadataRes);
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
    if (collectionId === undefined || collectionId === -1) {
        return Promise.reject("collectionId is invalid");
    }
    if (accountNumber === undefined || accountNumber === -1) {
        return Promise.reject("accountNumber is invalid");
    }

    console.log("collectionId: " + collectionId, "accountNumber: " + accountNumber);

    let error = Joi.number().integer().min(1).required().validate(collectionId).error
    if (error) {
        return Promise.reject(error);
    }

    error = Joi.number().integer().min(-1).required().validate(accountNumber).error
    if (error) {
        return Promise.reject(error);
    }


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


/**
 * Here, we define the API function logic to call your backend.
 */
export const getChallenge = async (chain: string, address: string, assetIds: string[]) => {
    const assets = [];
    for (const assetId of assetIds) {
        assets.push('Asset ID: ' + assetId);
    }

    const message = await getChallengeFromBlockin(chain, address, assets);
    return message;
}


const getChallengeFromBlockin = async (chain: string, address: string, assetIds: string[]): Promise<string> => {
    const data = await fetch(BACKEND_URL + '/api/getChallenge', {
        method: 'post',
        body: JSON.stringify({
            address,
            assetIds,
            chain
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return data.message;
}

export const getChallengeParams = async (chain: string, address: string): Promise<ChallengeParams> => {
    const data = await fetch(BACKEND_URL + '/api/getChallengeParams', {
        method: 'post',
        body: JSON.stringify({
            address,
            chain
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return data;
}

export const verifyChallengeOnBackend = async (chain: string, originalBytes: Uint8Array, signatureBytes: Uint8Array) => {
    const bodyStr = stringify({ originalBytes, signatureBytes, chain }); //hack to preserve uint8 arrays
    console.log(bodyStr);

    const verificationRes = await fetch(BACKEND_URL + '/api/verifyChallenge', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return verificationRes;
}


export const addMerkleTreeToIpfs = async (leaves: string[]) => {

    const bodyStr = stringify({
        leaves
    }); //hack to preserve uint8 arrays

    const addToIpfsRes = await fetch(BACKEND_URL + '/api/addMerkleTreeToIpfs', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return addToIpfsRes;
}

export const addToIpfs = async (collectionMetadata: BadgeMetadata, individualBadgeMetadata: { [badgeId: string]: BadgeMetadata }) => {
    const bodyStr = stringify({
        collectionMetadata,
        individualBadgeMetadata
    }); //hack to preserve uint8 arrays

    const addToIpfsRes = await fetch(BACKEND_URL + '/api/addToIpfs', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return addToIpfsRes;
}

export interface GetFromIPFSResponse {
    file: string
}

export const getFromIpfs = async (path: string) => {
    const bodyStr = stringify({ path }); //hack to preserve uint8 arrays

    const addToIpfsRes: GetFromIPFSResponse = await fetch(BACKEND_URL + '/api/getFromIpfs', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        return res.json()
    });

    return addToIpfsRes;
}