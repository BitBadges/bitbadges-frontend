import { Empty, Card, Divider, Typography, } from 'antd';
import { useState } from 'react';
import React from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { CreateTxMsgTransferManagerModal } from '../../txModals/CreateTxMsgTransferManagerModal';
import { useChainContext } from '../../../chain/ChainContext';
import { BlockinDisplay } from '../../blockin/BlockinDisplay';
import { CreateTxMsgUpdatePermissionsModal } from '../../txModals/CreateTxMsgUpdatePermissions';
import { useRouter } from 'next/router';
import Meta from 'antd/lib/card/Meta';
import { CreateTxMsgRequestTransferManagerModal } from '../../txModals/CreateTxMsgRequestTransferManagerModal';
import { CreateTxMsgTransferBadgeModal } from '../../txModals/CreateTxMsgTransferBadge';

export function ActionsTab({
    badge,
    setBadgeCollection,
    userBalance,
    setUserBalance,
}: {
    badge?: BitBadgeCollection;
    setBadgeCollection: () => void;
    userBalance?: UserBalance;
    setUserBalance: () => void;
}) {
    const router = useRouter();
    const [transferIsVisible, setTransferIsVisible] = useState(false);
    const [transferManagerIsVisible, setTransferManagerIsVisible] = useState(false);
    const [freezeIsVisible, setFreezeIsVisible] = useState(false);
    const [updatePermissionsIsVisible, setUpdatePermissionsIsVisible] = useState(false);
    const [requestTransferManagerIsVisible, setRequestTransferManagerIsVisible] = useState(false);

    const chain = useChainContext();
    const accountNumber = chain.accountNumber;

    if (!badge) return <></>;

    let actions: any[] = [];
    const isManager = badge.manager.accountNumber === accountNumber;

    actions.push({
        title: <div style={{ color: PRIMARY_TEXT }}>Transfer</div>,
        description: (
            <div style={{ color: SECONDARY_TEXT }}>
                Transfer badge(s) in this collection.
            </div>
        ),
        showModal: () => {
            setTransferIsVisible(!transferIsVisible);
        },
    });


    if (isManager) {
        if (badge.permissions.CanCreateMoreBadges) {
            actions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Add New Badge to Collection</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        New Badge
                    </div>
                ),
                showModal: () => {
                    router.push(`/mint/badge/${badge.collectionId}`)
                },
            });
        }

        if (badge.unmintedSupplys.length > 0) {
            actions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Distribute Badges</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Distribute badges that are currently unminted.
                    </div>
                ),
                showModal: () => {
                    router.push(`/distribute/${badge.collectionId}`)
                },
            });
        }

        if (badge.permissions.CanUpdateUris) {
            actions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Update Metadata</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Update the metadata of this collection and badges.
                    </div>
                ),
                showModal: () => {
                    router.push(`/updateMetadata/${badge.collectionId}`)
                },
            });
        }



        //TODO:
        // if (badge.permissions.CanRevoke) {
        //     actions.push({
        //         title: <div style={{ color: PRIMARY_TEXT }}>Revoke</div>,
        //         description: (
        //             <div style={{ color: SECONDARY_TEXT }}>
        //                 Revoke a badge from an existing owner
        //             </div>
        //         ),
        //         showModal: () => {
        //             setRevokeIsVisible(!revokeIsVisible);
        //         },
        //     });
        // }

        if (badge.permissions.CanUpdateDisallowed) {
            actions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Update Disallowed Transfers</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Freeze or unfreeze if badge owners able to transfer.
                    </div>
                ),
                showModal: () => {
                    setFreezeIsVisible(!freezeIsVisible);
                    router.push(`/updateDisallowed/${badge.collectionId}`);
                },
            });
        }

        if (badge.permissions.CanManagerBeTransferred) {
            actions.push({
                title: (
                    <div style={{ color: PRIMARY_TEXT }}>Transfer Manager</div>
                ),
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Transfer manager privileges to new address
                    </div>
                ),
                showModal: () => {
                    setTransferManagerIsVisible(!transferManagerIsVisible);
                },
            });
        }


        actions.push({
            title: <div style={{ color: PRIMARY_TEXT }}>Update Permissions</div>,
            description: (
                <div style={{ color: SECONDARY_TEXT }}>
                    Update the permissions of this collection.
                </div>
            ),
            showModal: () => {
                setUpdatePermissionsIsVisible(!updatePermissionsIsVisible);
            },
        })
    }

    if (!isManager) {
        if (badge.permissions.CanManagerBeTransferred) {
            actions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Request Manager Transfer</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Request to become the manager of this collection.
                    </div>
                ),
                showModal: () => {
                    setRequestTransferManagerIsVisible(!requestTransferManagerIsVisible);
                },
            })
        }
    }

    if (!chain.connected) {
        return <div>
            <Divider />
            {chain.connected &&
                <Typography style={{ color: PRIMARY_TEXT, textAlign: 'center', fontSize: 20, paddingBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    Your connected address is not the manager of this collection.
                </Typography>
            }
            <BlockinDisplay />
        </div>

    }

    return (
        <div
            style={{
                width: '100%',
                fontSize: 20,
            }}
        >
            <div
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
            >

                {
                    actions.map((action, idx) => {
                        return <Card
                            key={idx}
                            style={{
                                width: '300px',
                                minHeight: '150px',
                                margin: 8,
                                textAlign: 'center',
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: action.disabled ? 'not-allowed' : undefined,
                            }}
                            hoverable={!action.disabled}
                            onClick={async () => {
                                if (action.disabled) return;
                                action.showModal();
                            }}

                        >
                            <Meta
                                title={
                                    <div
                                        style={{
                                            fontSize: 20,
                                            color: PRIMARY_TEXT,
                                            fontWeight: 'bolder',
                                        }}
                                    >
                                        {action.title}
                                    </div>
                                }
                                description={
                                    <div
                                        style={{
                                            color: SECONDARY_TEXT,
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {action.description}
                                    </div>
                                }
                            />
                        </Card>

                    })
                }
            </div>
            {actions.length == 0 && (
                <>
                    <Empty
                        style={{ color: PRIMARY_TEXT }}
                        description="No actions can be taken."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </>
            )}

            {
                <CreateTxMsgTransferBadgeModal
                    visible={transferIsVisible}
                    setVisible={setTransferIsVisible}
                    badge={badge}
                    setBadgeCollection={setBadgeCollection}
                    userBalance={userBalance ? userBalance : { approvals: [], balances: [] }}
                    setUserBalance={setUserBalance}
                />
            }

            <CreateTxMsgTransferManagerModal
                visible={transferManagerIsVisible}
                setVisible={setTransferManagerIsVisible}
                collection={badge}
                setBadgeCollection={setBadgeCollection}
            />

            <CreateTxMsgRequestTransferManagerModal
                visible={requestTransferManagerIsVisible}
                setVisible={setRequestTransferManagerIsVisible}
                collection={badge}
                setBadgeCollection={setBadgeCollection}
            />

            <CreateTxMsgUpdatePermissionsModal
                visible={updatePermissionsIsVisible}
                setVisible={setUpdatePermissionsIsVisible}
                badge={badge}
                setBadgeCollection={setBadgeCollection}
            />


            {
                //TODO: -slowly introduce additional functionality (approvals,  new subbadges, etc)
            }
        </div >
    );
}
