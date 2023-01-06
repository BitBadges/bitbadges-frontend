import { Typography, Form, Button } from 'antd';
import React from 'react';
import { useState } from 'react';

import { PRIMARY_TEXT } from '../../../constants';
import { FormNavigationHeader } from '../form/FormNavigationHeader';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { CreateTxMsgNewBadgeModal } from '../../txModals/CreateTxMsgNewBadgeModal';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 4;

export function TransactionDetails({
    setTimelineStepNumber,
    newBadgeMsg,
    newBadgeMetadata
}: {
    setTimelineStepNumber: (stepNum: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    newBadgeMetadata: BadgeMetadata;
}) {
    const [stepNum, setStepNum] = useState(1);
    const [visible, setVisible] = useState<boolean>(false);

    const incrementStep = () => {
        if (stepNum === FINAL_STEP_NUM) {
            // setTimelineStepNumber(CURR_TIMELINE_STEP_NUM + 1);
        } else {
            setStepNum(stepNum + 1);
        }
    };

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
                            Mint Badge
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
                        style={{ width: '90%' }}
                        onClick={async () => {
                            setVisible(true);
                        }}
                    >
                        Create Badge!
                    </Button>
                    <CreateTxMsgNewBadgeModal
                        visible={visible}
                        setVisible={setVisible}
                        txCosmosMsg={newBadgeMsg}
                    />
                </div>
            </Form.Provider >
        </div >
    );
}
