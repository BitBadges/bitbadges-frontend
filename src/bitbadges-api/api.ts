import axios from 'axios';
import { NODE_URL } from '../constants';
import { GetPermissions } from './permissions';
import { GetAccountRoute, GetAccountByNumberRoute, GetBadgeBalanceRoute, GetBadgeRoute, GetBalanceRoute } from './routes';
import { BadgeMetadata, BalanceObject, BitBadgeCollection, CosmosAccountInformation, GetBadgeResponse, GetBalanceResponse, SupportedChain } from './types';
import { getFromIpfs } from '../chain/backend_connectors';


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


export async function getBadge(
    collectionId: number,
    currBadge?: BitBadgeCollection,
    badgeId?: number
): Promise<GetBadgeResponse> {
    if (isNaN(collectionId) || collectionId < 0) {
        console.error("Invalid collectionId: ", collectionId);
        return Promise.reject(`Invalid collectionId: ${collectionId}`);
    }

    //Get the badge data from the blockchain if it doesn't exist
    let badgeData = currBadge;
    if (!badgeData) {
        console.log('FETCHING BADGE DATA')
        const badgeDataResponse = await axios.get(NODE_URL + GetBadgeRoute(collectionId))
            .then((res) => res.data);

        if (badgeDataResponse.error) {
            console.error("ERROR: ", badgeDataResponse.error);
            return Promise.reject(badgeDataResponse.error);
        }
        badgeData = badgeDataResponse.badge;
        if (badgeData) {
            badgeData.id = collectionId;

            // Convert the returned permissions (uint) to a Permissions object for easier use
            let permissionsNumber: any = badgeData.permissions;
            badgeData.permissions = GetPermissions(permissionsNumber);

            let managerAccountNumber: any = badgeData.manager;
            let managerAccountInfo: CosmosAccountInformation = await getAccountInformationByAccountNumber(managerAccountNumber);

            console.log(managerAccountInfo);

            badgeData.manager = {
                accountNumber: managerAccountInfo.account_number,
                address: managerAccountInfo.address,//TODO:
                cosmosAddress: managerAccountInfo.address,
                chain: SupportedChain.COSMOS //TODO:
            };

            const defaultSupplyObject: BalanceObject = {
                balance: badgeData.defaultSubassetSupply,
                idRanges: []
            };

            for (let i = 0; i < badgeData.nextSubassetId; i++) {
                if (!badgeData.subassetSupplys.find((supply) => supply.idRanges.find((range) => {
                    if (!range.end) range.end = range.start;

                    return range.start <= i && range.end >= i;
                }))) {
                    defaultSupplyObject.idRanges.push({
                        start: i,
                        end: i
                    });
                }
            }
            console.log("MED", JSON.stringify(defaultSupplyObject));

            if (defaultSupplyObject.idRanges.length > 0) {
                //combine all ranges where the previous end is the next start minus one
                for (let i = 0; i < defaultSupplyObject.idRanges.length - 1; i++) {
                    let currStart = defaultSupplyObject.idRanges[i].start;
                    let currEnd = defaultSupplyObject.idRanges[i].end;
                    let nextStart = defaultSupplyObject.idRanges[i + 1].start;
                    let nextEnd = defaultSupplyObject.idRanges[i + 1].end;

                    if (!currEnd) currEnd = currStart;
                    if (!nextEnd) nextEnd = nextStart;

                    if (currEnd + 1 === nextStart) {
                        defaultSupplyObject.idRanges[i].end = nextEnd;
                        defaultSupplyObject.idRanges.splice(i + 1, 1);
                        i--;
                    }
                }

                badgeData.subassetSupplys.push(defaultSupplyObject);
            }
        }
    }


    //Get the collection metadata if it does not exist on the current badge object
    if (badgeData && (!badgeData.collectionMetadata || JSON.stringify(badgeData.collectionMetadata) === JSON.stringify({} as BadgeMetadata))) {
        const res = await getFromIpfs(badgeData.uri.uri, 'collection');
        badgeData.collectionMetadata = JSON.parse(res.file);
    }

    if (badgeData && !badgeData.badgeMetadata) {
        let badgeMetadata: BadgeMetadata[] = [];
        for (let i = 0; i < Number(badgeData?.nextSubassetId); i++) {
            badgeMetadata.push({} as BadgeMetadata);
        }
        badgeData.badgeMetadata = badgeMetadata;
    }

    //Get the individual badge metadata if the requested badgeId does not currently have metadata
    if (badgeId !== undefined && badgeId >= 0 && badgeData && badgeData.badgeMetadata
        && (JSON.stringify(badgeData.badgeMetadata[badgeId]) === JSON.stringify({} as BadgeMetadata)
            || !badgeData.badgeMetadata[badgeId])) {
        const res = await getFromIpfs(badgeData.uri.uri, `${badgeId}`);
        badgeData.badgeMetadata[badgeId] = JSON.parse(res.file);
    }

    return {
        badge: badgeData
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
    const balance = await axios.get(NODE_URL + GetBadgeBalanceRoute(badgeId, accountNumber))
        .then((res) => res.data);

    if (balance.error) {
        console.error("ERROR: ", balance.error);
        return Promise.reject(balance.error);
    }

    //Normalize end ranges
    for (const balanceAmount of balance.balanceInfo.balanceAmounts) {
        for (const idRange of balanceAmount.idRanges) {
            console.log("ID RANGE", idRange);
            if (!idRange.end || idRange.end < idRange.start) {
                idRange.end = idRange.start;
            }

            idRange.end = Number(idRange.end);
            idRange.start = Number(idRange.start);
        }
        balanceAmount.balance = Number(balanceAmount.balance);
    }

    for (const pending of balance.balanceInfo.pending) {
        pending.amount = Number(pending.amount);
        pending.expirationTime = Number(pending.expirationTime);
        pending.cantCancelBeforeTime = Number(pending.cantCancelBeforeTime);
    }

    return balance;
}
