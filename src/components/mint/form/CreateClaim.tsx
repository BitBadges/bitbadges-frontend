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

    const [users, setUsers] = useState<BitBadgesUserInfo[]>([]);

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

        const hashes = leaves.map(x => SHA256(x))

        const tree = new MerkleTree(hashes, SHA256)
        const root = tree.getRoot().toString('hex')


        setNewBadgeMsg({
            ...newBadgeMsg,
            claims: [
                {
                    amountPerClaim: amountToClaim,
                    balances: newBalances.balances,
                    type: claimType,
                    uri: "",
                    data: root,
                    timeRange: {
                        start: 0,
                        end: Number.MAX_SAFE_INTEGER //TODO: change to max uint64,
                    },
                }
            ]
        })
    }, [amountToClaim, newBalances, setNewBadgeMsg, newBadgeMsg, leaves, claimType, setLeaves])

    useEffect(() => {
        setLeaves(users.map(x => x.cosmosAddress));
    }, [users, setLeaves])




    return <div style={{ textAlign: 'center', color: PRIMARY_TEXT, justifyContent: 'center' }}>
        <BalanceBeforeAndAfter balance={beforeBalances} newBalance={newBalances} partyString='Unminted' />
        <Form.Provider>
            <Form
                style={{ justifyContent: 'center', alignItems: 'center' }}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
            >
                <Form.Item
                    label={
                        <Text
                            style={{ color: PRIMARY_TEXT }}
                            strong
                        >
                            Amount per Recipient
                        </Text>
                    }
                    style={{ textAlign: 'right' }}
                    required
                >
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
                </Form.Item>
                {/* <Form.Item
                    label={
                        <Text
                            style={{ color: PRIMARY_TEXT }}
                            strong
                        >
                            Amount per Recipient
                        </Text>
                    }
                    style={{ textAlign: 'right' }}
                    required
                >
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
                </Form.Item> */}
                <Form.Item
                    label={
                        <Text
                            style={{ color: PRIMARY_TEXT }}
                            strong
                        >
                            Whitelisted Users
                        </Text>
                    }
                    required
                >
                    <AddressListSelect

                        users={users}
                        setUsers={setUsers}
                    />
                </Form.Item>
            </Form>
        </Form.Provider>



        <br />
    </div >
}