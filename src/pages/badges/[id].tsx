import { MintTimeline } from '../../components/mint/MintTimeline';
import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useChainContext } from '../../chain_handlers_frontend/ChainContext';
import ConnectScreen from '../connect';
import { useRouter } from 'next/router';
import { DisconnectedWrapper } from '../../components/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/RegisterWrapper';
import { getBadge } from '../../api/api';
import { Badge } from '../../components/Badge';
import { BadgeModalOverview } from '../../components/badges/BadgeOverview';
import { useSelector } from 'react-redux';
import { Tabs } from '../../components/Tabs';
import { BadgeModalManagerActions } from '../../components/badges/ManagerActions';
import { BadgeModalUserActions } from '../../components/badges/UserActions';

const { Content } = Layout;

export interface CosmosBadgeInfo {

}

function Badges() {
    const router = useRouter()
    const { id } = router.query;

    const [badgeDetails, setBadgeDetails] = useState<CosmosBadgeInfo | undefined>()
    const [tab, setTab] = useState('overview');

    const tabInfo = [{ key: 'overview', content: 'Overview' }];
    //TODO: add properties into overview tab

    //TODO:
    // if (address && chain) {
    tabInfo.push({
        key: 'status',
        content: 'Status',
    });
    // }

    //TODO:
    // if (badge.manager === `${chain}:${address}`) {
    tabInfo.push({
        key: 'manageractions',
        content: 'Manager Actions',
    });
    // }

    tabInfo.push(
        { key: 'owners', content: 'Owners' },
        { key: 'activity', content: 'Activity' }
    );

    useEffect(() => {
        if (isNaN(Number(id))) {
            return
        }

        async function getBadgeFromApi() {
            if (isNaN(Number(id))) {
                return
            }
            const badgeRes = await getBadge(Number(id));


            //TODO: add a 404 clause (possibly in /api)
            const badgeInfo = badgeRes.badge;
            // console.log(badge);
            badgeInfo.metadata = {
                name: 'test',
                description: 'test',
                image: 'https://bitbadges.web.app/img/icons/logo.png'
            }

            console.log(badgeInfo);
            setBadgeDetails(badgeInfo)
        }
        getBadgeFromApi();
    }, [id])

    return (
        <Layout>
            <Content
                style={{
                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                    textAlign: 'center',
                    minHeight: '100vh',
                }}
            >
                {/* <div className="primary-text">Badge</div> */}
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
                    TEST: {id}
                    {/* <BadgeDisplay
                        badge={badgeDetails}
                        size={150}
                    /> */}
                    <BadgeModalOverview
                        badge={badgeDetails}
                    />
                    <Tabs
                        tabInfo={tabInfo}
                        setTab={setTab}
                        theme="dark"
                        fullWidth
                    />
                    {tab === 'status' && (
                        <BadgeModalUserActions
                            badge={badgeDetails}
                        // conceptBadge={conceptBadge}
                        // hidePermissions={hidePermissions}
                        />
                    )}
                    {tab === 'manageractions' && (
                        <BadgeModalManagerActions
                            badge={badgeDetails}
                        // conceptBadge={conceptBadge}
                        // hidePermissions={hidePermissions}
                        />
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
