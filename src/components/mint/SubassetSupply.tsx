import React, { useState } from 'react';
import { Typography, Avatar, Table, InputNumber, Button } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../chain_handlers_frontend/ChainContext';
import Blockies from 'react-blockies'
import { Address } from '../Address';
import { useSelector } from 'react-redux';
import { DeleteOutlined } from '@ant-design/icons';

interface SubassetSupply {
    amount: number;
    supply: number;
}

export function SubassetSupply({
    badge,
    setBadge
}: {
    badge: any;
    setBadge: (badge: any) => void;
}) {
    const chain = useChainContext();
    const accountInformation = useSelector((state: any) => state.user);
    const address = chain.address;
    const accountNumber = accountInformation.accountNumber;
    const [subassetSupplys, setSubassetSupplys] = useState<SubassetSupply[]>([]);

    // const [amountToCreate, setAmountToCreate] = useState<number>(0);

    let defaultBadgeSupply = 0;
    if (badge.subassetSupplys && badge.subassetSupplys[0]) {
        if (badge.defaultSubassetSupply == 1) {
            defaultBadgeSupply = badge.subassetSupplys[0].amount;
        } else {
            defaultBadgeSupply = badge.subassetSupplys[0].supply;
        }
    }

    const [supplyToCreate, setSupplyToCreate] = useState<number>(defaultBadgeSupply);

    const getTotalSupply = () => {
        let sum = 0;
        for (const subassetSupply of subassetSupplys) {
            sum += (subassetSupply.supply * subassetSupply.amount);
        }

        return sum
    }

    const addTokens = (supply: number) => {
        // if (supplyToCreate > 0 && amountToCreate > 0) {
        //     const newValue = [...subassetSupplys, {
        //         amount: amountToCreate,
        //         supply: supplyToCreate,
        //     }]
        //     setSubassetSupplys(newValue);
        //     setBadge({
        //         ...badge,
        //         subassetSupplys: newValue,
        //     })
        // }

        if (supply > 0) {
            let newValue;
            if (badge.defaultSubassetSupply == 1) {
                newValue = [{
                    amount: supply,
                    supply: 1,
                }]
                setBadge({
                    ...badge,
                    subassetSupplys: newValue,
                })
            } else {
                newValue = [{
                    amount: 1,
                    supply: supply,
                }]
                setBadge({
                    ...badge,
                    subassetSupplys: newValue
                })
            }
            setSubassetSupplys(newValue);
        }
    }

    return (
        <div>
            <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>

            </Typography >
            {/* <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                For example, if a badge has 1000 recipients and is the same badge for all users, this should be one token with supply = 1000.
                <br />
                A badge which has 1000 recipients but is unique for each user should be 1000 tokens with supply = 1.
            </Typography> */}
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
                {/* < InputNumber value={amountToCreate} onChange={
                    (value) => {
                        setAmountToCreate(value as number);
                    }
                } /> */}
                <InputNumber value={supplyToCreate} onChange={
                    (value) => {

                        setSupplyToCreate(value as number);
                        addTokens(value);
                    }
                } />
                {/* < Button
                    onClick={() => {
                        addTokens();
                    }}
                >
                    Add
                </Button > */}
            </div >
        </div >
    )
}