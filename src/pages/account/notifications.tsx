import { Badge, Empty, Layout, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
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
  const accounts = useAccountsContext();

  const signedInAccount = accounts.getAccount(chain.address);

  const [tab, setTab] = useState('announcements');

  const transferActivity = accounts.getActivityView(chain.cosmosAddress, 'latestActivity') ?? [];
  const announcements = accounts.getAnnouncementsView(chain.cosmosAddress, 'latestAnnouncements') ?? [];
  const claimAlerts = accounts.getClaimAlertsView(chain.cosmosAddress, 'latestClaimAlerts') ?? [];
  const [prevSeenActivity] = useState<number | undefined>(Number(signedInAccount?.seenActivity) ?? 0n);

  const [seenAnnouncements, setSeenAnnouncements] = useState<boolean>(false);
  const [seenClaimAlerts, setSeenClaimAlerts] = useState<boolean>(false);
  const [seenTransferActivity, setSeenTransferActivity] = useState<boolean>(false);
  const [seenAddressMappings, setSeenAddressMappings] = useState<boolean>(false);

  const fetchMore = async () => {
    if (!signedInAccount) return;

    await accounts.fetchNextForViews(signedInAccount.cosmosAddress, [`${listsTab}`]);
  }


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, update seen activity');
    const signedInAccount = accounts.getAccount(chain.address);

    if (signedInAccount && chain.connected && chain.loggedIn && chain.cosmosAddress) {
      accounts.updateProfileInfo(chain.cosmosAddress, { seenActivity: chain.lastSeenActivity }); //chain.lastSeenActivity was fetch time
    }
  }, [chain.connected, chain.loggedIn, chain.cosmosAddress, chain.address, chain.lastSeenActivity]);


  const listsTab = 'latestAddressMappings';
  const hasMoreAddressMappings = signedInAccount?.views[`${listsTab}`]?.pagination?.hasMore ?? true;

  const listsView = signedInAccount ? accounts.getAddressMappingsView(signedInAccount.cosmosAddress, listsTab) ?? [] : [];

  useEffect(() => {
    const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
    accounts.fetchAccounts([...new Set(createdBys)]);
  }, [listsView]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, fetch accounts');
    if (hasMoreAddressMappings) fetchMore();
  }, []);


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
  }, [tab]);

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
                  marginLeft: '7vw',
                  marginRight: '7vw',
                  paddingLeft: '1vw',
                  paddingRight: '1vw',
                  paddingTop: '20px'
                }}
              >
                <br />
                <div className="primary-title" style={{ fontSize: 25, textAlign: 'center' }}>
                  Notifications
                </div>
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
                      fetchMore={async () => {
                        await accounts.fetchNextForViews(chain.cosmosAddress, ['latestActivity']);
                      }}
                      hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestActivity?.pagination.hasMore ?? true}
                    />
                  </>}

                  {tab === 'announcements' && <><br /><AnnouncementsTab
                    announcements={announcements ?? []}
                    fetchMore={async () => {
                      await accounts.fetchNextForViews(chain.cosmosAddress, ['latestAnnouncements']);
                    }}
                    hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestAnnouncements?.pagination.hasMore ?? true}
                  /></>}

                  {tab === 'claimAlerts' && <><br /><ClaimAlertsTab
                    claimAlerts={claimAlerts ?? []}
                    fetchMore={async () => {
                      await accounts.fetchNextForViews(chain.cosmosAddress, ['latestClaimAlerts']);
                    }}
                    hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestClaimAlerts?.pagination.hasMore ?? true}
                  />
                  </>}

                  {tab === 'latestAddressMappings' && <><br />

                    <div className='flex-center flex-wrap'>
                      <InfiniteScroll
                        dataLength={listsView.length}
                        next={fetchMore}

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