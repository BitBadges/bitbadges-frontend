import { Badge, Layout } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import { AccountViewKey } from 'bitbadgesjs-utils';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchNextForAccountViews, getAccountActivityView, getAccountClaimAlertsView, getAccountListsActivityView, updateProfileInfo, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
// import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { ClaimAlertsTab } from '../../components/collection-page/ClaimAlertsTab';
import { ListActivityTab } from '../../components/collection-page/ListActivityDisplay';
import { ActivityTab } from '../../components/collection-page/TransferActivityDisplay';
import { Tabs } from '../../components/navigation/Tabs';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';

const { Content } = Layout;

export function Notifications() {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);

  const [tab, setTab] = useState('transferActivity');

  //We only show the transfer activity at first load time (chain.lastSeenActivity)
  //Anything after that, we don't show and will assume that they see the next time they refresh the page
  //This is to avoid the race conditions where we somehow fetch or add an activity at time T in some other manner (claiming a badge, sending an announcement, etc)
  //We don't want to mark all notifications as read if we haven't yet loaded notifications from last seen to T
  const transferActivity = (getAccountActivityView(signedInAccount, 'latestActivity') ?? []).filter((transfer) => transfer.timestamp < (chain.lastSeenActivity));
  const claimAlerts = (getAccountClaimAlertsView(signedInAccount, 'latestClaimAlerts') ?? []).filter((claimAlert) => claimAlert.createdTimestamp < (chain.lastSeenActivity));
  
  const listsActivity = (getAccountListsActivityView(signedInAccount, 'listsActivity') ?? []).filter((transfer) => transfer.timestamp < (chain.lastSeenActivity));
  const listsTab = 'latestAddressMappings';
  const hasMoreAddressMappings = signedInAccount?.views[`${listsTab}`]?.pagination?.hasMore ?? true;

  const [prevSeenActivity, setPrevSeenActivity] = useState<number | undefined>(Number(signedInAccount?.seenActivity) ?? 0n);

  const [seenAnnouncements, setSeenAnnouncements] = useState<boolean>(false);
  const [seenClaimAlerts, setSeenClaimAlerts] = useState<boolean>(false);
  const [seenTransferActivity, setSeenTransferActivity] = useState<boolean>(false);
  const [seenAddressMappings, setSeenAddressMappings] = useState<boolean>(false);

  const fetchMore = useCallback(async (address: string, viewType: AccountViewKey) => {
    await fetchNextForAccountViews(address, viewType, viewType); //no custom IDs so pass in same
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
    if (INFINITE_LOOP_MODE) console.log('useEffect: notifications page, fetch accounts');
    if (hasMoreAddressMappings) fetchMore(chain.address, listsTab);
  }, [hasMoreAddressMappings, fetchMore, chain.address, listsTab]);


  // const unseenAnnouncementsCount = announcements.filter((announcement) => announcement.timestamp > (prevSeenActivity ?? 0)).length;
  const unseenClaimAlertsCount = claimAlerts.filter((claimAlert) => claimAlert.createdTimestamp > (prevSeenActivity ?? 0)).length;
  const unseenTransferActivityCount = transferActivity.filter((transfer) => transfer.timestamp > (prevSeenActivity ?? 0)).length;
  const unseenListsActivityCount = listsActivity.filter((transfer) => transfer.timestamp > (prevSeenActivity ?? 0)).length;
  
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
      
        {title}
      {'      '}
      {count > 0 && toShow && <Badge style={{ marginLeft: 6 }} count={count} overflowCount={10}>
      </Badge>}
    </div>
  }

  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect and sign in to view this page.'}
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
                {chain.lastSeenActivity > 1 &&
                  <div className='secondary-text flex-center'>
                    Last Fetched: {new Date(Number(chain.lastSeenActivity)).toLocaleDateString()} {new Date(Number(chain.lastSeenActivity)).toLocaleTimeString()}
                  </div>}
                <br />
                <Tabs
                  fullWidth
                  tab={tab}
                  setTab={setTab}
                  tabInfo={[
                    {
                      key: 'transferActivity',
                      content: <TabComponent title={'Transfer Activity'} count={unseenTransferActivityCount} />,
                      disabled: false
                    },
                    {
                      key: 'latestAddressMappings',
                      content: <TabComponent title={'List Activity'} count={unseenListsActivityCount} />,
                      disabled: false
                    },
                    {
                      key: 'claimAlerts',
                      content: <TabComponent title={'Claim Alerts'} count={unseenClaimAlertsCount} />,
                      disabled: false
                    },
                  ]}
                />

                <div style={{ textAlign: 'center' }}>
                  {tab === 'transferActivity' && <>
                    <br /><ActivityTab
                      activity={transferActivity ?? []}
                      fetchMore={async () => fetchMore(chain.address, 'latestActivity')}
                      hasMore={signedInAccount?.views.latestActivity?.pagination.hasMore ?? true}
                    />
                  </>}
                  {tab === 'claimAlerts' && <><br /><ClaimAlertsTab
                    claimAlerts={claimAlerts ?? []}
                    fetchMore={async () => fetchMore(chain.address, 'latestClaimAlerts')}
                    hasMore={signedInAccount?.views.latestClaimAlerts?.pagination.hasMore ?? true}
                  />
                  </>}

                  {tab === 'latestAddressMappings' && <><br />
                    <ListActivityTab
                      activity={listsActivity ?? []}
                      fetchMore={async () => fetchMore(chain.address, 'listsActivity')}
                      hasMore={signedInAccount?.views.listsActivity?.pagination.hasMore ?? true}
                    />
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