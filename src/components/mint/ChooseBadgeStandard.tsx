import React from 'react';
import { Card } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import Meta from 'antd/lib/card/Meta';
import { getBadge, getBadgeBalance } from '../../bitbadges-api/api';
import { BitBadgeMintObject } from '../../bitbadges-api/types';
const CURR_STEP_NUMBER = 0;

export function ChooseBadgeStandard({ setCurrStepNumber, setBadge, badge }: {
    setCurrStepNumber: (stepNumber: number) => void;
    setBadge: (type: BitBadgeMintObject) => void;
    badge: any;
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
                        setBadge({
                            ...badge,
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
                        setBadge({
                            ...badge,
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
                        setBadge({
                            ...badge,
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
            {/* <Button
                type="primary"
                style={{ width: '100%' }}
                loading={transactionIsLoading}
                disabled={!address || txnSubmitted}
                onClick={async () => {
                    setCurrStepNumber(CURR_STEP_NUMBER + 1);
                }}
            >
                {'Confirm and Continue'}
            </Button>
            <Typography style={{ color: 'lightgrey' }}>
                *To use a different wallet, please disconnect and
                reconnect with a new wallet.
            </Typography> */}


        </div >
    )
}