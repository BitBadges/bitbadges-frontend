import React from 'react';
import { Card } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import Meta from 'antd/lib/card/Meta';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';

const CURR_STEP_NUMBER = 0;

export function ChooseBadgeType({ setCurrStepNumber, setNewBadgeMsg, newBadgeMsg }: {
    setCurrStepNumber: (stepNumber: number) => void;
    setNewBadgeMsg: (type: MessageMsgNewBadge) => void;
    newBadgeMsg: MessageMsgNewBadge;
}) {
    //TODO: add a ton of standards and types here
    return (
        <div>
            <div
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                    display: 'flex',
                }}
            >
                <Card
                    style={{
                        width: '33%',
                        margin: 8,
                        textAlign: 'center',
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    hoverable
                    onClick={async () => {
                        setNewBadgeMsg({
                            ...newBadgeMsg,
                            standard: 0,
                        });
                        setCurrStepNumber(CURR_STEP_NUMBER + 1);
                    }}
                >
                    <Meta
                        title={
                            <div
                                style={{
                                    fontSize: 20,
                                    color: PRIMARY_TEXT,
                                    fontWeight: 'bolder',
                                }}
                            >
                                {'Standard Badge'}
                            </div>
                        }
                    // description={
                    //     <div
                    //         style={{
                    //             color: SECONDARY_TEXT,
                    //             display: 'flex',
                    //             alignItems: 'center',
                    //             width: '100%',
                    //         }}
                    //     >
                    //         {/* {'Standard on-chain non-fungible tokens.'} */}
                    //     </div>
                    // }
                    />
                </Card>

                <Card
                    style={{
                        width: '33%',
                        margin: 8,
                        textAlign: 'center',
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    hoverable
                    onClick={() => {
                        setNewBadgeMsg({
                            ...newBadgeMsg,
                            standard: 0,
                        });
                        setCurrStepNumber(CURR_STEP_NUMBER + 1);
                    }}
                >
                    <Meta
                        title={
                            <div
                                style={{
                                    fontSize: 20,
                                    color: PRIMARY_TEXT,
                                    fontWeight: 'bolder',
                                }}
                            >
                                {'Collection (On-Chain)'}
                            </div>
                        }
                    // description={
                    //     <div
                    //         style={{
                    //             color: SECONDARY_TEXT,
                    //             display: 'flex',
                    //             alignItems: 'center',
                    //             width: '100%',
                    //         }}
                    //     >
                    //         {'Collection of users. Both metadata and addresses are stored on-chain.'}
                    //     </div>
                    // }
                    />
                </Card>

                <Card
                    style={{
                        width: '33%',
                        margin: 8,
                        textAlign: 'center',
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    hoverable
                    onClick={() => {
                        setNewBadgeMsg({
                            ...newBadgeMsg,
                            standard: 0,
                        });
                        setCurrStepNumber(CURR_STEP_NUMBER + 1);
                    }}
                >
                    <Meta
                        title={
                            <div
                                style={{
                                    fontSize: 20,
                                    color: PRIMARY_TEXT,
                                    fontWeight: 'bolder',
                                }}
                            >
                                {'Collection (Off-Chain)'}
                            </div>
                        }
                    // description={
                    //     <div
                    //         style={{
                    //             color: SECONDARY_TEXT,
                    //             display: 'flex',
                    //             alignItems: 'center',
                    //             width: '100%',
                    //         }}
                    //     >
                    //         {'Collection of users. Metadata and addresses are stored on-chain.'}
                    //     </div>
                    // }
                    />
                </Card>
            </div>

        </div >
    )
}