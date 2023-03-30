import { GO_MAX_UINT_64 } from "../constants";
import { InsertRangeToIdRanges, RemoveIdsFromIdRange } from "./idRanges";
import { Addresses, BitBadgesUserInfo, IdRange, TransferMapping, TransferMappingWithUnregisteredUsers } from "./types";

export const updateTransferMappingAccountNums = (accountNumber: number, remove: boolean, transferMappingAddresses: Addresses) => {
    //If we are to remove the account, we remove it from the accountNums
    //Else, insert it
    let newAccountNums: IdRange[] = []
    if (remove) {
        for (const idRange of transferMappingAddresses.accountNums) {
            newAccountNums.push(...RemoveIdsFromIdRange({ start: accountNumber, end: accountNumber }, idRange));
        }

        transferMappingAddresses.accountNums = newAccountNums;
    } else {
        if (transferMappingAddresses.accountNums.length == 0) {
            transferMappingAddresses.accountNums.push({ start: accountNumber, end: accountNumber });
        } else {
            //Since they were previously unregistered, we assume there is no way it can already be in accountNums
            transferMappingAddresses.accountNums = InsertRangeToIdRanges({ start: accountNumber, end: accountNumber }, transferMappingAddresses.accountNums);
        }
    }

    return transferMappingAddresses;
}

export const isTransferMappingFull = (transfersMapping: TransferMapping[]) => {
    return transfersMapping.length === 1 && transfersMapping[0].to.accountNums.length === 1 &&
        transfersMapping[0].to.accountNums[0].start == 0 &&
        transfersMapping[0].to.accountNums[0].end == GO_MAX_UINT_64 &&
        transfersMapping[0].from.accountNums.length === 1 &&
        transfersMapping[0].from.accountNums[0].start == 0 &&
        transfersMapping[0].from.accountNums[0].end == GO_MAX_UINT_64
}

export const getTransferMappingForSelectOptions = (isFromMapping: boolean, unregistered: string[], users: BitBadgesUserInfo[], all: boolean, none: boolean, everyoneExcept: boolean) => {
    let transferMapping: TransferMappingWithUnregisteredUsers | undefined;
    const accountNums: IdRange[] = [];
    for (const user of users) {
        if (user.accountNumber === -1) {
            //To be added/removed when registered
            unregistered.push(user.cosmosAddress);
            continue;
        } else {
            accountNums.push({
                start: user.accountNumber,
                end: user.accountNumber
            })
        }
    }

    if (!none) {
        transferMapping = {
            from: {
                accountNums: all || everyoneExcept ? [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }] : accountNums,
                options: 0,
            },
            to: {
                accountNums: [{
                    start: 0,
                    end: GO_MAX_UINT_64
                }],
                options: 0,
            },
            removeFromUsers: false,
            removeToUsers: false,
            fromUnregisteredUsers: unregistered,
            toUnregisteredUsers: [],
        }
    } else if (none) {
        transferMapping = undefined;
    }

    let shouldRemoveAddresses = everyoneExcept && users.length > 0;

    if (shouldRemoveAddresses) {
        if (!transferMapping) return;

        transferMapping.removeFromUsers = true;

        for (const user of users) {
            for (let i = 0; i < transferMapping.from.accountNums.length; i++) {
                transferMapping.from.accountNums = [...transferMapping.from.accountNums.slice(0, i), ...RemoveIdsFromIdRange({ start: user.accountNumber, end: user.accountNumber }, transferMapping.from.accountNums[i]), ...transferMapping.from.accountNums.slice(i + 1)];
            }
        }
    }

    if (isFromMapping) {
        return transferMapping;
    } else {
        if (!transferMapping) return;

        return {
            ...transferMapping,
            from: transferMapping?.to,
            to: transferMapping?.from,
            removeFromUsers: transferMapping?.removeToUsers,
            removeToUsers: transferMapping?.removeFromUsers,
            fromUnregisteredUsers: transferMapping?.toUnregisteredUsers,
            toUnregisteredUsers: transferMapping?.fromUnregisteredUsers,
        }
    }
}