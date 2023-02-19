/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getAccountInformation, getAccountsByAccountNumbers } from '../bitbadges-api/api';
import { BitBadgesUserInfo } from '../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../bitbadges-api/users';
import { convertToCosmosAddress } from '../bitbadges-api/chains';
import { MINT_ACCOUNT } from '../constants';

export type AccountsContextType = {
    accounts: {
        [accountNumber: string]: BitBadgesUserInfo;
    },
    accountNumbers: {
        [address: string]: number;
    },
    fetchAccounts: (accountsToFetch: string[]) => Promise<void>,
    fetchAccountsByNumber: (accountNumsToFetch: number[]) => Promise<void>,
}

const AccountsContext = createContext<AccountsContextType>({
    accounts: {},
    accountNumbers: {},
    fetchAccounts: async () => { },
    fetchAccountsByNumber: async () => { },
});

type Props = {
    children?: React.ReactNode
};

export const AccountsContextProvider: React.FC<Props> = ({ children }) => {
    const [accounts, setAccounts] = useState<{ [accountNumber: string]: BitBadgesUserInfo }>({
        'Mint': MINT_ACCOUNT
    });
    const [accountNumbers, setAccountNumbers] = useState<{ [address: string]: number }>({});

    //TODO: batch fetch
    const fetchAccounts = async (accountsToFetch: string[]) => {
        const fetchedAccounts = [];
        for (const account of accountsToFetch) {
            if (account === 'Mint') continue;

            if (accountNumbers[account] === undefined) {
                const accountInfo = await getAccountInformation(convertToCosmosAddress(account));
                setAccounts({
                    ...accounts,
                    [accountInfo.account_number]: convertToBitBadgesUserInfo(accountInfo)
                });
                setAccountNumbers({
                    ...accountNumbers,
                    [accountInfo.address]: accountInfo.account_number,
                    [accountInfo.cosmosAddress]: accountInfo.account_number
                });

                fetchedAccounts.push(convertToBitBadgesUserInfo(accountInfo));
            } else {
                fetchedAccounts.push(accounts[accountNumbers[account]]);
            }
        }
    }

    const fetchAccountsByNumber = async (accountNums: number[]) => {

        const accountsToFetch = [];
        for (const accountNum of accountNums) {
            if (accounts[accountNum] === undefined) {
                accountsToFetch.push(accountNum);
            }
        }

        const fetchedAccounts = await getAccountsByAccountNumbers(accountsToFetch);
        for (const accountInfo of fetchedAccounts) {
            setAccounts({
                ...accounts,
                [accountInfo.account_number]: convertToBitBadgesUserInfo(accountInfo)
            });
            setAccountNumbers({
                ...accountNumbers,
                [accountInfo.address]: accountInfo.account_number,
                [accountInfo.cosmosAddress]: accountInfo.account_number
            });
        }
    }



    const accountsContext: AccountsContextType = {
        accounts,
        accountNumbers,
        fetchAccounts,
        fetchAccountsByNumber,
    };

    return <AccountsContext.Provider value={accountsContext}>
        {children}
    </AccountsContext.Provider>;
}


export const useAccountsContext = () => useContext(AccountsContext);