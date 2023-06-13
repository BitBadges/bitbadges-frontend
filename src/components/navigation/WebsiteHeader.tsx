import {
  BellOutlined,
  GlobalOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Layout, Menu, Modal, Tooltip, Typography } from 'antd';
import Search from 'antd/lib/input/Search';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useCookies } from 'react-cookie';
import { signOut } from '../../bitbadges-api/api';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';
import { Tabs } from '../navigation/Tabs';
import { CreateTxMsgSendModal } from '../tx-modals/CreateTxMsgSendModal';
import { SearchDropdown } from './SearchDropdown';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';

const { Header } = Layout;
const { Text } = Typography;

export function WalletHeader() {
  const router = useRouter()
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const account = accounts.getAccount(chain.cosmosAddress);

  const [searchValue, setSearchValue] = useState<string>('');
  const [_cookies, _setCookie, removeCookie] = useCookies(['blockincookie']);
  const [visible, setVisible] = useState<boolean>(false);

  const address = chain.address;
  const avatar = account?.avatar;

  const onSearch = async (value: string, isAccount?: boolean) => {
    if (!value) return;

    if (isAccount) {
      router.push('/account/' + value);
    } else {
      router.push('/collections/' + value);
    }

    setSearchValue('');
    Modal.destroyAll()
  };


  const HomeTabMenu = <></>
  const HomeTabWithIcon = { key: '', content: (<Avatar src={<HomeOutlined />} />), subMenuOverlay: HomeTabMenu };
  const HomeTabWithText = { key: '', content: (<>Home</>), subMenuOverlay: HomeTabMenu };

  const BrowseTabMenu = <></>
  const BrowseTabWithIcon = { key: 'browse', content: (<Avatar src={<GlobalOutlined />} />), subMenuOverlay: BrowseTabMenu };
  const BrowseTabWithText = { key: 'browse', content: (<>Browse</>), subMenuOverlay: BrowseTabMenu };

  const MintTabMenu = <></>
  const MintTabWithIcon = { key: 'mint/collection', content: (<Avatar src={<PlusOutlined style={{ fontSize: 18 }} className='primary-text' />} />), subMenuOverlay: MintTabMenu };
  const MintTabWithText = { key: 'mint/collection', content: (<>Mint</>), subMenuOverlay: MintTabMenu };

  let unseenNotificationCount = 0;
  let overflowCount = 10;
  const allActivity = [...(account?.activity ?? []), ...(account?.announcements ?? [])];
  for (const activity of allActivity) {
    if (account?.seenActivity && account.seenActivity < activity.timestamp) {
      unseenNotificationCount++;

      if (unseenNotificationCount > overflowCount) {
        break;
      }
    }
  }

  const NotificationsTabMenu = <></>
  const NotificationsTabWithIcon = {
    key: 'account/notifications', content: (
      <Badge count={unseenNotificationCount} overflowCount={overflowCount}>
        <Avatar src={<BellOutlined style={{ fontSize: 18 }} className='primary-text' />} />
      </Badge>
    ), subMenuOverlay: NotificationsTabMenu
  };

  let signedIn = chain.loggedIn;
  let disabled = false;
  const UserTabMenu = <Menu className='dropdown' style={{ minWidth: 350, alignItems: 'center' }}>
    <div className='flex-center' style={{ marginTop: 10 }}>
      <p>
        <b>{address ? <div>
          <AddressDisplay
            addressOrUsername={address}
            hidePortfolioLink
          />
          {account?.balance ? <>
            <br />
            {account.balance} $BADGE
          </> : ''}

          <br />
          <div className='flex-center full-width' style={{ padding: '10', marginTop: 8 }}>
            <Tooltip
              title={<div style={{ textAlign: 'center' }}> {'Send $BADGE'}</div>}
              placement='bottom'
              style={{ textAlign: 'center' }}
            >
              <div style={{ minWidth: 75 }}>
                <Avatar
                  style={{
                    marginBottom: 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 20,
                    padding: 0,
                    margin: 0,
                    alignItems: 'center',

                  }}
                  size="large"
                  onClick={disabled ? () => { } : () => { setVisible(true) }}
                  className="screen-button-normal"
                >
                  <SwapOutlined />
                </Avatar>
                <div style={{ marginTop: 3 }}>
                  <Text>
                    Send $BADGE
                  </Text>
                </div>
              </div>
            </Tooltip>
          </div>
        </div>
          : `Not Connected`}
        </b>

      </p>
    </div>

    <hr />
    {!address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Connect and Sign-In</Menu.Item>}
    {address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Sign In</Menu.Item>}

    {address && <>
      <Menu.Item className='dropdown-item' onClick={() => router.push('/account/' + address)}>Portfolio</Menu.Item>
    </>}
    {address && <>
      <Menu.Item className='dropdown-item' onClick={() => router.push('/account/' + address + '/settings')}>Account Settings</Menu.Item>
    </>}

    {address && !signedIn && <Menu.Item className='dropdown-item' onClick={() => chain.disconnect()}>Disconnect</Menu.Item>}
    {address && signedIn && <>
      {/* <Menu.Item className='dropdown-item'>Sign Out</Menu.Item> */}
      <Menu.Item className='dropdown-item' onClick={() => {
        chain.disconnect();
        signOut();
        chain.setLoggedIn(false);
        removeCookie('blockincookie');
      }}>Disconnect and Sign Out</Menu.Item>
    </>}
  </Menu>

  const UserTab = {
    key: `popup-user`,
    content: (
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {!address ? (
          <Avatar src={<UserOutlined style={{ fontSize: 18 }} className='primary-text' size={40} />} />
        ) : (
          <Avatar src={
            <BlockiesAvatar
              fontSize={40}
              shape='circle'
              avatar={avatar}
              address={address.toLowerCase()}
            />

          }
            size={40}
          />
        )}
      </div>
    ),
    subMenuOverlay: UserTabMenu,
    subMenuTrigger: ['hover', 'click']
  };

  const SearchBar = <Search
    defaultValue=""
    placeholder="Enter an Address, Username, or Collection Name"
    onSearch={async (value) => {
      onSearch(value, true);
    }}
    value={searchValue}
    onChange={async (e) => {
      setSearchValue(e.target.value);
    }}
    enterButton
    allowClear
    size="large"
  />;

  const ExpandedSearchBar = <>
    <Dropdown
      open={searchValue !== ''}
      placement="bottom"
      overlay={<SearchDropdown searchValue={searchValue} onSearch={onSearch} />}
      trigger={['hover', 'click']}
    >
      {SearchBar}
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
          width: '100%',
        }}
      >
        {ExpandedSearchBar}
      </div>
    ),
  }

  //It's a little confusing but when "navbar-expanded" is visible, the "navbar-collapsed" is hidden and vice versa
  return (
    <>
      <Header className="App-header">
        <div onClick={() => router.push('/')}>
          <div className="navbar-super-collapsed">
            <Image
              src={'/images/bitbadgeslogo.png'}
              className="App-logo"
              alt="logo"
              height={"60px"}
              width={"60px"}
              quality={100}
            />
            <Typography className='App-title'>
              BitBadges
            </Typography>
          </div>
        </div>

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
              if (e.startsWith('popup-')) {
                return;
              }
              router.push(`/${e}`)
            }}
            noSelectedKeys
            tabInfo={[
              HomeTabWithText,
              BrowseTabWithText,
              MintTabWithText,
              NotificationsTabWithIcon,
              UserTab
            ]}
          />
        </div>

        <div className="navbar-collapsed">
          <Tabs
            tab=''
            setTab={(e) => {
              if (e.startsWith('popup-')) {
                return;
              }
              router.push(`/${e}`)
            }}
            noSelectedKeys
            tabInfo={[
              HomeTabWithIcon,
              CollapsedSearchIconTab,
              BrowseTabWithIcon,
              MintTabWithIcon,
              NotificationsTabWithIcon,
              UserTab,
            ]}
          />
        </div>
      </Header>
      <CreateTxMsgSendModal
        visible={visible}
        setVisible={setVisible}
      />
    </>
  );
}
