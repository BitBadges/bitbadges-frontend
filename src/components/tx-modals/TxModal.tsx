import { CloseOutlined, CodeOutlined, InfoCircleOutlined, MinusOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Checkbox, Col, Divider, InputNumber, Modal, Row, Spin, StepProps, Steps, Switch, Tooltip, Typography, notification } from 'antd';
import {
  BigIntify,
  CosmosCoin,
  MsgCreateAddressLists,
  MsgCreateCollection,
  MsgCreateProtocol,
  MsgDeleteCollection,
  MsgDeleteProtocol,
  MsgExecuteContractCompat,
  MsgInstantiateContractCompat,
  MsgSetCollectionForProtocol,
  MsgTransferBadges,
  MsgUniversalUpdateCollection,
  MsgUnsetCollectionForProtocol,
  MsgUpdateCollection,
  MsgUpdateProtocol,
  MsgUpdateUserApprovals,
  Numberify,
  TxContext
} from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { broadcastTx, simulateTx } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../../bitbadges-api/contexts/StatusContext';
import {
  MsgExecuteContractCompat as ProtoMsgExecuteContractCompat,
  MsgInstantiateContractCompat as ProtoMsgInstantiateContractCompat
} from 'bitbadgesjs-sdk/dist/proto/wasmx/tx_pb';
import { MsgStoreCode as ProtoMsgStoreCode } from 'bitbadgesjs-sdk/dist/proto/cosmwasm/wasm/v1/tx_pb';
import { MsgSend as ProtoMsgSend } from 'bitbadgesjs-sdk/dist/proto/cosmos/bank/v1beta1/tx_pb';
import { MsgVote as ProtoMsgVote } from 'bitbadgesjs-sdk/dist/proto/cosmos/gov/v1beta1/tx_pb';
import { MsgDeposit as ProtoMsgDeposit } from 'bitbadgesjs-sdk/dist/proto/cosmos/gov/v1beta1';
import { MsgSubmitProposal as ProtoMsgSubmitProposal } from 'bitbadgesjs-sdk/dist/proto/cosmos/gov/v1beta1/tx_pb';
import { MsgDelegate as ProtoMsgDelegate, MsgUndelegate as ProtoMsgUndelegate } from 'bitbadgesjs-sdk/dist/proto/cosmos/staking/v1beta1';

