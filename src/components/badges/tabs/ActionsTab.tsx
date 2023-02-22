import { Card, Divider, Empty, Typography } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { useChainContext } from '../../../chain/ChainContext';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { BlockinDisplay } from '../../blockin/BlockinDisplay';
import { CreateTxMsgRequestTransferManagerModal } from '../../txModals/CreateTxMsgRequestTransferManagerModal';
import { CreateTxMsgTransferBadgeModal } from '../../txModals/CreateTxMsgTransferBadge';
import { CreateTxMsgTransferManagerModal } from '../../txModals/CreateTxMsgTransferManagerModal';
import { CreateTxMsgUpdatePermissionsModal } from '../../txModals/CreateTxMsgUpdatePermissions';

export function ActionsTab({
    collection,
    
    userBalance,
    refreshUserBalance
}: {
    collection?: BitBadgeCollection;
    userBalance?: UserBalance;
    refreshUserBalance: () => void;
}) {
    const router = useRouter();
    const chain = useChainContext();
    const accountNumber = chain.accountNumber;

    //Modal visibilities
    const [transferIsVisible, setTransferIsVisible] = useState(false);
    const [transferManagerIsVisible, setTransferManagerIsVisible] = useState(false);
    const [freezeIsVisible, setFreezeIsVisible] = useState(false);
    const [updatePermissionsIsVisible, setUpdatePermissionsIsVisible] = useState(false);
    const [distributeIsVisible, setDistributeIsVisible] = useState(false);
    const [requestTransferManagerIsVisible, setRequestTransferManagerIsVisible] = useState(false);

    if (!collection) return <></>;
    const isManager = collection.manager.accountNumber === accountNumber;

    const getTitleElem = (title: string) => {
        return (
            <div style={{ color: PRIMARY_TEXT }}>
                {title}
            </div>
        );
    };

    const getDescriptionElem = (description: string) => {
        return (
            <div style={{ color: SECONDARY_TEXT }}>
                {description}
            </div>
        );
    };

    let actions: {
        title: React.ReactNode,
        description: React.ReactNode,
        showModal: () => void,
        disabled?: boolean
    }[] = [];

    actions.push({
        title: getTitleElem("Transfer"),
        description: getDescriptionElem(
            "Transfer badge(s) in this collection."
        ),
        showModal: () => {
            setTransferIsVisible(!transferIsVisible);
        },
    });


    if (isManager) {
        if (collection.permissions.CanCreateMoreBadges) {
            actions.push({
                title: getTitleElem("Add New Badge to Collection"),
                description: getDescriptionElem(
                    "New Badge"
                ),
                showModal: () => {
                    router.push(`/mint/badge/${collection.collectionId}`)
                },
            });
        }

        if (collection.unmintedSupplys.length > 0) {
            actions.push({
                title: getTitleElem("Distribute Badges"),
                description: getDescriptionElem(
                    "Distribute badges that are currently unminted."
                ),
                showModal: () => {
                    router.push(`/distribute/${collection.collectionId}`)
                    // setDistributeIsVisible(!distributeIsVisible);
                },
            });
        }

        if (collection.permissions.CanUpdateUris) {
            actions.push({
                title: getTitleElem("Update Metadata"),
                description: getDescriptionElem(
                    "Update the metadata of this collection and badges."
                ),
                showModal: () => {
                    router.push(`/updateMetadata/${collection.collectionId}`)
                },
            });
        }

        if (collection.permissions.CanUpdateDisallowed) {
            actions.push({
                title: getTitleElem("Update Disallowed Transfers"),
                description: getDescriptionElem(
                    "Freeze or unfreeze if badge owners able to transfer."
                ),
                showModal: () => {
                    setFreezeIsVisible(!freezeIsVisible);
                    router.push(`/updateDisallowed/${collection.collectionId}`);
                },
            });
        }

        if (collection.permissions.CanManagerBeTransferred) {
            actions.push({
                title: getTitleElem("Transfer Manager"),
                description: getDescriptionElem(
                    "Transfer manager privileges to new address"
                ),
                showModal: () => {
                    setTransferManagerIsVisible(!transferManagerIsVisible);
                },
            });
        }


        actions.push({
            title: getTitleElem("Update Permissions"),
            description: getDescriptionElem(
                "Update the permissions of this collection."
            ),
            showModal: () => {
                setUpdatePermissionsIsVisible(!updatePermissionsIsVisible);
            },
        })
    }

    if (!isManager) {
        if (collection.permissions.CanManagerBeTransferred) {
            actions.push({
                title: getTitleElem("Request Manager Transfer"),
                description: getDescriptionElem(
                    "Request to become the manager of this collection."
                ),
                showModal: () => {
                    setRequestTransferManagerIsVisible(!requestTransferManagerIsVisible);
                },
            })
        }
    }

    if (!chain.connected) {
        return <div>
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

            <CreateTxMsgTransferBadgeModal
                visible={transferIsVisible}
                setVisible={setTransferIsVisible}
                collection={collection}
                userBalance={userBalance ? userBalance : { approvals: [], balances: [] }}
                refreshUserBalance={refreshUserBalance}
            />

            <CreateTxMsgTransferManagerModal
                visible={transferManagerIsVisible}
                setVisible={setTransferManagerIsVisible}
                collection={collection}
            />

            <CreateTxMsgRequestTransferManagerModal
                visible={requestTransferManagerIsVisible}
                setVisible={setRequestTransferManagerIsVisible}
                collection={collection}
            />

            <CreateTxMsgUpdatePermissionsModal
                visible={updatePermissionsIsVisible}
                setVisible={setUpdatePermissionsIsVisible}
                collection={collection}
            />
        </div >
    );
}
