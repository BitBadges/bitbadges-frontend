import { Badge, Empty, Layout, Spin, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import { AccountViewKey } from 'bitbadgesjs-utils';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, fetchNextForAccountViews, getAccountActivityView, getAccountAddressMappingsView, getAccountAnnouncementsView, getAccountClaimAlertsView, updateProfileInfo, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressListCard } from '../../components/badges/AddressListCard';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { ClaimAlertsTab } from '../../components/collection-page/ClaimAlertsTab';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { Tabs } from '../../components/navigation/Tabs';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

export function Notifications() {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);

  const [tab, setTab] = useState('announcements');

  //We only show the transfer activity at first load time (chain.lastSeenActivity)
  //Anything after that, we don't show and will assume that they see the next time they refresh the page
  //This is to avoid the race conditions where we somehow fetch or add an activity at time T in some other manner (claiming a badge, sending an announcement, etc)
  //We don't want to mark all notifications as read if we haven't yet loaded notifications from last seen to T
  const transferActivity = (getAccountActivityView(signedInAccount, 'latestActivity') ?? []).filter((transfer) => transfer.timestamp < (chain.lastSeenActivity));
  const announcements = (getAccountAnnouncementsView(signedInAccount, 'latestAnnouncements') ?? []).filter((announcement) => announcement.timestamp < (chain.lastSeenActivity));
  const claimAlerts = (getAccountClaimAlertsView(signedInAccount, 'latestClaimAlerts') ?? []).filter((claimAlert) => claimAlert.createdTimestamp < (chain.lastSeenActivity));

  const listsTab = 'latestAddressMappings';
  const hasMoreAddressMappings = signedInAccount?.views[`${listsTab}`]?.pagination?.hasMore ?? true;
  const listsView = getAccountAddressMappingsView(signedInAccount, listsTab).filter((addressMapping) => addressMapping.updateHistory.sort((a, b) => b.blockTimestamp - a.blockTimestamp > 0 ? 1 : -1)[0].blockTimestamp < (chain.lastSeenActivity));


  const [prevSeenActivity, setPrevSeenActivity] = useState<number | undefined>(Number(signedInAccount?.seenActivity) ?? 0n);

  const [seenAnnouncements, setSeenAnnouncements] = useState<boolean>(false);
  const [seenClaimAlerts, setSeenClaimAlerts] = useState<boolean>(false);
  const [seenTransferActivity, setSeenTransferActivity] = useState<boolean>(false);
  const [seenAddressMappings, setSeenAddressMappings] = useState<boolean>(false);

  const fetchMore = useCallback(async (address: string, viewKey: AccountViewKey) => {
    await fetchNextForAccountViews(address, [`${viewKey}`]);
  }, []);



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, update seen activity');
    if (!signedInAccount) return;

    if (chain.connected && chain.loggedIn && chain.address) {
      setPrevSeenActivity(Number(signedInAccount?.seenActivity ?? 0n));
      updateProfileInfo(chain.address, { seenActivity: chain.lastSeenActivity }); //chain.lastSeenActivity was fetch time
    }
  }, [chain.connected, chain.loggedIn, chain.address, chain.lastSeenActivity]);


  useEffect(() => {
    const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
    fetchAccounts([...new Set(createdBys)]);
  }, [listsView]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, fetch accounts');
    if (hasMoreAddressMappings) fetchMore(chain.address, listsTab);
  }, [hasMoreAddressMappings, fetchMore, chain.address, listsTab]);


  const unseenAnnouncementsCount = announcements.filter((announcement) => announcement.timestamp > (prevSeenActivity ?? 0)).length;
  const unseenClaimAlertsCount = claimAlerts.filter((claimAlert) => claimAlert.createdTimestamp > (prevSeenActivity ?? 0)).length;
  const unseenTransferActivityCount = transferActivity.filter((transfer) => transfer.timestamp > (prevSeenActivity ?? 0)).length;
  const unseenAddressMappingsCount = listsView.filter((addressMapping) => addressMapping.updateHistory.sort((a, b) => b.blockTimestamp - a.blockTimestamp > 0 ? 1 : -1)[0].blockTimestamp > (prevSeenActivity ?? 0)).length;

  //Make badge count disappear 5 seconds after being seen
  useEffect(() => {
    if (tab === 'announcements') {
      if (seenAnnouncements) return
      setTimeout(() => {
        setSeenAnnouncements(true);
      }, 5000);
    } else if (tab === 'claimAlerts') {
      if (seenClaimAlerts) return
      setTimeout(() => {
        setSeenClaimAlerts(true);
      }, 5000);
    } else if (tab === 'transferActivity') {
      if (seenTransferActivity) return
      setTimeout(() => {
        setSeenTransferActivity(true);
      }, 5000);
    } else if (tab === 'latestAddressMappings') {
      if (seenAddressMappings) return
      setTimeout(() => {
        setSeenAddressMappings(true);
      }, 5000);
    }
  }, [tab, seenAnnouncements, seenClaimAlerts, seenTransferActivity, seenAddressMappings]);

  const TabComponent = ({ title, count }: { title: string, count: number }) => {
    const toShow = (title === 'Announcements' && !seenAnnouncements) || (title === 'Claim Alerts' && !seenClaimAlerts) || (title === 'Transfer Activity' && !seenTransferActivity) || (title === 'Lists' && !seenAddressMappings);


    return <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }} >
      <Typography.Text className='primary-text' strong style={{ fontSize: 16 }}>
        {title}
      </Typography.Text>
      {'      '}
      {count > 0 && toShow && <Badge style={{ marginLeft: 6 }} count={count} overflowCount={10}>
      </Badge>}
    </div>
  }

  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <RegisteredWrapper
          node={
            <Content
              className="full-area "
              style={{ minHeight: '100vh' }}
            >
              <div
                style={{
                  marginLeft: '3vw',
                  marginRight: '3vw',
                  paddingLeft: '1vw',
                  paddingRight: '1vw',
                  paddingTop: '20px'
                }}
              >
                <br />
                <div className="primary-text" style={{ fontSize: 25, textAlign: 'center' }}>
                  Notifications
                </div>
                <div className='secondary-text flex-center'>
                  Last Fetched: {new Date(Number(chain.lastSeenActivity)).toLocaleDateString()} {new Date(Number(chain.lastSeenActivity)).toLocaleTimeString()}
                </div>
                {/* <div className='flex-center'>
                  <IconButton
                    src={<CloudSyncOutlined />}
                    text='Refresh'
                    onClick={() => {
                      window.location.reload();
                    }}
                  />

                </div> */}
                <br />
                <Tabs
                  fullWidth
                  tab={tab}
                  setTab={setTab}
                  tabInfo={[

                    {
                      key: 'announcements',
                      content: <TabComponent title={'Announcements'} count={unseenAnnouncementsCount} />,
                      disabled: false
                    }, {
                      key: 'claimAlerts',
                      content: <TabComponent title={'Claim Alerts'} count={unseenClaimAlertsCount} />,
                      disabled: false
                    }, {
                      key: 'transferActivity',
                      content: <TabComponent title={'Transfer Activity'} count={unseenTransferActivityCount} />,
                      disabled: false
                    },
                    {
                      key: 'latestAddressMappings',
                      content: <TabComponent title={'Lists'} count={unseenAddressMappingsCount} />,
                      disabled: false
                    }]}
                />

                <div style={{ textAlign: 'center' }}>
                  {tab === 'transferActivity' && <>
                    <br /><ActivityTab
                      activity={transferActivity ?? []}
                      fetchMore={async () => fetchMore(chain.address, 'latestActivity')}
                      hasMore={signedInAccount?.views.latestActivity?.pagination.hasMore ?? true}
                    />
                  </>}

                  {tab === 'announcements' && <><br /><AnnouncementsTab
                    announcements={announcements ?? []}
                    fetchMore={async () => fetchMore(chain.address, 'latestAnnouncements')}
                    hasMore={signedInAccount?.views.latestAnnouncements?.pagination.hasMore ?? true}
                  /></>}

                  {tab === 'claimAlerts' && <><br /><ClaimAlertsTab
                    claimAlerts={claimAlerts ?? []}
                    fetchMore={async () => fetchMore(chain.address, 'latestClaimAlerts')}
                    hasMore={signedInAccount?.views.latestClaimAlerts?.pagination.hasMore ?? true}
                  />
                  </>}

                  {tab === 'latestAddressMappings' && <><br />

                    <div className='flex-center flex-wrap'>
                      <InfiniteScroll
                        dataLength={listsView.length}
                        next={async () => fetchMore(chain.address, listsTab)}
                        hasMore={hasMoreAddressMappings}
                        loader={<div>
                          <br />
                          <Spin size={'large'} />
                        </div>}
                        scrollThreshold={"300px"}
                        endMessage={
                          <></>
                        }
                        initialScrollY={0}
                        style={{ width: '100%', overflow: 'hidden' }}
                      >
                        <div className='full-width flex-center flex-wrap'>
                          {listsView.map((addressMapping, idx) => {
                            return <AddressListCard
                              key={idx}
                              addressMapping={addressMapping}
                              addressOrUsername={signedInAccount?.address ?? ''}
                            />
                          })}
                        </div>
                      </InfiniteScroll>

                      {listsView.length === 0 && !hasMoreAddressMappings && (
                        <Empty
                          className='primary-text'
                          description={
                            <span>
                              No lists found.
                            </span>
                          }
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </div>
                  </>}
                </div>
              </div>
            </Content>
          }
        />
      }
    />
  );
}

export default Notifications;