import { createTransactionPayload } from 'bitbadgesjs-sdk';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { fetchAccountsWithOptions, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { CHAIN_DETAILS, DEV_MODE, INFINITE_LOOP_MODE } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { DevMode } from '../common/DevMode';
import IconButton from '../display/IconButton';
import { DisconnectedWrapper } from '../wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';
import { TransactionStatus } from '../../bitbadges-api/types';

const { Step } = Steps;

export interface TxInfo {
  type: string;
  msg: object;
  generateProtoMsg?: (msg: object) => any;
  beforeTx?: (simulate: boolean) => Promise<any>;
  afterTx?: (collectionId: bigint) => Promise<void>;
}

export function TxModal({
  txsInfo,
  visible,
  setVisible,
  txName,
  children,
  style,
  closeIcon,
  bodyStyle,
  msgSteps,
  disabled,
  requireLogin,
  coinsToTransfer,
  width
}: {
  txsInfo: TxInfo[];
  visible: boolean;
  setVisible: (visible: boolean) => void;
  txName: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  closeIcon?: React.ReactNode;
  bodyStyle?: React.CSSProperties;

  msgSteps?: StepProps[];
  disabled?: boolean;
  requireLogin?: boolean;
  coinsToTransfer?: Array<CosmosCoin<bigint>>;
  width?: number | string;
}) {
  const chain = useChainContext();

  const router = useRouter();
  const statusContext = useStatusContext();
  const txTimelineContext = useTxTimelineContext();

  const [irreversibleChecked, setIrreversibleChecked] = useState(false);
  const [betaChecked, setBetaChecked] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(TransactionStatus.None);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [useRecommendedFee, setUseRecommendedFee] = useState(true);

  const [amount, setAmount] = useState(0n);
  const [simulatedGas, setSimulatedGas] = useState(200000n);
  const [simulated, setSimulated] = useState(false);
  const [recommendedAmount, setRecommendedAmount] = useState(0n);
  const [showJson, setShowJson] = useState<object[] | null>(null);

  const [finalMsgs, setFinalMsgs] = useState<any[] | null>(null);

  const signedInAccount = useAccount(chain.cosmosAddress);
  const isClaimTransaction = txName === 'Claim Badge';

  const txsInfoPopulated = useMemo(() => {
    return txsInfo.map((tx) => {
      let createFunction = undefined;
      switch (tx.type) {
        case 'MsgUniversalUpdateCollection':
          createFunction = (msg: MsgUniversalUpdateCollection<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgCreateAddressLists':
          createFunction = (msg: MsgCreateAddressLists) => {
            return msg.toProto();
          };
          break;
        case 'MsgCreateCollection':
          createFunction = (msg: MsgCreateCollection<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgDeleteCollection':
          createFunction = (msg: MsgDeleteCollection<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgTransferBadges':
          createFunction = (msg: MsgTransferBadges<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgUpdateUserApprovals':
          createFunction = (msg: MsgUpdateUserApprovals<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgUpdateCollection':
          createFunction = (msg: MsgUpdateCollection<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgCreateProtocol':
          createFunction = (msg: MsgCreateProtocol) => {
            return msg.toProto();
          };
          break;
        case 'MsgUpdateProtocol':
          createFunction = (msg: MsgUpdateProtocol) => {
            return msg.toProto();
          };
          break;
        case 'MsgDeleteProtocol':
          createFunction = (msg: MsgDeleteProtocol) => {
            return msg.toProto();
          };
          break;
        case 'MsgSetCollectionForProtocol':
          createFunction = (msg: MsgSetCollectionForProtocol<bigint>) => {
            return msg.toProto();
          };
          break;
        case 'MsgUnsetCollectionForProtocol':
          createFunction = (msg: MsgUnsetCollectionForProtocol) => {
            return msg.toProto();
          };
          break;
        case 'MsgSend':
          createFunction = (params: ProtoMsgSend) => {
            return new ProtoMsgSend({
              fromAddress: params.fromAddress,
              toAddress: params.toAddress,
              amount: params.amount.map((coin) => {
                return {
                  amount: coin.amount.toString(),
                  denom: coin.denom
                };
              })
            });
          };
          break;
        case 'MsgStoreCode':
          createFunction = (params: any) => {
            return new ProtoMsgStoreCode({
              ...params,
              sender: chain.cosmosAddress
              //We already convery in broadcast.tsx
              // wasmByteCode: new Uint8Array(Buffer.from(params.wasmByteCode)),
            });
          };
          break;
        case 'MsgInstantiateContractCompat':
          createFunction = (params: MsgInstantiateContractCompat) => {
            return new ProtoMsgInstantiateContractCompat({
              ...params,
              sender: chain.cosmosAddress
            });
          };
          break;
        case 'MsgExecuteContractCompat':
          createFunction = (params: MsgExecuteContractCompat) => {
            return new ProtoMsgExecuteContractCompat({
              ...params,
              sender: chain.cosmosAddress
            });
          };
          break;
        case 'MsgDelegate':
          createFunction = (params: ProtoMsgDelegate) => {
            return new ProtoMsgDelegate({
              ...params,
              delegatorAddress: chain.cosmosAddress
            });
          };
          break;
        case 'MsgUndelegate':
          createFunction = (params: ProtoMsgUndelegate) => {
            return new ProtoMsgUndelegate({
              ...params,
              delegatorAddress: chain.cosmosAddress
            });
          };
          break;
        case 'MsgSubmitProposal':
          createFunction = (params: ProtoMsgSubmitProposal) => {
            console.log('params', params);
            return new ProtoMsgSubmitProposal({
              ...params,
              proposer: chain.cosmosAddress
            });
          };
          break;
        case 'MsgDeposit':
          createFunction = (params: ProtoMsgDeposit) => {
            return new ProtoMsgDeposit({
              ...params,
              depositor: chain.cosmosAddress
            });
          };
          break;
        case 'MsgVote':
          createFunction = (params: ProtoMsgVote) => {
            return new ProtoMsgVote({
              ...params,
              voter: chain.cosmosAddress
            });
          };
          break;
      }

      return {
        ...tx,
        generateProtoMsg: (tx.generateProtoMsg ?? createFunction) as (msg: object) => any
      };
    });
  }, [txsInfo, chain.cosmosAddress]);

  useEffect(() => {
    setFinalMsgs(null);
  }, [txsInfo]);

  const fee = useMemo(() => {
    return {
      amount: `${amount}`,
      denom: 'badge',
      gas: `${simulatedGas}`
    };
  }, [amount, simulatedGas]);

  const txDetails = useMemo(() => {
    return {
      chain: {
        ...CHAIN_DETAILS,
        chain: chain.chain as any
      },
      sender: {
        accountAddress: signedInAccount?.cosmosAddress ?? '',
        sequence: Number(signedInAccount?.sequence ?? '0') >= 0 ? Number(signedInAccount?.sequence ?? '0') : 0,
        accountNumber: Number(signedInAccount?.accountNumber ?? '0'),
        pubkey: signedInAccount?.publicKey ?? ''
      },
      fee,
      memo: ''
    };
  }, [chain.chain, signedInAccount, fee]);

  let exceedsBalance = false;
  let amountBadgeTransferred = 0n;
  for (const coin of coinsToTransfer ?? []) {
    if (coin.denom === 'badge') {
      amountBadgeTransferred += BigIntify(coin.amount);
    }
  }
  amountBadgeTransferred += BigIntify(txDetails.fee.amount);

  if (signedInAccount?.balance?.amount && amountBadgeTransferred > BigIntify(signedInAccount?.balance?.amount)) {
    exceedsBalance = true;
  } else {
    exceedsBalance = false;
  }

  const updateStatus = useCallback(async () => {
    const status = await statusContext.updateStatus();
    return status;
  }, []);

  const msgStepsLength = useMemo(() => {
    return msgSteps?.length ?? 0;
  }, [msgSteps?.length]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: amount');
    //Simulates the transaction and sets the expected gas to be used.
    //This is used to calculate the transaction fee.
    //NOTE: This is not 100% accurate, but it is close enough. This is before the actual IPFS uris are added in, but we simulate their existince with beforeTx(..., true);
    setError('');
    if (!visible || (msgStepsLength && currentStep != msgStepsLength)) return;

    async function simulate() {
      try {
        if (!signedInAccount) return;

        const status = await updateStatus();
        const gasPrice = Number(status.lastXGasAmounts.reduce((a, b) => a + b, 0n)) / Number(status.lastXGasLimits.reduce((a, b) => a + b, 0n));

        //Don't do anything with these msgs like setShowJson bc they are simulated messages, not final ones
        const generatedMsgs = [];
        for (const tx of txsInfoPopulated) {
          const { generateProtoMsg, beforeTx, msg } = tx;

          let cosmosMsg = msg;
          if (beforeTx) {
            const newMsg = await beforeTx(true);
            if (newMsg) cosmosMsg = newMsg;
          }

          generatedMsgs.push(generateProtoMsg(cosmosMsg));
        }

        const context: TxContext = {
          chain: {
            ...CHAIN_DETAILS,
            chain: chain.chain as any
          },
          sender: {
            accountAddress: signedInAccount?.cosmosAddress,
            sequence: Number(signedInAccount?.sequence ?? '0') >= 0 ? Number(signedInAccount?.sequence ?? '0') : 0,
            accountNumber: Number(signedInAccount?.accountNumber ?? '0'),
            pubkey: signedInAccount?.publicKey ?? ''
          },
          fee: {
            amount: `0`,
            denom: 'badge',
            gas: `100000000000`
          },
          memo: ''
        };
        const payload = await createTransactionPayload(context, generatedMsgs);

        console.log(payload);
        const simulatedTxBody = await chain.signTxn(context, payload, true);

        const simulatedTx = await simulateTx(simulatedTxBody);
        console.log(simulatedTx);
        const gasUsed = simulatedTx.gas_info.gas_used;
        console.log('Simulated Tx Response: ', 'Gas Used (', gasUsed, ')', simulatedTx);

        setSimulatedGas(BigIntify(gasUsed));
        setSimulated(true);
        setAmount(BigIntify(gasUsed) * BigIntify(Math.round(gasPrice)));
        setRecommendedAmount(BigIntify(gasUsed) * BigIntify(Math.round(gasPrice)));
      } catch (e: any) {
        if (e?.response?.data?.message) {
          setError(e.response.data.message);
        } else if (e?.message) {
          setError(e.message);
        } else {
          setError('Unknown error');
        }
      }
    }
    simulate();
  }, [currentStep, visible, signedInAccount, txsInfoPopulated, chain, updateStatus, msgStepsLength]);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const submitTx = async (txsInfo: TxInfo[]) => {
    setError('');
    setTransactionStatus(TransactionStatus.AwaitingSignatureOrBroadcast);

    try {
      //Currently used for updating IPFS metadata URIs right before tx
      //We return the new Msg from beforeTx() because we don't have time to wait for the React state (passe in cosmosMsg) to update

      const generatedMsgs = [];
      for (let i = 0; i < txsInfo.length; i++) {
        const tx = txsInfo[i];
        const { generateProtoMsg, beforeTx, msg } = tx;
        if (!generateProtoMsg) throw new Error('generateProtoMsg is undefined');

        let cosmosMsg = msg;
        if (!finalMsgs?.length) {
          if (beforeTx) {
            const newMsg = await beforeTx(false);
            if (newMsg) cosmosMsg = newMsg;
          }
          generatedMsgs.push(generateProtoMsg(cosmosMsg));
        } else {
          generatedMsgs.push(finalMsgs[i]);
        }
      }
      setFinalMsgs(generatedMsgs);

      //Sign and broadcast transaction
      // txDetails.sender.sequence = "0"

      const simulatePayload = await createTransactionPayload(txDetails, generatedMsgs);
      const txBody = await chain.signTxn(txDetails, simulatePayload, true);
      console.log('SIMULATING TX', txBody);
      const simulatedTx = await simulateTx(txBody);
      const gasUsed = simulatedTx.gas_info.gas_used;
      console.log('Simulated Tx Response: ', 'Gas Used (', gasUsed, ')', simulatedTx);

      //Get public key (if not already stored)
      const publicKey = await chain.getPublicKey(chain.cosmosAddress);

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
      };
      const finalPayload = await createTransactionPayload(finalTxDetails, generatedMsgs);
      console.log('Unsigned TX:', finalPayload);
      const txBodyFinal = await chain.signTxn(finalTxDetails, finalPayload, false);
      const initialRes = await broadcastTx(txBodyFinal);

      if (DEV_MODE) console.log(initialRes);

      const msgResponse = initialRes;

      //If transaction fails with badges module error, throw error. Other errors are caught before this.
      if (msgResponse.tx_response.codespace === 'badges' && msgResponse.tx_response.code !== 0) {
        throw {
          message: `Code ${msgResponse.tx_response.code} from \"${msgResponse.tx_response.codespace}\": ${msgResponse.tx_response.raw_log}`
        };
      }

      console.log('TX:', msgResponse.tx_response);

      notification.success({
        message: 'Transaction Broadcasted',
        description: `We are now waiting for the transaction to be included on the blockchain and our servers to process that block.`
      });

      const codeIdAttr = msgResponse.tx_response.events.find((x) => x.attributes.find((y) => y.key === 'code_id'));
      let codeId = 0;
      if (codeIdAttr) {
        codeId = Number(codeIdAttr.attributes.find((y) => y.key === 'code_id')?.value);
      }

      let contractAddr = '';
      const contractAddrAttr = msgResponse.tx_response.events.find((x) => x.attributes.find((y) => y.key === '_contract_address'));
      if (contractAddrAttr) {
        contractAddr = contractAddrAttr.attributes.find((y) => y.key === '_contract_address')?.value ?? '';
      }

      if (codeId && !contractAddr) {
        notification.info({
          message: 'Code ID',
          description: `Your contract's code ID is ${codeId}.`,
          duration: 0
        });
      } else if (contractAddr) {
        notification.info({
          message: 'Contract Address',
          description: `Your contract's address is ${contractAddr}.`,
          duration: 0
        });
      }

      //Wait for transaction to be included in block and indexer to process that block
      let currIndexerHeight = 0n;
      const maxTries = 60;
      let numTries = 0;
      while (currIndexerHeight < Numberify(msgResponse.tx_response.height)) {
        if (currIndexerHeight != 0n) await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          const response = await statusContext.updateStatus();
          if (statusContext.maintenanceMode) {
            notification.info({
              message: 'Out of Sync',
              description: `Your transaction was processed on the blockchain, but our servers are running slowly or down.
              They were last synced at ${new Date(Number(response.block.timestamp)).toLocaleTimeString()}.
              In the meantime, you may not see your transaction results until our servers are synced back up.
              You can view your transaction on a block explorer.`,
              duration: 0
            });

            await router.push('/');
            setTransactionStatus(TransactionStatus.None);
            return;
          }

          currIndexerHeight = response.block.height;

          numTries++;
        } catch (e) {
          notification.info({
            message: 'Fetch Error',
            description: `There was an error communicating with the BitBadges servers. Your transaction was processed on the blockchain, but our servers are running slowly or down. In the meantime, you may not see your transaction results until our servers are synced back up. However, your transaction was successful.`,
            duration: 0
          });

          await router.push('/');
          setTransactionStatus(TransactionStatus.None);
          return;
        }

        if (numTries > maxTries) {
          notification.info({
            message: 'Heavy Load',
            description: `BitBadges is experiencing heavy load currently. Your transaction was processed on the blockchain, but our servers are running slowly or down. In the meantime, you may not see your transaction results until our servers are synced back up. However, your transaction was successful.`,
            duration: 0
          });

          await router.push('/');
          setTransactionStatus(TransactionStatus.None);
          return;
        }
      }

      notification.success({
        message: 'Transaction Successful!'
      });

      if (window.opener) {
        window.opener.postMessage({ type: 'txSuccess', txHash: msgResponse.tx_response.txhash }, '*');
        window.close();
      }

      setTransactionStatus(TransactionStatus.None);
      await fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchBalance: true, fetchSequence: true }], true);

      //If it is a new collection, redirect to collection page
      if (
        msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.key === 'action' &&
        msgResponse.tx_response.logs[0]?.events[0]?.attributes[0]?.value === '/badges.MsgUniversalUpdateCollection'
      ) {
        const collectionIdStr = msgResponse.tx_response.logs[0]?.events[1].attributes.find((attr: any) => attr.key === 'collectionId')?.value;
        if (collectionIdStr) {
          const collectionId = Numberify(collectionIdStr);
          Modal.destroyAll();

          await router.push(`/collections/${collectionId}`);

          return BigInt(collectionIdStr);
        }
      }

      return 0n;
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
      setTransactionStatus(TransactionStatus.None);
      throw err;
    }
  };

  const handleSubmitTx = async () => {
    try {
      const collectionId = await submitTx(txsInfoPopulated);

      for (const tx of txsInfoPopulated) {
        const { afterTx } = tx;
        if (afterTx) {
          await afterTx(collectionId ?? 0n);
        }
      }

      await txTimelineContext.resetState();
      setVisible(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const finalSubmitStep = {
    title: <>Submit</>,
    description: (
      <DisconnectedWrapper
        message={`Please connect${requireLogin ? ' and sign in' : ''} to access.`}
        requiresSignature={true} //We allow reserving badges without signing
        requireLogin={requireLogin}
        node={
          <>
            <div>
              {currentStep === (msgSteps ?? []).length && (
                <div>
                  <div className="flex-center flex-wrap" style={{ alignItems: 'normal' }}>
                    <Col md={8} xs={24} style={{ textAlign: 'center' }}>
                      <Typography.Text
                        strong
                        style={{
                          textAlign: 'center',
                          alignContent: 'center',
                          alignItems: 'center',
                          fontSize: 24
                        }}
                        className="primary-text flex-center">
                        Signer
                      </Typography.Text>
                      <br />
                      <div className="flex-center">
                        <AddressDisplay hidePortfolioLink addressOrUsername={chain.address} overrideChain={chain.chain} fontSize={16} />
                      </div>
                      <br />
                      <div style={{ textAlign: 'center' }} className="primary-text">
                        <Typography.Text strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 16 }} className="primary-text">
                          Balance: {`${signedInAccount?.balance?.amount ?? 0}`} ${txDetails.fee.denom.toUpperCase()}
                        </Typography.Text>
                      </div>
                      <br />
                    </Col>

                    <Col md={8} xs={24} style={{ textAlign: 'center' }}>
                      <Typography.Text
                        strong
                        style={{
                          textAlign: 'center',
                          alignContent: 'center',
                          alignItems: 'center',
                          fontSize: 24
                        }}
                        className="primary-text flex-center">
                        Fee
                        <Tooltip
                          color="black"
                          title="The transaction fee is the amount of cryptocurrency that is paid to the network for processing the transaction. The recommended fee was calculated based on the current market price of gas and the type of transaction.">
                          <InfoCircleOutlined style={{ marginLeft: 5, marginRight: 5 }} />
                        </Tooltip>
                      </Typography.Text>
                      <br />
                      {txDetails?.fee && simulated ? (
                        <>
                          <Switch
                            checked={useRecommendedFee}
                            onChange={(checked) => {
                              setUseRecommendedFee(checked);
                              setAmount(checked ? recommendedAmount : BigIntify(txDetails.fee.amount));
                            }}
                            checkedChildren="Recommended"
                            unCheckedChildren="Custom"
                          />
                          <br />
                          <br />
                          <Typography.Text
                            strong
                            style={{
                              textAlign: 'center',
                              alignContent: 'center',
                              alignItems: 'center',
                              fontSize: 16
                            }}
                            className="primary-text flex-center">
                            {useRecommendedFee ? (
                              <>{recommendedAmount.toString()}</>
                            ) : (
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
                                className="primary-text inherit-bg"
                              />
                            )}{' '}
                            ${txDetails.fee.denom.toUpperCase()}
                          </Typography.Text>
                        </>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}>
                          <Spin size="large" />
                          <Typography.Text className="secondary-text" style={{ textAlign: 'center' }} strong>
                            Simulating Transaction
                          </Typography.Text>
                          <Divider />
                        </div>
                      )}
                    </Col>
                    <Col md={8} xs={24} style={{ textAlign: 'center' }}>
                      <Typography.Text
                        strong
                        style={{
                          textAlign: 'center',
                          alignContent: 'center',
                          alignItems: 'center',
                          fontSize: 24
                        }}
                        className="primary-text flex-center">
                        Options
                      </Typography.Text>
                      {simulated && (
                        <>
                          <div className="flex-center">
                            <IconButton
                              src={showJson ? <MinusOutlined /> : <ZoomInOutlined />}
                              text={'Show Final JSON'}
                              tooltipMessage="Show the JSON of the Cosmos SDK message sent to the blockchain."
                              onClick={async () => {
                                if (showJson) {
                                  setShowJson(null);
                                } else {
                                  if (!finalMsgs?.length) {
                                    const generatedMsgs: any[] = [];
                                    for (const tx of txsInfoPopulated) {
                                      const { generateProtoMsg, beforeTx, msg } = tx;

                                      let cosmosMsg = msg;
                                      if (beforeTx) {
                                        const newMsg = await beforeTx(false);
                                        if (newMsg) cosmosMsg = newMsg;
                                      }

                                      generatedMsgs.push(generateProtoMsg(cosmosMsg));
                                    }

                                    setFinalMsgs(generatedMsgs);
                                    setShowJson(generatedMsgs);
                                  } else if (finalMsgs.length > 0) {
                                    setShowJson(finalMsgs);
                                  } else {
                                    setShowJson(txsInfoPopulated.map((tx) => tx.msg));
                                  }
                                }
                              }}
                            />

                            {txName !== 'MsgSend' && (
                              <IconButton
                                src={<CodeOutlined />}
                                text={'Dev Mode'}
                                tooltipMessage="Go into developer mode and edit this final transaction JSON."
                                onClick={async () => {
                                  const msgsToRedirect: any[] = [];
                                  if (!finalMsgs) {
                                    const generatedMsgs: any[] = [];
                                    for (const tx of txsInfoPopulated) {
                                      const { generateProtoMsg, beforeTx, msg } = tx;

                                      let cosmosMsg = msg;
                                      if (beforeTx) {
                                        const newMsg = await beforeTx(false);
                                        if (newMsg) cosmosMsg = newMsg;
                                      }

                                      msgsToRedirect.push(cosmosMsg);
                                      generatedMsgs.push(generateProtoMsg(cosmosMsg));
                                    }

                                    setFinalMsgs(generatedMsgs);
                                  } else {
                                    msgsToRedirect.push(...finalMsgs);
                                  }

                                  if (msgsToRedirect.length === 0) alert('Cannot enter developer mode for no transactions.');

                                  const populatedTxInfos = txsInfoPopulated.map((tx, idx) => {
                                    return {
                                      type: tx.type,
                                      msg: msgsToRedirect[idx]
                                    };
                                  });

                                  if (confirm('Are you sure you want to enter developer mode? This may cause you to lose progress.')) {
                                    await router.push(`/dev/broadcast?txsInfo=${encodeURIComponent(JSON.stringify(populatedTxInfos))}`);
                                    setVisible(false);
                                  }
                                }}
                              />
                            )}
                          </div>
                          <div className="secondary-text" style={{ textAlign: 'center' }}>
                            <InfoCircleOutlined /> These are advanced options.
                          </div>
                        </>
                      )}
                    </Col>
                    {exceedsBalance && (
                      <div style={{ textAlign: 'center' }} className="primary-text">
                        <Typography.Text
                          strong
                          style={{
                            textAlign: 'center',
                            alignContent: 'center',
                            fontSize: 16,
                            color: 'red'
                          }}>
                          This transaction will send more $BADGE than your wallet balance ({amountBadgeTransferred.toString()} {'>'}{' '}
                          {`${signedInAccount?.balance?.amount ?? 0}`} $BADGE).
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                  {showJson && (
                    <>
                      <div style={{ textAlign: 'center' }} className="primary-text">
                        <br />
                        <DevMode obj={showJson} override />
                        <br />
                      </div>
                    </>
                  )}

                  <Divider />
                  <div className="flex-center">
                    <Typography.Text
                      strong
                      style={{
                        textAlign: 'center',
                        alignContent: 'center',
                        fontSize: 16,
                        alignItems: 'center'
                      }}
                      className="primary-text">
                      I understand that this is a beta version of BitBadges, and there may be bugs.
                    </Typography.Text>
                  </div>
                  <div className="flex-center">
                    <Checkbox
                      checked={betaChecked}
                      onChange={(e) => {
                        setBetaChecked(e.target.checked);
                      }}
                    />
                  </div>
                  <br />
                  <div className="flex-center">
                    <Typography.Text
                      strong
                      style={{
                        textAlign: 'center',
                        alignContent: 'center',
                        fontSize: 16,
                        alignItems: 'center'
                      }}
                      className="primary-text">
                      I understand that blockchain transactions are permanent and irreversible.
                    </Typography.Text>
                  </div>
                  <div className="flex-center">
                    <Checkbox
                      checked={irreversibleChecked}
                      onChange={(e) => {
                        setIrreversibleChecked(e.target.checked);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        }
      />
    ),
    disabled: (msgSteps ?? []).find((step) => step.disabled) ? true : false
  };

  const innerContent = (
    <>
      {children}

      {msgSteps && msgSteps.length > 0 && (
        <>
          <Steps current={currentStep} onChange={onStepChange} className="primary-texxt">
            {msgSteps &&
              [...msgSteps, finalSubmitStep].map((item, index) => (
                <Step
                  key={index}
                  title={<b className="primary-text hover:text-vivid-blue">{item.title}</b>}
                  disabled={msgSteps && [...msgSteps, finalSubmitStep].find((step, idx) => step.disabled && idx < index) ? true : false}
                />
              ))}
          </Steps>
        </>
      )}
      <div className="primary-text">
        <br />
        {<div>{[...(msgSteps ?? []), finalSubmitStep][currentStep].description}</div>}
        <br />
      </div>

      {error && (
        <div>
          <hr />
          <div style={{ color: 'red' }}>Oops! {error}</div>
        </div>
      )}

      <DevMode obj={txsInfoPopulated} />
    </>
  );

  return (
    <Modal
      title={
        <div className="primary-text inherit-bg">
          <b>{txName}</b>
        </div>
      }
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
      width={width ? width : undefined}
      closeIcon={<div className="primary-text inherit-bg">{closeIcon ? closeIcon : <CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
        ...bodyStyle
      }}
      onOk={handleSubmitTx}
      okButtonProps={{
        disabled:
          transactionStatus != TransactionStatus.None ||
          currentStep != (msgSteps ?? []).length ||
          !txDetails ||
          exceedsBalance ||
          !irreversibleChecked ||
          !betaChecked ||
          disabled,
        loading: transactionStatus != TransactionStatus.None
      }}
      onCancel={() => {
        setVisible(false);
      }}
      okText={'Sign and Submit Transaction'}
      cancelText={'Cancel'}
      destroyOnClose={true}>
      <DisconnectedWrapper
        message={`Please connect${requireLogin ? ' and sign in' : ''} to access.`}
        node={
          <Row>
            <Col md={24} xs={24} sm={24}>
              <RegisteredWrapper node={innerContent} />
            </Col>
          </Row>
        }
        requireLogin={requireLogin}
        requiresSignature={isClaimTransaction ? false : true} //We allow reserving badges without signing
      />
    </Modal>
  );
}
