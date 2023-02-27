
import { Avatar, Menu, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';
import { getChainForAddress, isAddressValid } from '../../bitbadges-api/chains';
import { BadgeMetadata, BitBadgesUserInfo, CosmosAccountInformation, SupportedChain } from '../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../bitbadges-api/users';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useEthereumContext } from '../../contexts/ethereum/EthereumContext';
import { AddressDisplay } from '../address/AddressDisplay';

export function SearchDropdown({
    searchValue,
    onSearch,
    onlyAddresses
}:
    {
        searchValue: string,
        onSearch: (value: string) => void
        onlyAddresses?: boolean
    }
) {
    const accounts = useAccountsContext();
    const ethereum = useEthereumContext();
    const [accountsResults, setAccountsResults] = useState<BitBadgesUserInfo[]>([]);
    const [collectionsResults, setCollectionsResults] = useState<((BadgeMetadata & { _id: string }))[]>([]);


    useEffect(() => {
        const updateSearchValue = async (value: string) => {
            if (!value) return
            await accounts.fetchAccounts([value]);
            const results = await getSearchResults(value);
            const resolvedAddresses: string[] = []

            const newAccounts = await accounts.fetchAccounts([...resolvedAddresses, ...results.accounts.map((result: CosmosAccountInformation) => result.address)]);

            const resolvedAccount = newAccounts.find((account: BitBadgesUserInfo) => account.address === resolvedAddresses[0])
            const accountsToSet = [];
            if (resolvedAccount) {
                accountsToSet.push(resolvedAccount);
            }
            accountsToSet.push(...results.accounts.map((result: CosmosAccountInformation) => convertToBitBadgesUserInfo(result)));

            setAccountsResults(accountsToSet);
            setCollectionsResults(results.collections);

            console.log("SEARCH RESULTS", results);
        }
        updateSearchValue(searchValue);
    }, [searchValue, accounts])




    return <Menu className='dropdown' onKeyDown={(e) => {
        if (e.key === '') {
            onSearch(searchValue);
        }
    }}>
        <Typography.Text strong style={{ fontSize: 20 }}>Accounts</Typography.Text>

        {/* Current Search Value Address Helper */}
        {!accountsResults.find((result: BitBadgesUserInfo) => result.address === searchValue) &&
            <Menu.Item className='dropdown-item' disabled={!accounts.cosmosAddressesByAccountNames[searchValue] && !isAddressValid(searchValue)} style={{ cursor: 'disabled' }} onClick={() => {
                accounts.cosmosAddressesByAccountNames[searchValue] ?
                    onSearch(accounts.cosmosAddressesByAccountNames[searchValue]) :
                    onSearch(searchValue);
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AddressDisplay
                            userInfo={accounts.cosmosAddressesByAccountNames[searchValue] ?
                                accounts.accounts[accounts.cosmosAddressesByAccountNames[searchValue]] :
                                {
                                    address: searchValue,
                                    cosmosAddress: '',
                                    chain: SupportedChain.UNKNOWN,
                                    accountNumber: -1,
                                }}
                            hidePortfolioLink
                            hideTooltip
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isAddressValid(searchValue) ? 'Unregistered' : ''}
                    </div>
                </div>
            </Menu.Item>
        }

        {/* {Account Results} */}
        {accountsResults.map((result: BitBadgesUserInfo, idx) => {
            return <Menu.Item key={idx} className='dropdown-item' onClick={() => {
                onSearch(result.address);
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AddressDisplay
                            userInfo={getChainForAddress(searchValue) === SupportedChain.ETH ?
                                {
                                    address: result.address,
                                    cosmosAddress: result.cosmosAddress,
                                    chain: SupportedChain.ETH,
                                    accountNumber: result.accountNumber,
                                } : {
                                    address: result.cosmosAddress,
                                    cosmosAddress: result.cosmosAddress,
                                    chain: SupportedChain.COSMOS,
                                    accountNumber: result.accountNumber,
                                }
                            }
                            hidePortfolioLink
                            hideTooltip
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {result.accountNumber ? 'ID: ' + result.accountNumber : 'Unregistered'}
                    </div>
                </div>
            </Menu.Item>
        })}

        {/* Collection Results */}
        {!onlyAddresses && collectionsResults.length > 0 && <>
            <hr />
            <Typography.Text strong style={{ fontSize: 20 }}>Collections</Typography.Text>
            {collectionsResults.map((result, idx) => {
                return <Menu.Item key={'collection' + idx + result._id} className='dropdown-item' onClick={() => {
                    onSearch(`${result._id.split(':')[0]}`);
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={result.image} style={{ marginRight: 8 }} />
                            {result.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            ID: {result._id.split(':')[0]}
                        </div>
                    </div>
                </Menu.Item>
            })}
        </>}
    </Menu>
}
