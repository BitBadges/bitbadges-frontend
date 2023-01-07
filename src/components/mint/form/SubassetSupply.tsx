import React, { useState } from 'react';
import { Typography, InputNumber } from 'antd';
import { PRIMARY_TEXT } from '../../../constants';
import { MessageMsgNewBadge, MessageMsgNewSubBadge } from 'bitbadgesjs-transactions';

interface SubassetSupply {
    amount: number;
    supply: number;
}

export function SubassetSupply({
    newBadgeMsg,
    setNewBadgeMsg
}: {
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
}) {
    let defaultBadgeSupply = 0;
    if (newBadgeMsg.subassetSupplysAndAmounts && newBadgeMsg.subassetSupplysAndAmounts[0]) {
        if (newBadgeMsg.defaultSubassetSupply == 1) {
            defaultBadgeSupply = newBadgeMsg.subassetSupplysAndAmounts[0].supply;
        } else {
            defaultBadgeSupply = newBadgeMsg.subassetSupplysAndAmounts[0].supply;
        }
    }

    const [supplyToCreate, setSupplyToCreate] = useState<number>(defaultBadgeSupply);



    const addTokens = (supply: number) => {

        if (supply > 0) {
            let newSupplyObjs = newBadgeMsg.subassetSupplysAndAmounts;


            if (newBadgeMsg.defaultSubassetSupply == 1) {
                newSupplyObjs = [{
                    amount: supply,
                    supply: 1
                }];

                setNewBadgeMsg({
                    ...newBadgeMsg,
                    subassetSupplysAndAmounts: newSupplyObjs
                })
            } else {
                newSupplyObjs = [{
                    amount: 1,
                    supply: supply
                }];
                setNewBadgeMsg({
                    ...newBadgeMsg,
                    subassetSupplysAndAmounts: newSupplyObjs
                })
            }
        }
    }

    return (
        <div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>

            </Typography >
            < div
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                }}
            >
                <InputNumber value={supplyToCreate}
                    defaultValue={1}
                    min={1}
                    onChange={
                        (value) => {
                            setSupplyToCreate(value as number);
                            addTokens(value);
                        }
                    } />
            </div >
        </div >
    )
}