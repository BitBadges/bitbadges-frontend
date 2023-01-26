import { Timeline, Typography } from 'antd';
import React, { useEffect } from 'react';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { ChooseBadgeType } from './timeline-items/ChooseBadgeType';
import { SetProperties } from './timeline-items/SetProperties';
import { TransactionDetails } from './timeline-items/SubmitNewBadgeMsg';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useChainContext } from '../../chain/ChainContext';
import { BadgeMetadata } from '../../bitbadges-api/types';
import { SetMetadata } from './timeline-items/SetMetadata';

const { Text } = Typography;

export enum MetadataAddMethod {
    Manual = 'Manual',
    UploadUrl = 'Insert Custom Metadata Url (Advanced)',
    //TODO: CSV Upload
}

export function MintTimeline() {
    const chain = useChainContext();
    const [currStepNumber, setCurrStepNumber] = useState(0);
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);

    const [newBadgeMsg, setNewBadgeMsg] = useState<MessageMsgNewCollection>({
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

    const [newBadgeMetadata, setNewBadgeMetadata] = useState<BadgeMetadata>({} as BadgeMetadata);
    const [individualBadgeMetadata, setIndividualBadgeMetadata] = useState<BadgeMetadata[]>();

    useEffect(() => {
        if (newBadgeMetadata && newBadgeMsg.badgeSupplys && newBadgeMsg.badgeSupplys[0]) {
            let metadata = [];
            for (let i = 0; i < newBadgeMsg.badgeSupplys[0].amount; i++) {
                metadata.push(newBadgeMetadata);
            }
            setIndividualBadgeMetadata(metadata);
        }
    }, [newBadgeMetadata, newBadgeMsg.badgeSupplys])

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
                    newBadgeMsg={newBadgeMsg}
                    setNewBadgeMsg={setNewBadgeMsg}
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
                    {newBadgeMsg?.standard == 0 && <SetProperties
                        setCurrStepNumber={setCurrStepNumber}
                        newBadgeMsg={newBadgeMsg}
                        setNewBadgeMsg={setNewBadgeMsg}
                        newBadgeMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
                        setNewBadgeMetadata={setNewBadgeMetadata}
                        addMethod={addMethod}
                        setAddMethod={setAddMethod}
                    />}
                    {/* TODO:  newBadgeMsg?.standard == ... */}
                </>
            ),
        },
        {
            stepNumber: 2,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Select Metadata
                </Text>
            ),
            content: (
                <>
                    <SetMetadata
                        setCurrStepNumber={setCurrStepNumber}
                        newBadgeMsg={newBadgeMsg}
                        setNewBadgeMsg={setNewBadgeMsg}
                        collectionMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
                        setCollectionMetadata={setNewBadgeMetadata}
                        individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                        setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                        addMethod={addMethod}
                        setAddMethod={setAddMethod}
                    />
                </>
            ),
        },
        {
            stepNumber: 3,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Submit Transaction
                </Text>
            ),
            content: (
                <TransactionDetails
                    newBadgeMsg={newBadgeMsg}
                    setTimelineStepNumber={setCurrStepNumber}
                    newBadgeMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
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
