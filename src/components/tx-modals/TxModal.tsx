import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, Col, Divider, InputNumber, Modal, Row, Spin, StepProps, Steps, Tooltip, Typography, message, notification } from 'antd';
import { generatePostBodyBroadcast } from 'bitbadgesjs-provider';
import { BigIntify, CosmosCoin, Numberify, TransactionStatus } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { getStatus, simulateTx } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../../bitbadges-api/contexts/StatusContext';
import { broadcastTransaction } from '../../cosmos-sdk/broadcast';
import { fetchDefaultTxDetails, formatAndCreateGenericTx } from '../../cosmos-sdk/transactions';
import { AddressDisplay, } from '../address/AddressDisplay';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';
import { DEV_MODE } from '../../constants';
import { DevMode } from '../common/DevMode';

const { Step } = Steps;

export function TxModal(
  { createTxFunction, txCosmosMsg, visible, setVisible, txName, children, style, closeIcon, bodyStyle,
    msgSteps, displayMsg, onSuccessfulTx, beforeTx, disabled,
    requireRegistration,
    coinsToTransfer
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
    onSuccessfulTx?: () => Promise<void>,
    beforeTx?: () => Promise<any>,
    msgSteps?: StepProps[],
    displayMsg?: string | ReactNode
    // width?: number | string
    disabled?: boolean,
    requireRegistration?: boolean
    coinsToTransfer?: CosmosCoin<bigint>[],
  }
) {
  if (!msgSteps) msgSteps = [];
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const router = useRouter();
  const statusContext = useStatusContext();
  const statusRef = useRef(statusContext);

  const [checked, setChecked] = useState(false);
  const [irreversibleChecked, setIrreversibleChecked] = useState(false);
  const [betaChecked, setBetaChecked] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [txDetails, setTxDetails] = useState<any>(null);
  const [exceedsBalance, setExceedsBalance] = useState(false);

  const signedInAccount = accounts.getAccount(chain.cosmosAddress);
  
  useEffect(() => {
    async function fetchDetails() {
      if ((!txDetails
        || !txDetails.sender.pubkey
        || signedInAccount?.sequence !== txDetails.sender.sequence
        || signedInAccount?.cosmosAddress !== txDetails.sender.accountAddress) && msgSteps && currentStep === msgSteps.length) {

        const txDetails = await fetchDefaultTxDetails(chain, accounts, statusContext.status.gasPrice);
        setTxDetails(txDetails);
      }
    }
    fetchDetails();
  }, [currentStep, msgSteps, signedInAccount, txDetails, statusContext.status.gasPrice, chain, accounts]);

  useEffect(() => {
    statusRef.current.updateStatus();
  }, []);

  useEffect(() => {
    if (!txDetails || !txDetails.fee) return;
    let amountBadgeTransferred = 0n;
    for (const coin of coinsToTransfer ?? []) {
      if (coin.denom === 'badge') {
        amountBadgeTransferred += BigIntify(coin.amount);
      }
    }

    if (signedInAccount?.balance?.amount && BigIntify(txDetails.fee.amount) + amountBadgeTransferred >= BigIntify(signedInAccount?.balance?.amount)) {
      setExceedsBalance(true);
    } else {
      setExceedsBalance(false);
    }
  }, [txDetails, signedInAccount?.balance?.amount, coinsToTransfer]);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const submitTx = async (createTxFunction: any, cosmosMsg: object, isRegister: boolean) => {
    setError('');
    setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);

    try {

      //Currently used for updating IPFS metadata URIs right before tx
      //We return the new Msg from beforeTx() because we don't have time to wait for the React state (passe in cosmosMsg) to update
      if (!isRegister && beforeTx) {
        let newMsg = await beforeTx();
        if (newMsg) cosmosMsg = newMsg;
      }



      //Sign and broadcast transaction
      const unsignedTxSimulated = await formatAndCreateGenericTx(createTxFunction, txDetails, cosmosMsg);
      const rawTxSimulated = await chain.signTxn(unsignedTxSimulated, true);
      const simulatedTx = await simulateTx(generatePostBodyBroadcast(rawTxSimulated));
      const gasUsed = simulatedTx.data.gas_info.gas_used;
      console.log("Simulated Tx Resposne: ", "Gas Used (", gasUsed, ")", simulatedTx);
      const finalTxDetails = {
        ...txDetails,
        fee: {
          ...txDetails.fee,
          gas: `${Math.round(gasUsed * 1.3)}`
        }
      }


      const unsignedTx = await formatAndCreateGenericTx(createTxFunction, finalTxDetails, cosmosMsg);
      console.log("Unsigned TX:", unsignedTx);
      const rawTx = await chain.signTxn(unsignedTx, false);
      console.log("Raw TX:", rawTx);


      const msgResponse = await broadcastTransaction(rawTx);

      if (DEV_MODE) console.log(msgResponse);

      //If transaction goes through, increment sequence number (includes errors within badges module)
      //Note if there is an error within ValidateBasic on the chain, the sequence number will be mismatched
      //However, this is a rare case and the user can just refresh the page to fix it. We should also strive to never allow this to happen on the frontend.
      accounts.incrementSequence(chain.cosmosAddress);

      //If transaction fails with badges module error, throw error. Other errors are caught before this.
      if (msgResponse.tx_response.codespace === "badges" && msgResponse.tx_response.code !== 0) {
        throw {
          message: `Code ${msgResponse.tx_response.code} from \"${msgResponse.tx_response.codespace}\": ${msgResponse.tx_response.raw_log}`,
        }
      }

      console.log("TX:", msgResponse.tx_response);


      //Wait for transaction to be included in block and indexer to process that block
      let currIndexerHeight = 0n;
      while (currIndexerHeight < Numberify(msgResponse.tx_response.height)) {
        if (currIndexerHeight != 0n) await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await getStatus();
        currIndexerHeight = response.status.block.height;
      }


      //If it is a new collection, redirect to collection page
      if (msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.key === "action" && msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.value === "/bitbadges.bitbadgeschain.badges.MsgNewCollection") {
        const collectionIdStr = msgResponse.tx_response.logs[0]?.events[0].attributes.find((attr: any) => attr.key === "collectionId")?.value;
        if (collectionIdStr) {
          const collectionId = Numberify(collectionIdStr)
          Modal.destroyAll()
          router.push(`/collections/${collectionId}`);
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
      await submitTx(createTxFunction, txCosmosMsg, false);
      setVisible(false);

      await accounts.fetchAccounts([chain.cosmosAddress], true);
      if (onSuccessfulTx) onSuccessfulTx();
    } catch (err: any) {
      console.error(err);
      message.error(err.message);
    }
  };

  const finalStep = {
    title: <>Sign and Submit Transaction</>,
    description: <div>
      {currentStep === msgSteps.length && <div>

        {displayMsg &&
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <br />
            {/* <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}> */}
            {displayMsg}
            {/* </Typography.Text> */}
            <hr />
          </div>
        }

        <br />

        <div style={{ textAlign: 'center' }} className='primary-text'>
          <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
            This transaction is to be signed by the following address:
          </Typography.Text>
        </div>
        <br />
        <div className='flex-center'>
          <AddressDisplay hidePortfolioLink addressOrUsername={chain.cosmosAddress} overrideChain={chain.chain} />
        </div>
        <Divider />
        {txDetails?.fee && txDetails.sender.pubkey ? <>
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
              Your Balance: {signedInAccount?.balance?.amount ?? 0} ${txDetails.fee.denom.toUpperCase()}
            </Typography.Text>
          </div>
          <br />
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
              Transaction Fee
              <Tooltip
                color='black'
                title="The transaction fee is the amount of cryptocurrency that is paid to the network for processing the transaction. The default fee was calculated based on the current market price of gas and the type of transaction."
              >
                <InfoCircleOutlined style={{ marginLeft: 5, marginRight: 5 }} />
              </Tooltip>:

              <InputNumber
                value={txDetails.fee.amount}
                onChange={(value) => {
                  setTxDetails({
                    ...txDetails,
                    fee: {
                      ...txDetails.fee,
                      amount: `${Math.round(value)}`
                    }
                  })
                }}
                min={0}
                max={signedInAccount?.balance?.amount ? Numberify(signedInAccount?.balance?.amount) : 0}
                step={1}
                style={{ marginLeft: 5, marginRight: 5 }}
                className='primary-text primary-blue-bg'
              /> ${txDetails.fee.denom.toUpperCase()}
            </Typography.Text>
          </div>

          {exceedsBalance &&
            <div style={{ textAlign: 'center' }} className='primary-text'>
              <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: 'red' }}>
                This transaction will send more $BADGE than your wallet balance ({txDetails.fee.amount} {">"} {signedInAccount?.balance?.amount ?? 0} $BADGE).
              </Typography.Text>
            </div>}

          <Divider />
        </> : <div style={{ width: '100%', display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
          <Spin size='large' />
          <Typography.Text className='secondary-text' style={{ textAlign: 'center' }} strong>Generating Transaction</Typography.Text>
          <Divider />
        </div>}
        <div className='flex-center'>
          <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, alignItems: 'center' }}>
            By checking the box below, I confirm that I have verified all transaction details are correct.
          </Typography.Text>
        </div>
        <div className='flex-center'>
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </div>
        <br />
        <div className='flex-center'>
          <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, alignItems: 'center' }} className='primary-text'>
            By checking the box below, I understand that this is a beta version of BitBadges, and there may be bugs.
          </Typography.Text>
        </div >
        <div className='flex-center'>
          <Checkbox
            checked={betaChecked}
            onChange={(e) => setBetaChecked(e.target.checked)}
          />
        </div >
        <br />
        <div className='flex-center'>
          <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, alignItems: 'center' }} className='primary-text'>
            By checking the box below, I understand that this transaction is irreversible.
          </Typography.Text>
        </div >
        <div className='flex-center'>
          <Checkbox
            checked={irreversibleChecked}
            onChange={(e) => setIrreversibleChecked(e.target.checked)}
          />
        </div >

      </div >}
    </div >,
    disabled: msgSteps.find((step) => step.disabled) ? true : false
  };


  const innerContent = <>
    {children}

    <Steps
      current={currentStep}
      onChange={onStepChange}
    >
      {msgSteps && [...msgSteps, finalStep].map((item, index) => (
        <Step
          key={index}
          title={<b>{item.title}</b>}
          disabled={msgSteps && [...msgSteps, finalStep].find((step, idx) => step.disabled && idx < index) ? true : false}
        />
      ))}

    </Steps>
    <div className='primary-text'>
      <br />
      {<div>
        {[...msgSteps, finalStep][currentStep].description}
      </div>}
      <br />
    </div>

    {
      error && <div>
        <hr />
        <div style={{ color: 'red' }}>
          Oops! {error}
        </div>
      </div>
    }

    <DevMode obj={txCosmosMsg} />
  </>

  return (
    <Modal
      title={<div className='primary-text primary-blue-bg'><b>{txName}</b></div>}
      open={visible}

      style={{
        paddingLeft: '0px',
        paddingRight: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        borderBottom: '0px',
        minWidth: '60vw',
        ...style
      }}
      // width={width ? width : '80%'}
      closeIcon={<div className='primary-text primary-blue-bg'>{closeIcon ? closeIcon : <CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
        ...bodyStyle,
        backgroundColor: '#001529',
        color: 'white'
      }}
      onOk={handleSubmitTx}
      okButtonProps={{
        disabled: transactionStatus != TransactionStatus.None || currentStep != msgSteps.length || !txDetails || exceedsBalance || (!checked || !irreversibleChecked || !betaChecked || disabled),
        loading: transactionStatus != TransactionStatus.None
      }}
      onCancel={() => setVisible(false)}
      okText={"Sign and Submit Transaction"}
      cancelText={"Cancel"}
      destroyOnClose={true}
    >
      <Row>
        <Col md={24} xs={24} sm={24}>
          {requireRegistration ?
            <RegisteredWrapper
              node={innerContent}
            /> : innerContent}
        </Col>
      </Row>
    </Modal >
  );
}
