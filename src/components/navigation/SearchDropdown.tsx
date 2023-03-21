
import { Avatar, Menu, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getSearchResults } from '../../bitbadges-api/api';
import { convertToCosmosAddress, isAddressValid } from '../../bitbadges-api/chains';
import { BadgeMetadata, BitBadgesUserInfo, CosmosAccountInformation, SupportedChain } from '../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../bitbadges-api/users';
import { useAccountsContext } from '../../contexts/AccountsContext';
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
    const { setAccounts, cosmosAddressesByAccountNames, accounts, cosmosAddresses } = useAccountsContext();
    const [accountsResults, setAccountsResults] = useState<BitBadgesUserInfo[]>([]);
    const [collectionsResults, setCollectionsResults] = useState<((BadgeMetadata & { _id: string }))[]>([]);
    const [loading, setLoading] = useState<boolean>(false);


    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!searchValue) return

            setLoading(true);
            setAccountsResults([]);
            setCollectionsResults([]);
            const results = await getSearchResults(searchValue);
            setAccounts(results.accounts);

            const accountsToSet = [];
            accountsToSet.push(...results.accounts.map((result: CosmosAccountInformation) => convertToBitBadgesUserInfo(result)));
            setAccountsResults(accountsToSet);
            setCollectionsResults(results.collections);
            setLoading(false);
        }, 300)

        return () => clearTimeout(delayDebounceFn)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValue])



    return <Menu className='dropdown' onKeyDown={(e) => {
        if (e.key === '') {
            onSearch(searchValue);
        }
    }}>

        <Typography.Text strong style={{ fontSize: 20 }}>Accounts</Typography.Text>

        {/* Current Search Value Address Helper */}
        {!accountsResults.find((result: BitBadgesUserInfo) => result.address === searchValue || result.name === searchValue) &&
            <Menu.Item className='dropdown-item' disabled={!cosmosAddressesByAccountNames[searchValue] && !isAddressValid(searchValue)} style={{ cursor: 'disabled' }} onClick={() => {
                cosmosAddressesByAccountNames[searchValue] ?
                    onSearch(cosmosAddressesByAccountNames[searchValue]) :
                    onSearch(searchValue);
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AddressDisplay
                            userInfo={cosmosAddressesByAccountNames[searchValue] ?
                                accounts[cosmosAddressesByAccountNames[searchValue]] :
                                {
                                    address: searchValue,
                                    cosmosAddress: convertToCosmosAddress(searchValue),
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

        {loading && <Menu.Item className='dropdown-item' disabled style={{ cursor: 'disabled' }}>
            <Spin size={'large'} />
        </Menu.Item>}

        {/* {Account Results} */}
        {accountsResults.map((result: BitBadgesUserInfo, idx) => {
            return <Menu.Item key={idx} className='dropdown-item' onClick={() => {
                onSearch(result.address);
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AddressDisplay
                            userInfo={result.name && cosmosAddressesByAccountNames[result.name] ?
                                accounts[cosmosAddressesByAccountNames[result.name]] :
                                accounts[cosmosAddresses[result.address]]
                            }
                            hidePortfolioLink
                            hideTooltip
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {result.accountNumber && result.accountNumber >= 0 ? 'ID: ' + result.accountNumber : 'Unregistered'}
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
