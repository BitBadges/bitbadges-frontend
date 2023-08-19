import { Layout } from 'antd';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { ActivityTab } from '../../components/activity/TransferActivityDisplay';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { Tabs } from '../../components/navigation/Tabs';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';
import { ClaimAlertsTab } from '../../components/collection-page/ClaimAlertsTab';

const { Content } = Layout;

export function Notifications() {
  const chain = useChainContext();
  const accounts = useAccountsContext();

  const signedInAccount = accounts.getAccount(chain.address);

  const [tab, setTab] = useState('announcements');

  const transferActivity = signedInAccount?.activity;
  const announcements = signedInAccount?.announcements;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, update seen activity');
    const signedInAccount = accounts.getAccount(chain.address);

    if (signedInAccount && chain.connected && chain.loggedIn && chain.cosmosAddress) {
      accounts.updateProfileInfo(chain.cosmosAddress, { seenActivity: Date.now() });
    }
  }, [chain.connected, chain.loggedIn, chain.cosmosAddress]);

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
                      claimAlerts={signedInAccount?.claimAlerts ?? []}
                      fetchMore={async () => {
                        await accounts.fetchNextForViews(chain.cosmosAddress, ['latestClaimAlerts']);
                      }}
                      hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestClaimAlerts?.pagination.hasMore ?? true}
                    />
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