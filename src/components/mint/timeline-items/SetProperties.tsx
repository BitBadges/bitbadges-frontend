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
import { FirstComeFirstServe } from '../form/FirstComeFirstServe';

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

export function SetProperties({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    newBadgeMetadata,
    setNewBadgeMetadata,
    addMethod,
    setAddMethod,
    leaves,
    setLeaves,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    newBadgeMetadata: BadgeMetadata;
    setNewBadgeMetadata: (metadata: BadgeMetadata) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
    leaves: string[];
    setLeaves: (leaves: string[]) => void;
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
                        options={[
                            {
                                title: 'Fungible',
                                message: 'Every minted badge will have the same metadata and characteristics.',
                                isSelected: fungible,
                            },
                            {
                                title: 'Non-Fungible',
                                message: 'Every minted badge will have its own unique metadata and characteristics.',
                                isSelected: nonFungible,
                            },
                        ]}
                        onSwitchChange={(newTitle) => {
                            if (newTitle == 'Fungible') {
                                setFungible(true);
                                setNonFungible(false);
                            } else if (newTitle == 'Non-Fungible') {
                                setFungible(false);
                                setNonFungible(true);
                            }
                        }}
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
                        options={[
                            {
                                title: 'Anyone Can Claim (First Come, First Serve)',
                                message: 'First come, first serve. Anyone can claim until the supply runs out (one claim per account). You will be able to specify how many badges each account can claim.',
                                isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
                            },
                            {
                                title: 'Codes',
                                message: 'We will generate and give you codes that can be redeemed for badges by anyone.',
                                isSelected: distributionMethod == DistributionMethod.Codes,
                            },
                            {
                                title: 'Specific Addresses',
                                message: 'Most customizable option. You determine which and how many badges each address can receive.',
                                isSelected: distributionMethod == DistributionMethod.SpecificAddresses,
                            },
                            {
                                title: 'Unminted',
                                message: 'Do nothing now. Leave the distribution of badges for a later time.',
                                isSelected: distributionMethod == DistributionMethod.Unminted,
                            },
                        ]}
                        onSwitchChange={(newTitle) => {
                            if (newTitle == 'Anyone Can Claim (First Come, First Serve)') {
                                setDistributionMethod(DistributionMethod.FirstComeFirstServe);
                            } else if (newTitle == 'Codes') {
                                setDistributionMethod(DistributionMethod.Codes);
                            } else if (newTitle == 'Specific Addresses') {
                                setDistributionMethod(DistributionMethod.SpecificAddresses);
                            } else if (newTitle == 'Unminted') {
                                setDistributionMethod(DistributionMethod.Unminted);
                            }
                        }}
                    />,
                    disabled: distributionMethod == DistributionMethod.None
                },
                distributionMethod === DistributionMethod.FirstComeFirstServe ?
                    {
                        title: `How Many Badges Can Each Account Claim?`,
                        description: 'How many badges can each account claim?',
                        node: <FirstComeFirstServe newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} fungible={fungible} />,
                    } : distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.SpecificAddresses ?
                        {
                            title: `Distribution of Badges`,
                            description: '',
                            node: <ManualTransfers newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} distributionMethod={distributionMethod} setLeaves={setLeaves} />,
                        } : {
                            title: `Unminted`,
                            description: 'You have selected to leave all badges unminted for now, so there is nothing to do here. Please continue',
                            node: <></>,
                        },
                {
                    title: 'Can Create More Badges?',
                    description: `This collection currently contains ${newBadgeMsg.badgeSupplys[0]?.amount} badge${newBadgeMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''} (supply = ${newBadgeMsg.badgeSupplys[0]?.supply}). Do you want the ability to add badges to this collection in the future?`,
                    node: <>
                        <SwitchForm
                            options={[
                                {
                                    title: 'Yes',
                                    message: `The manager may create new badges and add them to this collection.`,
                                    isSelected: handledPermissions.CanCreateMoreBadges && !!GetPermissions(newBadgeMsg.permissions).CanCreateMoreBadges
                                },
                                {
                                    title: 'No',
                                    message: `The collection will permanently contain ${newBadgeMsg.badgeSupplys[0]?.amount} badge${newBadgeMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''}.`,
                                    isSelected: !handledPermissions.CanCreateMoreBadges && !GetPermissions(newBadgeMsg.permissions).CanCreateMoreBadges
                                }
                            ]}
                            onSwitchChange={(title) => {

                                if (title == 'No') {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateMoreBadgesDigit, false);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                } else if (title == 'Yes') {
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
                            options={[
                                {
                                    title: 'Transferable',
                                    message: `This badge can be transferred to other addresses.`,
                                    isSelected: handledDisallowedTransfers && newBadgeMsg.disallowedTransfers.length == 0
                                },
                                {
                                    title: 'Non-Transferable',
                                    message: `This badge cannot be transferred to other addresses.`,
                                    isSelected: !handledDisallowedTransfers && newBadgeMsg.disallowedTransfers.length > 0
                                }
                            ]}


                            onSwitchChange={(title) => {
                                const transferable = title == 'Transferable';
                                const nonTransferable = title == 'Non-Transferable';
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
                        />
                    </>,
                },
                {
                    title: `Can Manager Freeze/Unfreeze Addresses?`,
                    //TODO: add whitelist freeze/ unfreeze support (w/ manager when frozen by default)
                    //make this clear in the messages
                    description: `Would you (the manager) like to be able to freeze/unfreeze addresses from transferring this badge?`,
                    node: <SwitchForm
                        options={[
                            {
                                title: 'Yes',
                                message: `The manager can freeze and unfreeze any owner's ability to transfer this badge.`,
                                isSelected: handledPermissions.CanUpdateDisallowed && !!GetPermissions(newBadgeMsg.permissions).CanUpdateDisallowed
                            },
                            {
                                title: 'No',
                                message: `The manager cannot freeze or unfreeze any owner's ability to transfer this badge.`,
                                isSelected: !handledPermissions.CanUpdateDisallowed && !GetPermissions(newBadgeMsg.permissions).CanUpdateDisallowed
                            }
                        ]}
                        onSwitchChange={(title) => {
                            const canFreeze = title == 'Yes';
                            const canNotFreeze = title == 'No';
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
                        helperMessage={`If you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanUpdateDisallowed
                },
                {
                    title: 'Can Manager Be Transferred?',
                    description: ``,
                    node: <SwitchForm

                        options={[
                            {
                                title: 'No',
                                message: `The manager cannot be transferred to another address.`,
                                isSelected: handledPermissions.CanManagerBeTransferred && !GetPermissions(newBadgeMsg.permissions).CanManagerBeTransferred
                            },
                            {
                                title: 'Yes',
                                message: `The manager can be transferred to another address.`,
                                isSelected: !handledPermissions.CanManagerBeTransferred && GetPermissions(newBadgeMsg.permissions).CanManagerBeTransferred
                            }
                        ]}

                        onSwitchChange={(title) => {
                            const noTransfersAllowed = title == 'No';
                            const transfersAllowed = title == 'Yes';
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
