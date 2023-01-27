import React, { useState } from 'react';

import { CanCreateMoreBadgesDigit, CanManagerBeTransferredDigit, CanUpdateDisallowedDigit, CanUpdateUrisDigit, GetPermissions, Permissions, UpdatePermissions } from '../../../bitbadges-api/permissions';
import { ConfirmManager } from '../form/ConfirmManager';
import { FormTimeline } from '../form/FormTimeline';
import { SubassetSupply } from '../form/SubassetSupply';
import { SwitchForm } from '../form/SwitchForm';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { MetadataAddMethod } from '../MintTimeline';
import { CreateClaim } from '../form/CreateClaim';
import { ManualTransfers } from '../form/ManualTransfers';

enum DistributionMethod {
    None,
    Transfer,
    Claim,
}

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
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    newBadgeMetadata: BadgeMetadata;
    setNewBadgeMetadata: (metadata: BadgeMetadata) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
}) {
    const [handledPermissions, setHandledPermissions] = useState<Permissions>({
        CanUpdateBytes: false,
        CanUpdateUris: false,
        CanManagerBeTransferred: false,
        CanUpdateDisallowed: false,
        CanCreateMoreBadges: false,
    });

    const [handledDisallowedTransfers, setHandledDisallowedTransfers] = useState<boolean>(false);
    const [fungible, setFungible] = useState(false);
    const [nonFungible, setNonFungible] = useState(false);
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);


    //TODO: abstract all these to their own exportable components
    return (
        <FormTimeline
            currStepNumber={1}
            items={[
                {
                    title: 'Confirm Manager',
                    description: 'Every badge needs a manager. For this badge, your address below will be the manager.',
                    node: <ConfirmManager />
                },

                {
                    //TODO: add semi-fungible and random assortments of supplys / amounts support
                    title: 'Fungible or Non-Fungible?',
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        selectedTitle={"Fungible"}
                        unselectedTitle={"Non-Fungible"}
                        onSwitchChange={(nonFungible, fungible) => {
                            if (fungible) {
                                setFungible(true);
                                setNonFungible(false);
                            } else if (nonFungible) {
                                setFungible(false);
                                setNonFungible(true);
                            }
                        }}
                        isOptionOneSelected={nonFungible}
                        isOptionTwoSelected={fungible}
                        unselectedMessage={'Every minted badge will have its own unique metadata and characteristics.'}
                        selectedMessage={`Every minted badge will have the same metadata and characteristics.`}
                    // helperMessage={`If you only intend on creating one badge, this answer will not matter.`}
                    />,
                    disabled: !fungible && !nonFungible
                },
                {
                    //TODO: make this and the previous one into a much more customizable one
                    title: `How Many ${fungible ? 'Fungible' : 'Non-Fungible'} Badges To Create?`,
                    description: 'What do you want the supply of this badge to be?',
                    node: <SubassetSupply newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} fungible={fungible} />,
                    disabled: newBadgeMsg.badgeSupplys?.length == 0 || newBadgeMsg.badgeSupplys?.length == 0
                },
                {
                    title: `How Would You Like To Distribute These Badges?`,
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        selectedTitle={"Manual Transfers"}
                        unselectedTitle={"Claiming Process"}
                        onSwitchChange={(claim, transfer) => {
                            if (transfer) {
                                setDistributionMethod(DistributionMethod.Transfer);
                            } else if (claim) {
                                setDistributionMethod(DistributionMethod.Claim);
                            }
                        }}
                        isOptionOneSelected={distributionMethod == DistributionMethod.Claim}
                        isOptionTwoSelected={distributionMethod == DistributionMethod.Transfer}
                        unselectedMessage={'Have users claim these badges according to some rules you set (e.g. secret codes, specific addresses, first come first serve, etc).'}
                        selectedMessage={`Manually distribute these badges to specific addresses. You will pay all transfer fees.`}
                    />,
                    disabled: distributionMethod == DistributionMethod.None
                },
                distributionMethod === DistributionMethod.Transfer ?
                    {
                        title: `Distribute via Manual Transfers`,
                        description: '',
                        node: <ManualTransfers newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} />,
                    } : {
                        title: `Distribute via Claiming Process`,
                        description: '',
                        node: <CreateClaim newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} />,
                    },
                {
                    title: 'Can Create More Badges ?',
                    description: `This collection currently contains ${newBadgeMsg.badgeSupplys[0]?.amount} badge${newBadgeMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''} (supply = ${newBadgeMsg.badgeSupplys[0]?.supply}). Do you want the ability to add badges to this collection in the future?`,
                    node: <>
                        <SwitchForm
                            selectedTitle={'Yes'}
                            unselectedTitle={'No'}
                            onSwitchChange={(canNotAdd, canAdd) => {

                                if (canNotAdd) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateMoreBadgesDigit, false);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                } else if (canAdd) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateMoreBadgesDigit, true);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                }

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreateMoreBadges = true;
                                setHandledPermissions(newHandledPermissions);
                            }}
                            isOptionOneSelected={handledPermissions.CanCreateMoreBadges && !GetPermissions(newBadgeMsg.permissions).CanCreateMoreBadges}
                            isOptionTwoSelected={handledPermissions.CanCreateMoreBadges && !!GetPermissions(newBadgeMsg.permissions).CanCreateMoreBadges}
                            selectedMessage={`The manager may create new badges and add them to this collection.`}
                            unselectedMessage={`The collection will permanently contain ${newBadgeMsg.badgeSupplys[0]?.amount} badge${newBadgeMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''}.`}
                            helperMessage={`If you select 'Yes', you can switch to 'No' at any point in the future.`}
                        />
                    </>,
                },
                //TODO: add other common options for transferability
                {
                    title: 'Transferable?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            selectedTitle={'Transferable'}
                            unselectedTitle={'Non-Transferable'}
                            onSwitchChange={(nonTransferable, transferable) => {
                                setHandledDisallowedTransfers(true);
                                if (transferable) {
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        disallowedTransfers: [],
                                    })
                                } else if (nonTransferable) {
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        disallowedTransfers: [
                                            {
                                                to: {
                                                    accountNums: [
                                                        {
                                                            start: 0,
                                                            end: 1000 //TODO: change to max uint64
                                                        }
                                                    ],
                                                    options: 0,
                                                },
                                                from: {
                                                    accountNums: [
                                                        {
                                                            start: 0,
                                                            end: 1000 //TODO: change to max uint64
                                                        }
                                                    ],
                                                    options: 0,
                                                },
                                            },
                                        ],
                                    })
                                }
                            }}
                            isOptionOneSelected={handledDisallowedTransfers && (newBadgeMsg.disallowedTransfers?.length > 0)}
                            isOptionTwoSelected={handledDisallowedTransfers && !(newBadgeMsg.disallowedTransfers?.length > 0)}

                            selectedMessage={`Owners of this badge will be able to transfer it.`}
                            unselectedMessage={`Owners of this badge will not be able to transfer it.`}
                        />
                    </>,
                },
                {
                    title: `Can Manager Freeze/Unfreeze Addresses?`,
                    //TODO: add whitelist freeze/ unfreeze support (w/ manager when frozen by default)
                    //make this clear in the messages
                    description: `Would you (the manager) like to be able to freeze/unfreeze addresses from transferring this badge?`,
                    node: <SwitchForm
                        onSwitchChange={(canNotFreeze, canFreeze) => {

                            if (canNotFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanUpdateDisallowedDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (canFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanUpdateDisallowedDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanUpdateDisallowed = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanUpdateDisallowed && !GetPermissions(newBadgeMsg.permissions).CanUpdateDisallowed}
                        isOptionTwoSelected={handledPermissions.CanUpdateDisallowed && !!GetPermissions(newBadgeMsg.permissions).CanUpdateDisallowed}
                        selectedMessage={`The manager can freeze and unfreeze any owner's ability to transfer this badge.`}
                        unselectedMessage={`The manager can not freeze and unfreeze any owner's ability to transfer this badge.`}
                        helperMessage={`If you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanUpdateDisallowed
                },
                {
                    title: 'Can Manager Be Transferred?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noTransfersAllowed, transfersAllowed) => {
                            if (noTransfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerBeTransferredDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (transfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerBeTransferredDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanManagerBeTransferred = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanManagerBeTransferred && !GetPermissions(newBadgeMsg.permissions).CanManagerBeTransferred}
                        isOptionTwoSelected={handledPermissions.CanManagerBeTransferred && !!GetPermissions(newBadgeMsg.permissions).CanManagerBeTransferred}
                        selectedMessage={'You can transfer managerial privileges to another address in the future, if desired.'}
                        unselectedMessage={`You will permanently be manager of this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanManagerBeTransferred
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
                //         unselectedMessage={`No new badges will be able to be created later. You have currently selected to create ${badge.badgeSupplys?.length} unique badge(s).`}
                //     />,
                // },

                // //TODO:
                // {
                //     title: 'Can Badges Be Revoked?',
                //     description: ``,
                //     node: <SwitchForm
                //         onSwitchChange={(canNotRevoke, canRevoke) => {
                //             if (canNotRevoke) {
                //                 const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, false);
                //                 setNewBadgeMsg({
                //                     ...newBadgeMsg,
                //                     permissions: newPermissions
                //                 })
                //             } else if (canRevoke) {
                //                 const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, true);
                //                 setNewBadgeMsg({
                //                     ...newBadgeMsg,
                //                     permissions: newPermissions
                //                 })
                //             }

                //             //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                //             let newHandledPermissions = { ...handledPermissions };
                //             newHandledPermissions.CanRevoke = true;
                //             setHandledPermissions(newHandledPermissions);
                //         }}
                //         isOptionOneSelected={handledPermissions.CanRevoke && !GetPermissions(newBadgeMsg.permissions).CanRevoke}
                //         isOptionTwoSelected={handledPermissions.CanRevoke && !!GetPermissions(newBadgeMsg.permissions).CanRevoke}
                //         selectedMessage={`The manager will be able to forcefully revoke this badge from an owner at anytime.`}
                //         unselectedMessage={`The manager will not be able to forcefully revoke this badge.`}
                //         helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                //     />,
                //     disabled: !handledPermissions.CanRevoke
                // },


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
