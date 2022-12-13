export const GetAccountRoute = (bech32address: string) => {
    return `/cosmos/auth/v1beta1/accounts/${bech32address}`;
}

export const GetAccountByNumberRoute = (bech32address: string) => {
    return `/cosmos/auth/v1beta1/accounts/${bech32address}`; //TODO: 
}

export const GetBalanceRoute = (bech32address: string) => {
    return `/cosmos/bank/balances/${bech32address}`;
}

export const GetBadgeRoute = (badgeId: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_badge/${badgeId}`;
}

export const GetBadgeBalanceRoute = (badgeId: number, accountNumber: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_balance/${badgeId}/${accountNumber}`;
}