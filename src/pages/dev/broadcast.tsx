import { DeleteOutlined, DownOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, Collapse, Divider, Input, Row, Select, Typography, notification } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { BigIntify, convertMsgCreateCollection, convertMsgDeleteCollection, convertMsgTransferBadges, convertMsgUniversalUpdateCollection, convertMsgUpdateCollection, convertMsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { DevMode } from '../../components/common/DevMode';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TxInfo, TxModal } from '../../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
const style = require('react-syntax-highlighter/dist/cjs/styles/prism').oneDark;

const sampleMsgUpdateCollection = require('./sample-msgupdate.json');
const sampleMsgDeleteCollection = require('./sample-msgdelete.json');
const sampleMsgCreateAddressMappings = require('./sample-msgcreateaddress.json');
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

function Broadcast() {
  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState<Error | null>();
  const chain = useChainContext();
  const router = useRouter();

  const routerTxsInfo = router.query.txsInfo;

  const [txsInfo, setTxsInfo] = useState<TxInfo[]>([]);

  const [inputTxType, setInputTxType] = useState<string | undefined>('MsgUniversalUpdateCollection');
  const [inputMsg, setInputMsg] = useState((JSON.stringify(sampleMsgUniversalUpdateCollection, null, 2)));
  const [msg, setMsg] = useState<object>(convertMsgUniversalUpdateCollection(sampleMsgUniversalUpdateCollection, BigIntify));


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
        : txType === 'MsgCreateAddressMappings' ? sampleMsgCreateAddressMappings
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
                              : undefined
  }


  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
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
            <br />
            <br />

            <Collapse
              className='full-width primary-text'
              style={{ alignItems: 'center' }}
              expandIconPosition='start'
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
                    <DevMode obj={txInfo.msg} override inheritBg noBorder />
                    <div className='flex-center full-width'>
                      <div className='full-width flex-center'>
                        <IconButton src={<DeleteOutlined />} onClick={() => {
                          setTxsInfo(txsInfo.filter((_, i) => idx !== i));
                        }} text='Delete' />
                      </div>
                    </div>
                  </>}
                </CollapsePanel>


              })}
            </Collapse>
            <Divider />

            <IconButton
              src={editIsVisible ? <MinusOutlined /> : <PlusOutlined />}
              onClick={() => setEditIsVisible(!editIsVisible)}
              text={editIsVisible ? 'Hide' : 'Add'}
            />
            <Divider />


          </Col>

          {editIsVisible && <div className='flex-center flex-column'>

            <Select

              className="selector primary-text inherit-bg"
              style={{ marginLeft: 4 }}
              value={inputTxType}
              onChange={(value) => {
                setInputTxType(value);
                const json = getJSON(value);
                json.creator = chain.cosmosAddress;

                setInputMsg(JSON.stringify(getJSON(value), null, 2));
                setMsg(json);
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
              <Select.Option key={2} value={'MsgCreateAddressMappings'}>
                MsgCreateAddressMappings
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
            </Select>
            <br />
            <br />
            <a href={`https://docs.bitbadges.io/for-developers/cosmos-sdk-msgs/${inputTxType?.toLowerCase()}`} target='_blank'>
              Learn more about {inputTxType} here.
            </a>
            <br />
            <br />
            <Row className='full-width'>
              <InformationDisplayCard title='' md={12} xs={24} style={{ textAlign: 'center' }}>
                <b className='primary-text'>Enter Value</b>
                <Input.TextArea
                  value={inputMsg}
                  autoSize
                  className='primary-text inherit-bg'
                  placeholder={'Enter your value here here'}
                  onChange={(e) => {
                    setErr(null)
                    try {
                      setInputMsg(e.target.value);
                      const msg = JSON.parse(e.target.value);
                      if (inputTxType === 'MsgUniversalUpdateCollection') setMsg(convertMsgUniversalUpdateCollection(msg, BigIntify));
                      else if (inputTxType === 'MsgDeleteCollection') setMsg(convertMsgDeleteCollection(msg, BigIntify));
                      else if (inputTxType === 'MsgCreateAddressMappings') setMsg(msg);
                      else if (inputTxType === 'MsgUpdateUserApprovals') setMsg(convertMsgUpdateUserApprovals(msg, BigIntify));
                      else if (inputTxType === 'MsgTransferBadges') setMsg(convertMsgTransferBadges(msg, BigIntify));
                      else if (inputTxType === 'MsgCreateCollection') setMsg(convertMsgCreateCollection(msg, BigIntify));
                      else if (inputTxType === 'MsgUpdateCollection') setMsg(convertMsgUpdateCollection(msg, BigIntify));
                      else if (inputTxType === 'MsgSend') setMsg({
                        destinationAddress: msg.toAddress,
                        amount: msg.amount.length > 0 ? msg.amount[0].amount : 0,
                        denom: msg.amount.length > 0 ? msg.amount[0].denom : "badge",
                      });
                      else setMsg(msg);

                    } catch (e: any) {
                      console.error(e);
                      setErr(e.message);
                    }
                  }}
                />

                <br />
                <br />

              </InformationDisplayCard>
              <InformationDisplayCard title='' md={12} xs={24} style={{ textAlign: 'center' }}>
                <b className='primary-text'>Set Value</b>

                <SyntaxHighlighter language="json" style={style}>
                  {JSON.stringify(msg, null, 2)}
                </SyntaxHighlighter>

              </InformationDisplayCard>
            </Row>

            {err && <div className='flex-center' style={{ color: 'red' }}>
              {err.toString()}
            </div>}
            <br />
            <Divider />
            <button className='landing-button'
              style={{ width: '100%' }}
              disabled={!!err}
              onClick={() => {
                if (!inputTxType) return;


                let msg = JSON.parse(inputMsg);
                if (inputTxType === 'MsgUniversalUpdateCollection') msg = convertMsgUniversalUpdateCollection(msg, BigIntify)
                else if (inputTxType === 'MsgDeleteCollection') msg = convertMsgDeleteCollection(msg, BigIntify)
                else if (inputTxType === 'MsgCreateAddressMappings') msg = msg
                else if (inputTxType === 'MsgUpdateUserApprovals') msg = convertMsgUpdateUserApprovals(msg, BigIntify)
                else if (inputTxType === 'MsgTransferBadges') msg = convertMsgTransferBadges(msg, BigIntify)
                else if (inputTxType === 'MsgCreateCollection') msg = convertMsgCreateCollection(msg, BigIntify)
                else if (inputTxType === 'MsgUpdateCollection') msg = convertMsgUpdateCollection(msg, BigIntify)
                else if (inputTxType === 'MsgSend') msg = {
                  destinationAddress: msg.toAddress,
                  amount: msg.amount.length > 0 ? msg.amount[0].amount : 0,
                  denom: msg.amount.length > 0 ? msg.amount[0].denom : "badge",
                }
                else msg = msg

                setTxsInfo([
                  ...txsInfo,
                  {
                    type: inputTxType,
                    msg: msg,
                  }
                ]);
                setEditIsVisible(false);
              }}>Add</button>


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
        </div>
      }
    />
  );
}

export default Broadcast;
