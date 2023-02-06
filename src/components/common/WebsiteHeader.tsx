import Search from 'antd/lib/input/Search';

import { Tabs } from './Tabs';
import Blockies from 'react-blockies';
import {
    GlobalOutlined,
    HomeOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Typography, Layout, Select, message, Avatar, Menu, Tooltip } from 'antd';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';
import { useChainContext } from '../../chain/ChainContext';
import { ethers } from 'ethers';

const { Header } = Layout;
const { Option } = Select;

export function WalletHeader() {
    const router = useRouter()
    const chain = useChainContext();

    const address = chain.address;

    const onSearch = async (value: string) => {
        //TODO: give them options to search for a badge or a user
        if (!value) return;

        if (ethers.utils.isAddress(value)) {
            router.push('/user/ETH:' + value);
        }


        router.push('/collections/' + value);
    };

    const HomeTabMenu = <></>
    const HomeTabWithIcon = { key: '', content: (<Avatar src={<HomeOutlined />} />), subMenuOverlay: HomeTabMenu };
    const HomeTabWithText = { key: '', content: (<>Home</>), subMenuOverlay: HomeTabMenu };

    const BrowseTabMenu = <Menu className='dropdown'><Menu.Item className="dropdown-item">All</Menu.Item><Menu.Item className="dropdown-item">Category 1</Menu.Item></Menu>
    const BrowseTabWithIcon = { key: 'browse', content: (<Avatar src={<GlobalOutlined />} />), subMenuOverlay: BrowseTabMenu };
    const BrowseTabWithText = { key: 'browse', content: (<>Browse</>), subMenuOverlay: BrowseTabMenu };

    const MintTabMenu = <></>
    const MintTabWithIcon = { key: 'mint/collection', content: (<Avatar src={<PlusOutlined />} />), subMenuOverlay: MintTabMenu };
    const MintTabWithText = { key: 'mint/collection', content: (<>Mint</>), subMenuOverlay: MintTabMenu };

    //TODO: Blockin Connect / Sign-In
    //TODO: Add Chain Img if signed In

    //Connect and sign-in if nothing
    let signedIn = false; //Placeholder TODO:
    const UserTabMenu = <Menu className='dropdown'>

        <p><b>{address ? `Connected as: ${getAbbreviatedAddress(address)} Signed In` : `Not Connected / Not Signed In`}</b></p>
        <hr />

        {!address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Connect and Sign-In</Menu.Item>}
        {address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Sign In</Menu.Item>}

        {address && <>
            <Menu.Item className='dropdown-item'>Portfolio</Menu.Item>
            <Menu.Item className='dropdown-item'>Settings</Menu.Item>
        </>}

        {/* onClicks */}
        {address && !signedIn && <Menu.Item className='dropdown-item'>Disconnect</Menu.Item>}
        {address && signedIn && <>
            <Menu.Item className='dropdown-item'>Sign Out</Menu.Item>
            <Menu.Item className='dropdown-item'>Disconnect and Sign Out</Menu.Item>
        </>}
    </Menu>

    const UserTab = {
        key: 'account', content: (
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

    const ExpandedSearchBar = <Search
        defaultValue="0xe00dD9D317573f7B4868D8f2578C65544B153A27"
        placeholder="Enter an Address, Username, or Badge ID Number"
        onSearch={onSearch}
        enterButton
        allowClear
        size="large"
    />

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
                    defaultValue="0xe00dD9D317573f7B4868D8f2578C65544B153A27"
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
