import React, { ReactNode, useState } from 'react';
import { Typography, Modal } from 'antd';
import { TransactionStatus } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { DEV_MODE } from '../../constants';
import { AddressModalDisplay } from './AddressModalDisplay';
import { MessageMsgRegisterAddresses, createTxMsgRegisterAddresses } from 'bitbadgesjs-transactions';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';

export function TxModal(
    { destroyOnClose, disabled, displayMsg, createTxFunction, txCosmosMsg, visible, setVisible, txName, children, style, closeIcon, bodyStyle,
        unregisteredUsers, onRegister }
        : {
            destroyOnClose?: boolean,
            disabled?: boolean,
            displayMsg: string | ReactNode,
            createTxFunction: any, //TODO
            txCosmosMsg: object,
            visible: boolean,
            setVisible: (visible: boolean) => void,
            txName: string,
            children?: React.ReactNode,
            style?: React.CSSProperties,
            closeIcon?: React.ReactNode,
            bodyStyle?: React.CSSProperties,
            unregisteredUsers?: string[],
            onRegister?: () => void,
        }
) {
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
    const [error, setError] = useState<string | null>(null);
    const chain = useChainContext();

    const handleSubmitTx = async () => {
        setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);
        try {
            const unsignedTx = await formatAndCreateGenericTx(createTxFunction, chain, txCosmosMsg);
            const rawTx = await chain.signTxn(unsignedTx);
            const msgResponse = await broadcastTransaction(rawTx);

            if (DEV_MODE) console.log(msgResponse);

            setTransactionStatus(TransactionStatus.None);

            //TODO: way to track tx - link to block explorer
            chain.incrementSequence();

            setVisible(false);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setTransactionStatus(TransactionStatus.None);
        }
    };

    const registerUsers = async () => {
        if (unregisteredUsers && onRegister) {
            const registerTxCosmosMsg: MessageMsgRegisterAddresses = {
                creator: chain.cosmosAddress,
                addressesToRegister: unregisteredUsers,
            };

            setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);
            try {
                const unsignedTx = await formatAndCreateGenericTx(createTxMsgRegisterAddresses, chain, registerTxCosmosMsg);
                const rawTx = await chain.signTxn(unsignedTx);
                const msgResponse = await broadcastTransaction(rawTx);

                if (DEV_MODE) console.log(msgResponse);

                chain.incrementSequence();
                setTransactionStatus(TransactionStatus.None);
                onRegister();
            } catch (err: any) {
                console.error(err);
                setError(err.message);
                setTransactionStatus(TransactionStatus.None);
            }
        }
    };

    return (
        <Modal
            title={<b>{txName}</b>}
            open={visible}
            style={{
                paddingLeft: '12px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                borderBottom: '0px',
                ...style
            }}
            closeIcon={closeIcon}
            bodyStyle={{
                paddingTop: 8,
                fontSize: 20,
                ...bodyStyle
            }}
            onOk={unregisteredUsers && unregisteredUsers.length > 0 ? registerUsers : handleSubmitTx}
            okButtonProps={{
                disabled: disabled || transactionStatus != TransactionStatus.None,
                loading: transactionStatus != TransactionStatus.None
            }}
            onCancel={() => setVisible(false)}
            okText={unregisteredUsers && unregisteredUsers.length > 0 ? "Register Users" : "Sign and Submit Transaction"}
            cancelText={"Cancel"}
            destroyOnClose={destroyOnClose ? destroyOnClose : true}
        >
            {children}
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 20 }}>
                {displayMsg}
            </Typography.Text>
            <hr />
            {/* {TODO: make it clear that everything is permanent} */}
            {!(unregisteredUsers && unregisteredUsers.length > 0) && <>
                <div style={{ textAlign: 'center' }}>
                    <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}>
                        Please confirm all the above transaction details are correct.
                        If they are, you may proceed by signing and submitting the transaction
                        with the following wallet:
                    </Typography.Text>
                </div>
                <AddressModalDisplay
                    userInfo={{
                        chain: chain.chain,
                        address: chain.address,
                        cosmosAddress: chain.cosmosAddress,
                        accountNumber: chain.accountNumber,
                    }}
                // title={"Your Signing Wallet: "}
                />
            </>}
            {
                unregisteredUsers && unregisteredUsers.length > 0 &&
                <div style={{ textAlign: 'center' }}>
                    <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}>
                        The following addresses ({unregisteredUsers.map((address) => getAbbreviatedAddress(address)).join(", ")}) are not currently registered on the BitBadges blockchain!
                        Once you have added all addresses, you may register them by clicking the button below!
                        Registration is a one-time transaction. You will not need to register these addresses again.
                    </Typography.Text>
                </div>
            }

            {error && <div>
                <hr />
                <div style={{ color: 'red' }}>
                    Oops! {error}
                </div>
            </div>}


            {DEV_MODE && <>
                <hr />
                <pre>
                    {JSON.stringify(txCosmosMsg, null, 2)}
                </pre>
            </>}
        </Modal>
    );
}
