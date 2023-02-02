import { BitBadgeCollection, UserBalance } from "./types";

export const GetAccountRoute = (bech32address: string) => {
    return `/cosmos/auth/v1beta1/accounts/${bech32address}`;
}

export const GetAccountByNumberRoute = (id: number) => {
    return `/cosmos/auth/v1beta1/address_by_id/${id}`;
}

export const GetBalanceRoute = (bech32address: string) => {
    return `/cosmos/bank/balances/${bech32address}`;
}

export const GetCollectionRoute = (collectionId: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_collection/${collectionId}`;
}

export const GetBadgeBalanceRoute = (collectionId: number, accountNumber: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_balance/${collectionId}/${accountNumber}`;
}

export interface GetCollectionResponse {
    error?: any;
    collection?: BitBadgeCollection;
}

export interface GetAccountByNumberResponse {
    error?: any;
    account_address?: string;
}

export interface GetBadgeBalanceResponse {
    error?: any;
    balance?: UserBalance;
}