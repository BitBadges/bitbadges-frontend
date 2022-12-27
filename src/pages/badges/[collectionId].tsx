import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useRouter } from 'next/router';
import { getBadge } from '../../bitbadges-api/api';
import { PageHeaderWithAvatar } from '../../components/badges/PageHeaderWithAvatar';
import { Tabs } from '../../components/Tabs';
import { BadgeModalManagerActions } from '../../components/badges/tabs/ManagerActionsTab';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../components/badges/tabs/BadgePageOverviewTab';
import { BadgeSubBadgesTab } from '../../components/badges/tabs/BadgePageSubBadgesTab';

const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'subbadges', content: 'Badges', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'manageractions', content: 'Manager Actions', disabled: false }
];

function Badges() {
    const router = useRouter()
    const { collectionId } = router.query;

    const [tab, setTab] = useState('overview');
    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();
    const collectionMetadata = badgeCollection?.collectionMetadata;

    useEffect(() => {
        async function getBadgeInformation() {
            await getBadge(Number(collectionId), badgeCollection)
                .then(res => { setBadgeCollection(res.badge) });
        }
        getBadgeInformation();
    }, [collectionId, badgeCollection]);

    return (
        <Layout>
            <Content
                style={{
                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                    textAlign: 'center',
                    minHeight: '100vh',
                }}
            >
                <div
                    style={{
                        marginLeft: '10vw',
                        marginRight: '10vw',
                        paddingLeft: '2vw',
                        paddingRight: '2vw',
                        paddingTop: '20px',
                        background: PRIMARY_BLUE,
                    }}
                >
                    <PageHeaderWithAvatar
                        badge={badgeCollection}
                        metadata={collectionMetadata}
                    />
                    <Tabs
                        tabInfo={tabInfo}
                        setTab={setTab}
                        theme="dark"
                        fullWidth
                    />


                    {tab === 'overview' && (<>
                        <BadgeOverviewTab
                            badge={badgeCollection}
                            metadata={collectionMetadata}
                        />
                    </>
                    )}
                    {tab === 'subbadges' && (<>
                        <BadgeSubBadgesTab
                            badgeCollection={badgeCollection}
                            setBadgeCollection={setBadgeCollection}
                        />
                    </>
                    )}


                    {tab === 'manageractions' && (
                        <>
                            <BadgeModalManagerActions
                                badge={badgeCollection}
                            />
                        </>

                    )}

                    {tab === 'activity' && (
                        <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description="This feature is coming soon..."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}

                    {tab === 'owners' && (
                        <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description="This feature is coming soon..."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            </Content>
        </Layout>
    );
}

export default Badges;
