import React, { useEffect, useState } from 'react';
import { Typography, InputNumber, Button, Select, Input } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SampleAccountMerkleTreeLeaves, SampleAccountMerkleTreeRoot } from '../../../constants';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { BalanceBeforeAndAfter } from '../../common/BalanceBeforeAndAfter';
import { UserBalance } from '../../../bitbadges-api/types';
import { DownOutlined } from '@ant-design/icons';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

const CryptoJS = require("crypto-js");

enum ClaimType {
    AccountNum,
    Code,
}

//TODO: code based claims

export function CreateClaim({
    newBadgeMsg,
    setNewBadgeMsg,
    leaves,
    setLeaves,
}: {
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    leaves: string[];
    setLeaves: (leaves: string[]) => void;
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

    const [numDistributed, setNumDistributed] = useState<number>(0);
    const [newBalances, setNewBalances] = useState<UserBalance>(beforeBalances);
    const [amountToClaim, setAmountToClaim] = useState<number>(0);
    const [claimType, setClaimType] = useState<ClaimType>(ClaimType.AccountNum);
    const [currLeaf, setCurrLeaf] = useState<string>('');

    useEffect(() => {
        // const newLeaves = leaves.map(x => SHA256(x))
        // const tree = new MerkleTree(newLeaves, SHA256, { isBitcoinTree: true })
        // const newRoot = tree.getRoot().toString('hex')

        // const leaf = CryptoJS.enc.Hex.stringify(newLeaves[0]);
        // const proof = tree.getProof(leaf)
        // // console.log("PROOOOOF", tree.verify(proof, leaf, newRoot))
        // console.log("root", newRoot)
        // console.log(tree);
        // console.log(proof);
        setLeaves(SampleAccountMerkleTreeLeaves); //TODO: remove

        setNewBadgeMsg({
            ...newBadgeMsg,
            claims: [
                {
                    amountPerClaim: amountToClaim,
                    balance: newBalances.balances[0],
                    type: claimType,
                    uri: "",
                    data: SampleAccountMerkleTreeRoot,
                    timeRange: {
                        start: 0,
                        end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                    },
                }
            ]
        })
    }, [amountToClaim, newBalances, setNewBadgeMsg, newBadgeMsg, leaves, claimType, setLeaves])




    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
        <Typography.Text style={{ color: PRIMARY_TEXT, textAlign: 'center' }} strong>
            You have distributed {numDistributed} / {newBadgeMsg.badgeSupplys[0].amount} badges (each badge supply = {newBadgeMsg.badgeSupplys[0].supply}).
        </Typography.Text>

        <BalanceBeforeAndAfter balance={beforeBalances} newBalance={newBalances} partyString='Unminted' />
        <div className='flex-between'>
            Amount to Claim Per Recipient:
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
        </div>
        <Select
            className="selector"
            defaultValue={claimType}
            onSelect={(e: any) => {
                setClaimType(e);
            }}
            style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
            }}
            suffixIcon={
                <DownOutlined
                    style={{ color: PRIMARY_TEXT }}
                />
            }
        >
            {Object.keys(ClaimType).map((key: any) => {
                return (
                    <Select.Option key={key} value={ClaimType[key as keyof typeof ClaimType]}>
                        {ClaimType[key as keyof typeof ClaimType]}
                    </Select.Option>
                )
            })}
        </Select>

        <Input.Group compact>
            <Input value={currLeaf} style={{ width: 'calc(100% - 200px)' }} defaultValue="" onChange={(e: any) => {
                setCurrLeaf(e.target.value);
            }} />
            <Button type="primary" onClick={(e) => {
                const newLeaves = [...leaves, currLeaf];
                setLeaves(newLeaves);
                setCurrLeaf('');
            }}>Add New</Button>
        </Input.Group>
        <br />
    </div >
}