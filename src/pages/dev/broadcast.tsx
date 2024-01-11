import { CheckCircleFilled, DeleteOutlined, DownOutlined, EditOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { Col, Collapse, Divider, Row, Select, Typography, Upload, notification } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { BigIntify, convertMsgCreateCollection, convertMsgDeleteCollection, convertMsgTransferBadges, convertMsgUniversalUpdateCollection, convertMsgUpdateCollection, convertMsgUpdateUserApprovals } from 'bitbadgesjs-proto';

import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { DevMode } from '../../components/common/DevMode';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TxInfo, TxModal } from '../../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { MarkdownDisplay, MarkdownEditor } from '../account/[addressOrUsername]/settings';

const sampleMsgUpdateCollection = require('./sample-msgupdate.json');
const sampleMsgDeleteCollection = require('./sample-msgdelete.json');
const sampleMsgCreateAddressLists = require('./sample-msgcreateaddress.json');
const sampleMsgUpdateUserApprovals = require('./sample-msgupdateapprovals.json');
const sampleMsgTransferBadges = require('./sample-msgtransfer.json');
const sampleMsgUniversalUpdateCollection = require('./sample-msguniversalupdate.json');
const sampleMsgCreateCollection = require('./sample-msgcreate.json');
const sampleMsgSend = require('./sample-msgsend.json');
const sampleMsgCreateProtocol = require('./sample-msgcreateprotocol.json');
const sampleMsgUpdateProtocol = require('./sample-msgcreateprotocol.json');
const sampleMsgDeleteProtocol = require('./sample-msgdeleteprotocol.json');
const sampleMsgSetCollectionForProtocol = require('./sample-msgsetcollectionforprotocol.json');
const sampleMsgUnsetCollectionForProtocol = require('./sample-msgunsetcollectionforprotocol.json');
const sampleMsgInstantiateContractCompat = require('./sample-msginstantiatecontractcompat.json');
const sampleMsgExecuteContractCompat = require('./sample-msgexecutecontractcompat.json');

