import axios from 'axios';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { BACKEND_URL, NODE_URL } from '../constants';
import { convertToCosmosAddress } from './chains';
import { GetPermissions } from './permissions';
import { GetAccountByNumberRoute, GetAccountRoute, GetAccountsByNumberRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetMetadataRoute, GetOwnersResponse, GetOwnersRoute, GetPortfolioResponse, GetPortfolioRoute } from './routes';
import { BitBadgeCollection, CosmosAccountInformation, DistributionMethod } from './types';
import Joi from 'joi';
import { convertToBitBadgesUserInfo } from './users';

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

export async function getAccountsByAccountNumbers(accountNums: number[]) {
    const accountObjects: { accounts: CosmosAccountInformation[] } = await axios.post(BACKEND_URL + GetAccountsByNumberRoute(), { accountNums }).then((res) => res.data);
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