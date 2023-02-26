import { InputNumber } from 'antd';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';
import { GO_MAX_UINT_64, PRIMARY_TEXT } from '../../../constants';
import { ClaimType } from '../../../bitbadges-api/types';

export function FirstComeFirstServeAmountSelect({
    newCollectionMsg,
    setNewCollectionMsg,
    fungible,
    nonFungible
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    fungible: boolean;
    nonFungible: boolean;
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
                        start: 1,
                        end: 1,
                    }],
                    incrementIdsBy: fungible ? 0 : 1,
                    uri: "",
                    data: "",
                    timeRange: {
                        start: 0,
                        end: GO_MAX_UINT_64
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
                    type: ClaimType.Anyone,
                    badgeIds: [{
                        start: 1,
                        end: 1,
                    }],
                    incrementIdsBy: fungible ? 0 : 1,
                    uri: "",
                    data: "",
                    timeRange: {
                        start: 0,
                        end: GO_MAX_UINT_64
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