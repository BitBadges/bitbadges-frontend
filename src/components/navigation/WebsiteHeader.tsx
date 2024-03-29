import { BlockOutlined, GlobalOutlined, HomeOutlined, PlusOutlined, SearchOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Layout, Menu, Modal, Tooltip, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useCookies } from 'react-cookie';
import { signOut } from '../../bitbadges-api/api';

import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../../bitbadges-api/contexts/StatusContext';

import { getAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import DarkModeSwitcher from '../DarkModeSwitcher';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';
import { Tabs } from '../navigation/Tabs';
import { CreateTxMsgSendModal } from '../tx-modals/CreateTxMsgSendModal';
import { SearchDropdown } from './SearchDropdown';
import { useWeb2Context } from '../../bitbadges-api/contexts/chains/Web2Context';

const { Header } = Layout;
const { Text } = Typography;

export function WalletHeader() {
  const router = useRouter();
  const chain = useChainContext();
  const web2Context = useWeb2Context();

  const account = useAccount(chain.address);
  const status = useStatusContext();

  const [searchValue, setSearchValue] = useState<string>('');
  const [, setCookie] = useCookies(['blockincookie']);
  const [visible, setVisible] = useState<boolean>(false);
  const [searchIsVisible, setSearchIsVisible] = useState<boolean>(false);

  const address = chain.address;
  const avatar = account?.profilePicUrl ?? account?.avatar;

  const onSearch = async (value: string, isAccount?: boolean, isCollection?: boolean, isBadge?: boolean) => {
    if (isAccount) {
      const account = getAccount(value);
      await router.push('/account/' + account?.address);
    } else if (isCollection || isBadge) {
      await router.push('/collections/' + value);
    } else {
      await router.push('/lists/' + value);
    }

    setSearchValue('');
    Modal.destroyAll();

    setSearchIsVisible(false);
  };

  const HomeTabMenu = <></>;
  const HomeTabWithIcon = {
    key: '',
    content: (
      <Avatar
        className="flex-center"
        style={{ height: 72 }}
        src={<HomeOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" />}
      />
    ),
    subMenuOverlay: HomeTabMenu
  };

  const BrowseTabMenu = <></>;
  const BrowseTabWithIcon = {
    key: 'browse',
    content: (
      <Avatar
        className="flex-center"
        style={{ height: 72 }}
        src={<GlobalOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" />}
      />
    ),
    subMenuOverlay: BrowseTabMenu
  };

  const BrowseTabWithText = {
    key: 'browse',
    content: (
      <Typography.Text className="primary-text flex-center" style={{ fontSize: 18, height: 72, fontWeight: 'bold' }}>
        Browse
      </Typography.Text>
    ),
    subMenuOverlay: BrowseTabMenu
  };

  const MintTabMenu = <></>;
  const MintTabWithIcon = {
    key: 'collections/mint',
    content: (
      <Avatar
        className="flex-center"
        style={{ height: 72 }}
        src={<PlusOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" />}
      />
    ),
    subMenuOverlay: MintTabMenu
  };
  const MintTabWithText = {
    key: 'collections/mint',
    content: (
      <Typography.Text className="primary-text flex-center" style={{ fontSize: 18, height: 72, fontWeight: 'bold' }}>
        Create
      </Typography.Text>
    ),
    subMenuOverlay: MintTabMenu
  };

  //Calculate number of unseen notifications
  let unseenNotificationCount = 0;
  const overflowCount = 10;
  const allActivity = [...(account?.activity ?? []), ...(account?.listsActivity ?? []), ...(account?.claimAlerts ?? [])];
  const seenActivity = account?.seenActivity || 1n;
  const firstLoadCutoff = chain.lastSeenActivity;

  if (chain.loggedIn) {
    for (const activity of allActivity) {
      if (seenActivity && seenActivity < activity.timestamp && activity.timestamp < firstLoadCutoff) {
        unseenNotificationCount++;
      }

      if (unseenNotificationCount > overflowCount) {
        break;
      }
    }
  }

  const signedIn = chain.loggedIn;
  const connected = chain.connected;
  const disabled = false;
  const UserTabMenu = (
    <Menu
      theme="dark"
      className="dropdown primary-text bg-slate-950 border-0 rounded-xl"
      style={{
        minWidth: 350,
        alignItems: 'center',
        border: '1px solid gray',
        marginTop: 8,
        marginRight: 10,
        overflow: 'hidden'
      }}>
      <div className="dark flex-center primary-text inherit-bg" style={{ marginTop: 10 }}>
        {address ? (
          <div className="primary-text">
            <AddressDisplay addressOrUsername={address} hidePortfolioLink />
            <br />
            {(account?.balance?.amount ?? '0').toString()} $BADGE
            <br />
            <div className="flex-center full-width" style={{ padding: '10', marginTop: 8 }}>
              <Tooltip title={<div style={{ textAlign: 'center' }}> {'Send $BADGE'}</div>} placement="bottom" style={{ textAlign: 'center' }}>
                <div style={{ minWidth: 75 }} className="primary-text">
                  <Avatar
                    style={{
                      marginBottom: 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: 20,
                      padding: 0,
                      margin: 0,
                      alignItems: 'center'
                    }}
                    size="large"
                    onClick={
                      disabled
                        ? () => {}
                        : () => {
                            setVisible(true);
                          }
                    }
                    className="styled-button-normal">
                    <SwapOutlined />
                  </Avatar>
                  <div style={{ marginTop: 3 }}>
                    <Text strong className="primary-text">
                      Send $BADGE
                    </Text>
                  </div>
                </div>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="dark primary-text">{`Not Connected`}</div>
        )}
      </div>
      <div className="dark">
        <div className="flex-center full-width primary-text my-3" style={{ padding: '10' }}>
          <BlockOutlined style={{ marginRight: 4 }} /> Block #{status.status.block.height.toString()} (
          {new Date(Number(status.status.block.timestamp)).toLocaleString()})
        </div>
      </div>

      {connected && (
        <Menu.Item
          style={{ alignItems: 'center' }}
          className="dropdown-item text-sm text-vivid-blue"
          onClick={async () => await router.push('/account/notifications')}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            Notifications{'      '}
            {overflowCount > 0 && unseenNotificationCount > 0 && (
              <Badge style={{ marginLeft: 6 }} count={unseenNotificationCount} overflowCount={overflowCount}>
                {/* <BellFilled /> */}
              </Badge>
            )}
          </div>
        </Menu.Item>
      )}

      {connected && (
        <>
          <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/account/' + 'watchlist')}>
            Watchlist
          </Menu.Item>
        </>
      )}
      {connected && (
        <>
          <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/account/' + address)}>
            Portfolio
          </Menu.Item>
        </>
      )}
      {
        <>
          <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/account/codes')}>
            Authentication Codes
          </Menu.Item>
        </>
      }
      {connected && (
        <>
          <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/account/' + address + '/settings')}>
            Account Settings
          </Menu.Item>
        </>
      )}

      <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={() => {}}>
        <div className="flex-center">
          <div className="mx-2">{'Dark Mode'}</div>
          <DarkModeSwitcher />
        </div>
      </Menu.Item>

      {!connected && (
        <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/connect')}>
          Connect and Sign-In
        </Menu.Item>
      )}
      {connected && !signedIn && (
        <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await router.push('/connect')}>
          Sign In
        </Menu.Item>
      )}

      {connected && !signedIn && (
        <Menu.Item className="dropdown-item text-sm text-vivid-blue" onClick={async () => await chain.disconnect()}>
          Disconnect
        </Menu.Item>
      )}
      {connected && signedIn && (
        <>
          <Menu.Item
            className="dropdown-item text-sm text-vivid-blue"
            onClick={() => {
              signOut({ signOutBlockin: true, signOutDiscord: true, signOutTwitter: true, signOutGithub: true, signOutGoogle: true });
              setCookie('blockincookie', '', { path: '/' });
              web2Context.setDiscord({ username: '', discriminator: '', id: '' });
            }}>
            Sign Out
          </Menu.Item>
        </>
      )}
      {connected && signedIn && (
        <>
          <Menu.Item
            className="dropdown-item text-sm text-vivid-blue"
            onClick={() => {
              signOut({ signOutBlockin: true, signOutDiscord: true, signOutTwitter: true, signOutGithub: true, signOutGoogle: true });
              setCookie('blockincookie', '', { path: '/' });
              chain.disconnect();
              web2Context.setDiscord({ username: '', discriminator: '', id: '' });
            }}>
            Disconnect and Sign Out
            {chain.loggedInExpiration > 0 ? (
              <div className="secondary-text text-xs my-1">Logged in until {new Date(chain.loggedInExpiration).toLocaleString()}</div>
            ) : (
              ''
            )}
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  const UserTab = {
    key: `popup-user`,
    content: (
      <>
        {!address ? (
          <Avatar
            className="flex-center"
            style={{ height: 72 }}
            src={<UserOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" size={40} />}
          />
        ) : (
          <div className="flex-center" style={{ height: 72 }}>
            <>
              {/* AntD Badge, not BitBadge */}
              <Badge count={unseenNotificationCount} overflowCount={overflowCount}>
                <BlockiesAvatar fontSize={40} avatar={avatar} address={address.toLowerCase()} />
              </Badge>
            </>
          </div>
        )}
      </>
    ),
    subMenuOverlay: UserTabMenu,
    subMenuTrigger: ['hover', 'click']
  };

  const SearchBar = (
    <Input
      defaultValue=""
      placeholder="Enter an Address, Username, List, Badge, or Collection"
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value);
      }}
      className="form-input inherit-bg"
      size="large"
      prefix={<SearchOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" />}
    />
  );

  const ExpandedSearchBar = (
    <>
      <Dropdown
        open={searchValue !== ''}
        placement="bottom"
        overlay={<SearchDropdown searchValue={searchValue} onSearch={onSearch} />}
        overlayClassName="primary-text inherit-bg"
        className="primary-blue-bg rounded border border-blue-black-50 focus:border-blue-black-50 hover:border-blue-black-50"
        trigger={['hover', 'click']}>
        {SearchBar}
      </Dropdown>
    </>
  );

  const CollapsedSearchIconTab = {
    key: 'search',
    content: (
      <Avatar
        className="flex-center"
        style={{ height: 72 }}
        src={<SearchOutlined style={{ fontSize: 22, fontWeight: 'bold' }} className="primary-text" />}
      />
    ),
    onClick: () => {
      setSearchIsVisible(!searchIsVisible);
    }
  };

  //It's a little confusing but when "navbar-expanded" is visible, the "navbar-collapsed" ais hidden and vice versa
  return (
    <>
      <Header className="dark App-header bg-slate-950" style={{ zIndex: 49 }}>
        <div className="flex-between flex-center-if-mobile">
          <div onClick={async () => await router.push('/')}>
            <div className="navbar-super-collapsed ml-3">
              <img src={'/images/bitbadgeslogo.png'} className="" alt="logo" height={60} width={60} />
              <Typography className="App-title">BitBadges</Typography>
            </div>
          </div>

          <div
            className="navbar-expanded"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '50%'
            }}>
            {ExpandedSearchBar}
          </div>
          <div
            className="navbar-expanded"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'end'
            }}>
            <Tabs
              tab=""
              setTab={(e) => {
                if (e.startsWith('popup-')) {
                  return;
                }
                router.push(`/${e}`);
              }}
              noSelectedKeys
              tabInfo={[BrowseTabWithText, MintTabWithText, UserTab]}
            />
          </div>

          <div className={searchIsVisible ? 'navbar-collapsed with-search' : 'navbar-collapsed'}>
            <Tabs
              tab=""
              setTab={(e) => {
                if (e.startsWith('popup-')) {
                  return;
                }
                router.push(`/${e}`);
              }}
              noSelectedKeys
              tabInfo={[HomeTabWithIcon, CollapsedSearchIconTab, BrowseTabWithIcon, MintTabWithIcon, UserTab]}
            />
          </div>
        </div>
        {searchIsVisible && <div className="p-2">{ExpandedSearchBar}</div>}
      </Header>
      <CreateTxMsgSendModal visible={visible} setVisible={setVisible} />
    </>
  );
}
