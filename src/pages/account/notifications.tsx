import { Layout } from 'antd';
import { BitBadgeCollection } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { updateLastSeenActivity, updateUserActivity, updateUserAnnouncements } from '../../bitbadges-api/api';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
import { Tabs } from '../../components/navigation/Tabs';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { PRIMARY_BLUE } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';

const { Content } = Layout;

export function Notifications() {
    const chain = useChainContext();
    const [tab, setTab] = useState('announcements');

    const transferActivity = chain.activity;

    useEffect(() => {
        updateLastSeenActivity();
        chain.setSeenActivity(Date.now());
    }, [chain.address]);

    return (
        <DisconnectedWrapper
            requireLogin
            message={'Please connect your wallet and sign in to view this page.'}
            node={
                <RegisteredWrapper

                    node={
                        <Layout>
                            <Content
                                className="full-area"
                                style={{ backgroundColor: PRIMARY_BLUE, minHeight: '100vh' }}
                            >
                                <div
                                    style={{
                                        marginLeft: '7vw',
                                        marginRight: '7vw',
                                        paddingLeft: '1vw',
                                        paddingRight: '1vw',
                                        paddingTop: '20px',
                                        background: PRIMARY_BLUE,
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

                                                userActivity={transferActivity}
                                                collection={{} as BitBadgeCollection}
                                                fetchMore={async () => {
                                                    if (!chain.activity) return;

                                                    const newRes = await updateUserActivity(chain.accountNumber, chain.activityBookmark);
                                                    chain.setActivityBookmark(newRes.pagination.userActivity.bookmark);
                                                    chain.setActivityHasMore(newRes.pagination.userActivity.hasMore);

                                                    chain.setActivity([...chain.activity, ...newRes.activity]);
                                                }}
                                                hasMore={chain.activityHasMore}
                                            />
                                        </>}

                                        {tab === 'announcements' && <><br /><AnnouncementsTab
                                            announcements={chain.announcements}
                                            fetchMore={async () => {
                                                if (!chain.announcements) return;

                                                const newRes = await updateUserAnnouncements(chain.accountNumber, chain.announcementsBookmark);
                                                chain.setAnnouncementsBookmark(newRes.pagination.announcements.bookmark);
                                                chain.setAnnouncementsHasMore(newRes.pagination.announcements.hasMore);

                                                chain.setAnnouncements([...chain.announcements, ...newRes.announcements]);
                                            }}
                                            hasMore={chain.announcementsHasMore}
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