import React, { ReactNode, useState } from 'react';
import { Typography, Modal, Steps, StepProps, Button, Divider } from 'antd';
import { TransactionStatus } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { DEV_MODE } from '../../constants';
import { AddressModalDisplay } from '../address/AddressModalDisplay';
import { MessageMsgRegisterAddresses, createTxMsgRegisterAddresses } from 'bitbadgesjs-transactions';
import { getAbbreviatedAddress } from '../../utils/AddressUtils';

const { Step } = Steps;

export function TxModal(
    { destroyOnClose, disabled, createTxFunction, txCosmosMsg, visible, setVisible, txName, children, style, closeIcon, bodyStyle,
        unregisteredUsers, onRegister, msgSteps, displayMsg }
        : {
            destroyOnClose?: boolean,
            disabled?: boolean,
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
            msgSteps?: StepProps[],
            displayMsg?: string | ReactNode
        }
) {
    if (!msgSteps) msgSteps = [];

    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
    const [error, setError] = useState<string | null>(null);
    const chain = useChainContext();

    const [current, setCurrent] = useState(0);

    const onStepChange = (value: number) => {
        setCurrent(value);
    };

    const handleSubmitTx = async () => {
        setError('');
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
                disabled: disabled || transactionStatus != TransactionStatus.None || current != msgSteps.length,
                loading: transactionStatus != TransactionStatus.None
            }}
            onCancel={() => setVisible(false)}
            okText={unregisteredUsers && unregisteredUsers.length > 0 ? "Register Users" : "Sign and Submit Transaction"}
            cancelText={"Cancel"}
            destroyOnClose={destroyOnClose ? destroyOnClose : true}
        >
            {children}


            <Steps
                current={current}
                onChange={onStepChange}
                direction="vertical"
            >
                {msgSteps && msgSteps.map((item, index) => (
                    <Step
                        key={index}
                        title={<b>{item.title}</b>} description={
                            <div>
                                {current === index && <div>
                                    {item.description}
                                </div>}
                            </div>
                        }
                        disabled={msgSteps && msgSteps.find((step, idx) => step.disabled && idx < index) ? true : false}
                    />
                ))}
                <Step
                    key={msgSteps.length}
                    title={unregisteredUsers && unregisteredUsers.length > 0 ? <b>Register Users</b> : <b>Sign and Submit Transaction</b>}
                    description={
                        <div>
                            {current === msgSteps.length && <div>
                                {!(unregisteredUsers && unregisteredUsers.length > 0) && <>
                                    {displayMsg &&
                                        <div style={{ textAlign: 'center' }}>
                                            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}>
                                                {displayMsg}
                                            </Typography.Text>
                                            <Divider />
                                        </div>
                                    }

                                    <div style={{ textAlign: 'center' }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}>
                                            Before signing the transaction, please confirm all transaction details are correct
                                            because blockchain transactions are permanent!
                                        </Typography.Text>
                                    </div>
                                    <Divider />
                                    <AddressModalDisplay

                                        userInfo={{
                                            chain: chain.chain,
                                            address: chain.address,
                                            cosmosAddress: chain.cosmosAddress,
                                            accountNumber: chain.accountNumber,
                                        }}
                                        title={"Your Connected Wallet"}
                                    />
                                </>}
                                {
                                    unregisteredUsers && unregisteredUsers.length > 0 &&
                                    <div style={{ textAlign: 'center' }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}>
                                            The following addresses ({unregisteredUsers.map((address) => getAbbreviatedAddress(address)).join(", ")}) are not currently registered on the BitBadges blockchain!
                                            To proceed, we first need to register them which is a one-time transaction.
                                            You will not need to register these addresses again.
                                        </Typography.Text>
                                    </div>
                                }</div>}
                        </div>
                    }
                    disabled={msgSteps.find((step) => step.disabled) ? true : false}
                />
            </Steps>

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
