/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getAccounts } from '../bitbadges-api/api';
import { AccountMap, BitBadgesUserInfo, CosmosAccountInformation } from '../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../bitbadges-api/users';
import { MINT_ACCOUNT } from '../constants';

export type AccountsContextType = {
    accounts: AccountMap,
    cosmosAddressesByAccountNumbers: {
        [accountNum: string]: string;
    },
    cosmosAddressesByAccountNames: {
        [name: string]: string;
    },
    cosmosAddresses: {
        [address: string]: string;
    },
    fetchAccounts: (accountsToFetch: string[], forceful?: boolean) => Promise<BitBadgesUserInfo[]>,
    fetchAccountsByNumber: (accountNumsToFetch: number[], forceful?: boolean) => Promise<BitBadgesUserInfo[]>,
    setAccounts: (accounts: CosmosAccountInformation[]) => void,
}

const AccountsContext = createContext<AccountsContextType>({
    accounts: {},
    cosmosAddressesByAccountNumbers: {},
    cosmosAddressesByAccountNames: {},
    cosmosAddresses: {},
    fetchAccounts: async () => { return [] },
    fetchAccountsByNumber: async () => { return [] },
    setAccounts: async () => { }
});

type Props = {
    children?: React.ReactNode
};

export const AccountsContextProvider: React.FC<Props> = ({ children }) => {
    const [accounts, setAccountsMap] = useState<AccountMap>({
        'Mint': MINT_ACCOUNT
    });
    const [cosmosAddresses, setCosmosAddresses] = useState<{ [address: string]: string }>({});
    const [cosmosAddressesByAccountNumbers, setCosmosAddressesByAccountNumbers] = useState<{ [accountNum: string]: string }>({
        'Mint': 'Mint'
    });
    const [cosmosAddressesByAccountNames, setCosmosAddressesByAccountNames] = useState<{ [name: string]: string }>({});

    const setAccounts = async (fetchedAccounts: CosmosAccountInformation[]) => {
        for (const accountInfo of fetchedAccounts) {
            setAccountsMap({
                ...accounts,
                [accountInfo.cosmosAddress]: convertToBitBadgesUserInfo(accountInfo)
            });

            setCosmosAddresses({
                ...cosmosAddresses,
                [accountInfo.address]: accountInfo.cosmosAddress,
                [accountInfo.cosmosAddress]: accountInfo.cosmosAddress
            });

            setCosmosAddressesByAccountNumbers({
                ...cosmosAddressesByAccountNumbers,
                [`${accountInfo.account_number}`]: accountInfo.cosmosAddress,
            });

            if (accountInfo.name) {
                setCosmosAddressesByAccountNames({
                    ...cosmosAddressesByAccountNames,
                    [accountInfo.name]: accountInfo.cosmosAddress,
                });
            }
        }
    }


    const fetchAccounts = async (accountsToFetch: string[], forceful?: boolean) => {
        accountsToFetch = [...new Set(accountsToFetch)]; //remove duplicates
        const accountsToFetchFromDB = [];
        for (const account of accountsToFetch) {
            const isName = cosmosAddressesByAccountNames[account] !== undefined;
            const emptyEntry = isName ? accounts[cosmosAddressesByAccountNames[account]] === undefined : accounts[cosmosAddresses[account]] === undefined;

            if (forceful || emptyEntry) {
                accountsToFetchFromDB.push(account);
            }
        }

        let fetchedAccounts: CosmosAccountInformation[] = [];
        if (accountsToFetchFromDB.length > 0) {
            fetchedAccounts = await getAccounts([], accountsToFetchFromDB);
            setAccounts(fetchedAccounts);
        }

        const accountsToReturn = [];
        for (const account of accountsToFetch) {
            const isName = cosmosAddressesByAccountNames[account] !== undefined;
            const emptyEntry = isName ? accounts[cosmosAddressesByAccountNames[account]] === undefined : accounts[cosmosAddresses[account]] === undefined;

            if (forceful || emptyEntry) {
                const accountInfo = fetchedAccounts.find(fetchedAccount => fetchedAccount.address === account || fetchedAccount.cosmosAddress === account);
                if (accountInfo) accountsToReturn.push(convertToBitBadgesUserInfo(accountInfo)); //should always be the case
            } else {
                accountsToReturn.push(accounts[cosmosAddresses[account]]);
            }
        }

        return accountsToReturn;
    }

    const fetchAccountsByNumber = async (accountNums: number[], forceful?: boolean) => {
        accountNums = [...new Set(accountNums)]; //remove duplicates
        const accountsToFetch = [];
        for (const accountNum of accountNums) {
            if (forceful || accounts[cosmosAddressesByAccountNumbers[accountNum]] === undefined) {
                accountsToFetch.push(accountNum);
            }
        }

        let fetchedAccounts: CosmosAccountInformation[] = [];
        if (accountsToFetch.length > 0) {
            fetchedAccounts = await getAccounts(accountsToFetch, []);
            setAccounts(fetchedAccounts);
        }

        const accountsToReturn = [];
        for (const accountNum of accountNums) {
            if (forceful || accounts[cosmosAddressesByAccountNumbers[accountNum]] === undefined) {
                const accountInfo = fetchedAccounts.find(account => account.account_number === accountNum);
                if (accountInfo) accountsToReturn.push(convertToBitBadgesUserInfo(accountInfo)); //should always be the case
            } else {
                accountsToReturn.push(accounts[cosmosAddressesByAccountNumbers[accountNum]]);
            }
        }

        return accountsToReturn;
    }

    const accountsContext: AccountsContextType = {
        accounts,
        cosmosAddressesByAccountNumbers,
        cosmosAddressesByAccountNames,
        cosmosAddresses,
        fetchAccounts,
        fetchAccountsByNumber,
        setAccounts,
    };

    return <AccountsContext.Provider value={accountsContext}>
        {children}
    </AccountsContext.Provider>;
}


export const useAccountsContext = () => useContext(AccountsContext);