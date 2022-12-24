import React, { useState } from 'react';
import { Typography, InputNumber } from 'antd';
import { PRIMARY_TEXT } from '../../constants';
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
    if (newBadgeMsg.subassetSupplys && newBadgeMsg.subassetSupplys[0]) {
        if (newBadgeMsg.defaultSubassetSupply == 1) {
            defaultBadgeSupply = newBadgeMsg.subassetAmountsToCreate[0];
        } else {
            defaultBadgeSupply = newBadgeMsg.subassetSupplys[0];
        }
    }

    const [supplyToCreate, setSupplyToCreate] = useState<number>(defaultBadgeSupply);



    const addTokens = (supply: number) => {

        if (supply > 0) {
            let newSupplys = newBadgeMsg.subassetSupplys;
            let newAmounts = newBadgeMsg.subassetAmountsToCreate;
            if (newBadgeMsg.defaultSubassetSupply == 1) {
                newSupplys = [1];
                newAmounts = [supply];

                setNewBadgeMsg({
                    ...newBadgeMsg,
                    subassetSupplys: newSupplys,
                    subassetAmountsToCreate: newAmounts
                })
            } else {
                newSupplys = [supply];
                newAmounts = [1];
                setNewBadgeMsg({
                    ...newBadgeMsg,
                    subassetSupplys: newSupplys,
                    subassetAmountsToCreate: newAmounts
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
                <InputNumber value={supplyToCreate} onChange={
                    (value) => {

                        setSupplyToCreate(value as number);
                        addTokens(value);
                    }
                } />
            </div >
        </div >
    )
}