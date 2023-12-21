import { CodeOutlined, DeleteOutlined, DownOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, Divider, Input, Row, Select, Typography, notification } from 'antd';
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
                  : undefined
  }

  const MsgComponent = ({
    txsInfo,
    currIdxToDisplay,
    setTxsInfo,
  }: {
    txsInfo: TxInfo[],
    currIdxToDisplay: number,
    setTxsInfo: (txsInfo: TxInfo[]) => void,
  }) => {
    const txInfo = txsInfo[currIdxToDisplay];

    const [showMoreIsVisible, setShowMoreIsVisible] = useState<boolean>(false);

    return <InformationDisplayCard md={12} xs={24} title={`Tx ${currIdxToDisplay + 1}: ${txInfo.type}`}
    
    style={{ textAlign: 'center' }}>
     
      <div className='flex-center full-width'>
        <div className='full-width flex-center'>
          <IconButton src={showMoreIsVisible ? <MinusOutlined /> : <CodeOutlined />} onClick={() => {
              setShowMoreIsVisible(!showMoreIsVisible);
            }} text={showMoreIsVisible ? 'Hide' : 'Show JSON'} />
            <IconButton src={<DeleteOutlined />} onClick={() => {
              setTxsInfo(txsInfo.filter((_, idx) => idx !== currIdxToDisplay));
            }} text='Delete' />
        </div>
     </div>
      {showMoreIsVisible && <>
      <br/>
      <DevMode obj={txInfo.msg} override inheritBg noBorder />
    </>}
    </InformationDisplayCard>
    
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
              Tx Builder (Dev)
            </Typography.Text>
            <br />
            <br />
            

            <div className='flex-center flex-wrap'>
              {txsInfo.map((_, idx) => {
                return <MsgComponent
                   key={idx}
                  txsInfo={txsInfo}
                  currIdxToDisplay={idx}
                  setTxsInfo={setTxsInfo}
                />
             
              })}
            </div>
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
            disabled={err !== null}
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
            // else if (inputTxType === 'MsgSend') msg = msg
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
            disabled={err !== null || txsInfo.length == 0}
            
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
