import React, { ReactNode, useState } from 'react';
import { Typography, Modal, Steps, StepProps, Divider, notification } from 'antd';
import { TransactionStatus } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { formatAndCreateGenericTx } from '../../bitbadges-api/transactions';
import { broadcastTransaction } from '../../bitbadges-api/broadcast';
import { DEV_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { MessageMsgRegisterAddresses, createTxMsgRegisterAddresses } from 'bitbadgesjs-transactions';
import { getAbbreviatedAddress } from '../../bitbadges-api/utils/AddressUtils';

const { Step } = Steps;

export interface TxModalContent {
    txName: string,
    txCosmosMsg: object,
    createTxFunction: any,
    msgSteps: StepProps[],
    displayMsg: string | ReactNode,
    unregisteredUsers?: string[],
    onRegister?: () => void,
}

export function TxModal(
    { createTxFunction, txCosmosMsg, visible, setVisible, txName, children, style, closeIcon, bodyStyle,
        unregisteredUsers, onRegister, msgSteps, displayMsg }
        : {

            createTxFunction: any,
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

    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const submitTx = async (createTxFunction: any, cosmosMsg: object) => {
        setError('');
        setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);
        try {
            const unsignedTx = await formatAndCreateGenericTx(createTxFunction, chain, cosmosMsg);
            const rawTx = await chain.signTxn(unsignedTx);
            const msgResponse = await broadcastTransaction(rawTx);

            if (DEV_MODE) console.log(msgResponse);

            chain.incrementSequence();

            if (msgResponse.tx_response.codespace === "badges" && msgResponse.tx_response.code !== 0) {
                throw {
                    message: `Code ${msgResponse.tx_response.code} from \"${msgResponse.tx_response.codespace}\": ${msgResponse.tx_response.raw_log}`,
                }
            }

            setTransactionStatus(TransactionStatus.None);

            notification.success({
                message: 'Transaction Successful',
                description: `Tx Hash: ${msgResponse.tx_response.txhash}`,
            });

            setTransactionStatus(TransactionStatus.None);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setTransactionStatus(TransactionStatus.None);
        }
    }

    const handleSubmitTx = async () => {
        try {
            await submitTx(createTxFunction, txCosmosMsg);
            setVisible(false);
        } catch (err: any) { }
    };

    const registerUsers = async () => {
        if (unregisteredUsers && onRegister) {
            const registerTxCosmosMsg: MessageMsgRegisterAddresses = {
                creator: chain.cosmosAddress,
                addressesToRegister: unregisteredUsers,
            };

            try {
                await submitTx(createTxMsgRegisterAddresses, registerTxCosmosMsg);
                onRegister();
            } catch (err: any) { }
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
                disabled: transactionStatus != TransactionStatus.None || currentStep != msgSteps.length,
                loading: transactionStatus != TransactionStatus.None
            }}
            onCancel={() => setVisible(false)}
            okText={unregisteredUsers && unregisteredUsers.length > 0 ? "Register Users" : "Sign and Submit Transaction"}
            cancelText={"Cancel"}
            destroyOnClose={true}
        >
            {children}

            <Steps
                current={currentStep}
                onChange={onStepChange}
                direction="vertical"
            >
                {msgSteps && msgSteps.map((item, index) => (
                    <Step
                        key={index}
                        title={<b>{item.title}</b>} description={
                            <div>
                                {currentStep === index && <div>
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
                            {currentStep === msgSteps.length && <div>
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
                                    <AddressDisplay

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
