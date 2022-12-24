import React, { useEffect, useState } from 'react';
import { MessageMsgRegisterAddresses, createTxMsgRegisterAddresses } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
import { Button } from 'antd';
import { AddressModalDisplay } from './AddressModalDisplay';


export function CreateTxMsgRegisterAddressesModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({} as BitBadgesUserInfo);
    const [registeredUsers, setRegisteredUsers] = useState<BitBadgesUserInfo[]>([]);

    const txCosmosMsg: MessageMsgRegisterAddresses = {
        creator: chain.cosmosAddress,
        addressesToRegister: registeredUsers.map((user) => user.cosmosAddress),
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
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
                                userInfo={currUserInfo ? currUserInfo : {} as BitBadgesUserInfo}
                            />
                        </div>
                    )
                })}
            </div>}
            disabled={registeredUsers.length === 0}
        >
            <AddressSelect onChange={handleChange} title={"Register User"} />
            <Button type="primary"
                style={{ width: "100%" }}
                disabled={!currUserInfo?.address || !currUserInfo.chain || !currUserInfo.cosmosAddress}
                onClick={() => {
                    if (!currUserInfo?.address || !currUserInfo.chain || !currUserInfo.cosmosAddress) return;
                    setRegisteredUsers([
                        ...registeredUsers,
                        {
                            cosmosAddress: currUserInfo.cosmosAddress,
                            accountNumber: -1,
                            chain: currUserInfo.chain,
                            address: currUserInfo?.address
                        }
                    ]);

                    setCurrUserInfo({} as BitBadgesUserInfo);
                }}>Add Address</Button>
            {children}
        </TxModal>
    );
}