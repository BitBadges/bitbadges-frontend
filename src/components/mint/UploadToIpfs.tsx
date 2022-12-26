import { Typography, Form, Button, Statistic } from 'antd';
import React, { useEffect } from 'react';
import { useState } from 'react';

import { PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { FormNavigationHeader } from './FormNavigationHeader';
import { BadgeMetadata, TransactionStatus } from '../../bitbadges-api/types';
import { addToIpfs } from '../../chain/backend_connectors';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { saveAs } from 'file-saver';
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 3;

function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}


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

    const incrementStep = () => {
        if (stepNum === FINAL_STEP_NUM) {
            setTimelineStepNumber(CURR_TIMELINE_STEP_NUM + 1);
        } else {
            setStepNum(stepNum + 1);
        }
    }

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
                    incrementStep={incrementStep}
                    decrementStep={decrementStep}
                    stepNum={stepNum}
                    // backButtonDisabled={txnSubmitted && !transactionIsLoading} TODO: instead of this, we redirect to new badge page
                    finalStepNumber={1}
                    nextButtonDisabled={!success}
                />
                <div>
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
                            Upload
                        </Typography.Text>
                    </div>
                </div>

                <div>
                    <div
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                        }}
                    >
                        <Typography.Text
                            style={{
                                color: PRIMARY_TEXT,
                                fontSize: 14,
                                marginBottom: 10,
                            }}
                            strong
                        >
                            We will now upload your metadata to our permanent file storage.
                            For backup purposes, we recommend you save a local copy as well (
                            <button
                                style={{
                                    backgroundColor: 'inherit',
                                    color: SECONDARY_TEXT,
                                }}
                                onClick={() => {
                                    const today = new Date();

                                    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                                    const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                                    downloadJson({
                                        collectionMetadata: newBadgeMetadata,
                                        individualBadgeMetadata: individualBadgeMetadata,
                                    }, `metadata-${newBadgeMetadata.name}-${dateString}-${timeString}.json`);
                                }}
                                className="opacity link-button"
                            >
                                click here to download
                            </button>).
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
                            setSuccess(false);
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
                        disabled={success}
                    >
                        Upload Metadata {success && <CheckCircleFilled
                            style={{
                                color: 'green',
                            }}
                        />}
                    </Button>
                </div>
            </Form.Provider>
        </div >
    );
}
