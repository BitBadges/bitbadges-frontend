
import { Avatar, Layout, Menu, Select, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../accounts/AccountsContext';
import { getSearchResults } from '../../bitbadges-api/api';
import { getChainForAddress, isAddressValid } from '../../bitbadges-api/chains';
import { BadgeMetadata, BitBadgesUserInfo, CosmosAccountInformation, SupportedChain } from '../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../bitbadges-api/users';
import { useChainContext } from '../../chain/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';

const { Header } = Layout;
const { Option } = Select;

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
    const [accountsResults, setAccountsResults] = useState<BitBadgesUserInfo[]>([]);
    const [collectionsResults, setCollectionsResults] = useState<BadgeMetadata[]>([]);

    useEffect(() => {
        const updateSearchValue = async (value: string) => {
            accounts.fetchAccounts([value]);
            const results = await getSearchResults(value);
            await accounts.fetchAccounts(results.accounts.map((result: CosmosAccountInformation) => result.address));
            setAccountsResults(results.accounts.map((result: CosmosAccountInformation) => convertToBitBadgesUserInfo(result)));
            setCollectionsResults(results.collections);

            console.log("SEARCH RESULTS", results);
        }
        updateSearchValue(searchValue);
    }, [searchValue, accounts]);



    return <Menu className='dropdown'>
        <Typography.Text strong style={{ fontSize: 20 }}>Accounts</Typography.Text>
        {!accountsResults.find((result: BitBadgesUserInfo) => result.address === searchValue) &&
            <Menu.Item className='dropdown-item' disabled={true} style={{ cursor: 'disabled' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <AddressDisplay
                            userInfo={{
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
        {!onlyAddresses && collectionsResults.length > 0 && <>
            <hr />
            <Typography.Text strong style={{ fontSize: 20 }}>Collections</Typography.Text>
            {collectionsResults.map((result: BadgeMetadata, idx) => {
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
