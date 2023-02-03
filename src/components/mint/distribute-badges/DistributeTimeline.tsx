import React, { useEffect, useState } from 'react';

import { CanCreateMoreBadgesDigit, CanManagerBeTransferredDigit, CanUpdateDisallowedDigit, CanUpdateUrisDigit, GetPermissions, Permissions, UpdatePermissions } from '../../../bitbadges-api/permissions';
import { ConfirmManager } from '../form-items/ConfirmManager';
import { FormTimeline } from '../../common/FormTimeline';
import { BadgeSupply } from '../form-items/BadgeSupplySelect';
import { SwitchForm } from '../../common/SwitchForm';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeMetadata, BitBadgeCollection, ClaimItem, UserBalance } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { FullMetadataForm } from '../form-items/FullMetadataForm';
import { CreateClaims } from '../form-items/CreateClaims';
import { FirstComeFirstServeAmountSelect } from '../form-items/FirstComeFirstServeAmountSelect';
import saveAs from 'file-saver';
import { Button, Divider, InputNumber } from 'antd';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { createCollectionFromMsgNewCollection } from '../../../bitbadges-api/badges';
import { PRIMARY_TEXT } from '../../../constants';
import MerkleTree from 'merkletreejs';
import { SHA256 } from 'crypto-js';
import { getPostTransferBalance } from '../../../bitbadges-api/balances';
import { MetadataAddMethod } from './DistributeBadgeTimeline';

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

