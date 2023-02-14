import axios from 'axios';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { getFromIpfs } from '../chain/backend_connectors';
import { BACKEND_URL, NODE_URL } from '../constants';
import { GetPermissions } from './permissions';
import { GetAccountByNumberResponse, GetAccountByNumberRoute, GetAccountRoute, GetBadgeBalanceResponse, GetBadgeBalanceRoute, GetBalanceRoute, GetCollectionResponse, GetCollectionRoute } from './routes';
import { BadgeMetadata, BitBadgeCollection, CosmosAccountInformation, DistributionMethod, IdRange, SupportedChain } from './types';

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
    collectionId: number
): Promise<GetCollectionResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }

    const badgeDataResponse = await axios.get(BACKEND_URL + GetCollectionRoute(collectionId))
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
        managerAccountInfo.account_number = Number(managerAccountInfo.account_number);
        managerAccountInfo.sequence = Number(managerAccountInfo.sequence);

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

    for (let idx = 0; idx < badgeData.claims.length; idx++) {
        let claim = badgeData.claims[idx];

        if (Number(claim.type) === 0) {
            const fetchedLeaves: string[] = claim.leaves;

            if (fetchedLeaves[0]) {
                if (fetchedLeaves[0].split('-').length < 5 || (fetchedLeaves[0].split('-').length - 3) % 2 != 0) {
                    //Is a list of hashed codes; do not hash the leaves
                    //Users will enter their code and we check if we have a Merkle proof for it
                    const tree = new MerkleTree(fetchedLeaves, SHA256);
                    badgeData.claims[idx].tree = tree;
                    badgeData.claims[idx].distributionMethod = DistributionMethod.Codes;
                } else {
                    //Is a list of specific codes with addresses
                    const tree = new MerkleTree(fetchedLeaves.map((x) => SHA256(x)), SHA256);
                    badgeData.claims[idx].tree = tree;
                    badgeData.claims[idx].distributionMethod = DistributionMethod.Whitelist;
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
