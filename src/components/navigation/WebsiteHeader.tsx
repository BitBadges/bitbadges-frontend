import {
  BlockOutlined,
  GlobalOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Layout, Menu, Modal, Tooltip, Typography } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useCookies } from 'react-cookie';
import { signOut } from '../../bitbadges-api/api';

import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';
import { Tabs } from '../navigation/Tabs';
import { CreateTxMsgSendModal } from '../tx-modals/CreateTxMsgSendModal';
import { SearchDropdown } from './SearchDropdown';
import { useStatusContext } from '../../bitbadges-api/contexts/StatusContext';

const { Header } = Layout;
const { Text } = Typography;

export function WalletHeader() {
  const router = useRouter()
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const account = accounts.getAccount(chain.address);
  const status = useStatusContext();

  const [searchValue, setSearchValue] = useState<string>('');
  const [_cookies, _setCookie] = useCookies(['blockincookie']);
  const [visible, setVisible] = useState<boolean>(false);

  const address = chain.address;
  const avatar = account?.profilePicUrl ?? account?.avatar;

  const onSearch = async (value: string | BitBadgesUserInfo<bigint>, isAccount?: boolean, isCollection?: boolean, isBadge?: boolean) => {

    if (isAccount && typeof value !== "string") {
      router.push('/account/' + value.address);
    } else if (isCollection || isBadge) {
      router.push('/collections/' + value);
    } else {
      router.push('/addresses/' + value);
    }

    setSearchValue('');
    Modal.destroyAll()
  };


  const HomeTabMenu = <></>
  const HomeTabWithIcon = { key: '', content: (<Avatar src={<HomeOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className='primary-text' />} />), subMenuOverlay: HomeTabMenu };
  const HomeTabWithText = { key: '', content: (<Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>Home</Typography.Text>), subMenuOverlay: HomeTabMenu };

  const BrowseTabMenu = <></>
  const BrowseTabWithIcon = { key: 'browse', content: (<Avatar src={<GlobalOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className='primary-text' />} />), subMenuOverlay: BrowseTabMenu };
  const BrowseTabWithText = { key: 'browse', content: (<Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>Browse</Typography.Text>), subMenuOverlay: BrowseTabMenu };

  const MintTabMenu = <></>
  const MintTabWithIcon = { key: 'collections/mint', content: (<Avatar src={<PlusOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className='primary-text' />} />), subMenuOverlay: MintTabMenu };
  const MintTabWithText = { key: 'collections/mint', content: (<Typography.Text strong className='primary-text' style={{ fontSize: 18, fontWeight: 'bold' }}>Mint</Typography.Text>), subMenuOverlay: MintTabMenu };

  //Calculate number of unseen notifications
  let unseenNotificationCount = 0;
  let overflowCount = 10;
  const allActivity = [...(account?.activity ?? []), ...(account?.announcements ?? [])];
  const claimAlerts = account?.claimAlerts ?? [];
  for (const activity of allActivity) {
    if (account?.seenActivity && account.seenActivity < activity.timestamp) {
      unseenNotificationCount++;

      if (unseenNotificationCount > overflowCount) {
        break;
      }
    }
  }

  for (const addressMapping of account?.addressMappings ?? []) {
    if (account?.seenActivity && account.seenActivity < addressMapping.lastUpdated) {
      unseenNotificationCount++;

      if (unseenNotificationCount > overflowCount) {
        break;
      }
    }
  }

  for (const claimAlert of claimAlerts) {
    if (account?.seenActivity && account.seenActivity < claimAlert.createdTimestamp) {
      unseenNotificationCount++;

      if (unseenNotificationCount > overflowCount) {
        break;
      }
    }
  }


  let signedIn = chain.loggedIn;
  let connected = chain.connected;
  let disabled = false;
  const UserTabMenu = <Menu theme='dark' className='dropdown' style={{ minWidth: 350, alignItems: 'center', border: '1px solid gray', borderRadius: 8, marginTop: 8, marginRight: 10, overflow: 'hidden' }}>
    <div className='flex-center primary-text primary-blue-bg' style={{ marginTop: 10 }}>
      <p>
        <b>{address ? <div className='primary-text'>
          <AddressDisplay
            addressOrUsername={address}
            hidePortfolioLink
          />

          {account?.balance?.amount ? <>
            <br />
            {account.balance?.amount.toString()} $BADGE
          </> : ''}

          <br />
          <div className='flex-center full-width' style={{ padding: '10', marginTop: 8 }}>
            <Tooltip
              title={<div style={{ textAlign: 'center' }}> {'Send $BADGE'}</div>}
              placement='bottom'
              style={{ textAlign: 'center' }}
            >
              <div style={{ minWidth: 75 }} className='primary-text'>
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
                  className="styled-button"
                >
                  <SwapOutlined />
                </Avatar>
                <div style={{ marginTop: 3 }}>
                  <Text strong className='primary-text'>
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
    <div className='flex-center full-width primary-text' style={{ padding: '10', marginTop: 8 }}>
      <BlockOutlined style={{ marginRight: 4 }} /> <b>Block #{status.status.block.height.toString()} ({new Date(Number(status.status.block.timestamp)).toLocaleString()})</b>
      <Tooltip title="Data is provided by the BitBadges API. The API has processed up to this block. ">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </div>

    <hr />
    {connected &&
      <Menu.Item style={{ alignItems: 'center' }} className='dropdown-item' onClick={() => router.push('/account/notifications')}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }} >
          Notifications{'      '}
          {overflowCount > 0 && unseenNotificationCount > 0 && <Badge style={{ marginLeft: 6 }} count={unseenNotificationCount} overflowCount={overflowCount}>
            {/* <BellOutlined /> */}
          </Badge>}
        </div>
      </Menu.Item>
    }

    {!connected && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Connect and Sign-In</Menu.Item>}
    {connected && !signedIn && <Menu.Item className='dropdown-item' onClick={() => router.push('/connect')}>Sign In</Menu.Item>}

    {connected && <>
      <Menu.Item className='dropdown-item' onClick={() => router.push('/account/' + address)}>Portfolio</Menu.Item>
    </>}
    {connected && <>
      <Menu.Item className='dropdown-item' onClick={() => router.push('/account/' + address + '/settings')}>Account Settings</Menu.Item>
    </>}

    {connected && !signedIn && <Menu.Item className='dropdown-item' onClick={() => chain.disconnect()}>Disconnect</Menu.Item>}
    {connected && signedIn && <>
      {/* <Menu.Item className='dropdown-item'>Sign Out</Menu.Item> */}
      <Menu.Item className='dropdown-item' onClick={() => {
        chain.disconnect();
        signOut();
        chain.setLoggedIn(false);
        _setCookie('blockincookie', '', { path: '/' });
      }}>Disconnect and Sign Out</Menu.Item>
    </>}
  </Menu>

  const UserTab = {
    key: `popup-user`,
    content: (
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {!address ? (
          <Avatar src={<UserOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className='primary-text' size={40} />} />
        ) : (
          <Badge count={unseenNotificationCount} overflowCount={overflowCount}>
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
          </Badge>
        )}
      </div>
    ),
    subMenuOverlay: UserTabMenu,
    subMenuTrigger: ['hover', 'click']
  };

  const SearchBar = <Input
    defaultValue=""
    placeholder="Enter an Address, Username, List, Badge, or Collection"
    // onSearch={async (value) => {
    //   onSearch(value, true);
    // }}
    value={searchValue}
    onChange={async (e) => {
      setSearchValue(e.target.value);
    }}
    // style={{ marginLeft: 10, marginRight: 10 }}
    className='form-input'
    // enterButton
    size='large'
  />;

  const ExpandedSearchBar = <>
    <Dropdown
      open={searchValue !== ''}
      placement="bottom"
      overlay={
        <SearchDropdown searchValue={searchValue} onSearch={onSearch} />
      }
      overlayClassName='primary-text primary-blue-bg'
      className='primary-blue-bg'
      trigger={['hover', 'click']}
    >
      {SearchBar}
    </Dropdown >
  </>

  const CollapsedSearchIconTab = {
    key: 'search',
    content: <Avatar src={<SearchOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className='primary-text' />} />,
    onClick: () => {
      // console.log('Do Nothing');
    },
    popoverContent: (
      <>
        {ExpandedSearchBar}
      </>
    ),
  }

  //It's a little confusing but when "navbar-expanded" is visible, the "navbar-collapsed" is hidden and vice versa
  return (
    <>
      <Header className="App-header " style={{ zIndex: 49 }} >
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
              // NotificationsTabWithIcon,
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
              // NotificationsTabWithIcon,
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
