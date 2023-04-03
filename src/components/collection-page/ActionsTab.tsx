import { Card, Empty, message } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useState } from 'react';
import { BitBadgeCollection, UserBalance } from 'bitbadges-sdk';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgMintBadgeModal } from '../tx-modals/CreateTxMsgMintBadgeModal';
import { CreateTxMsgRequestTransferManagerModal } from '../tx-modals/CreateTxMsgRequestTransferManagerModal';
import { CreateTxMsgTransferBadgeModal } from '../tx-modals/CreateTxMsgTransferBadge';
import { CreateTxMsgTransferManagerModal } from '../tx-modals/CreateTxMsgTransferManagerModal';
import { CreateTxMsgUpdateDisallowedTransfersModal } from '../tx-modals/CreateTxMsgUpdateDisallowedTransfers';
import { CreateTxMsgUpdatePermissionsModal } from '../tx-modals/CreateTxMsgUpdatePermissions';
import { CreateTxMsgUpdateUrisModal } from '../tx-modals/CreateTxMsgUpdateUrisModal';
import { refreshMetadataOnBackend } from '../../bitbadges-api/api';

export function ActionsTab({
    collection,

    userBalance,
    refreshUserBalance,
    badgeView
}: {
    collection?: BitBadgeCollection;
    userBalance?: UserBalance;
    refreshUserBalance: () => Promise<void>;
    badgeView?: boolean;
}) {
    const chain = useChainContext();
    const accountNumber = chain.accountNumber;

    //Modal visibilities
    const [transferIsVisible, setTransferIsVisible] = useState(false);
    const [transferManagerIsVisible, setTransferManagerIsVisible] = useState(false);
    const [updatePermissionsIsVisible, setUpdatePermissionsIsVisible] = useState(false);
    const [distributeIsVisible, setDistributeIsVisible] = useState(false);
    const [addBadgesIsVisible, setAddBadgesIsVisible] = useState(false);
    const [updateMetadataIsVisible, setUpdateMetadataIsVisible] = useState(false);
    const [requestTransferManagerIsVisible, setRequestTransferManagerIsVisible] = useState(false);
    const [updateDisallowedIsVisible, setUpdateDisallowedIsVisible] = useState(false);


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
            "Transfer badge(s) in this collection, if allowed."
        ),
        showModal: () => {
            setTransferIsVisible(!transferIsVisible);
        },
    });


    if (isManager && !badgeView) {
        if (collection.permissions.CanCreateMoreBadges) {
            actions.push({
                title: getTitleElem("Add Badges"),
                description: getDescriptionElem(
                    "Add new badges to the collection."
                ),
                showModal: () => {
                    setAddBadgesIsVisible(!addBadgesIsVisible);
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
                    setDistributeIsVisible(!distributeIsVisible);
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
                    setUpdateMetadataIsVisible(!updateMetadataIsVisible);
                },
            });
        }

        if (collection.permissions.CanUpdateDisallowed) {
            actions.push({
                title: getTitleElem("Edit Transferability"),
                description: getDescriptionElem(
                    "Freeze or unfreeze if badge owners able to transfer."
                ),
                showModal: () => {
                    setUpdateDisallowedIsVisible(!updateDisallowedIsVisible);
                    // router.push(`/updateDisallowed/${collection.collectionId}`);
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

        actions.push({
            title: getTitleElem("Refresh Metadata"),
            description: getDescriptionElem(
                "Perform a forceful refresh for all metadata for this collection."
            ),
            showModal: async () => {
                try {
                    await refreshMetadataOnBackend(collection.collectionId);
                    message.success("Added to the refresh queue! It may take awhile for the refresh to be processed. Please check back later.");
                } catch (e) {
                    message.error("Oops! Something went wrong. Please try again later.");
                }
            },
        })
    }

    if (!isManager && !badgeView) {
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

            <CreateTxMsgMintBadgeModal
                visible={addBadgesIsVisible}
                setVisible={setAddBadgesIsVisible}
                txType='AddBadges'
                collectionId={collection.collectionId}
            />

            <CreateTxMsgMintBadgeModal
                visible={distributeIsVisible}
                setVisible={setDistributeIsVisible}
                txType='DistributeBadges'
                collectionId={collection.collectionId}
            />


            <CreateTxMsgUpdateUrisModal
                visible={updateMetadataIsVisible}
                setVisible={setUpdateMetadataIsVisible}
                collectionId={collection.collectionId}
            />

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

            <CreateTxMsgUpdateDisallowedTransfersModal
                visible={updateDisallowedIsVisible}
                setVisible={setUpdateDisallowedIsVisible}
                collectionId={collection.collectionId}
            />

        </div >
    );
}
