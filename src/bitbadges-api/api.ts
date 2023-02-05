import axios from 'axios';
import { NODE_URL } from '../constants';
import { GetPermissions } from './permissions';
import { GetAccountRoute, GetAccountByNumberRoute, GetBadgeBalanceRoute, GetCollectionRoute, GetBalanceRoute, GetCollectionResponse, GetBadgeBalanceResponse, GetAccountByNumberResponse } from './routes';
import { BadgeMetadata, BitBadgeCollection, CosmosAccountInformation, SupportedChain, DistributionMethod, GetBalanceResponse, IdRange, } from './types';
import { getFromIpfs } from '../chain/backend_connectors';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';

//TODO: data normalization: "0" to number 0, "false" to boolean false, etc.

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
    const res: GetAccountByNumberResponse = await axios
        .get(NODE_URL + GetAccountByNumberRoute(id))
        .then((res) => res.data);

    if (res.error || !res.account_address) {
        return Promise.reject(res.error);
    }

    const bech32Address = res.account_address;

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

export async function getBalance(bech32Address: string) {
    const balance = await axios.get(NODE_URL + GetBalanceRoute(bech32Address))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }

    return balance;
}

//TODO: pagination / scalability
export async function getBadgeCollection(
    collectionId: number,
    badgeIdsToFetch?: IdRange
): Promise<GetCollectionResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }


    const badgeDataResponse = await axios.get(NODE_URL + GetCollectionRoute(collectionId))
        .then((res) => res.data);

    if (badgeDataResponse.error) {
        console.error("ERROR: ", badgeDataResponse.error);
        return Promise.reject(badgeDataResponse.error);
    }

    let badgeData: BitBadgeCollection = badgeDataResponse.collection;

    //Format some of the data for easier use
    if (badgeData) {
        badgeData.collectionId = collectionId;

        // Convert the returned permissions (uint) to a Permissions object for easier use
        let permissionsNumber: any = badgeData.permissions;
        badgeData.permissions = GetPermissions(permissionsNumber);

        // Convert the returned manager (bech32) to an BitBadgesUserInfo object for easier use
        let managerAccountNumber: any = badgeData.manager;
        let managerAccountInfo: CosmosAccountInformation = await getAccountInformationByAccountNumber(managerAccountNumber);


        //TODO: dynamic conversions between chains
        let ethAddress = cosmosToEth(managerAccountInfo.address);
        badgeData.manager = {
            accountNumber: managerAccountInfo.account_number,
            address: ethAddress,
            cosmosAddress: managerAccountInfo.address,
            chain: SupportedChain.ETH
        };

        badgeData.unmintedSupplys = badgeData.unmintedSupplys.map((supply) => {
            return {
                balance: Number(supply.balance),
                badgeIds: supply.badgeIds.map((id) => {
                    return {
                        start: Number(id.start),
                        end: Number(id.end)
                    }
                }),
            }
        });

        badgeData.maxSupplys = badgeData.maxSupplys.map((supply) => {
            return {
                balance: Number(supply.balance),
                badgeIds: supply.badgeIds.map((id) => {
                    return {
                        start: Number(id.start),
                        end: Number(id.end)
                    }
                }),
            }
        });
    }


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

    //Create empty array for all unique badges if it does not exist on the current badge object
    if (badgeData && !badgeData.badgeMetadata) {
        let badgeMetadata: BadgeMetadata[] = [];
        for (let i = 0; i < Number(badgeData?.nextBadgeId); i++) {
            badgeMetadata.push({} as BadgeMetadata);
        }
        badgeData.badgeMetadata = badgeMetadata;
    }

    //If not specified, fetch all badges
    if (!badgeIdsToFetch) {
        badgeIdsToFetch = {
            start: 0,
            end: Number(badgeData?.nextBadgeId) - 1
        }
    }

    //Get the individual badge metadata if the requested badgeId does not currently have metadata
    for (let i = badgeIdsToFetch.start; i <= badgeIdsToFetch.end; i++) {
        if (badgeData && badgeData.badgeMetadata
            && (JSON.stringify(badgeData.badgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)
                || !badgeData.badgeMetadata[i])) {
            let badgeUri = badgeData.badgeUri;
            if (badgeUri.startsWith('ipfs://')) {
                const res = await getFromIpfs(badgeUri.replace('ipfs://', '').replace('{id}', i.toString()));
                badgeData.badgeMetadata[i] = JSON.parse(res.file);
            }

            if (badgeData.claims) {
                for (let idx = 0; idx < badgeData.claims.length; idx++) {
                    let claim = badgeData.claims[idx];

                    //If we have not fetched the leaves for each claim yet, fetch them
                    if (!claim.leaves || claim.leaves.length === 0) {
                        if (Number(claim.type) === 0) {
                            let res = await getFromIpfs(claim.uri.replace('ipfs://', ''));
                            const fetchedLeaves: string[] = JSON.parse(res.file);

                            if (fetchedLeaves[0]) {
                                if (fetchedLeaves[0].split('-').length < 5 || (fetchedLeaves[0].split('-').length - 3) % 2 != 0) {
                                    //Is a list of hashed codes; do not hash the leaves
                                    //Users will enter their code and we check if we have a Merkle proof for it
                                    const tree = new MerkleTree(fetchedLeaves, SHA256);
                                    badgeData.claims[idx].leaves = fetchedLeaves;
                                    badgeData.claims[idx].tree = tree;
                                    badgeData.claims[idx].distributionMethod = DistributionMethod.Codes;
                                } else {
                                    //Is a list of specific codes with addresses
                                    const tree = new MerkleTree(fetchedLeaves.map((x) => SHA256(x)), SHA256);
                                    badgeData.claims[idx].leaves = fetchedLeaves;
                                    badgeData.claims[idx].tree = tree;
                                    badgeData.claims[idx].distributionMethod = DistributionMethod.SpecificAddresses;
                                }
                            }
                        } else {
                            badgeData.claims[idx].leaves = [];
                            badgeData.claims[idx].tree = new MerkleTree([], SHA256);
                        }
                    }
                }
            }
        }
    }


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
    console.log("Getting badge balance for collectionId: ", collectionId, " and accountNumber: ", accountNumber);

    const balanceRes: GetBadgeBalanceResponse = await axios.get(NODE_URL + GetBadgeBalanceRoute(collectionId, accountNumber))
        .then((res) => res.data);

    console.log(balanceRes);

    if (balanceRes.error) {
        console.error("ERROR: ", balanceRes.error);
        return Promise.reject(balanceRes.error);
    }
    
    if (balanceRes.balance) {
        for (const balanceObject of balanceRes.balance.balances) {
            balanceObject.balance = Number(balanceObject.balance);
            for (const badgeId of balanceObject.badgeIds) {
                badgeId.start = Number(badgeId.start);
                badgeId.end = Number(badgeId.end);
            }
        }
    }

    return balanceRes;
}
