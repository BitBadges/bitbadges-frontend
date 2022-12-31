import { Timeline, Typography } from 'antd';
import React, { useEffect } from 'react';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { ChooseBadgeType } from './timeline-items/ChooseBadgeType';
import { SetCollectionMetadata } from './timeline-items/SetCollectionMetadata';
import { TransactionDetails } from './timeline-items/SubmitNewBadgeMsg';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { useChainContext } from '../../chain/ChainContext';
import { BadgeMetadata } from '../../bitbadges-api/types';
import { UploadToIPFS } from './timeline-items/UploadToIpfs';
import { SetIndividualBadgeMetadata } from './timeline-items/SetBadgeMetadata';

const { Text } = Typography;

export function MintTimeline() {
    const chain = useChainContext();
    const [currStepNumber, setCurrStepNumber] = useState(0);

    const [newBadgeMsg, setNewBadgeMsg] = useState<MessageMsgNewBadge>({
        creator: chain.cosmosAddress,
        //IPFS URI (not image or externalUrl)
        uri: {
            uri: 'abc.com',
            decodeScheme: 0,
            scheme: 0,
            idxRangeToRemove: {
                start: 0,
                end: 0,
            },
            insertSubassetBytesIdx: 0,
            bytesToInsert: '',
            insertIdIdx: 0,
        },
        arbitraryBytes: '',
        permissions: 0,
        defaultSubassetSupply: 1,
        freezeAddressRanges: [],
        standard: 0,
        subassetSupplys: [],
        subassetAmountsToCreate: [],
        whitelistedRecipients: []
    });

    const [newBadgeMetadata, setNewBadgeMetadata] = useState<BadgeMetadata>();
    const [individualBadgeMetadata, setIndividualBadgeMetadata] = useState<BadgeMetadata[]>();

    useEffect(() => {
        if (newBadgeMetadata && newBadgeMsg.subassetAmountsToCreate && newBadgeMsg.subassetAmountsToCreate[0]) {
            let metadata = [];
            for (let i = 0; i < newBadgeMsg.subassetAmountsToCreate[0]; i++) {
                metadata.push(newBadgeMetadata);
            }
            setIndividualBadgeMetadata(metadata);
        }
    }, [newBadgeMetadata, newBadgeMsg.subassetAmountsToCreate])

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
                    Customize Collection
                </Text>
            ),
            content: (
                <>
                    {newBadgeMsg?.standard == 0 && <SetCollectionMetadata
                        setCurrStepNumber={setCurrStepNumber}
                        newBadgeMsg={newBadgeMsg}
                        setNewBadgeMsg={setNewBadgeMsg}
                        newBadgeMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
                        setNewBadgeMetadata={setNewBadgeMetadata}
                    />}
                    {
                        //TODO:
                    }
                    {newBadgeMsg?.standard != 0 && <SetCollectionMetadata
                        setCurrStepNumber={setCurrStepNumber}
                        newBadgeMsg={newBadgeMsg}
                        setNewBadgeMsg={setNewBadgeMsg}
                        newBadgeMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
                        setNewBadgeMetadata={setNewBadgeMetadata}
                    />}
                </>
            ),
        },
        {
            stepNumber: 2,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Set Individual Badge Metadata
                </Text>
            ),
            content: (
                <>
                    <SetIndividualBadgeMetadata
                        setCurrStepNumber={setCurrStepNumber}
                        newBadgeMsg={newBadgeMsg}
                        setNewBadgeMsg={setNewBadgeMsg}
                        individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                        setIndividualBadgeMetadata={setIndividualBadgeMetadata}
                    />
                </>
            ),
        },
        {
            stepNumber: 3,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Upload Metadata
                </Text>
            ),
            content: (
                <UploadToIPFS
                    setTimelineStepNumber={setCurrStepNumber}
                    newBadgeMetadata={newBadgeMetadata ? newBadgeMetadata : {} as BadgeMetadata}
                    newBadgeMsg={newBadgeMsg}
                    setNewBadgeMsg={setNewBadgeMsg}
                    individualBadgeMetadata={individualBadgeMetadata ? individualBadgeMetadata : []}
                />
            ),
        },
        {
            stepNumber: 4,
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
