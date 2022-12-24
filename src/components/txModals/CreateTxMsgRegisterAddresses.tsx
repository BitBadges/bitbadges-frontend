import React, { useEffect, useState } from 'react';
import { MessageMsgFreezeAddress, MessageMsgRegisterAddresses, MessageMsgRevokeBadge, createTxMsgFreezeAddress, createTxMsgRegisterAddresses, createTxMsgRevokeBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button, InputNumber, Switch } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


export function CreateTxMsgRegisterAddressesModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currAddress, setCurrAddress] = useState<string>();
    const [currCosmosAddress, setCurrCosmosAddress] = useState<string>();
    const [currAccountNumber, setCurrAccountNumber] = useState<number>();
    const [currChain, setCurrChain] = useState<string>();
    const [freeze, setFreeze] = useState<boolean>(true);

    // const [amountToRevoke, setAmountToRevoke] = useState<number>(0);
    // const [startSubbadgeId, setStartSubbadgeId] = useState<number>(-1);
    // const [endSubbadgeId, setEndSubbadgeId] = useState<number>(-1);

    const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
    // const [amounts, setAmounts] = useState<number[]>([]);
    // const [subbadgeRanges, setSubbadgeRanges] = useState<IdRange[]>([]);


    const txCosmosMsg: MessageMsgRegisterAddresses = {
        creator: chain.cosmosAddress,
        addressesToRegister: registeredUsers.map((user) => user.cosmosAddress),
    };

    const handleChange = (cosmosAddress: string, newManagerAccountNumber: number, chain: string, address: string) => {
        setCurrCosmosAddress(cosmosAddress);
        setCurrAccountNumber(newManagerAccountNumber);
        setCurrAddress(address);
        setCurrChain(chain);
    }

    useEffect(() => {
        setRegisteredUsers([]);
    }, [visible])

    return (
        <TxModal
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Register Addresses"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgRegisterAddresses}
            displayMsg={<div>You are registering these users:
                {registeredUsers.map((user, index) => {
                    return (
                        <div key={index}>
                            <AddressModalDisplay
                                title={"User " + (index + 1)}
                                cosmosAddress={user.cosmosAddress}
                                accountNumber={user.accountNumber}
                                chain={user.chain}
                                address={user.address}
                            />
                            {/* {index === revokedUsers.length - 1 && <hr />} */}
                        </div>
                    )
                })}
            </div>}
            disabled={registeredUsers.length === 0}
        >
            <AddressSelect onChange={handleChange} title={"Register User"} />
            <Button type="primary"
                style={{ width: "100%" }}
                disabled={!currAddress || !currChain || !currCosmosAddress}
                onClick={() => {
                    if (!currAddress || !currChain || !currCosmosAddress) return;
                    setRegisteredUsers([
                        ...registeredUsers,
                        {
                            cosmosAddress: currCosmosAddress,
                            accountNumber: -1,
                            chain: currChain,
                            address: currAddress
                        }
                    ]);

                    setCurrAccountNumber(undefined);
                    setCurrAddress(undefined);
                    setCurrChain(undefined);
                    setCurrCosmosAddress(undefined);
                }}>Add Address</Button>
            {children}
        </TxModal>
    );
}