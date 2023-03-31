import { CloseOutlined } from '@ant-design/icons';
import { Checkbox, Divider, Modal, StepProps, Steps, Typography, notification } from 'antd';
import { MessageMsgRegisterAddresses, createTxMsgRegisterAddresses } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { ReactNode, useState } from 'react';
import { getStatus } from '../../bitbadges-api/api';
import { broadcastTransaction } from '../../cosmos-sdk/broadcast';
import { formatAndCreateGenericTx } from '../../cosmos-sdk/transactions';
import { TransactionStatus } from 'bitbadges-sdk';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressDisplay, AddressDisplayList } from '../address/AddressDisplay';

const { Step } = Steps;

export function TxModal(
    { createTxFunction, txCosmosMsg, visible, setVisible, txName, children, style, closeIcon, bodyStyle,
        unregisteredUsers, onRegister, msgSteps, displayMsg, onSuccessfulTx, width, beforeTx, disabled
    }: {
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
        onSuccessfulTx?: () => Promise<void>,
        beforeTx?: () => Promise<any>,
        msgSteps?: StepProps[],
        displayMsg?: string | ReactNode
        width?: number | string
        disabled?: boolean
    }
) {
    if (!msgSteps) msgSteps = [];
    const chain = useChainContext();
    const accounts = useAccountsContext();
    const router = useRouter();

    const [checked, setChecked] = useState(false);
    const [irreversibleChecked, setIrreversibleChecked] = useState(false);
    const [betaChecked, setBetaChecked] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);


    const onStepChange = (value: number) => {
        setCurrentStep(value);
    };

    const submitTx = async (createTxFunction: any, cosmosMsg: object) => {
        setError('');
        setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);

        try {
            //Currently used for updating IPFS metadata URIs right before tx
            //We return the new Msg from beforeTx() because we don't have time to wait for the React state (passe in cosmosMsg) to update
            if (beforeTx) {
                let newMsg = await beforeTx();
                if (newMsg) cosmosMsg = newMsg;
            }

            //Sign and broadcast transaction
            const unsignedTx = await formatAndCreateGenericTx(createTxFunction, chain, cosmosMsg);
            const rawTx = await chain.signTxn(unsignedTx);
            const msgResponse = await broadcastTransaction(rawTx);

            if (DEV_MODE) console.log(msgResponse);

            //If transaction goes through, increment sequence number (includes errors within badges module)
            //Note if there is an error within ValidateBasic on the chain, the sequence number will be mismatched
            //However, this is a rare case and the user can just refresh the page to fix it. We should also strive to never allow this to happen on the frontend.
            chain.incrementSequence();

            //If transaction fails with badges module error, throw error. Other errors are caught before this.
            if (msgResponse.tx_response.codespace === "badges" && msgResponse.tx_response.code !== 0) {
                throw {
                    message: `Code ${msgResponse.tx_response.code} from \"${msgResponse.tx_response.codespace}\": ${msgResponse.tx_response.raw_log}`,
                }
            }

            console.log("TX:", msgResponse.tx_response);


            //Wait for transaction to be included in block and indexer to process that block
            let currIndexerHeight = 0;
            while (currIndexerHeight < Number(msgResponse.tx_response.height)) {
                if (currIndexerHeight != 0) await new Promise(resolve => setTimeout(resolve, 1000));

                const response = await getStatus();
                currIndexerHeight = response.status.block.height;
            }


            //If it is a new collection, redirect to collection page
            //HACK: This is a hacky way to do this. We should have a better way to handle this. Eventually, we will not even return the collection in an event. Look to use the Msg
            if (msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.key === "action" && msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.value === "/bitbadges.bitbadgeschain.badges.MsgNewCollection") {
                const collectionStr = msgResponse.tx_response.logs[0]?.events[0].attributes.find((attr: any) => attr.key === "collection")?.value;
                if (collectionStr) {
                    const collection = JSON.parse(collectionStr)
                    router.push(`/collections/${collection.collectionId}`);
                }
            }

            setTransactionStatus(TransactionStatus.None);

            notification.success({
                message: 'Transaction Successful',
                description: `Tx Hash: ${msgResponse.tx_response.txhash}`,
            });


            if (msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.key === "action" && msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.value === "/bitbadges.bitbadgeschain.badges.MsgUpdateUris") {
                notification.info({
                    message: 'Refreshing Metadata',
                    description: 'We have added your new metadata to the refresh queue. Note that it may take awhile for it to be processed and reflected on the website. Please check back later.'
                });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setTransactionStatus(TransactionStatus.None);
            throw err;
        }
    }

    const handleSubmitTx = async () => {
        try {
            await submitTx(createTxFunction, txCosmosMsg);
            setVisible(false);

            if (onSuccessfulTx) onSuccessfulTx();
        } catch (err: any) {

        }
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
            } catch (err: any) {

            }
        }
    };

    return (
        <Modal
            title={<div style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
            }}><b>{txName}</b></div>}
            open={visible}

            style={{
                paddingLeft: '12px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                borderBottom: '0px',
                ...style
            }}
            width={width ? width : '80%'}
            closeIcon={<div style={{
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
            }}>{closeIcon ? closeIcon : <CloseOutlined />}</div>}
            bodyStyle={{
                paddingTop: 8,
                fontSize: 20,
                ...bodyStyle,
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT
            }}
            onOk={unregisteredUsers && unregisteredUsers.length > 0 ? registerUsers : handleSubmitTx}
            okButtonProps={{
                disabled: transactionStatus != TransactionStatus.None || currentStep != msgSteps.length || (unregisteredUsers && unregisteredUsers.length > 0 ? false : (!checked || !irreversibleChecked || !betaChecked || disabled)),
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
                            <div style={{ color: PRIMARY_TEXT }}>
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
                                        <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
                                            <br />
                                            {/* <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}> */}
                                            {displayMsg}
                                            {/* </Typography.Text> */}
                                            <hr />
                                        </div>
                                    }

                                    <br />

                                    <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: PRIMARY_TEXT }}>
                                            This transaction is to be signed by the following address:
                                        </Typography.Text>


                                    </div>
                                    <br />
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <AddressDisplay
                                            userInfo={{
                                                chain: chain.chain,
                                                address: chain.address,
                                                cosmosAddress: chain.cosmosAddress,
                                                accountNumber: chain.accountNumber,
                                            }}
                                            // title={"Your Connected Wallet"}
                                            // showAccountNumber
                                            hidePortfolioLink
                                            darkMode
                                        />
                                    </div>
                                    <Divider />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: PRIMARY_TEXT, alignItems: 'center' }}>
                                            By checking the box below, I confirm that I have verified all transaction details are correct.
                                        </Typography.Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={checked}
                                            onChange={(e) => setChecked(e.target.checked)}
                                        />
                                    </div>
                                    <br />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: PRIMARY_TEXT, alignItems: 'center' }}>
                                            By checking the box below, I understand that this is a beta version of BitBadges, and there may be bugs.
                                        </Typography.Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={betaChecked}
                                            onChange={(e) => setBetaChecked(e.target.checked)}
                                        />
                                    </div>
                                    <br />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: PRIMARY_TEXT, alignItems: 'center' }}>
                                            By checking the box below, I understand that this transaction is irreversible.
                                        </Typography.Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Checkbox
                                            checked={irreversibleChecked}
                                            onChange={(e) => setIrreversibleChecked(e.target.checked)}
                                        />
                                    </div>
                                </>}
                                {
                                    unregisteredUsers && unregisteredUsers.length > 0 &&
                                    <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
                                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: PRIMARY_TEXT }}>
                                            Before proceeding with this transaction, we need to register the following addresses
                                            because they have not interacted with BitBadges yet.
                                        </Typography.Text>
                                        <Divider />
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <AddressDisplayList
                                                title={'Unregistered Addresses'}
                                                users={unregisteredUsers.map((address) => accounts.accounts[accounts.cosmosAddresses[address]])}
                                                fontColor={PRIMARY_TEXT}
                                                hideAccountNumber
                                            />
                                        </div>
                                    </div>
                                }</div>}
                        </div>
                    }
                    disabled={msgSteps.find((step) => step.disabled) ? true : false}
                />
            </Steps>

            {
                error && <div>
                    <hr />
                    <div style={{ color: 'red' }}>
                        Oops! {error}
                    </div>
                </div>
            }


            {
                DEV_MODE && <>
                    <hr />
                    <pre>
                        {JSON.stringify(txCosmosMsg, null, 2)}
                    </pre>
                </>
            }
        </Modal >
    );
}
