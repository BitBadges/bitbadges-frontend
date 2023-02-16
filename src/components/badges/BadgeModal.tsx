import React, { useState } from 'react';
import { Layout, Drawer, Divider, Empty, Row, Col, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE, SECONDARY_TEXT } from '../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { Tabs } from '../common/Tabs';
import { BadgePageHeader } from './BadgePageHeader';
import { CollectionOverview } from '../badges/CollectionOverview';
import { BadgeOverview } from '../badges/BadgeOverview';
import { BalanceOverview } from './BalanceOverview';
import { PermissionsOverview } from './PermissionsOverview';
import { useChainContext } from '../../chain/ChainContext';
import { OwnersTab } from './tabs/OwnersTab';
import { BadgeActivityTab } from './tabs/BadgeActivityTab';

const { Content } = Layout;
const { Text } = Typography;

export function BadgeModal({ badge, metadata, visible, setVisible, children, balance, badgeId }
    : {
        badge: BitBadgeCollection,
        metadata: BadgeMetadata,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        balance: UserBalance,
        badgeId: number
    }) {
    const chain = useChainContext();
    const [tab, setTab] = useState('overview');

    const tabInfo = [
        { key: 'overview', content: 'Overview' },
        { key: 'owners', content: 'Owners' },
        { key: 'activity', content: 'Activity' },
    ];
    return (
        <Drawer
            onClose={() => { setVisible(false) }}
            open={visible}
            placement={'bottom'}
            size="large"
            title={
                <Tabs
                    tab={tab}
                    tabInfo={tabInfo}
                    setTab={setTab}
                    theme="dark"
                    fullWidth
                />
            }
            headerStyle={{
                paddingLeft: '12px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                borderBottom: '0px',
                backgroundColor: '#001529',
                color: PRIMARY_TEXT,
            }}
            closeIcon={<CloseOutlined style={{ color: PRIMARY_TEXT }} />}
            bodyStyle={{
                paddingTop: 8,
                fontSize: 20,
                backgroundColor: '#001529',
                color: PRIMARY_TEXT,
            }}
        >
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


                        {tab === 'overview' && (<>
                            <BadgePageHeader
                                metadata={metadata}
                            />
                            {chain.connected && <>You have x{balance?.balances?.find((balanceAmount) => {
                                const found = balanceAmount.badgeIds.find((idRange) => {
                                    if (idRange.end === undefined) {
                                        idRange.end = idRange.start;
                                    }
                                    return badgeId >= idRange.start && badgeId <= idRange.end;
                                });
                                return found !== undefined;
                            })?.balance ?? 0} of this badge.</>}
                            <Divider />
                            <Row
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',

                                }}
                            >

                                <Col span={16} style={{ minHeight: 100, border: '1px solid white', borderRadius: 10 }}>

                                    <Text style={{ color: SECONDARY_TEXT }}>


                                        <BadgeOverview
                                            badge={badge}
                                            metadata={badge.badgeMetadata[badgeId - 1]}
                                            balance={balance}
                                            badgeId={badgeId}
                                        />
                                    </Text>
                                </Col>
                            </Row>

                        </>
                        )}

                        {tab === 'activity' && (
                            <BadgeActivityTab
                                badgeCollection={badge}
                                badgeId={badgeId}

                            />
                        )}

                        {tab === 'owners' && (
                            <OwnersTab
                                badgeCollection={badge}
                                badgeId={badgeId}
                            />
                        )}

                        {/* {pending.map((pendingData) => (
                    <div key={pendingData.badge.id}>
                        {tab === 'incoming' && (
                            <>
                                <PendingModalItem
                                    address={
                                        pendingData.from === ETH_NULL_ADDRESS
                                            ? badgeMap[pendingData.badge].manager
                                            : pendingData.from
                                    }
                                    title={
                                        <>
                                            {pendingData.from !==
                                                ETH_NULL_ADDRESS ? (
                                                <>
                                                    <Tooltip
                                                        title={pendingData.from}
                                                    >
                                                        {' '}
                                                        {getAbbreviatedAddress(
                                                            pendingData.from
                                                        )}{' '}
                                                    </Tooltip>
                                                    wants to send you{' '}
                                                </>
                                            ) : (
                                                <>
                                                    <Tooltip
                                                        title={
                                                            badgeMap[
                                                                pendingData.badge
                                                            ].manager
                                                        }
                                                    >
                                                        {' '}
                                                        {getAbbreviatedAddress(
                                                            badgeMap[
                                                                pendingData.badge
                                                            ].manager
                                                        )}{' '}
                                                    </Tooltip>
                                                    wants to mint you{' '}
                                                </>
                                            )}
                                            {pendingData.amount}{' '}
                                            {
                                                badgeMap[pendingData.badge].metadata
                                                    .name
                                            }{' '}
                                            badges{' '}
                                        </>
                                    }
                                    info={
                                        <>
                                            {[
                                                badgeMap[pendingData.badge]
                                                    .permissions.canOwnerTransfer
                                                    ? badgeMap[pendingData.badge]
                                                        .permissions.canRevoke
                                                        ? 'This badge is transferable, but the manager can revoke it at anytime.'
                                                        : 'This badge is transferable and can never be revoked by the manager.'
                                                    : badgeMap[pendingData.badge]
                                                        .permissions.canRevoke
                                                        ? 'This badge is non-transferable, but the manager can revoke it.'
                                                        : 'This badge is non-transferable and can never be revoked by the manager. Once you accept this badge, it will permanently live in your account forever.',
                                                badgeMap[pendingData.badge]
                                                    .permissions.canMintMore
                                                    ? 'The supply of this badge is not locked. The badge manager can mint more of this badge.'
                                                    : 'The supply of this badge is locked. The badge manager can not mint anymore of this badge ever.',
                                            ].map((item) => (
                                                <List.Item
                                                    key={item}
                                                    style={{
                                                        padding: '4px 0px',
                                                        color: PRIMARY_TEXT,
                                                    }}
                                                >
                                                    <Typography.Text>
                                                        <div
                                                            style={{
                                                                color: PRIMARY_TEXT,
                                                            }}
                                                        >
                                                            <WarningOutlined
                                                                style={{
                                                                    color: 'orange',
                                                                }}
                                                            />
                                                            {item}
                                                        </div>
                                                    </Typography.Text>{' '}
                                                </List.Item>
                                            ))}
                                        </>
                                    }
                                    badge={badgeMap[pendingData.badge]}
                                    balance={pendingData.amount}
                                    id={pendingData.id}
                                    showButtons
                                />
                            </>
                        )}
                        {tab === 'outgoing' && (
                            <PendingModalItem
                                address={pendingData.to}
                                title={
                                    <>
                                        {' '}
                                        You are sending {pendingData.amount}{' '}
                                        {badgeMap[pendingData.badge].metadata.name}{' '}
                                        badges to{' '}
                                        <Tooltip title={pendingData.to}>
                                            {' '}
                                            {getAbbreviatedAddress(
                                                pendingData.to
                                            )}{' '}
                                        </Tooltip>
                                    </>
                                }
                                info={
                                    <>
                                        {[
                                            `If the recipient declines this
                                            transfer request, the badges will be
                                            added back to your account's
                                            balances.`,
                                        ].map((item) => (
                                            <List.Item
                                                key={item}
                                                style={{
                                                    padding: '4px 0px',
                                                    color: PRIMARY_TEXT,
                                                }}
                                            >
                                                <Typography.Text>
                                                    <div
                                                        style={{
                                                            color: PRIMARY_TEXT,
                                                        }}
                                                    >
                                                        <WarningOutlined
                                                            style={{
                                                                color: 'orange',
                                                            }}
                                                        />
                                                        {item}
                                                    </div>
                                                </Typography.Text>{' '}
                                            </List.Item>
                                        ))}
                                    </>
                                }
                                badge={badgeMap[pendingData.badge]}
                                balance={pendingData.amount}
                                id={pendingData.id}
                            />
                        )}
                    </div>
                ))}
                {(!pending || pending.length === 0) && (
                    <Empty
                        description={
                            <div style={{ color: PRIMARY_TEXT }}>
                                No Badges Found
                            </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )} */}

                    </div>
                </Content>
            </Layout>
        </Drawer>
    );
}
