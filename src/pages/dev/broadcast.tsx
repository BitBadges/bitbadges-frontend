import { DownOutlined } from '@ant-design/icons';
import { Col, Divider, Input, Row, Select, Typography, notification } from 'antd';
import { BigIntify, convertMsgCreateCollection, convertMsgDeleteCollection, convertMsgTransferBadges, convertMsgUniversalUpdateCollection, convertMsgUpdateCollection, convertMsgUpdateUserApprovals, createTxMsgCreateAddressMappings, createTxMsgCreateCollection, createTxMsgDeleteCollection, createTxMsgTransferBadges, createTxMsgUniversalUpdateCollection, createTxMsgUpdateCollection, createTxMsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TxModal } from '../../components/tx-modals/TxModal';
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
  const [msg, setMsg] = useState<object>(convertMsgUniversalUpdateCollection(sampleMsgUniversalUpdateCollection, BigIntify));
  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState<Error | null>();
  const chain = useChainContext();
  const router = useRouter();

  const routerTxType = router.query.txType;
  const routerTxMsg = router.query.txMsg;

  const [txType, setTxType] = useState(routerTxType as string || 'MsgCreateCollection');
  const [inputMsg, setInputMsg] = useState((routerTxMsg ? JSON.stringify(JSON.parse(routerTxMsg as string), null, 2) : undefined) || JSON.stringify(sampleMsgUniversalUpdateCollection, null, 2));
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (routerTxType) {
      setTxType(routerTxType as string);
    }

    if (routerTxMsg) {
      setInputMsg(JSON.stringify(JSON.parse(routerTxMsg as string), null, 2));
      setMsg(JSON.parse(routerTxMsg as string));
    }

    if (!notified && (routerTxType || routerTxMsg)) {
      setNotified(true);
      notification.info({
        message: 'Loaded from URL',
        description: 'The transaction type and message were loaded from the URL.'
      })
    }
  }, [routerTxType, routerTxMsg, notified])

  const convertFunction = txType === 'MsgUniversalUpdateCollection' ? createTxMsgUniversalUpdateCollection
    : txType === 'MsgDeleteCollection' ? createTxMsgDeleteCollection
      : txType === 'MsgCreateAddressMappings' ? createTxMsgCreateAddressMappings
        : txType === 'MsgUpdateUserApprovals' ? createTxMsgUpdateUserApprovals
          : txType === 'MsgTransferBadges' ? createTxMsgTransferBadges
            : txType === 'MsgCreateCollection' ? createTxMsgCreateCollection
              : txType === 'MsgUpdateCollection' ? createTxMsgUpdateCollection
                : undefined

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
              Custom JSON Form
            </Typography.Text>
            <br />
            <br />
            <Select
              className="selector primary-text inherit-bg"
              style={{ marginLeft: 4 }}
              value={txType}
              onChange={(value) => {
                setTxType(value);
                const json = getJSON(value);
                json.creator = chain.cosmosAddress;

                setInputMsg(JSON.stringify(getJSON(value), null, 2));
                setMsg(getJSON(value));
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
            <a href={`https://docs.bitbadges.io/for-developers/cosmos-sdk-msgs/${txType.toLowerCase()}`} target='_blank'>
              Learn more about {txType} here.
            </a>
            <br />
            <br />
          </Col>


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



                    if (txType === 'MsgUniversalUpdateCollection') setMsg(convertMsgUniversalUpdateCollection(msg, BigIntify));
                    else if (txType === 'MsgDeleteCollection') setMsg(convertMsgDeleteCollection(msg, BigIntify));
                    else if (txType === 'MsgCreateAddressMappings') setMsg(msg);
                    else if (txType === 'MsgUpdateUserApprovals') setMsg(convertMsgUpdateUserApprovals(msg, BigIntify));
                    else if (txType === 'MsgTransferBadges') setMsg(convertMsgTransferBadges(msg, BigIntify));
                    else if (txType === 'MsgCreateCollection') setMsg(convertMsgCreateCollection(msg, BigIntify));
                    else if (txType === 'MsgUpdateCollection') setMsg(convertMsgUpdateCollection(msg, BigIntify));
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
              setVisible(true);
            }}>Broadcast</button>



          {msg &&
            <TxModal
              visible={visible}
              setVisible={setVisible}
              createTxFunction={convertFunction}
              txCosmosMsg={msg}
              txName={txType}
              txType={txType}
            />}
        </div>
      }
    />
  );
}

export default Broadcast;
