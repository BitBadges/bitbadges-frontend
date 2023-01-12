import React, { useState } from 'react';

import { CanCreateDigit, CanFreezeDigit, CanManagerTransferDigit, CanRevokeDigit, CanUpdateUrisDigit, ForcefulTransfersDigit, FrozenByDefaultDigit, GetPermissions, Permissions, UpdatePermissions } from '../../../bitbadges-api/permissions';
import { ConfirmManager } from '../form/ConfirmManager';
import { FormTimeline } from '../form/FormTimeline';
import { SubassetSupply } from '../form/SubassetSupply';
import { SwitchForm } from '../form/SwitchForm';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { MetadataAddMethod } from '../MintTimeline';


export function SetProperties({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    newBadgeMetadata,
    setNewBadgeMetadata,
    addMethod,
    setAddMethod,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
    newBadgeMetadata: BadgeMetadata;
    setNewBadgeMetadata: (metadata: BadgeMetadata) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
}) {
    const [handledPermissions, setHandledPermissions] = useState<Permissions>({
        CanUpdateBytes: false,
        CanUpdateUris: false,
        CanCreate: false,
        CanManagerTransfer: false,
        CanFreeze: false,
        CanRevoke: false,
        ForcefulTransfers: false,
        FrozenByDefault: false
    });

    //TODO: abstract all these to their own exportable components
    return (
        <FormTimeline
            currStepNumber={1}
            items={[
                {
                    title: 'Confirm Manager',
                    description: 'Every badge needs a manager. For this badge, the address below will be the manager.',
                    node: <ConfirmManager />
                },

                {
                    title: 'Transferable?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            selectedTitle={'Transferable'}
                            unselectedTitle={'Non-Transferable'}
                            onSwitchChange={(frozen, notFrozen) => {
                                if (notFrozen) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, FrozenByDefaultDigit, false);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                } else if (frozen) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, FrozenByDefaultDigit, true);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                }

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.FrozenByDefault = true;
                                setHandledPermissions(newHandledPermissions);
                            }}
                            isOptionOneSelected={handledPermissions.FrozenByDefault && !!GetPermissions(newBadgeMsg.permissions).FrozenByDefault}
                            isOptionTwoSelected={handledPermissions.FrozenByDefault && !GetPermissions(newBadgeMsg.permissions).FrozenByDefault}

                            selectedMessage={`Owners of this badge will be able to transfer it to other addresses.`}
                            unselectedMessage={`Owners of this badge will not be able to transfer it.`}
                        // helperMessage={GetPermissions(newBadgeMsg.permissions).CanFreeze ? `` : `Note that you previously selected that the manager can not freeze or unfreeze any users' transfer privileges.`}
                        />

                    </>,
                    disabled: !handledPermissions.FrozenByDefault
                },
                {
                    title: 'Method of Receiving This Badge?',
                    description: ``,
                    node: <SwitchForm
                        selectedTitle={'Immediate Transfer'}
                        unselectedTitle={'Pending Queue'}
                        onSwitchChange={(noForceful, forceful) => {
                            if (noForceful) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, ForcefulTransfersDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (forceful) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, ForcefulTransfersDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.ForcefulTransfers = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.ForcefulTransfers && !GetPermissions(newBadgeMsg.permissions).ForcefulTransfers}
                        isOptionTwoSelected={handledPermissions.ForcefulTransfers && !!GetPermissions(newBadgeMsg.permissions).ForcefulTransfers}
                        selectedMessage={
                            `Upon mints and transfers, the badge will be transferred to the recipient's account immediately without needing approval.`
                        }
                        unselectedMessage={
                            `Upon mints and transfers, the badge will go into a pending queue until the recipient approves or denies the transfer.`
                        }
                    // helperMessage={`Note that this site does not display forceful badges by default.`}
                    />,
                    disabled: !handledPermissions.ForcefulTransfers
                },
                {
                    title: 'Can Manager Be Transferred?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noTransfersAllowed, transfersAllowed) => {
                            if (noTransfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerTransferDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (transfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerTransferDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanManagerTransfer = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanManagerTransfer && !GetPermissions(newBadgeMsg.permissions).CanManagerTransfer}
                        isOptionTwoSelected={handledPermissions.CanManagerTransfer && !!GetPermissions(newBadgeMsg.permissions).CanManagerTransfer}
                        selectedMessage={'You can transfer managerial privileges to another address in the future, if desired.'}
                        unselectedMessage={`You will permanently be manager of this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanManagerTransfer
                },
                {
                    title: `Can Manager ${GetPermissions(newBadgeMsg.permissions).FrozenByDefault ? 'Unfreeze' : 'Freeze'} Addresses?`,
                    //TODO: add whitelist freeze/ unfreeze support (w/ manager when frozen by default)
                    //make this clear in the messages
                    description: `You have selected for this badge to be ${GetPermissions(newBadgeMsg.permissions).FrozenByDefault ? 'non-transferable. Should the manager have the privilege of allowing transfers from certain addresses?' : 'transferable. Should the manager have the privilege of disabling transfers from certain addresses?'}`,
                    node: <SwitchForm
                        onSwitchChange={(canNotFreeze, canFreeze) => {
                            if (canNotFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanFreezeDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (canFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanFreezeDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanFreeze = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanFreeze && !GetPermissions(newBadgeMsg.permissions).CanFreeze}
                        isOptionTwoSelected={handledPermissions.CanFreeze && !!GetPermissions(newBadgeMsg.permissions).CanFreeze}
                        selectedMessage={`The manager can freeze and unfreeze any owner's ability to transfer this badge.`}
                        unselectedMessage={`The manager can not freeze and unfreeze any owner's ability to transfer this badge.`}
                        helperMessage={`If you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanFreeze
                },


                // {
                //TODO: add support for this
                //     title: 'Can More Badges Be Created Later?',
                //     description: ``,
                //     node: <SwitchForm
                //         onSwitchChange={(value) => {
                //             //TODO: set permissions
                //             //and undisable next button
                //         }}
                //         defaultValue={false}
                //         selectedMessage={`Yes, new badges can be created later by the current manager. This permission can be permanently locked at anytime.`}
                //         unselectedMessage={`No new badges will be able to be created later. You have currently selected to create ${badge.subassetSupplys?.length} unique badge(s).`}
                //     />,
                // },
                {
                    title: 'Can Badges Be Revoked?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(canNotRevoke, canRevoke) => {
                            if (canNotRevoke) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (canRevoke) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanRevoke = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanRevoke && !GetPermissions(newBadgeMsg.permissions).CanRevoke}
                        isOptionTwoSelected={handledPermissions.CanRevoke && !!GetPermissions(newBadgeMsg.permissions).CanRevoke}
                        selectedMessage={`The manager will be able to forcefully revoke this badge from an owner at anytime.`}
                        unselectedMessage={`The manager will not be able to forcefully revoke this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanRevoke
                },


                //TODO: updatable metadata
                //TODO: create more
                //TODO: semi-fungible
                //TODO: different storage types
                //TODO: whitelist freeze
                //TODO: whitelist mint
                //TODO: bytes and updateBytes
                //TODO: more metadata!!!!!
                //TODO: previews
                //TODO: confirmations
            ]}
            setCurrStepNumber={setCurrStepNumber}
        />
    );
}
