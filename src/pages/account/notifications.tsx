import { Layout } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { Tabs } from '../../components/navigation/Tabs';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';

const { Content } = Layout;

export function Notifications() {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const accountsRef = useRef(accounts);
  const signedInAccount = accounts.getAccount(chain.cosmosAddress);

  const [tab, setTab] = useState('announcements');

  const transferActivity = signedInAccount?.activity;
  const announcements = signedInAccount?.announcements;

  useEffect(() => {
    if (chain.connected && chain.loggedIn) {
      accountsRef.current.updateProfileInfo(chain.cosmosAddress, { seenActivity: Date.now() });
    }
  }, [chain]);

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
                  <div className="primary-text" style={{ fontSize: 25, textAlign: 'center' }}>
                    Notifications
                  </div>
                  <br />
                  <Tabs
                    fullWidth
                    tab={tab}
                    setTab={setTab}
                    tabInfo={[{
                      key: 'announcements',
                      content: 'Announcements',
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
                        hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestActivity?.pagination.hasMore ?? false}
                      />
                    </>}

                    {tab === 'announcements' && <><br /><AnnouncementsTab
                      announcements={announcements ?? []}
                      fetchMore={async () => {
                        await accounts.fetchNextForViews(chain.cosmosAddress, ['latestAnnouncements']);
                      }}
                      hasMore={accounts.getAccount(chain.cosmosAddress)?.views.latestAnnouncements?.pagination.hasMore ?? false}
                    /></>}
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