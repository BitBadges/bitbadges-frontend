import { BitBadgeCollection, CosmosAccountInformation, UserBalance } from "./types";

export const GetAccountRoute = (bech32address: string) => {
    return `/api/user/address/${bech32address}`;
}

export const GetAccountByNumberRoute = (id: number) => {
    return `/api/user/id/${id}`;
}

export const GetBalanceRoute = (bech32address: string) => {
    return `/cosmos/bank/balances/${bech32address}`;
}

export const GetCollectionRoute = (collectionId: number) => {
    return `/api/collection/${collectionId}`;
}

export const GetBadgeBalanceRoute = (collectionId: number, accountNumber: number) => {
    return `/api/balance/${collectionId}/${accountNumber}`;
}

export const GetOwnersRoute = (collectionId: number, badgeId: number) => {
    return `/api/collection/${collectionId}/${badgeId}/owners`;
}

export interface GetCollectionResponse {
    error?: any;
    collection?: BitBadgeCollection;
}

export interface GetAccountResponse {
    error?: any;
    accountInfo?: CosmosAccountInformation;
}

export interface GetBadgeBalanceResponse {
    error?: any;
    balance?: UserBalance;
}