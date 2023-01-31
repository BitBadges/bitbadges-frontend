import React, { useEffect, useState } from 'react';
import { Typography, InputNumber, Button, Select, Input, Form } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SampleAccountMerkleTreeLeaves, SampleAccountMerkleTreeRoot } from '../../../constants';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import { BitBadgesUserInfo, UserBalance } from '../../../bitbadges-api/types';
import { DownOutlined } from '@ant-design/icons';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';
import { AddressListSelect } from '../../address/AddressListSelect';

const CryptoJS = require("crypto-js");

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,

}
const { Text } = Typography;

export function FirstComeFirstServe({
    newBadgeMsg,
    setNewBadgeMsg,
    fungible
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    fungible: boolean;
}) {

    const beforeBalances: UserBalance = {
        balances: [
            {
                balance: newBadgeMsg.badgeSupplys[0].supply,
                badgeIds: [{
                    start: 0,
                    end: newBadgeMsg.badgeSupplys[0].amount - 1,
                }]
            }
        ],
        approvals: [],
    }

    // const [newBalances, setNewBalances] = useState<UserBalance>(beforeBalances);
    const [amountToClaim, setAmountToClaim] = useState<number>(1);

    const [users, setUsers] = useState<BitBadgesUserInfo[]>([]);

    useEffect(() => {
        setNewBadgeMsg({
            ...newBadgeMsg,
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
        setNewBadgeMsg({
            ...newBadgeMsg,
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
    }, [amountToClaim, setNewBadgeMsg, newBadgeMsg, fungible, beforeBalances.balances])



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