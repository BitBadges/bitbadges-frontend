import axios from 'axios';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { BACKEND_URL, NODE_URL } from '../constants';
import { GetPermissions } from './permissions';
import { GetAccountByNumberRoute, GetAccountRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute, GetOwnersRoute, GetPortfolioRoute } from './routes';
import { BitBadgeCollection, CosmosAccountInformation, DistributionMethod, SupportedChain } from './types';

export async function getAccountInformation(bech32Address: string) {
    const accountObject = await axios.get(BACKEND_URL + GetAccountRoute(bech32Address.toLowerCase())).then((res) => res.data);
    console.log(accountObject);

    return accountObject.accountInfo;
}

export async function getAccountInformationByAccountNumber(id: number) {
    const accountObject = await axios.get(BACKEND_URL + GetAccountByNumberRoute(id)).then((res) => res.data);
    return accountObject.accountInfo;
}

export async function getBalance(bech32Address: string) {
    const balance = await axios.get(NODE_URL + GetBalanceRoute(bech32Address))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }

    return balance;
}

export async function getBadgeOwners(collectionId: number, badgeId: number) {
    const owners: { owners: any[], balances: any } = await axios.get(BACKEND_URL + GetOwnersRoute(collectionId, badgeId)).then((res) => res.data);
    return owners;
}


//TODO: pagination / scalability
export async function getBadgeCollection(collectionId: number): Promise<GetCollectionResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }

    const badgeDataResponse = await axios.get(BACKEND_URL + GetCollectionRoute(collectionId)).then((res) => res.data);

    let badgeData: BitBadgeCollection = badgeDataResponse.collection;

    // Convert the returned permissions (uint) to a Permissions object for easier use
    let permissionsNumber: any = badgeData.permissions;
    badgeData.permissions = GetPermissions(permissionsNumber);

    // Convert the returned manager (bech32) to a BitBadgesUserInfo object for easier use
    let managerAccountNumber: any = badgeData.manager;
    let managerAccountInfo = await getAccountInformationByAccountNumber(managerAccountNumber);

    if (managerAccountInfo) {
        badgeData.manager = {
            accountNumber: managerAccountInfo.account_number,
            address: managerAccountInfo.address,
            cosmosAddress: managerAccountInfo.cosmosAddress,
            chain: managerAccountInfo.chain
        };
    }

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

    badgeData.activity.reverse();

    return {
        collection: badgeData
    };
}

export async function getBadgeBalance(
    collectionId: number,
    accountNumber: number
): Promise<GetBadgeBalanceResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }

    if (isNaN(accountNumber) || accountNumber < 0) {
        console.error("Invalid accountNumber: ", accountNumber);
        return Promise.reject(`Invalid accountNumber: ${accountNumber}`);
    }

    const balanceRes: GetBadgeBalanceResponse = await axios.get(BACKEND_URL + GetBadgeBalanceRoute(collectionId, accountNumber)).then((res) => res.data);
    return balanceRes;
}

export async function GetPortfolio(accountNumber: number) {
    const portfolio = await axios.get(BACKEND_URL + GetPortfolioRoute(accountNumber)).then((res) => res.data);
    return portfolio;
}