export function MintAndDistribute({
    collection,
    setCollection,
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
    hackyUpdatedFlag,
}: {
    collection: BitBadgeCollection,
    setCollection: (collection: BitBadgeCollection) => void;
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
    hackyUpdatedFlag: boolean;
}) {
    const chain = useChainContext();

    const [handledPermissions, setHandledPermissions] = useState<Permissions>({
        CanCreateMoreBadges: false,
        CanManagerBeTransferred: false,
        CanUpdateDisallowed: false,
        CanUpdateUris: false,
        CanUpdateBytes: false,
    });

    const [handledDisallowedTransfers, setHandledDisallowedTransfers] = useState<boolean>(false);
    const [fungible, setFungible] = useState(false);
    const [nonFungible, setNonFungible] = useState(false);

    const [id, setId] = useState(0);
    const [manualSend, setManualSend] = useState(false);

    console.log("UNMINTED", collection.unmintedSupplys);

    //TODO: abstract all these to their own exportable components
    return (
        <FormTimeline
            currStepNumber={0}
            items={[
                {
                    title: `How Would You Like To Distribute The Badges?`,
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        options={[
                            // {
                            //     title: 'Anyone Can Claim (First Come, First Serve)',
                            //     message: `First come, first serve. ${fungible ? 'Anyone can claim badges until the supply runs out (one claim per account).' : 'The first user to claim will receive the badge with ID 0, the second user will receive ID 1, and so on.'}`,
                            //     isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
                            // },
                            {
                                title: 'Codes',
                                message: 'Generate secret codes that can be redeemed for badges. You choose how to distribute these codes.',
                                isSelected: distributionMethod == DistributionMethod.Codes,
                            },
                            {
                                title: 'Whitelist',
                                message: 'Whitelist specific addresses to receive badges.',
                                isSelected: distributionMethod == DistributionMethod.SpecificAddresses,
                            },
                            // {
                            //     title: 'Unminted',
                            //     message: 'Do nothing now. Leave the distribution of badges for a later time.',
                            //     isSelected: distributionMethod == DistributionMethod.Unminted,
                            // },
                        ]}
                        onSwitchChange={(newTitle) => {
                            if (newTitle == 'Anyone Can Claim (First Come, First Serve)') {
                                setDistributionMethod(DistributionMethod.FirstComeFirstServe);
                            } else if (newTitle == 'Codes') {
                                setDistributionMethod(DistributionMethod.Codes);
                            } else if (newTitle == 'Whitelist') {
                                setDistributionMethod(DistributionMethod.SpecificAddresses);
                            } else if (newTitle == 'Unminted') {
                                setDistributionMethod(DistributionMethod.Unminted);
                            }
                        }}
                    />,
                    disabled: distributionMethod == DistributionMethod.None
                },
                distributionMethod === DistributionMethod.FirstComeFirstServe ?
                    fungible ?
                        {
                            title: 'Sorry, this is currently unsupported',
                            description: '',
                            node: <></>,
                        }
                        // {
                        //     title: `How Many Badges Can Each Account Claim?`,
                        //     description: `This collection has ${newCollectionMsg.badgeSupplys[0]?.supply ?? '?'} identical badges. How many will each account be able to receive per claim?`,
                        //     node: <FirstComeFirstServeAmountSelect newCollectionMsg={newCollectionMsg} setNewCollectionMsg={setNewCollectionMsg} fungible={fungible} />,
                        // } 
                        : EmptyFormItem
                    : distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.SpecificAddresses ?
                        {
                            title: `Create Claims`,
                            description: '',
                            node: <CreateClaims
                                balancesToDistribute={collection.unmintedSupplys}
                                newCollectionMsg={newCollectionMsg}
                                setNewCollectionMsg={setNewCollectionMsg}
                                distributionMethod={distributionMethod}
                                claimItems={claimItems}
                                setClaimItems={setClaimItems}
                                individualBadgeMetadata={collection.badgeMetadata}
                                setIndividualBadgeMetadata={(metadata) => {
                                    console.log("BADGE", metadata)
                                    // setCollection({
                                    //     ...collection,
                                    //     badgeMetadata: metadata,
                                    // });
                                }}
                                collectionMetadata={collection.collectionMetadata}
                                setCollectionMetadata={(metadata) => {
                                    console.log("COLLECTION", metadata)
                                    // setCollection({
                                    //     ...collection,
                                    //     collectionMetadata: metadata,
                                    // });
                                }}
                                collection={collection}
                            />,
                            disabled: claimItems.length == 0
                        } : EmptyFormItem,
                {
                    title: `Distribution Method`,
                    description: `You have whitelisted ${claimItems.length} addresses. How would you like to distribute badges to these addresses?`,
                    node: <SwitchForm
                        options={[
                            {
                                title: 'Send Manually',
                                message: `Badges will be sent to the addresses upon creation, and you pay all transfer fees.`,
                                isSelected: manualSend,
                            },
                            {
                                title: 'Claimable (Recommended)',
                                message: 'The badges will be able to be claimed by these addresses. Each address pays their own transfer fees.',
                                isSelected: !manualSend,
                            },
                        ]}
                        onSwitchChange={(newTitle) => {
                            setManualSend(newTitle == 'Send Manually');
                            if (newTitle == 'Send Manually') {
                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    transfers: claimItems.map((x) => ({
                                        toAddresses: [x.accountNum],
                                        balances: [
                                            {
                                                balance: x.amount,
                                                badgeIds: [
                                                    {
                                                        start: x.badgeIds[0].start,
                                                        end: x.badgeIds[0].end,
                                                    }
                                                ]
                                            }
                                        ]
                                    })),
                                    claims: []
                                });
                            } else if (newTitle == 'Claimable (Recommended)') {
                                const tree = new MerkleTree(claimItems.map((x) => SHA256(x.fullCode)), SHA256)
                                const root = tree.getRoot().toString('hex')

                                const balance = {
                                    balances: [
                                        {
                                            balance: newCollectionMsg.badgeSupplys[0].supply,
                                            badgeIds: [{
                                                start: 0,
                                                end: newCollectionMsg.badgeSupplys[0].amount - 1,
                                            }]
                                        }
                                    ],
                                    approvals: [],
                                }


                                if (distributionMethod === DistributionMethod.Codes) {
                                    for (let i = 0; i < claimItems.length; i += 2) {
                                        const leaf = claimItems[i];
                                        const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                                        balance.balances = newBalance.balances;
                                    }
                                } else if (distributionMethod === DistributionMethod.SpecificAddresses) {
                                    for (let i = 0; i < claimItems.length; i++) {
                                        const leaf = claimItems[i];
                                        const newBalance = getPostTransferBalance(balance, leaf.badgeIds[0].start, leaf.badgeIds[0].end, leaf.amount, 1);
                                        balance.balances = newBalance.balances;
                                    }
                                }

                                const claimBalance = {
                                    balances: [
                                        {
                                            balance: newCollectionMsg.badgeSupplys[0].supply,
                                            badgeIds: [{
                                                start: 0,
                                                end: newCollectionMsg.badgeSupplys[0].amount - 1,
                                            }]
                                        }
                                    ], approvals: []
                                };

                                for (const balanceObj of balance.balances) {
                                    for (const badgeId of balanceObj.badgeIds) {
                                        const newBalance = getPostTransferBalance(claimBalance, badgeId.start, badgeId.end, balanceObj.balance, 1);
                                        claimBalance.balances = newBalance.balances;
                                    }
                                }

                                setNewCollectionMsg({
                                    ...newCollectionMsg,
                                    transfers: [],
                                    claims: [
                                        {
                                            amountPerClaim: 0,
                                            balances: claimBalance.balances,
                                            type: 0,
                                            uri: "",
                                            data: root,
                                            timeRange: {
                                                start: 0,
                                                end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                                            },
                                            incrementIdsBy: 0,
                                            badgeIds: [],
                                        }
                                    ]
                                })
                            }
                        }}
                    />,
                },
            ]}
            setCurrStepNumber={setCurrStepNumber}
        />
    );
}
