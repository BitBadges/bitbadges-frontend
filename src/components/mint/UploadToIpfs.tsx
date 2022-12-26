import { Typography, Form, Button, Statistic } from 'antd';
import React, { useEffect } from 'react';
import { useState } from 'react';

import { PRIMARY_TEXT } from '../../constants';
import { FormNavigationHeader } from './FormNavigationHeader';
import { BadgeMetadata, TransactionStatus } from '../../bitbadges-api/types';
import { addToIpfs } from '../../chain/backend_connectors';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 3;

export function UploadToIPFS({
    setTimelineStepNumber,
    newBadgeMetadata,
    newBadgeMsg,
    setNewBadgeMsg,
    individualBadgeMetadata
}: {
    setTimelineStepNumber: (stepNum: number) => void;
    newBadgeMetadata: BadgeMetadata;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (newBadgeMsg: MessageMsgNewBadge) => void;
    individualBadgeMetadata: BadgeMetadata[];
}) {
    const [stepNum, setStepNum] = useState(1);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (success) {
            if (stepNum === FINAL_STEP_NUM) {
                setTimelineStepNumber(CURR_TIMELINE_STEP_NUM + 1);
            } else {
                setStepNum(stepNum + 1);
            }
        }
    }, [success, stepNum, setTimelineStepNumber]);

    const decrementStep = () => {
        if (stepNum === FIRST_STEP_NUM) {
            setTimelineStepNumber(CURR_TIMELINE_STEP_NUM - 1);
        } else {
            setStepNum(stepNum - 1);
        }
    };



    return (
        <div>
            <Form.Provider>
                <FormNavigationHeader
                    incrementStep={() => { }}
                    decrementStep={decrementStep}
                    stepNum={stepNum}
                    // backButtonDisabled={txnSubmitted && !transactionIsLoading} TODO: instead of this, we redirect to new badge page
                    finalStepNumber={1}
                    nextButtonDisabled={true}
                />
                <div style={{ paddingLeft: 5 }}>
                    <div
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                        }}
                    >
                        <Typography.Text
                            style={{
                                color: PRIMARY_TEXT,
                                fontSize: 20,
                                marginBottom: 10,
                            }}
                            strong
                        >
                            Upload to IPFS
                        </Typography.Text>
                    </div>
                </div>
                <div

                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 20,
                    }}
                >
                    <Button
                        type="primary"
                        loading={loading}
                        style={{ width: '90%' }}
                        onClick={async () => {
                            setLoading(true);
                            let res = await addToIpfs(newBadgeMetadata, individualBadgeMetadata);

                            setNewBadgeMsg({
                                ...newBadgeMsg,
                                uri: {
                                    ...newBadgeMsg.uri,
                                    uri: res.cid,
                                    decodeScheme: 0,
                                    scheme: 3,
                                    idxRangeToRemove: {
                                        start: 0,
                                        end: 0,
                                    },
                                    insertSubassetBytesIdx: 0,
                                    bytesToInsert: '',
                                    insertIdIdx: 0,
                                },
                            });
                            setSuccess(true);
                            setLoading(false);
                        }}
                    >
                        Upload to IPFS
                    </Button>
                </div>
            </Form.Provider>
        </div >
    );
}