function Broadcast() {
  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState<Error | null>();
  const chain = useChainContext();
  const router = useRouter();

  const routerTxsInfo = router.query.txsInfo;

  const [txsInfo, setTxsInfo] = useState<TxInfo[]>([]);

  const [inputTxType, setInputTxType] = useState<string | undefined>('MsgUniversalUpdateCollection');
  const [inputMsg, setInputMsg] = useState((JSON.stringify(sampleMsgUniversalUpdateCollection, null, 2)));
  const [notified, setNotified] = useState(false);

  const [editIsVisible, setEditIsVisible] = useState<boolean>(false);

  useEffect(() => {
    setTxsInfo(routerTxsInfo ? JSON.parse(routerTxsInfo as string) : []);

    if (!notified && (routerTxsInfo)) {
      setNotified(true);
      notification.info({
        message: 'Loaded from URL',
        description: 'The transaction type and message were loaded from the URL.'
      })
    }
  }, [routerTxsInfo, notified]);

  const getJSON = (txType: string) => {
    return txType === 'MsgUniversalUpdateCollection' ? sampleMsgUniversalUpdateCollection
      : txType === 'MsgDeleteCollection' ? sampleMsgDeleteCollection
        : txType === 'MsgCreateAddressLists' ? sampleMsgCreateAddressLists
          : txType === 'MsgUpdateUserApprovals' ? sampleMsgUpdateUserApprovals
            : txType === 'MsgTransferBadges' ? sampleMsgTransferBadges
              : txType === 'MsgCreateCollection' ? sampleMsgCreateCollection
                : txType === 'MsgUpdateCollection' ? sampleMsgUpdateCollection
                  : txType === 'MsgSend' ? sampleMsgSend
                    : txType === 'MsgCreateProtocol' ? sampleMsgCreateProtocol
                      : txType === 'MsgUpdateProtocol' ? sampleMsgUpdateProtocol
                        : txType === 'MsgDeleteProtocol' ? sampleMsgDeleteProtocol
                          : txType === 'MsgSetCollectionForProtocol' ? sampleMsgSetCollectionForProtocol
                            : txType === 'MsgUnsetCollectionForProtocol' ? sampleMsgUnsetCollectionForProtocol
                              : txType === 'MsgInstantiateContractCompat' ? sampleMsgInstantiateContractCompat
                                : txType === 'MsgExecuteContractCompat' ? sampleMsgExecuteContractCompat
                                  : undefined
  }

  const [byteCode, setByteCode] = useState<any>();

  const [editIdx, setEditIdx] = useState<number>(-1);
  const [fileList, setFileList] = useState<any[]>([]);

  const [activeKeys, setActiveKeys] = useState<string[]>([]);


  const customRequest = async ({ file, onError }: any) => {
    try {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target && e.target.result) {
          const result = e.target.result as ArrayBuffer;
          const buffer = Buffer.from(result);
          const hexData = buffer.toString('hex');
          setByteCode('0x' + hexData);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      onError(err);

    }
  };

  const onChange = ({ fileList }: any) => {
    setFileList(fileList);
  };

  const uploadButton = (
    <div className='primary-text landing-button flex-center'>
      <div>Upload</div>
    </div>
  );

  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
      node={
        <RegisteredWrapper
          message='Please register to access this page.'
          node={
            <div
              style={{
                marginLeft: '3vw',
                marginRight: '3vw',
                paddingLeft: '1vw',
                paddingRight: '1vw',
                paddingTop: '20px',
              }}
            >

              <Col md={24} xs={24} style={{ textAlign: 'center' }} className='primary-text'>
                <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>
                  Transaction Builder
                </Typography.Text>
                <div className='secondary-text'>
                  <InfoCircleOutlined /> Transactions are made up of one or more Cosmos SDK Msgs.
                </div>
                <br />
                <br />

                <Collapse
                  className='full-width primary-text'
                  style={{ alignItems: 'center' }}
                  expandIconPosition='start'
                  activeKey={activeKeys}
                  onChange={(keys) => {
                    setActiveKeys(keys as string[]);
                  }}
                >

                  {txsInfo.map((_, idx) => {
                    const txInfo = txsInfo[idx];
                    return <CollapsePanel
                      key={idx}
                      className='full-width card-bg'
                      header={
                        <div className='primary-text full-width flex-center' style={{ justifyContent: 'space-between' }}>
                          <div style={{ textAlign: 'left', fontSize: 16, fontWeight: 500 }}>
                            {`Tx ${idx + 1}: ${txInfo.type}`}

                          </div>
                        </div>
                      }>
                      {<>
                        <br />
                        <div className='flex-center full-width'>
                          <IconButton src={<EditOutlined />} onClick={() => {
                            setInputTxType(txInfo.type);
                            setInputMsg(JSON.stringify(txInfo.msg, null, 2));
                            setEditIsVisible(true);
                            setEditIdx(idx);
                            setActiveKeys([]);
                          }} text='Edit' />
                          <IconButton src={<DeleteOutlined />} onClick={() => {
                            setTxsInfo(txsInfo.filter((_, i) => idx !== i));
                          }} text='Delete' />

                        </div>
                        <DevMode obj={txInfo.msg}
                          isJsonDisplay

                          override inheritBg noBorder />

                      </>}
                    </CollapsePanel>


                  })}
                </Collapse>
                <Divider />

                <IconButton
                  src={editIsVisible ? <MinusOutlined /> : <PlusOutlined />}
                  onClick={() => {
                    setEditIdx(-1);
                    setEditIsVisible(!editIsVisible)
                  }}
                  text={editIsVisible ? 'Hide' : 'Add Msg'}
                />
                <Divider />


              </Col>

              {editIsVisible && <div className='flex-center flex-column'>

                <Select

                  className="selector primary-text inherit-bg"
                  style={{ marginLeft: 4, width: 250, textAlign: 'center' }}
                  value={inputTxType}
                  onChange={(value) => {
                    setInputTxType(value);
                    if (value === 'MsgStoreCodeCompat') return;

                    const json = getJSON(value);
                    if (value.endsWith('Compat')) {
                      json.sender = chain.cosmosAddress;
                    } else if (value === 'MsgSend') {
                      json.fromAddress = chain.cosmosAddress;
                    } else {
                      json.creator = chain.cosmosAddress;
                    }
                    setInputMsg(JSON.stringify(getJSON(value), null, 2));
                    // setMsg(json);
                  }}
                  suffixIcon={
                    <DownOutlined
                      className='primary-text'
                    />
                  }
                >
                  <Select.Option key={5} value={'MsgCreateCollection'}>
                    MsgCreateCollection
                  </Select.Option>
                  <Select.Option key={6} value={'MsgUpdateCollection'}>
                    MsgUpdateCollection
                  </Select.Option>
                  <Select.Option key={1} value={'MsgDeleteCollection'}>
                    MsgDeleteCollection
                  </Select.Option>
                  <Select.Option key={2} value={'MsgCreateAddressLists'}>
                    MsgCreateAddressLists
                  </Select.Option>
                  <Select.Option key={3} value={'MsgUpdateUserApprovals'}>
                    MsgUpdateUserApprovals
                  </Select.Option>
                  <Select.Option key={4} value={'MsgTransferBadges'}>
                    MsgTransferBadges
                  </Select.Option>
                  <Select.Option key={0} value={'MsgUniversalUpdateCollection'}>
                    MsgUniversalUpdateCollection
                  </Select.Option>
                  <Select.Option key={7} value={'MsgSend'}>
                    MsgSend
                  </Select.Option>
                  <Select.Option key={8} value={'MsgCreateProtocol'}>
                    MsgCreateProtocol
                  </Select.Option>
                  <Select.Option key={9} value={'MsgUpdateProtocol'}>
                    MsgUpdateProtocol
                  </Select.Option>
                  <Select.Option key={10} value={'MsgDeleteProtocol'}>
                    MsgDeleteProtocol
                  </Select.Option>
                  <Select.Option key={11} value={'MsgSetCollectionForProtocol'}>
                    MsgSetCollectionForProtocol
                  </Select.Option>
                  <Select.Option key={12} value={'MsgUnsetCollectionForProtocol'}>
                    MsgUnsetCollectionForProtocol
                  </Select.Option>
                  <Select.Option key={13} value={'MsgStoreCodeCompat'}>
                    MsgStoreCodeCompat
                  </Select.Option>
                  <Select.Option key={14} value={'MsgInstantiateContractCompat'}>
                    MsgInstantiateContractCompat
                  </Select.Option>

                  <Select.Option key={15} value={'MsgExecuteContractCompat'}>
                    MsgExecuteContractCompat
                  </Select.Option>
                </Select>
                <br />
                <a href={`https://docs.bitbadges.io/for-developers/cosmos-sdk-msgs/${inputTxType?.toLowerCase()}`} target='_blank'>
                  Learn more about {inputTxType} here.
                </a>
                <br />
                <div className='flex-center full-width' style={{ alignItems: 'normal' }}>
                  <InformationDisplayCard noBorder inheritBg title='' md={12} xs={24} style={{ textAlign: 'center' }}>
                    {inputTxType !== 'MsgStoreCodeCompat' && <>
                      <Row className='full-width flex-center flex-column'>

                        <b className='primary-text'>Enter MsgValue</b>
                        <br />
                        <Editor
                          value={inputMsg}
                          onValueChange={code => {
                            setErr(null)
                            try {
                              setInputMsg(code);
                              JSON.parse(code);


                            } catch (e: any) {
                              console.error(e);
                              setErr(e.message);
                            }
                          }}
                          highlight={x => x}
                          className='rounded-md full-width'
                          padding={16}
                          style={{ border: '1px solid gray', }}
                        />

                      </Row>
                    </>}

                    {inputTxType === 'MsgStoreCodeCompat' && <>
                      {!byteCode && <div className='flex-center'>
                        <Upload
                          fileList={fileList}
                          showUploadList={false}
                          onChange={onChange}
                          maxCount={1}
                          accept=".wasm.gz"
                          customRequest={customRequest}
                        >
                          {uploadButton}
                        </Upload>

                      </div>}

                      {byteCode && <div className='secondary-text'>
                        Uploaded WASM gzip file <CheckCircleFilled style={{ color: 'green' }} />
                      </div>}
                      <br />
                      {byteCode && <IconButton
                        src={<UndoOutlined />}
                        onClick={() => {
                          setByteCode(undefined);
                          setFileList([]);
                        }}
                        text='Reset'
                      />
                      }
                    </>}


                  </InformationDisplayCard>
                  <InformationDisplayCard noBorder inheritBg title='' md={12} xs={24} style={{ textAlign: 'center' }}>
                    <Row className='full-width flex-center flex-column'><b className='primary-text'>JSON</b>
                      <br />
                      <MarkdownDisplay
    
                        showMoreHeight={10000}
                        markdown={
                          "```json\n" +
                          inputMsg +
                          "\n```"
                        } />
                    </Row>
                  </InformationDisplayCard>

                </div>
                {err && <div className='flex-center' style={{ color: 'red' }}>
                  {err.toString()}
                </div>}
                <br />
                <Divider />
                <button className='landing-button'
                  style={{ width: '100%' }}
                  disabled={!!err || (inputTxType === 'MsgStoreCodeCompat' && !byteCode)}
                  onClick={() => {
                    if (!inputTxType) return;

                    let msg = JSON.parse(inputMsg);
                    if (inputTxType === 'MsgUniversalUpdateCollection') msg = convertMsgUniversalUpdateCollection(msg, BigIntify)
                    else if (inputTxType === 'MsgDeleteCollection') msg = convertMsgDeleteCollection(msg, BigIntify)
                    else if (inputTxType === 'MsgCreateAddressLists') msg = msg
                    else if (inputTxType === 'MsgUpdateUserApprovals') msg = convertMsgUpdateUserApprovals(msg, BigIntify)
                    else if (inputTxType === 'MsgTransferBadges') msg = convertMsgTransferBadges(msg, BigIntify)
                    else if (inputTxType === 'MsgCreateCollection') msg = convertMsgCreateCollection(msg, BigIntify)
                    else if (inputTxType === 'MsgUpdateCollection') msg = convertMsgUpdateCollection(msg, BigIntify)
                    else if (inputTxType === 'MsgSend') msg = {
                      fromAddress: msg.fromAddress,
                      toAddress: msg.toAddress,
                      amount: msg.amount.map((a: any) => ({
                        amount: BigInt(a.amount),
                        denom: a.denom
                      }))
                    }
                    else if (inputTxType === 'MsgStoreCodeCompat') msg = {
                      sender: chain.cosmosAddress,
                      hexWasmByteCode: byteCode,
                    }
                    else msg = msg

                    if (editIdx !== -1) {
                      const newTxsInfo = [...txsInfo];
                      newTxsInfo[editIdx] = {
                        type: inputTxType,
                        msg: msg,
                      }
                      setTxsInfo(newTxsInfo);
                    } else {

                      setTxsInfo([
                        ...txsInfo,
                        {
                          type: inputTxType,
                          msg: msg,
                        }
                      ]);
                    }
                    setEditIdx(-1);
                    setEditIsVisible(false);
                  }}>{editIdx >= 0 ? 'Edit' : 'Add Msg to Transaction'}</button>
              </div>}

              {!editIsVisible && <>
                <button className='landing-button'
                  style={{ width: '100%' }}
                  disabled={!!err || txsInfo.length == 0}

                  onClick={() => {
                    setVisible(true);
                  }}>Broadcast</button>
              </>}


              {txsInfo.length > 0 &&
                <TxModal
                  visible={visible}
                  setVisible={setVisible}
                  txName={'Dev Broadcast'}
                  txsInfo={txsInfo}
                />}
            </ div>
          }
        />
      }
    />
  );
}

export default Broadcast;
