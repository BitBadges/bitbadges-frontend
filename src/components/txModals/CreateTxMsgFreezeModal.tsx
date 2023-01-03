import React, { useEffect, useState } from 'react';
import { MessageMsgFreezeAddress, createTxMsgFreezeAddress } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from '../address/AddressSelect';
import { Switch } from 'antd';

export function CreateTxMsgFreezeModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>();
    const [freeze, setFreeze] = useState<boolean>(true);

    //Reset states upon modal close
    useEffect(() => {
        if (!visible) {
            setCurrUserInfo(undefined);
            setFreeze(true);
        }
    }, [visible]);

    const txCosmosMsg: MessageMsgFreezeAddress = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        add: freeze,
        addressRanges: [{
            start: currUserInfo?.accountNumber ? currUserInfo?.accountNumber : -1,
            end: currUserInfo?.accountNumber ? currUserInfo?.accountNumber : -1,
        }],
    };

    const handleChange = (userInfo: BitBadgesUserInfo) => {
        setCurrUserInfo(userInfo);
    }

    const items = [
        {
            title: 'Select Address',
            description: <>
                Freeze or Unfreeze
                <Switch defaultChecked onChange={() => setFreeze(!freeze)} />
                <AddressSelect onChange={handleChange} title={"Freeze User"} />
            </>,
            disabled: currUserInfo === undefined || currUserInfo === null || currUserInfo.accountNumber < 0
        }
    ]

    return (
        <TxModal
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Revoke Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgFreezeAddress}
        >
            {children}
        </TxModal>
    );
}