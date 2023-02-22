import Search from 'antd/lib/input/Search';

import {
    GlobalOutlined,
    HomeOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Select, Typography } from 'antd';
import { ethers } from 'ethers';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Blockies from 'react-blockies';
import { useAccountsContext } from '../../accounts/AccountsContext';
import { getSearchResults } from '../../bitbadges-api/api';
import { getAbbreviatedAddress, isAddressValid } from '../../bitbadges-api/chains';
import { useChainContext } from '../../chain/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { Tabs } from './Tabs';
import { BadgeMetadata, BitBadgesUserInfo, CosmosAccountInformation, SupportedChain } from '../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../bitbadges-api/users';
import { PRIMARY_BLUE, SECONDARY_BLUE, TERTIARY_BLUE } from '../../constants';
import { SearchDropdown } from './SearchDropdown';

const { Header } = Layout;
const { Option } = Select;

export function WalletHeader() {
    const router = useRouter()
    const chain = useChainContext();
    const accounts = useAccountsContext();

    const [searchValue, setSearchValue] = useState<string>('');

    const address = chain.address;

    const onSearch = async (value: string) => {
        if (!value) return;

        if (ethers.utils.isAddress(value)) {
            router.push('/account/' + value);
        } else {
            router.push('/collections/' + value);
        }

        setSearchValue('');
    };


    const HomeTabMenu = <></>
    const HomeTabWithIcon = { key: '', content: (<Avatar src={<HomeOutlined />} />), subMenuOverlay: HomeTabMenu };
    const HomeTabWithText = { key: '', content: (<>Home</>), subMenuOverlay: HomeTabMenu };

    const BrowseTabMenu = <></>
    const BrowseTabWithIcon = { key: 'browse', content: (<Avatar src={<GlobalOutlined />} />), subMenuOverlay: BrowseTabMenu };
    const BrowseTabWithText = { key: 'browse', content: (<>Browse</>), subMenuOverlay: BrowseTabMenu };

    const MintTabMenu = <></>
    const MintTabWithIcon = { key: 'mint/collection', content: (<Avatar src={<PlusOutlined />} />), subMenuOverlay: MintTabMenu };
    const MintTabWithText = { key: 'mint/collection', content: (<>Mint</>), subMenuOverlay: MintTabMenu };


    //Connect and sign-in if nothing
    let signedIn = false; //Placeholder TODO:
    const UserTabMenu = <Menu className='dropdown' style={{ minWidth: 350, alignItems: 'center' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            <p><b>{address ? <AddressDisplay
                userInfo={{
                    address: chain.address,
                    cosmosAddress: chain.cosmosAddress,
                    accountNumber: chain.accountNumber,
                    chain: chain.chain,
                }}
                hidePortfolioLink
            /> : `Not Connected / Not Signed In`}</b></p>
        </div>
        <hr />

        {!address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Connect and Sign-In</Menu.Item>}
        {address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Sign In</Menu.Item>}

        {address && <>
            <Menu.Item className='dropdown-item' onClick={() => router.push('/account/' + address)}>Portfolio</Menu.Item>
            {/* <Menu.Item className='dropdown-item'>Settings</Menu.Item> */}
        </>}

        {/* onClicks */}
        {/* TODO: sign outs */}
        {address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => chain.disconnect()}>Disconnect</Menu.Item>}
        {address && signedIn && <>
            <Menu.Item className='dropdown-item'>Sign Out</Menu.Item>
            <Menu.Item className='dropdown-item' onClick={() => chain.disconnect()}>Disconnect and Sign Out</Menu.Item>
        </>}
    </Menu>

    const UserTab = {
        key: !address ? 'connect' : `account/${address}`,
        content: (
            <>
                {!address ? (
                    <Avatar src={<UserOutlined />} />
                ) : (
                    <Avatar
                        src={
                            <Blockies
                                seed={address.toLowerCase()}
                            />
                        }
                    />
                )}
            </>
        ),
        subMenuOverlay: UserTabMenu,
    };

    const ExpandedSearchBar = <>
        <Dropdown
            open={searchValue !== ''}
            placement="bottom"
            overlay={<SearchDropdown searchValue={searchValue} onSearch={onSearch} />}
            trigger={['hover', 'click']}
        // key={`${tab.key}`}
        >
            <Search
                defaultValue=""
                placeholder="Enter an Address, Collection Name, or Collection ID Number"
                onSearch={onSearch}
                value={searchValue}
                onChange={async (e) => {
                    setSearchValue(e.target.value);
                }}
                enterButton
                allowClear
                size="large"
            />
        </Dropdown >

    </>



    const CollapsedSearchIconTab = {
        key: 'search',
        content: <Avatar src={<SearchOutlined />} />,
        onClick: () => {
            console.log('Do Nothing');
        },
        popoverContent: (
            <div
                style={{
                    backgroundColor: 'white',
                    width: '85vw',
                }}
            >
                <Search
                    addonBefore={
                        <Select defaultValue={'eth'}>
                            <Option value="eth">ETH</Option>
                        </Select>
                    }
                    style={{
                        width: '100%',
                        padding: 8,
                    }}
                    defaultValue=""
                    placeholder="Enter Address (0x....)"
                    onSearch={onSearch}
                    enterButton
                    allowClear
                    size="large"
                />
            </div>
        ),
    }

    return (
        <Header className="App-header">
            <Link href="" passHref>
                <div className="navbar-super-collapsed">
                    <Image
                        src={'/images/bitbadgeslogo.png'}
                        className="App-logo"
                        alt="logo"
                        height={"65%"}
                        width={"65%"}
                    />
                    <Typography className='App-title'>
                        BitBadges
                    </Typography>
                </div>
            </Link>

            <div className="navbar-expanded"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '50%',
                }}
            >
                {ExpandedSearchBar}
            </div>
            <div
                className="navbar-expanded"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'end',
                }}
            >
                <Tabs
                    tab=''
                    setTab={(e) => {
                        router.push(`/${e}`)
                    }}
                    noSelectedKeys
                    tabInfo={[
                        HomeTabWithText,
                        BrowseTabWithText,
                        MintTabWithText,
                        UserTab,
                    ]}
                />
            </div>
            <div className="navbar-collapsed">
                <Tabs
                    tab=''
                    setTab={(e) => {
                        router.push(`/${e}`)
                    }}
                    noSelectedKeys
                    tabInfo={[
                        HomeTabWithIcon,
                        CollapsedSearchIconTab,
                        BrowseTabWithIcon,
                        MintTabWithIcon,
                        UserTab,
                    ]}
                />
            </div>
        </Header>
    );
}
