import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox, Col, Divider, InputNumber, Modal, Row, Spin, StepProps, Steps, Tooltip, Typography, notification } from 'antd';
import { generatePostBodyBroadcast } from 'bitbadgesjs-provider';
import { BigIntify, CosmosCoin, Numberify, TransactionStatus } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useState } from 'react';
import { getStatus, simulateTx } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../../bitbadges-api/contexts/StatusContext';
import { CHAIN_DETAILS, DEV_MODE, INFINITE_LOOP_MODE } from '../../constants';
import { broadcastTransaction } from '../../cosmos-sdk/broadcast';
import { formatAndCreateGenericTx } from '../../cosmos-sdk/transactions';
import { AddressDisplay, } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';

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
    beforeTx?: (simulate: boolean) => Promise<any>,
    msgSteps?: StepProps[],
    displayMsg?: string | ReactNode
    // width?: number | string
    disabled?: boolean,
    requireRegistration?: boolean
    coinsToTransfer?: CosmosCoin<bigint>[],
  }
) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const router = useRouter();
  const statusContext = useStatusContext();

  const [checked, setChecked] = useState(false);
  const [irreversibleChecked, setIrreversibleChecked] = useState(false);
  const [betaChecked, setBetaChecked] = useState(false);
  const [blockchainTruthChecked, setBlockchainTruthChecked] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [amount, setAmount] = useState(0n);
  const [simulatedGas, setSimulatedGas] = useState(200000n);
  const [simulated, setSimulated] = useState(false);
  const [recommendedAmount, setRecommendedAmount] = useState(0n);

  const gasPrice = Number(statusContext.status.lastXGasAmounts.reduce((a, b) => a + b, 0n)) / Number(statusContext.status.lastXGasLimits.reduce((a, b) => a + b, 0n));


  const signedInAccount = accounts.getAccount(chain.cosmosAddress);
  const fee = {
    amount: `${amount}`,
    denom: 'badge',
    gas: `${simulatedGas}`,
  }

  const txDetails = {
    chain: CHAIN_DETAILS,
    sender: {
      accountAddress: signedInAccount?.cosmosAddress ?? "",
      sequence: signedInAccount?.sequence ?? "0",
      accountNumber: signedInAccount?.accountNumber ?? "0",
      pubkey: signedInAccount?.publicKey ?? "",
    },
    fee,
    memo: '',
  }


  let exceedsBalance = false;
  let amountBadgeTransferred = 0n;
  for (const coin of coinsToTransfer ?? []) {
    if (coin.denom === 'badge') {
      amountBadgeTransferred += BigIntify(coin.amount);
    }
  }
  amountBadgeTransferred += BigIntify(txDetails.fee.amount);

  if (signedInAccount?.balance?.amount && (amountBadgeTransferred) > BigIntify(signedInAccount?.balance?.amount)) {
    exceedsBalance = true
  } else {
    exceedsBalance = false;
  }

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: amount');
    //Simulates the transaction and sets the expected gas to be used.
    //This is used to calculate the transaction fee.
    //NOTE: This is not 100% accurate, but it is close enough. This is before the actual IPFS uris are added in, but we simulate their existince with beforeTx(..., true);
    setError('');
    if (!visible || (msgSteps && currentStep != msgSteps.length)) return;

    async function simulate() {
      try {
        if (!signedInAccount) return;


        let cosmosMsg = txCosmosMsg;
        if (beforeTx) {
          let newMsg = await beforeTx(true);
          if (newMsg) cosmosMsg = newMsg;
        }

        //Sign and broadcast transaction
        const unsignedTxSimulated = await formatAndCreateGenericTx(createTxFunction, {
          chain: CHAIN_DETAILS,
          sender: {
            accountAddress: signedInAccount?.cosmosAddress,
            sequence: signedInAccount?.sequence ?? "0",
            accountNumber: signedInAccount?.accountNumber ?? "0",
            pubkey: signedInAccount?.publicKey ?? "",
          },
          fee: {
            amount: `0`,
            denom: 'badge',
            gas: `100000000000`,
          },
          memo: '',
        }, cosmosMsg);

        console.log(unsignedTxSimulated);
        const rawTxSimulated = await chain.signTxn(unsignedTxSimulated, true);
        const simulatedTx = await simulateTx(generatePostBodyBroadcast(rawTxSimulated));
        console.log(simulatedTx);
        const gasUsed = simulatedTx.gas_info.gas_used;
        console.log("Simulated Tx Response: ", "Gas Used (", gasUsed, ")", simulatedTx);

        setSimulatedGas(BigIntify(gasUsed));
        setSimulated(true);
        setAmount(BigIntify(gasUsed) * BigIntify(Math.round(gasPrice)));
        setRecommendedAmount(BigIntify(gasUsed) * BigIntify(Math.round(gasPrice)));
        notification.success({
          message: 'Transaction Simulation Successful',
        });
      } catch (e: any) {
        if (e?.response?.data?.message) {
          setError(e.response.data.message);
        } else if (e?.message) {
          setError(e.message)
        } else {
          setError("Unknown error")
        }
      }
    }
    simulate();
  }, [txCosmosMsg, currentStep, visible, createTxFunction, chain, signedInAccount, beforeTx, msgSteps, gasPrice]);

  useEffect(() => {
    if (!visible) return
    if (INFINITE_LOOP_MODE) console.log('useEffect: status');
    statusContext.updateStatus();
  }, [visible]);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const submitTx = async (createTxFunction: any, cosmosMsg: object, isRegister: boolean) => {
    setError('');
    setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);

    try {

      //Currently used for updating IPFS metadata URIs right before tx
      //We return the new Msg from beforeTx() because we don't have time to wait for the React state (passe in cosmosMsg) to update

      //Note this 
      if (!isRegister && beforeTx) {
        let newMsg = await beforeTx(false);
        if (newMsg) cosmosMsg = newMsg;
      }

      //Sign and broadcast transaction
      // txDetails.sender.sequence = "0"

      const unsignedTxSimulated = await formatAndCreateGenericTx(createTxFunction, txDetails, cosmosMsg);
      const rawTxSimulated = await chain.signTxn(unsignedTxSimulated, true);
      const simulatedTx = await simulateTx(generatePostBodyBroadcast(rawTxSimulated));
      const gasUsed = simulatedTx.gas_info.gas_used;
      console.log("Simulated Tx Response: ", "Gas Used (", gasUsed, ")", simulatedTx);


      //Get public key (if not already stored)
      const publicKey = await chain.getPublicKey(chain.cosmosAddress);
      accounts.setPublicKey(chain.cosmosAddress, publicKey);

      const finalTxDetails = {
        ...txDetails,
        fee: {
          ...txDetails.fee,
          gas: `${Math.round(Number(gasUsed) * 1.3)}`
        },
        sender: {
          ...txDetails.sender,
          pubkey: publicKey
        }
      }

      if (Number(gasUsed) > Numberify(simulatedGas) * 1.3 || Number(gasUsed) < Numberify(simulatedGas) * 0.7) {
        // setSimulated(false);
        setSimulatedGas(BigIntify(gasUsed));
        throw new Error(`Gas used (${gasUsed}) is too different from simulated gas (${simulatedGas}). We are stopping the transaction out of precaution. Please review the updated recommended fee and try again.`);
      }


      const unsignedTx = await formatAndCreateGenericTx(createTxFunction, finalTxDetails, cosmosMsg);
      console.log("Unsigned TX:", unsignedTx);
      const rawTx = await chain.signTxn(unsignedTx, false);
      console.log("Raw TX:", rawTx);


      const msgResponse = await broadcastTransaction(rawTx);

      if (DEV_MODE) console.log(msgResponse);

      //If transaction fails with badges module error, throw error. Other errors are caught before this.
      if (msgResponse.tx_response.codespace === "badges" && msgResponse.tx_response.code !== 0) {
        throw {
          message: `Code ${msgResponse.tx_response.code} from \"${msgResponse.tx_response.codespace}\": ${msgResponse.tx_response.raw_log}`,
        }
      }

      console.log("TX:", msgResponse.tx_response);

      notification.success({
        message: 'Transaction Broadcasted',
        description: `We are now waiting for the transaction to be included on the blockchain and our servers to process that block.`,
      });

      //Wait for transaction to be included in block and indexer to process that block
      let currIndexerHeight = 0n;
      while (currIndexerHeight < Numberify(msgResponse.tx_response.height)) {
        if (currIndexerHeight != 0n) await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await getStatus();
        currIndexerHeight = response.status.block.height;
      }

      await accounts.fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchBalance: true, fetchSequence: true }], true);


      //If it is a new collection, redirect to collection page
      if (msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.key === "action" && msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.value === "/bitbadges.bitbadgeschain.badges.MsgUpdateCollection") {
        const collectionIdStr = msgResponse.tx_response.logs[0]?.events[0].attributes.find((attr: any) => attr.key === "collectionId")?.value;
        if (collectionIdStr) {
          const collectionId = Numberify(collectionIdStr)
          Modal.destroyAll()
          router.push(`/collections/${collectionId}`);
        }
      }

      notification.success({
        message: 'Transaction Successful!',
      });

      setTransactionStatus(TransactionStatus.None);
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


      if (onSuccessfulTx) onSuccessfulTx();
    } catch (err: any) {
      console.error(err);
    }
  };

  const finalSubmitStep = {
    title: <>Submit</>,
    description: <div>
      {currentStep === (msgSteps ?? []).length && <div>

        {displayMsg &&
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <br />
            {/* <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }}> */}
            {displayMsg}
            {/* </Typography.Text> */}
            <hr />
          </div>
        }

        <div style={{ textAlign: 'center' }} className='primary-text'>
          <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
            This transaction is to be signed by:
          </Typography.Text>
        </div>
        <br />
        <div className='flex-center'>
          <AddressDisplay hidePortfolioLink addressOrUsername={chain.address} overrideChain={chain.chain} />
        </div>
        <Divider />
        {txDetails?.fee && simulated ? <>
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
              Your Balance: {`${signedInAccount?.balance?.amount ?? 0}`} ${txDetails.fee.denom.toUpperCase()}
            </Typography.Text>
          </div>
          <br />
          <div style={{ textAlign: 'center' }} className='primary-text'>
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
              Transaction Fee:

              <InputNumber
                value={Numberify(txDetails.fee.amount)}
                onChange={(value) => {


                  value = value ? Math.round(value) : 0;
                  setAmount(BigInt(value));
                }}
                min={0}
                max={signedInAccount?.balance?.amount ? Numberify(signedInAccount?.balance?.amount) : 0}
                step={1}
                style={{ marginLeft: 5, marginRight: 5 }}
                className='primary-text primary-blue-bg'
              /> ${txDetails.fee.denom.toUpperCase()}
            </Typography.Text>
            <br />
            <br />
            <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className='primary-text'>
              Recommended Fee <Tooltip
                color='black'
                title="The transaction fee is the amount of cryptocurrency that is paid to the network for processing the transaction. The recommended fee was calculated based on the current market price of gas and the type of transaction."
              >
                <InfoCircleOutlined style={{ marginLeft: 5, marginRight: 5 }} />
              </Tooltip>: {recommendedAmount.toString()} ${txDetails.fee.denom.toUpperCase()}
            </Typography.Text>

          </div>

          {exceedsBalance &&
            <div style={{ textAlign: 'center' }} className='primary-text'>
              <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, color: 'red' }}>
                This transaction will send more $BADGE than your wallet balance ({amountBadgeTransferred.toString()} {">"} {`${signedInAccount?.balance?.amount ?? 0}`} $BADGE).
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
            By checking the box below, I confirm that I will verify all transaction details are as desired when signing the transaction.
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
        <br />
        <div className='flex-center'>
          <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16, alignItems: 'center' }} className='primary-text'>
            By checking the box below, I understand that the blockchain is the final source of truth.
          </Typography.Text>
        </div >
        <div className='flex-center'>
          <Checkbox
            checked={blockchainTruthChecked}
            onChange={(e) => setBlockchainTruthChecked(e.target.checked)}
          />

        </div >
      </div >}
    </div >,
    disabled: (msgSteps ?? []).find((step) => step.disabled) ? true : false
  };


  const innerContent = <>
    {children}

    {msgSteps && msgSteps.length > 0 && <>
      <Steps
        current={currentStep}
        onChange={onStepChange}
        type='navigation'
      >
        {msgSteps && [...msgSteps, finalSubmitStep].map((item, index) => (
          <Step
            key={index}
            title={<b>{item.title}</b>}
            disabled={msgSteps && [...msgSteps, finalSubmitStep].find((step, idx) => step.disabled && idx < index) ? true : false}
          />
        ))}

      </Steps>
    </>}
    <div className='primary-text'>
      <br />
      {<div>
        {[...(msgSteps ?? []), finalSubmitStep][currentStep].description}
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
        disabled: transactionStatus != TransactionStatus.None || currentStep != (msgSteps ?? []).length || !txDetails || exceedsBalance || (!checked || !irreversibleChecked || !betaChecked || !blockchainTruthChecked || disabled),
        loading: transactionStatus != TransactionStatus.None
      }}
      onCancel={() => {
        setVisible(false)
      }}
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
