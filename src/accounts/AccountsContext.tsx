/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getAccountInformation, getAccountsByAccountNumbers } from '../bitbadges-api/api';
import { BitBadgesUserInfo, SupportedChain } from '../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../bitbadges-api/users';
import { convertToCosmosAddress, getChainForAddress } from '../bitbadges-api/chains';
import { MINT_ACCOUNT } from '../constants';
import { useEthereumContext } from '../chain/ethereum/EthereumContext';

export type AccountsContextType = {
    accounts: {
        [accountNumber: string]: BitBadgesUserInfo;
    },
    accountNumbers: {
        [address: string]: number;
    },
    accountNames: {
        [address: string]: string;
    },
    fetchAccounts: (accountsToFetch: string[]) => Promise<BitBadgesUserInfo[]>,
    fetchAccountsByNumber: (accountNumsToFetch: number[]) => Promise<BitBadgesUserInfo[]>,
}

const AccountsContext = createContext<AccountsContextType>({
    accounts: {},
    accountNumbers: {},
    accountNames: {},
    fetchAccounts: async () => { return [] },
    fetchAccountsByNumber: async () => { return [] },
});

type Props = {
    children?: React.ReactNode
};

export const AccountsContextProvider: React.FC<Props> = ({ children }) => {
    const [accounts, setAccounts] = useState<{ [accountNumber: string]: BitBadgesUserInfo }>({
        'Mint': MINT_ACCOUNT
    });
    const [accountNumbers, setAccountNumbers] = useState<{ [address: string]: number }>({});
    const [accountNames, setAccountNames] = useState<{ [address: string]: string }>({});

    const ethereum = useEthereumContext();


    //TODO: batch fetch
    const fetchAccounts = async (accountsToFetch: string[]) => {
        console.log(accountsToFetch);
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
                console.log("TESTING IF STATEMENT", accountInfo.chain === SupportedChain.ETH
                    && ethereum.selectedChainInfo
                    && ethereum.selectedChainInfo.getNameForAddress)

                if (getChainForAddress(account) === SupportedChain.ETH
                    && ethereum.selectedChainInfo
                    && ethereum.selectedChainInfo.getNameForAddress) {
                    let ensName = await ethereum.selectedChainInfo?.getNameForAddress(account);
                    console.log("ENS NAME", ensName);
                    if (ensName) {
                        setAccountNames({
                            ...accountNames,
                            [account]: ensName
                        });
                    }
                }
            } else {
                fetchedAccounts.push(accounts[accountNumbers[account]]);
            }
        }



        return fetchedAccounts;
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

            if (getChainForAddress(accountInfo.address) === SupportedChain.ETH
                && ethereum.selectedChainInfo
                && ethereum.selectedChainInfo.getNameForAddress) {
                let ensName = await ethereum.selectedChainInfo?.getNameForAddress(accountInfo.address);
                console.log("ENS NAME", ensName);
                if (ensName) {
                    setAccountNames({
                        ...accountNames,
                        [accountInfo.address]: ensName
                    });
                }
            }
        }

        const accountsToReturn = [];
        for (const accountNum of accountNums) {
            if (accounts[accountNum] === undefined) {
                const accountInfo = fetchedAccounts.find(account => account.account_number === accountNum);
                if (accountInfo) accountsToReturn.push(convertToBitBadgesUserInfo(accountInfo)); //should always be the case
            } else {
                accountsToReturn.push(accounts[accountNum]);
            }
        }

        return accountsToReturn;
    }




    const accountsContext: AccountsContextType = {
        accounts,
        accountNumbers,
        accountNames,
        fetchAccounts,
        fetchAccountsByNumber,
    };

    return <AccountsContext.Provider value={accountsContext}>
        {children}
    </AccountsContext.Provider>;
}


export const useAccountsContext = () => useContext(AccountsContext);