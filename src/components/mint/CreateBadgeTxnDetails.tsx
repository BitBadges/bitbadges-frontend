import { Typography, Form, Button, Statistic } from 'antd';
import React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { PRIMARY_TEXT } from '../../constants';
import { FormNavigationHeader } from './FormNavigationHeader';
import { useChainContext } from '../../chain/ChainContext';
import { TransactionStatus } from '../../bitbadges-api/types';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { createTxMsgNewBadge } from 'bitbadgesjs-transactions';
import { TxModal } from '../transactions/TxModal';
import { CreateTxMsgNewBadgeModal } from '../transactions/CreateTxMsgNewBadgeModal';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 2;

export function TransactionDetails({
    setTimelineStepNumber,
    badge,
}: {
    setTimelineStepNumber: (stepNum: number) => void;
    badge: any;
}) {
    const [stepNum, setStepNum] = useState(1);
    const [visible, setVisible] = useState<boolean>(false);

    const chain = useChainContext();

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

    const supplys = [];
    const amounts = [];
    for (const supplyObj of badge.subassetSupplys) {
        supplys.push(supplyObj.supply);
        amounts.push(supplyObj.amount);
    }
    //TODO: remove hardcoded stuff
    let msgNewBadgeParams = {
        creator: chain.cosmosAddress,
        //IPFS URI (not image or externalUrl)
        uri: {
            uri: 'http://facebook.com', //TODO:
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
        permissions: badge.permissions,
        defaultSubassetSupply: badge.defaultSubassetSupply,
        freezeAddressRanges: badge.freezeAddressRanges ? badge.freezeAddressRanges : [],
        standard: badge.standard,
        subassetSupplys: supplys,
        subassetAmountsToCreate: amounts,
        whitelistedRecipients: [
            // {
            //     addresses: [0, 1, 2],
            //     balanceAmounts: [
            //         {
            //             balance: 1,
            //             id_ranges: [
            //                 {
            //                     start: 0,
            //                     end: 0,
            //                 }
            //             ]
            //         }
            //     ]
            // }
        ]
    }

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
                        txCosmosMsg={msgNewBadgeParams}
                    />
                </div>
            </Form.Provider >
        </div >
    );
}
