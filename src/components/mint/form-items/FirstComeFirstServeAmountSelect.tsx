import React, { useEffect, useState } from 'react';
import { Typography, InputNumber } from 'antd';
import { PRIMARY_TEXT } from '../../../constants';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';

export function FirstComeFirstServeAmountSelect({
    newCollectionMsg,
    setNewCollectionMsg,
    fungible
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    fungible: boolean;
}) {

    const beforeBalances = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
    const [amountToClaim, setAmountToClaim] = useState<number>(1);

    useEffect(() => {
        setNewCollectionMsg({
            ...newCollectionMsg,
            claims: [
                {
                    amountPerClaim: amountToClaim,
                    balances: beforeBalances.balances,
                    type: 1,
                    badgeIds: [{
                        start: 0,
                        end: 0,
                    }],
                    incrementIdsBy: fungible ? 0 : 1,
                    uri: "",
                    data: "",
                    timeRange: {
                        start: 0,
                        end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                    },
                }
            ]
        })
    })

    useEffect(() => {
        setNewCollectionMsg({
            ...newCollectionMsg,
            claims: [
                {
                    amountPerClaim: amountToClaim,
                    balances: beforeBalances.balances,
                    type: 1, //TODO: change to enum
                    badgeIds: [{
                        start: 0,
                        end: 0,
                    }],
                    incrementIdsBy: fungible ? 0 : 1,
                    uri: "",
                    data: "",
                    timeRange: {
                        start: 0,
                        end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                    },
                }
            ]
        })
    }, [amountToClaim, setNewCollectionMsg, newCollectionMsg, fungible, beforeBalances.balances])

    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center' }}>
        <InputNumber
            min={1}
            title='Amount per Claim'
            value={amountToClaim} onChange={
                (value: number) => {
                    if (!value || value <= 0) {
                        setAmountToClaim(0);
                    }
                    else {
                        setAmountToClaim(value);
                    }
                }
            }
        />
        <br />
    </div >
}