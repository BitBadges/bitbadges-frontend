import React, { useState } from 'react';
import { Layout, Drawer } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { PRIMARY_TEXT } from '../../constants';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { Tabs } from '../Tabs';

const { Content } = Layout;

export function Pending({ badge, visible, setVisible, children, balance }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        balance: UserBalance,
    }) {
    const [tab, setTab] = useState('incoming');
    const tabInfo = [{ key: 'overview', content: 'Overview' }];
    return (
        <Drawer
            placement="right" onClose={() => { setVisible(false) }} open={visible}
            // size="large"
            title={
                "TEST"
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
            <Tabs
                tabInfo={tabInfo}
                setTab={setTab}
                theme="dark"
                fullWidth
            />
            {/* <Drawer

                

                placement={'bottom'}
                visible={modalIsVisible}
                key={'bottom'}
                onClose={() => setModalIsVisible(false)}

            > */}

            <Content className="full-area">
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

                Test
            </Content>
        </Drawer>
    );
}
