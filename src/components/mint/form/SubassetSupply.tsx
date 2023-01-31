import React, { useState } from 'react';
import { Typography, InputNumber, Button } from 'antd';
import { PRIMARY_TEXT } from '../../../constants';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';

interface SubassetSupply {
    amount: number;
    supply: number;
}

export function SubassetSupply({
    newBadgeMsg,
    setNewBadgeMsg,
    fungible
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    fungible: boolean;
}) {
    const [supplyToCreate, setSupplyToCreate] = useState<number>(0);



    const addTokens = (supply: number) => {

        if (supply > 0) {
            let newSupplyObjs = newBadgeMsg.badgeSupplys;

            if (!fungible) {
                newSupplyObjs = [{
                    amount: supply,
                    supply: 1
                }];

                setNewBadgeMsg({
                    ...newBadgeMsg,
                    badgeSupplys: newSupplyObjs
                })
            } else {
                newSupplyObjs = [{
                    amount: 1,
                    supply: supply
                }];
                setNewBadgeMsg({
                    ...newBadgeMsg,
                    badgeSupplys: newSupplyObjs
                })
            }
        }
    }

    return (
        <div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>

            </Typography >
            <div
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
            <div style={{
                padding: '0',
                textAlign: 'center',
                color: PRIMARY_TEXT,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
            }}>
                <Button
                    style={{
                        backgroundColor: 'transparent',
                        color: PRIMARY_TEXT,
                    }}
                    onClick={() => {
                        let value = 1000000; //TODO: uint64 max
                        setSupplyToCreate(value as number);
                        addTokens(value);
                    }}>Max</Button>
            </div>
        </div >
    )
}