import { Empty, Layout, Spin } from 'antd';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
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

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, update seen activity');
    const signedInAccount = accounts.getAccount(chain.address);

    if (signedInAccount && chain.connected && chain.loggedIn && chain.cosmosAddress) {
      accounts.updateProfileInfo(chain.cosmosAddress, { seenActivity: chain.lastSeenActivity });
    }
  }, [chain.connected, chain.loggedIn, chain.cosmosAddress, chain.address, chain.lastSeenActivity, accounts]);

  const listsTab = 'latestAddressMappings';
  const hasMoreAddressMappings = signedInAccount?.views[`${listsTab}`]?.pagination?.hasMore ?? true;

  const listsView = signedInAccount ? accounts.getAddressMappingsView(signedInAccount.cosmosAddress, listsTab) ?? [] : [];

  useEffect(() => {
    const createdBys = listsView.map((addressMapping) => addressMapping.createdBy);
    accounts.fetchAccounts([...new Set(createdBys)]);
  }, [listsView]);



  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <RegisteredWrapper

          node={
            <Layout>
              <Content
                className="full-area primary-blue-bg"
                style={{ minHeight: '100vh' }}
              >
                <div
                  className="primary-blue-bg"
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
                        content: 'Announcements',
                        disabled: false
                      }, {
                        key: 'claimAlerts',
                        content: 'Claim Alerts',
                        disabled: false
                      }, {
                        key: 'transferActivity',
                        content: 'Transfer Activity',
                        disabled: false
                      },
                      {
                        key: 'latestAddressMappings',
                        content: 'List Activity',
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
                          next={async () => {
                            if (!signedInAccount) return;

                            await accounts.fetchNextForViews(signedInAccount.cosmosAddress, [`${listsTab}`]);
                          }}

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
            </Layout>
          }
        />
      }
    />
  );
}

export default Notifications;