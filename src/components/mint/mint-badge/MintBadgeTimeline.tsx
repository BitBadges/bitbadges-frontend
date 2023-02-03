import { Timeline, Typography } from 'antd';
import React, { useEffect } from 'react';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { DefaultPlaceholderMetadata, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { MessageMsgMintBadge, MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeMetadata, BitBadgeCollection, ClaimItem } from '../../../bitbadges-api/types';
import { SubmitNewMintMsg } from './SubmitNewMintMsg';
import { MintAndDistribute } from './MintAndDistributeTimeline';

const { Text } = Typography;

export enum MetadataAddMethod {
    None = 'None',
    Manual = 'Manual',
    UploadUrl = 'Insert Custom Metadata Url (Advanced)',
    CSV = 'CSV',
}

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

export function MintCollectionTimeline({
    collection
}: {
    collection: BitBadgeCollection;
}) {
    const chain = useChainContext();
    const [currStepNumber, setCurrStepNumber] = useState(0);
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);
    const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);
    const [hackyUpdatedFlag, setHackyUpdatedFlag] = useState<boolean>(false);

    const [newCollectionMsg, setNewCollectionMsg] = useState<MessageMsgNewCollection>({
        creator: chain.cosmosAddress,
        badgeUri: '',
        collectionUri: '',
        bytes: '',
        permissions: 0,
        standard: 0,
        badgeSupplys: [],
        transfers: [],
        disallowedTransfers: [],
        claims: [],
        managerApprovedTransfers: [],
    });

    const [collectionMetadata, setCollectionMetadata] = useState<BadgeMetadata>({} as BadgeMetadata);
    const [individualBadgeMetadata, setBadgeMetadata] = useState<BadgeMetadata[]>([]);

    const setIndividualBadgeMetadata = (metadata: BadgeMetadata[]) => {
        setBadgeMetadata(metadata);
        setHackyUpdatedFlag(!hackyUpdatedFlag);
    }


    useEffect(() => {
        if (newCollectionMsg.badgeSupplys && newCollectionMsg.badgeSupplys[0]) {
            let metadata = [];
            for (let i = 0; i < newCollectionMsg.badgeSupplys[0].amount; i++) {
                metadata.push(DefaultPlaceholderMetadata);
            }
            setBadgeMetadata(metadata);
        }
    }, [newCollectionMsg.badgeSupplys])

    const steps = [
        {
            stepNumber: 0,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Select Properties
                </Text>
            ),
            content: (
                <>
                    {
                        <MintAndDistribute
                            setCurrStepNumber={setCurrStepNumber}
                            newCollectionMsg={newCollectionMsg}
                            setNewCollectionMsg={setNewCollectionMsg}
                            claimItems={claimItems}
                            setClaimItems={setClaimItems}
                            collectionMetadata={collectionMetadata ? collectionMetadata : {} as BadgeMetadata}
                            setCollectionMetadata={setCollectionMetadata}
                            individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                            setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                            distributionMethod={distributionMethod}
                            setDistributionMethod={setDistributionMethod}
                            hackyUpdatedFlag={hackyUpdatedFlag}
                            addMethod={addMethod}
                            setAddMethod={setAddMethod}
                        />
                    }
                </>
            ),
        },
        {
            stepNumber: 1,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Submit Transaction
                </Text>
            ),
            content: (
                <SubmitNewMintMsg
                    setTimelineStepNumber={setCurrStepNumber}
                    newCollectionMsg={newCollectionMsg}
                    setNewCollectionMsg={setNewCollectionMsg}
                    claimItems={claimItems}
                    setClaimItems={setClaimItems}
                    collectionMetadata={collectionMetadata ? collectionMetadata : {} as BadgeMetadata}
                    setCollectionMetadata={setCollectionMetadata}
                    individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                    setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                    distributionMethod={distributionMethod}
                    setDistributionMethod={setDistributionMethod}
                />
            ),
        },
    ];

    return (
        <Timeline>
            {steps.map((step) => {
                return (
                    <Timeline.Item
                        key={step.stepNumber}
                        color={
                            step.stepNumber < currStepNumber ? 'green' : 'blue'
                        }

                        dot={
                            step.stepNumber >= currStepNumber ? (
                                <ClockCircleOutlined
                                    style={{
                                        verticalAlign: 'middle',
                                        fontSize: '30px',
                                        backgroundColor: PRIMARY_BLUE,
                                        padding: 0,
                                        margin: 0,
                                    }}
                                />
                            ) : (
                                <CheckCircleOutlined
                                    style={{
                                        verticalAlign: 'middle',
                                        fontSize: '30px',
                                        backgroundColor: PRIMARY_BLUE,
                                        padding: 0,
                                        margin: 0,
                                    }}
                                />
                            )
                        }
                        style={{
                            textAlign: 'left',
                        }}
                    >
                        <span
                            style={{
                                verticalAlign: 'middle',
                                paddingLeft: 5,
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: PRIMARY_TEXT,
                            }}
                        >
                            {step.title}
                        </span>
                        <span
                            style={{
                                verticalAlign: 'middle',
                                paddingLeft: 5,
                                fontSize: 12,
                            }}
                        >
                            {step.stepNumber === currStepNumber && step.content}
                        </span>
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
}
