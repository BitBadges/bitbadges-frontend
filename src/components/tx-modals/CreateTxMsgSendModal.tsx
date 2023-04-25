import { InputNumber, Modal, Typography } from 'antd';
import { MessageSendParams, createMessageSend, createTxMsgUpdateUris } from 'bitbadgesjs-transactions';
import { BitBadgesUserInfo, SupportedChain, isAddressValid } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressSelect } from '../address/AddressSelect';
import { TxModal } from './TxModal';
import { AddressDisplay } from '../address/AddressDisplay';


export function CreateTxMsgSendModal({ visible, setVisible, children,
}: {
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
}) {
    const chain = useChainContext();

    const [currUserInfo, setCurrUserInfo] = useState<BitBadgesUserInfo>({
        address: '',
        cosmosAddress: '',
        accountNumber: -1,
        chain: SupportedChain.UNKNOWN
    });
    const [sendAmount, setSendAmount] = useState<number>(0);

    const msgSend: MessageSendParams = {
        destinationAddress: currUserInfo?.cosmosAddress ? currUserInfo.cosmosAddress : '',
        amount: `${sendAmount}`,
        denom: 'badge'
    }

    const msgSteps = [
        {
            title: 'Select Recipient',
            description: <div style={{ alignItems: 'center', justifyContent: 'center' }}>
                <AddressSelect
                    darkMode
                    currUserInfo={currUserInfo}
                    setCurrUserInfo={setCurrUserInfo}
                />

            </div>,

            disabled: !isAddressValid(currUserInfo.address),
        },
        {
            title: 'Select Amount',
            description: <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <b>$BADGE to Send</b>
                <InputNumber
                    value={sendAmount}
                    onChange={(e) => {
                        setSendAmount(e)
                    }}
                    style={{ backgroundColor: PRIMARY_BLUE, color: 'white' }}
                    min={0}
                    max={chain.balance}
                />
                <br />
                <b>Current Balance: {chain.balance} $BADGE</b>
            </div>,

            disabled: sendAmount <= 0
        }
    ];


    return (
        <TxModal
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Send $BADGE"
            txCosmosMsg={msgSend}
            createTxFunction={createMessageSend}
            // displayMsg={<div style={{ textAlign: 'center' }}>
            //     <Typography.Text strong style={{ color: PRIMARY_TEXT }}>Send {sendAmount} $BADGE to</Typography.Text>
            //     <br />
            //     <AddressDisplay
            //         userInfo={currUserInfo}
            //         darkMode
            //     />
            // </div>}
            onSuccessfulTx={async () => {
                await chain.updatePortfolioInfo(chain.address);
                Modal.destroyAll()
            }}
            requireRegistration
        >
            {children}
        </TxModal >
    );
}