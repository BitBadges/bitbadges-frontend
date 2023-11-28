import { DownOutlined, WarningOutlined } from '@ant-design/icons';
import { Col, Divider, Input, Row, Select, Typography } from 'antd';
import { BigIntify, convertMsgCreateCollection, convertMsgDeleteCollection, convertMsgTransferBadges, convertMsgUniversalUpdateCollection, convertMsgUpdateCollection, convertMsgUpdateUserApprovals, createTxMsgCreateAddressMappings, createTxMsgCreateCollection, createTxMsgDeleteCollection, createTxMsgTransferBadges, createTxMsgUniversalUpdateCollection, createTxMsgUpdateCollection, createTxMsgUpdateUserApprovals } from 'bitbadgesjs-proto';
import { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { TxModal } from '../../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
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

  const [txType, setTxType] = useState('MsgCreateCollection');
  const [inputMsg, setInputMsg] = useState(JSON.stringify(sampleMsgUniversalUpdateCollection, null, 2));

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
              Custom JSON Tx Form
            </Typography.Text>

            <div className='primary-text full-width' style={{ textAlign: 'center' }}>
              <WarningOutlined style={{ fontSize: 16, marginRight: 4, color: '#FF5733' }} />
              This is an advanced and experimental feature. Use at your own risk.
            </div>
            <div>
              If there are bugs or issues, please report them via our Discord or GitHub.

              See <a href="https://app.gitbook.com/o/7VSYQvtb1QtdWFsEGoUn/s/7R34Y0QZwgpUGaJnJ4dq/for-developers/concepts/cosmos-msgs" target="_blank" rel="noreferrer">the BitBadges documentation</a> for documentation on each Msg type.
            </div>
            <br />
            <Select
              className="selector primary-text inherit-bg"
              style={{ marginLeft: 4 }}
              defaultValue={txType}
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
            />}
        </div>
      }
    />
  );
}

export default Broadcast;
