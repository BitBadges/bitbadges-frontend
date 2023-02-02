import { Timeline, Typography } from 'antd';
import React, { useEffect } from 'react';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { ChooseBadgeType } from './timeline-items/ChooseBadgeType';
import { SetProperties } from './timeline-items/SetProperties';
import { TransactionDetails } from './timeline-items/SubmitNewCollectionMsg';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useChainContext } from '../../chain/ChainContext';
import { BadgeMetadata, ClaimItem } from '../../bitbadges-api/types';

const { Text } = Typography;

export enum MetadataAddMethod {
    None = 'None',
    Manual = 'Manual',
    UploadUrl = 'Insert Custom Metadata Url (Advanced)',
    //TODO: CSV Upload
}

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

export function MintTimeline() {
    const chain = useChainContext();
    const [currStepNumber, setCurrStepNumber] = useState(0);
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);
    const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);

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
    const [individualBadgeMetadata, setIndividualBadgeMetadata] = useState<BadgeMetadata[]>();

    useEffect(() => {
        if (collectionMetadata && newCollectionMsg.badgeSupplys && newCollectionMsg.badgeSupplys[0]) {
            let metadata = [];
            for (let i = 0; i < newCollectionMsg.badgeSupplys[0].amount; i++) {
                metadata.push(collectionMetadata);
            }
            setIndividualBadgeMetadata(metadata);
        }
    }, [collectionMetadata, newCollectionMsg.badgeSupplys])

    const steps = [
        {
            stepNumber: 0,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Choose Badge Type
                </Text>
            ),
            content: (
                <ChooseBadgeType
                    setCurrStepNumber={setCurrStepNumber}
                    newCollectionMsg={newCollectionMsg}
                    setNewCollectionMsg={setNewCollectionMsg}
                />
            ),
        },
        {
            stepNumber: 1,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Select Properties
                </Text>
            ),
            content: (
                <>
                    {newCollectionMsg?.standard == 0 && <SetProperties

                        setCurrStepNumber={setCurrStepNumber}
                        newCollectionMsg={newCollectionMsg}
                        setNewCollectionMsg={setNewCollectionMsg}
                        addMethod={addMethod}
                        setAddMethod={setAddMethod}
                        claimItems={claimItems}
                        setClaimItems={setClaimItems}
                        collectionMetadata={collectionMetadata ? collectionMetadata : {} as BadgeMetadata}
                        setCollectionMetadata={setCollectionMetadata}
                        individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                        setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                        distributionMethod={distributionMethod}
                        setDistributionMethod={setDistributionMethod}
                    />}
                    {/* TODO:  newCollectionMsg?.standard == ... */}
                </>
            ),
        },
        {
            stepNumber: 2,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Submit Transaction
                </Text>
            ),
            content: (
                <TransactionDetails
                    setTimelineStepNumber={setCurrStepNumber}
                    newCollectionMsg={newCollectionMsg}
                    setNewCollectionMsg={setNewCollectionMsg}
                    addMethod={addMethod}
                    setAddMethod={setAddMethod}
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
