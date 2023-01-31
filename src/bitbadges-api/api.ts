import axios from 'axios';
import { NODE_URL } from '../constants';
import { GetPermissions } from './permissions';
import { GetAccountRoute, GetAccountByNumberRoute, GetBadgeBalanceRoute, GetCollectionRoute, GetBalanceRoute } from './routes';
import { BadgeMetadata, BitBadgeCollection, CosmosAccountInformation, GetCollectionResponse, GetBalanceResponse, SupportedChain } from './types';
import { getFromIpfs } from '../chain/backend_connectors';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';


export async function getAccountInformation(
    bech32Address: string,
) {
    const accountObject = await axios.get(NODE_URL + GetAccountRoute(bech32Address))
        .then((res) => res.data)
        .catch((err) => {
            //Handle unregistered case
            if (err.response.data.code === 5) {
                return {
                    account: {
                        address: bech32Address,
                        account_number: -1,
                    }
                }
            }

            return Promise.reject();
        });

    const accountInformation: CosmosAccountInformation = accountObject.account;
    return accountInformation;
}

export async function getAccountInformationByAccountNumber(
    id: number,
) {
    const res = await axios.get(NODE_URL + GetAccountByNumberRoute(id))
        .then((res) => res.data);

    let bech32Address = res.account_address;

    const accountObject = await axios.get(NODE_URL + GetAccountRoute(bech32Address))
        .then((res) => res.data)
        .catch((err) => {
            //Handle unregistered case
            if (err.response.data.code === 5) {
                return {
                    account: {
                        address: bech32Address,
                        account_number: -1,
                    }
                }
            }

            return Promise.reject();
        });

    const accountInformation: CosmosAccountInformation = accountObject.account;
    return accountInformation;
}

export async function getBalance(
    bech32Address: string
) {
    const balance = await axios.get(NODE_URL + GetBalanceRoute(bech32Address))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }

    return balance;
}


export async function getBadgeCollection(
    collectionId: number,
    currBadge?: BitBadgeCollection,
    badgeId?: number
): Promise<GetCollectionResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }

    //Get the badge data from the blockchain if it doesn't exist
    let badgeData = currBadge;
    if (!badgeData) {
        console.log('FETCHING BADGE DATA')
        const badgeDataResponse = await axios.get(NODE_URL + GetCollectionRoute(collectionId))
            .then((res) => res.data);

        if (badgeDataResponse.error) {
            console.error("ERROR: ", badgeDataResponse.error);
            return Promise.reject(badgeDataResponse.error);
        }
        badgeData = badgeDataResponse.collection;
        if (badgeData) {
            badgeData.collectionId = collectionId;

            // Convert the returned permissions (uint) to a Permissions object for easier use
            let permissionsNumber: any = badgeData.permissions;
            badgeData.permissions = GetPermissions(permissionsNumber);

            let managerAccountNumber: any = badgeData.manager;
            let managerAccountInfo: CosmosAccountInformation = await getAccountInformationByAccountNumber(managerAccountNumber);

            //TODO: dynamic chains
            let ethAddress = cosmosToEth(managerAccountInfo.address);

            badgeData.manager = {
                accountNumber: managerAccountInfo.account_number,
                address: ethAddress,
                cosmosAddress: managerAccountInfo.address,
                chain: SupportedChain.ETH
            };
        }
    }
    console.log("TEST");

    //Get the collection metadata if it does not exist on the current badge object
    if (badgeData && (!badgeData.collectionMetadata || JSON.stringify(badgeData.collectionMetadata) === JSON.stringify({} as BadgeMetadata))) {
        let collectionUri = badgeData.collectionUri
        if (collectionUri.startsWith('ipfs://')) {
            const res = await getFromIpfs(collectionUri.replace('ipfs://', ''));
            badgeData.collectionMetadata = JSON.parse(res.file);
        } else {
            const res = await axios.get(collectionUri)
                .then((res) => res.data);
            badgeData.collectionMetadata = res;
        }
    }

    if (badgeData && !badgeData.badgeMetadata) {
        let badgeMetadata: BadgeMetadata[] = [];
        for (let i = 0; i < Number(badgeData?.nextBadgeId); i++) {
            badgeMetadata.push({} as BadgeMetadata);
        }
        badgeData.badgeMetadata = badgeMetadata;
    }

    //Get the individual badge metadata if the requested badgeId does not currently have metadata
    if (badgeId !== undefined && badgeId >= 0 && badgeData && badgeData.badgeMetadata
        && (JSON.stringify(badgeData.badgeMetadata[badgeId]) === JSON.stringify({} as BadgeMetadata)
            || !badgeData.badgeMetadata[badgeId])) {

        let badgeUri = badgeData.badgeUri;
        console.log("Fetching", badgeUri);
        if (badgeUri.startsWith('ipfs://')) {
            const res = await getFromIpfs(badgeUri.replace('ipfs://', '').replace('{id}', badgeId.toString()));
            badgeData.badgeMetadata[badgeId] = JSON.parse(res.file);
        }
    }

    if (badgeId !== undefined && badgeId >= 0 && badgeData && badgeData.claims) {
        for (let idx = 0; idx < badgeData.claims.length; idx++) {
            let claim = badgeData.claims[idx];
            if (!claim.leaves || claim.leaves.length === 0) {
                if (Number(claim.type) === 0) {
                    let res = await getFromIpfs(claim.uri.split('ipfs://')[1]);
                    console.log(res);
                    const fetchedLeaves: string[] = JSON.parse(res.file);

                    const tree = new MerkleTree(fetchedLeaves.map((x) => SHA256(x)), SHA256);
                    badgeData.claims[idx].leaves = fetchedLeaves;
                    badgeData.claims[idx].tree = tree;

                    console.log("TREE", tree);
                } else {
                    badgeData.claims[idx].leaves = [];
                    badgeData.claims[idx].tree = new MerkleTree([], SHA256);
                }
            }
        }

    }



    console.log("BADGE", badgeData);

    return {
        collection: badgeData
    };
}

export async function getBadgeBalance(
    badgeId: number,
    accountNumber: number
): Promise<GetBalanceResponse> {
    if (isNaN(badgeId) || badgeId < 0) {
        console.error("Invalid badgeId: ", badgeId);
        return Promise.reject(`Invalid badgeId: ${badgeId}`);
    }

    if (isNaN(accountNumber) || accountNumber < 0) {
        console.error("Invalid accountNumber: ", accountNumber);
        return Promise.reject(`Invalid accountNumber: ${accountNumber}`);
    }
    console.log('FETCHING BADGE BALANCE')
    const balanceRes = await axios.get(NODE_URL + GetBadgeBalanceRoute(badgeId, accountNumber))
        .then((res) => res.data);

    if (balanceRes.error) {
        console.error("ERROR: ", balanceRes.error);
        return Promise.reject(balanceRes.error);
    }

    console.log("BALANCE", balanceRes);


    //Normalize end ranges
    for (const balanceAmount of balanceRes.balance.balances) {
        balanceAmount.balance = Number(balanceAmount.balance);
    }

    return balanceRes;
}
