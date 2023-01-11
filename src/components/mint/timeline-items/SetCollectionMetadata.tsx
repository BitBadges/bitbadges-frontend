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


export function SetCollectionMetadata({
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
    const chain = useChainContext();

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
                    title: 'Set the Collection Metadata',
                    description: `Individual badges will be created later.`,
                    node: <FullMetadataForm
                        addMethod={addMethod}
                        setAddMethod={setAddMethod}
                        metadata={newBadgeMetadata}
                        setMetadata={setNewBadgeMetadata as any}
                        setNewBadgeMsg={setNewBadgeMsg}
                        newBadgeMsg={newBadgeMsg}
                    />,
                    disabled: (addMethod === MetadataAddMethod.Manual && !(newBadgeMetadata?.name))
                        || (addMethod === MetadataAddMethod.UploadUrl && !(newBadgeMsg.uri.insertIdIdx && newBadgeMsg.uri.insertIdIdx >= 0))
                },
                {
                    //TODO: add semi-fungible and random assortments of supplys / amounts support
                    title: 'Fungible or Non-Fungible?',
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        selectedTitle={"Non-Fungible"}
                        unselectedTitle={"Fungible"}
                        onSwitchChange={(fungible, nonFungible) => {
                            if (fungible) {

                                //If fungible, set canCreateMore to false. Will update with further support
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    defaultSubassetSupply: 0,
                                    permissions: newPermissions
                                })

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            } else if (nonFungible) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions,
                                    defaultSubassetSupply: 1
                                });

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            }
                        }}
                        isOptionOneSelected={handledPermissions.CanCreate && newBadgeMsg.defaultSubassetSupply != 1}
                        isOptionTwoSelected={handledPermissions.CanCreate && newBadgeMsg.defaultSubassetSupply == 1}
                        selectedMessage={'Every minted badge will have its own unique metadata and characteristics.'}
                        unselectedMessage={`Every minted badge will have the same metadata and characteristics.`}
                    // helperMessage={`If you only intend on creating one badge, this answer will not matter.`}
                    />,
                    disabled: newBadgeMsg.defaultSubassetSupply == undefined //This will change as well
                },
                {
                    title: `How Many ${newBadgeMsg.defaultSubassetSupply === 0 ? 'Fungible' : 'Non-Fungible'} Badges To Create?`,
                    description: 'What do you want the total supply of this badge to be? This can not be changed later.',
                    node: <SubassetSupply newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} />,
                    disabled: newBadgeMsg.subassetSupplysAndAmounts?.length == 0 || newBadgeMsg.subassetSupplysAndAmounts?.length == 0
                },
                {
                    title: 'Non-Transferable?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            selectedTitle={'Non-Transferable'}
                            unselectedTitle={'Transferable'}
                            onSwitchChange={(notFrozen, frozen) => {
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
                            isOptionOneSelected={handledPermissions.FrozenByDefault && !GetPermissions(newBadgeMsg.permissions).FrozenByDefault}
                            isOptionTwoSelected={handledPermissions.FrozenByDefault && !!GetPermissions(newBadgeMsg.permissions).FrozenByDefault}

                            selectedMessage={`Users will not be able to transfer this badge.`}
                            unselectedMessage={`Users will be able to transfer this badge.`}
                        // helperMessage={GetPermissions(newBadgeMsg.permissions).CanFreeze ? `` : `Note that you previously selected that the manager can not freeze or unfreeze any users' transfer privileges.`}
                        />

                    </>,
                    disabled: !handledPermissions.FrozenByDefault
                },
                {
                    title: 'Forceful Transfers?',
                    description: ``,
                    node: <SwitchForm
                        selectedTitle={'Forceful Transfers'}
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
                            GetPermissions(newBadgeMsg.permissions).FrozenByDefault ?
                                `When this badge is initially minted, it will be forcefully transferred to the recipient's account without needing approval.` :
                                `When this badge is initially minted and whenever this badge is transferred between users, it will be forcefully transferred to the recipient's account without needing approval.`
                        }
                        unselectedMessage={
                            GetPermissions(newBadgeMsg.permissions).FrozenByDefault ?
                                `When this badge is initially minted, it will go into a pending queue until the recipient approves or denies the transfer.` :
                                `When this badge is initially minted and whenever this badge is transferred between users, it will go into a pending queue until the recipient approves or denies the transfer.`
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
                        unselectedMessage={`The mnager can not freeze and unfreeze any owner's ability to transfer this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
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
