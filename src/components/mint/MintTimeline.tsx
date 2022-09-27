import { Timeline, Typography } from 'antd';
import React from 'react';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { ChooseBadgeStandard } from './ChooseBadgeStandard';
import { StandardBadgeForm } from './StandardBadgeForm';
import { TransactionDetails } from './CreateBadgeTxnDetails';

const { Text } = Typography;

export interface ValidFromObject {
    start: number,
    end: number,
}

export interface BadgeMetadata {
    name: string;
    description: string;
    image: string;
    creator?: string;
    validFrom?: ValidFromObject;
    color?: string;
    type?: number;
    category?: string;
    externalUrl?: string;
}

export interface SubassetSupply {
    supply: number;
    amount: number;
}

export interface Badge {
    standard?: number;
    permissions?: number;
    metadata?: BadgeMetadata;
    subassetSupplys?: SubassetSupply[];
}

export function MintTimeline() {
    const [currStepNumber, setCurrStepNumber] = useState(0);
    const [badge, setBadge] = useState<Badge>({
        standard: 0,
        permissions: 0,
        metadata: {
            name: '',
            description: '',
            image: 'https://bitbadges.web.app/img/icons/logo.png',
        },
        subassetSupplys: [],
    });
    const steps = [
        {
            stepNumber: 0,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Choose Badge Standard
                </Text>
            ),
            content: (
                <ChooseBadgeStandard setCurrStepNumber={setCurrStepNumber} badge={badge} setBadge={setBadge} />
            ),
        },
        {
            stepNumber: 1,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Customize Badge
                </Text>
            ),
            content: (
                <>
                    {badge?.standard == 0 && <StandardBadgeForm setCurrStepNumber={setCurrStepNumber} badge={badge} setBadge={setBadge} />}
                    {
                        //TODO:
                    }
                    {badge?.standard != 0 && <StandardBadgeForm setCurrStepNumber={setCurrStepNumber} badge={badge} setBadge={setBadge} />}
                </>
            ),
        },
        // <ConfirmManager setCurrStepNumber={setCurrStepNumber} />
        // {
        //     stepNumber: 1,
        //     title: (
        //         <Text style={{ color: PRIMARY_TEXT }}>
        //             Set Badge Permissions
        //         </Text>
        //     ),
        //     content: (
        //         <PermissionsForm
        //             setPermissions={(newPermissions: any) => {
        //                 setPermissions(newPermissions);
        //             }}
        //             setTimelineStepNum={setCurrStepNumber}
        //             recipients={recipients}
        //         />
        //     ),
        // },
        // {
        //     stepNumber: 2,
        //     title: (
        //         <Text style={{ color: PRIMARY_TEXT }}>Set Badge Metadata</Text>
        //     ),
        //     content: (
        //         <BadgeDataForm
        //             // setPermissions={(permissions: any) => {
        //             //     setPermissions(permissions);
        //             // }}
        //             setCurrStepNumber={setCurrStepNumber}
        //             setBadge={(badge) => {
        //                 setBadge(badge);
        //             }}
        //             setRecipients={(recipients: any) => {
        //                 setRecipients(recipients);
        //             }}
        //         />
        //     ),
        // },

        {
            stepNumber: 2,
            title: (
                <Text style={{ color: PRIMARY_TEXT }}>
                    Finalize Transaction
                </Text>
            ),
            content: (
                <TransactionDetails
                    badge={badge}
                    setTimelineStepNumber={setCurrStepNumber}
                // recipients={recipients}
                // permissions={permissions}
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
