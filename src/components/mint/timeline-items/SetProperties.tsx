import React, { useState } from 'react';

import { CanCreateMoreBadgesDigit, CanManagerBeTransferredDigit, CanUpdateDisallowedDigit, CanUpdateUrisDigit, GetPermissions, Permissions, UpdatePermissions } from '../../../bitbadges-api/permissions';
import { ConfirmManager } from '../form/ConfirmManager';
import { FormTimeline } from '../form/FormTimeline';
import { BadgeSupply } from '../form/BadgeSupplySelect';
import { SwitchForm } from '../form/SwitchForm';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeMetadata, ClaimItem } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { MetadataAddMethod } from '../MintTimeline';
import { CreateClaims } from '../form/CreateClaims';
import { FirstComeFirstServe } from '../form/FirstComeFirstServe';
import saveAs from 'file-saver';
import { Button, InputNumber } from 'antd';

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

export const EmptyFormItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}

export function SetProperties({
    setCurrStepNumber,
    newCollectionMsg,
    setNewCollectionMsg,
    collectionMetadata,
    setCollectionMetadata,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
    addMethod,
    setAddMethod,
    claimItems,
    setClaimItems,
    distributionMethod,
    setDistributionMethod,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
    claimItems: ClaimItem[];
    setClaimItems: (claimItems: ClaimItem[]) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    distributionMethod: DistributionMethod;
    setDistributionMethod: (method: DistributionMethod) => void;
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

    const [id, setId] = useState(0);


    //TODO: abstract all these to their own exportable components
    return (
        <FormTimeline
            currStepNumber={1}
            items={[
                {
                    title: 'Confirm Manager',
                    description: 'Every badge collection needs a manager. For this collection, your address below will be the manager.',
                    node: <ConfirmManager />
                },
                {
                    //TODO: add semi-fungible and random assortments of supplys / amounts support
                    title: 'Identical or Unique Badges?',
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        options={[
                            {
                                title: 'Identical',
                                message: 'Badges will all be identical. The collection will consist of 1 badge with supply Y (fungible).',
                                isSelected: fungible,
                            },
                            {
                                title: 'Unique',
                                message: 'Badges will have their own unique characteristics. The collection will consist of X badges each with supply 1 (non-fungible).',
                                isSelected: nonFungible,
                            },
                        ]}
                        onSwitchChange={(newTitle) => {
                            if (newTitle == 'Identical') {
                                setFungible(true);
                                setNonFungible(false);
                            } else if (newTitle == 'Unique') {
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
                    title: `How Many Badges To Create?`,
                    description: `${fungible ? `${newCollectionMsg.badgeSupplys[0]?.supply ?? '?'} identical` : `${newCollectionMsg.badgeSupplys[0]?.amount ?? '?'} unique`} badges will be created. ${fungible ? 'This will be the maximum total supply and cannot be changed later.' : ''}`,
                    node: <BadgeSupply newCollectionMsg={newCollectionMsg} setNewCollectionMsg={setNewCollectionMsg} fungible={fungible} />,
                    disabled: newCollectionMsg.badgeSupplys?.length == 0 || newCollectionMsg.badgeSupplys?.length == 0
                },
                nonFungible ? {
                    title: 'Can Manager Add Badges to Collection?',
                    description: `This collection currently contains ${newCollectionMsg.badgeSupplys[0]?.amount} unique badge${newCollectionMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''}.`,
                    node: <>
                        <SwitchForm
                            options={[
                                {
                                    title: 'No',
                                    message: `The collection will permanently contain ${newCollectionMsg.badgeSupplys[0]?.amount} badge${newCollectionMsg.badgeSupplys[0]?.amount > 1 ? 's' : ''}.`,
                                    isSelected: handledPermissions.CanCreateMoreBadges && !GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges
                                },
                                {
                                    title: 'Yes',
                                    message: `The manager may create new badges and add them to this collection.`,
                                    isSelected: handledPermissions.CanCreateMoreBadges && !!GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges
                                }
                            ]}
                            onSwitchChange={(title) => {
                                if (title == 'No') {
                                    const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanCreateMoreBadgesDigit, false);
                                    setNewCollectionMsg({
                                        ...newCollectionMsg,
                                        permissions: newPermissions
                                    })
                                } else if (title == 'Yes') {
                                    const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanCreateMoreBadgesDigit, true);
                                    setNewCollectionMsg({
                                        ...newCollectionMsg,
                                        permissions: newPermissions
                                    })
                                }

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreateMoreBadges = true;
                                setHandledPermissions(newHandledPermissions);
                            }}
                        // helperMessage={`If selected, note that the manager can permanently switch off this privilege and lock the total supply.`}
                        />
                    </>,
                } : EmptyFormItem,
                //TODO: add other common options for transferability
                {
                    title: 'Transferable?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            options={[
                                {
                                    title: 'Non-Transferable',
                                    message: `Badge owners cannot transfer their badges to other addresses.`,
                                    isSelected: handledDisallowedTransfers && newCollectionMsg.disallowedTransfers.length > 0
                                },
                                {
                                    title: 'Transferable',
                                    message: `Badge owners can transfer their badges to other addresses.`,
                                    isSelected: handledDisallowedTransfers && newCollectionMsg.disallowedTransfers.length == 0
                                },
                            ]}


                            onSwitchChange={(title) => {
                                const transferable = title == 'Transferable';
                                const nonTransferable = title == 'Non-Transferable';
                                setHandledDisallowedTransfers(true);
                                if (transferable) {
                                    setNewCollectionMsg({
                                        ...newCollectionMsg,
                                        disallowedTransfers: [],
                                    })
                                } else if (nonTransferable) {
                                    setNewCollectionMsg({
                                        ...newCollectionMsg,
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
                    title: `Can Manager Freeze and Unfreeze Addresses?`,
                    //TODO: add whitelist freeze/ unfreeze support
                    //make this clear in the messages
                    description: ``,
                    node: <SwitchForm
                        options={[
                            {
                                title: 'No',
                                message: `The manager cannot freeze or unfreeze any owner's ability to transfer badges in this collection. Badges will always be ${newCollectionMsg.disallowedTransfers.length > 0 ? 'non-transferable.' : 'transferable.'}`,
                                isSelected: handledPermissions.CanUpdateDisallowed && !GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                            },
                            {
                                title: 'Yes',
                                message: `The manager can freeze and unfreeze any owner's ability to transfer badges in this collection.`,
                                isSelected: handledPermissions.CanUpdateDisallowed && !!GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                            },
                        ]}
                        onSwitchChange={(title) => {
                            const canFreeze = title == 'Yes';
                            const canNotFreeze = title == 'No';
                            if (canNotFreeze) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanUpdateDisallowedDigit, false);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            } else if (canFreeze) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanUpdateDisallowedDigit, true);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanUpdateDisallowed = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                    // helperMessage={`If you select 'Yes', you can switch to 'No' at any point in the future.`}
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
                                message: `The role of the manager cannot be transferred to another address.`,
                                isSelected: handledPermissions.CanManagerBeTransferred && !GetPermissions(newCollectionMsg.permissions).CanManagerBeTransferred
                            },
                            {
                                title: 'Yes',
                                message: `The role of the manager can be transferred to another address.`,
                                isSelected: handledPermissions.CanManagerBeTransferred && !!GetPermissions(newCollectionMsg.permissions).CanManagerBeTransferred
                            }
                        ]}

                        onSwitchChange={(title) => {
                            const noTransfersAllowed = title == 'No';
                            const transfersAllowed = title == 'Yes';
                            if (noTransfersAllowed) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanManagerBeTransferredDigit, false);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            } else if (transfersAllowed) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanManagerBeTransferredDigit, true);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanManagerBeTransferred = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                    // helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanManagerBeTransferred
                },
                {
                    title: 'Metadata Storage',
                    description: `Choose how to store metadata for the badges in this collection.`,
                    node: <SwitchForm
                        options={[
                            {
                                title: 'Self-Hosted (Advanced)',
                                message: `Select this option if you want to store and host the metadata yourself. You will provide a custom URI that is used to fetch the metadata.`,
                                isSelected: addMethod === MetadataAddMethod.UploadUrl,
                            },
                            {
                                title: 'IPFS (Recommended)',
                                message: `We will handle the storage of the metadata for you! We do this using the InterPlanetary File System (IPFS).`,
                                isSelected: addMethod === MetadataAddMethod.Manual,
                            },
                        ]}
                        onSwitchChange={(title) => {
                            if (title === 'IPFS (Recommended)') {
                                setAddMethod(MetadataAddMethod.Manual);
                            } else if (title === 'Self-Hosted (Advanced)') {
                                setAddMethod(MetadataAddMethod.UploadUrl);
                            }
                        }}
                    />,
                },
                {
                    title: 'Updatable Metadata?',
                    description: `In the future, can the colleciton and badge metadata be updated?`,
                    node: <SwitchForm
                        options={[
                            {
                                title: 'No',
                                message: `The metadata cannot be updated and is frozen forever.`,
                                isSelected: handledPermissions.CanUpdateUris && !GetPermissions(newCollectionMsg.permissions).CanUpdateUris
                            },
                            {
                                title: 'Yes',
                                message: `The metadata can be updated in the future.`,
                                isSelected: handledPermissions.CanUpdateUris && !!GetPermissions(newCollectionMsg.permissions).CanUpdateUris,
                            },
                        ]}
                        onSwitchChange={(title) => {
                            const frozenMetadata = title == 'No';
                            const updatableMetadata = title == 'Yes';
                            if (frozenMetadata) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanUpdateUrisDigit, false);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            } else if (updatableMetadata) {
                                const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanUpdateUrisDigit, true);
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanUpdateUris = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                    />,
                },
                //TODO: add preview
                {
                    title: 'Set the Collection Metadata',
                    description: `Provide details about the badge collection. ${!GetPermissions(newCollectionMsg.permissions).CanUpdateUris ? 'This metadata will be permanent and uneditable!' : ''}`,
                    node: <FullMetadataForm
                        addMethod={addMethod}
                        setAddMethod={setAddMethod}
                        metadata={collectionMetadata}
                        setMetadata={setCollectionMetadata as any}
                        setNewCollectionMsg={setNewCollectionMsg}
                        newCollectionMsg={newCollectionMsg}
                    />,
                    disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
                        || (addMethod === MetadataAddMethod.UploadUrl && !(newCollectionMsg.badgeUri.indexOf('{id}') == -1))
                },
                //TODO: add preview
                addMethod === MetadataAddMethod.Manual ?
                    {
                        title: 'Set Individual Badge Metadata',
                        description: <>Currently Setting Metadata for Badge ID: <InputNumber min={0} max={individualBadgeMetadata.length - 1} value={id} onChange={(e) => setId(e)} /></>,
                        node: <FullMetadataForm
                            id={id}
                            metadata={individualBadgeMetadata}
                            setMetadata={setIndividualBadgeMetadata as any}
                            addMethod={addMethod}
                            setAddMethod={setAddMethod}
                            setNewCollectionMsg={setNewCollectionMsg}
                            newCollectionMsg={newCollectionMsg}
                        />,
                        disabled: !(individualBadgeMetadata[id]?.name)
                    } : EmptyFormItem,
                {
                    title: `How Would You Like To Distribute These Badges?`,
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        options={[
                            {
                                title: 'Anyone Can Claim (First Come, First Serve)',
                                message: `First come, first serve. ${fungible ? 'Anyone can claim badges until the supply runs out (one claim per account).' : 'The first user to claim will receive the badge with ID 0, the second user will receive ID 1, and so on.'}`,
                                isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
                            },
                            {
                                title: 'Codes',
                                message: 'Generate secret codes that can be redeemed for badges. You choose how to distribute these codes.',
                                isSelected: distributionMethod == DistributionMethod.Codes,
                            },
                            {
                                title: 'Specific Addresses',
                                message: 'Whitelist addresses to claim specific badges.',
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
                    fungible ? {
                        title: `How Many Badges Can Each Account Claim?`,
                        description: `This collection has ${newCollectionMsg.badgeSupplys[0]?.supply ?? '?'} identical badges. How many will each account be able to receive per claim?`,
                        node: <FirstComeFirstServe newCollectionMsg={newCollectionMsg} setNewCollectionMsg={setNewCollectionMsg} fungible={fungible} />,
                    } : EmptyFormItem
                    : distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.SpecificAddresses ?
                        {
                            title: `Create Claims`,
                            description: '',
                            node: <CreateClaims
                                newCollectionMsg={newCollectionMsg} setNewCollectionMsg={setNewCollectionMsg} distributionMethod={distributionMethod}
                                claimItems={claimItems}
                                setClaimItems={setClaimItems}
                                individualBadgeMetadata={individualBadgeMetadata}
                                setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                                collectionMetadata={collectionMetadata}
                                setCollectionMetadata={setCollectionMetadata}
                            />,
                        } : EmptyFormItem,
                // addMethod == MetadataAddMethod.Manual ?
                //     {
                //         title: 'Upload Metadata',
                //         description: <>We will now upload your metadata to our permanent file storage.
                //             For backup purposes, we recommend you save a local copy as well (
                //             <button
                //                 style={{
                //                     backgroundColor: 'inherit',
                //                     color: SECONDARY_TEXT,
                //                 }}
                //                 onClick={() => {
                //                     const today = new Date();

                //                     const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                //                     const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                //                     downloadJson({
                //                         collectionMetadata: collectionMetadata,
                //                         individualBadgeMetadata: individualBadgeMetadata,
                //                     }, `metadata-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                //                 }}
                //                 className="opacity link-button"
                //             >
                //                 click here to download
                //             </button>). </>,
                //         node: <div
                //             style={{
                //                 width: '100%',
                //                 display: 'flex',
                //                 justifyContent: 'center',
                //                 alignItems: 'center',
                //                 marginTop: 20,
                //             }}
                //         >
                //             <Button
                //                 type="primary"
                //                 loading={loading}
                //                 style={{ width: '90%' }}
                //                 onClick={async () => {
                //                     setLoading(true);
                //                     setSuccess(false);
                //                     let badgeMsg = newCollectionMsg;

                //                     if (addMethod == MetadataAddMethod.Manual) {
                //                         let res = await addToIpfs(collectionMetadata, individualBadgeMetadata);

                //                         badgeMsg.collectionUri = 'ipfs://' + res.cid + '/collection';
                //                         badgeMsg.badgeUri = 'ipfs://' + res.cid + '/{id}';
                //                     }

                //                     setNewCollectionMsg(badgeMsg);

                //                     setSuccess(true);
                //                     setLoading(false);
                //                 }}
                //                 disabled={success}
                //             >
                //                 Upload Metadata {success && <CheckCircleFilled
                //                     style={{
                //                         color: 'green',
                //                     }}
                //                 />}
                //             </Button>
                //         </div>,
                //         disabled: !success,

                //     } : EmptyFormItem,
                // distributionMethod == DistributionMethod.SpecificAddresses || distributionMethod == DistributionMethod.Codes ?
                //     {
                //         title: 'Upload Distribution Details',
                //         description: <>To aid us in properly distributing your badges, we will now upload your selected distribution details to our permanent file storage.
                //             For backup purposes, we recommend you save a local copy as well (
                //             <button
                //                 style={{
                //                     backgroundColor: 'inherit',
                //                     color: SECONDARY_TEXT,
                //                 }}
                //                 onClick={() => {
                //                     const today = new Date();

                //                     const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                //                     const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                //                     downloadJson({
                //                         claimItems: claimItems,
                //                     }, `merkleTree-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                //                 }}
                //                 className="opacity link-button"
                //             >
                //                 click here to download
                //             </button>). </>,
                //         node: <div
                //             style={{
                //                 width: '100%',
                //                 display: 'flex',
                //                 justifyContent: 'center',
                //                 alignItems: 'center',
                //                 marginTop: 20,
                //             }}
                //         >
                //             <Button
                //                 type="primary"
                //                 loading={loading}
                //                 style={{ width: '90%' }}
                //                 onClick={async () => {
                //                     setDistributionLoading(true);
                //                     setDistributionSuccess(false);
                //                     let badgeMsg = newCollectionMsg;

                //                     if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.SpecificAddresses) {
                //                         let merkleTreeRes = await addMerkleTreeToIpfs(claimItems);
                //                         badgeMsg.claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                //                     }

                //                     setNewCollectionMsg(badgeMsg);

                //                     setDistributionSuccess(true);
                //                     setDistributionLoading(false);
                //                 }}
                //                 disabled={success}
                //             >
                //                 Upload Metadata {success && <CheckCircleFilled
                //                     style={{
                //                         color: 'green',
                //                     }}
                //                 />}
                //             </Button>
                //         </div>,
                //         disabled: !distributionSuccess,
                //     } : EmptyFormItem,








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
                //                 const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanRevokeDigit, false);
                //                 setNewCollectionMsg({
                //                     ...newCollectionMsg,
                //                     permissions: newPermissions
                //                 })
                //             } else if (canRevoke) {
                //                 const newPermissions = UpdatePermissions(newCollectionMsg.permissions, CanRevokeDigit, true);
                //                 setNewCollectionMsg({
                //                     ...newCollectionMsg,
                //                     permissions: newPermissions
                //                 })
                //             }

                //             //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                //             let newHandledPermissions = { ...handledPermissions };
                //             newHandledPermissions.CanRevoke = true;
                //             setHandledPermissions(newHandledPermissions);
                //         }}
                //         isOptionOneSelected={handledPermissions.CanRevoke && !GetPermissions(newCollectionMsg.permissions).CanRevoke}
                //         isOptionTwoSelected={handledPermissions.CanRevoke && !!GetPermissions(newCollectionMsg.permissions).CanRevoke}
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
