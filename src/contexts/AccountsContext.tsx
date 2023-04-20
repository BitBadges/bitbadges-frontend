/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getAccounts } from '../bitbadges-api/api';
import { notification } from 'antd';
import { AccountMap, BitBadgesUserInfo, AccountResponse, MINT_ACCOUNT, convertToBitBadgesUserInfo } from 'bitbadgesjs-utils';

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
    setAccounts: (accounts: AccountResponse[]) => void,
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

    const setAccounts = async (fetchedAccounts: AccountResponse[]) => {
        let newAccountsMap = { ...accounts };
        let newCosmosAddresses = { ...cosmosAddresses };
        let newCosmosAddressesByAccountNumbers = { ...cosmosAddressesByAccountNumbers };
        let newCosmosAddressesByAccountNames = { ...cosmosAddressesByAccountNames };

        for (const accountInfo of fetchedAccounts) {
            newAccountsMap = {
                ...newAccountsMap,
                [accountInfo.cosmosAddress]: convertToBitBadgesUserInfo(accountInfo)
            };

            newCosmosAddresses = {
                ...newCosmosAddresses,
                [accountInfo.address]: accountInfo.cosmosAddress,
                [accountInfo.cosmosAddress]: accountInfo.cosmosAddress
            };

            newCosmosAddressesByAccountNumbers = {
                ...newCosmosAddressesByAccountNumbers,
                [`${accountInfo.account_number}`]: accountInfo.cosmosAddress,
            };



            if (accountInfo.name) {
                newCosmosAddressesByAccountNames = {
                    ...newCosmosAddressesByAccountNames,
                    [accountInfo.name]: accountInfo.cosmosAddress,
                };

            }
        }

        setAccountsMap(newAccountsMap);
        setCosmosAddresses(newCosmosAddresses);
        setCosmosAddressesByAccountNumbers(newCosmosAddressesByAccountNumbers);
        setCosmosAddressesByAccountNames(newCosmosAddressesByAccountNames);
    }


    const fetchAccounts = async (accountsToFetch: string[], forceful?: boolean) => {

        try {
            console.log(accountsToFetch);
            accountsToFetch = [...new Set(accountsToFetch)]; //remove duplicates
            const accountsToFetchFromDB = [];
            for (const account of accountsToFetch) {
                const isName = cosmosAddressesByAccountNames[account] !== undefined;
                const emptyEntry = isName ? accounts[cosmosAddressesByAccountNames[account]] === undefined : accounts[cosmosAddresses[account]] === undefined;

                if (forceful || emptyEntry) {
                    accountsToFetchFromDB.push(account);
                }
            }

            let fetchedAccounts: AccountResponse[] = [];
            if (accountsToFetchFromDB.length > 0) {
                fetchedAccounts = await getAccounts([], accountsToFetchFromDB);
                setAccounts(fetchedAccounts);
            }

            const accountsToReturn = [];
            for (const account of accountsToFetch) {
                const isName = cosmosAddressesByAccountNames[account] !== undefined;
                const emptyEntry = isName ? accounts[cosmosAddressesByAccountNames[account]] === undefined : accounts[cosmosAddresses[account]] === undefined;

                if (forceful || emptyEntry) {
                    const accountInfo = fetchedAccounts.find(fetchedAccount => fetchedAccount.address === account || fetchedAccount.cosmosAddress === account || fetchedAccount.name === account);
                    if (accountInfo) accountsToReturn.push(convertToBitBadgesUserInfo(accountInfo)); //should always be the case
                } else if (isName) {
                    accountsToReturn.push(accounts[cosmosAddressesByAccountNames[account]]);
                } else {
                    accountsToReturn.push(accounts[cosmosAddresses[account]]);
                }
            }

            return accountsToReturn;
        } catch (e: any) {
            console.error(e);
            notification.error({
                message: 'Oops! We ran into an error while fetching accounts.',
                description: e.message
            });
            return [];
        }
    }

    const fetchAccountsByNumber = async (accountNums: number[], forceful?: boolean) => {
        try {
            console.log(accountNums);
            accountNums = [...new Set(accountNums)]; //remove duplicates
            const accountsToFetch = [];
            for (const accountNum of accountNums) {
                if (forceful || accounts[cosmosAddressesByAccountNumbers[accountNum]] === undefined) {
                    accountsToFetch.push(accountNum);
                }
            }

            console.log(accountNums);

            let fetchedAccounts: AccountResponse[] = [];
            if (accountsToFetch.length > 0) {
                fetchedAccounts = await getAccounts(accountsToFetch, []);
                console.log(fetchedAccounts);
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
        } catch (e: any) {
            console.error(e);
            notification.error({
                message: 'Oops! We ran into an error while fetching accounts.',
                description: e.message
            });
            return [];
        }
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