import { DownOutlined } from '@ant-design/icons';
import { Button, Divider, Input, Layout, Select, Typography } from 'antd';
import { BigIntify, convertMsgDeleteCollection, convertMsgTransferBadges, convertMsgUpdateCollection, convertMsgUpdateUserApprovedTransfers, createTxMsgCreateAddressMappings, createTxMsgDeleteCollection, createTxMsgTransferBadges, createTxMsgUpdateCollection, createTxMsgUpdateUserApprovedTransfers } from 'bitbadgesjs-proto';
import { useState } from 'react';
import { TxModal } from '../../components/tx-modals/TxModal';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';

const { Content } = Layout;

const sample = require('./sample.json');
const sample2 = require('./sample2.json');

function Broadcast() {
  const [msg, setMsg] = useState<object>(convertMsgUpdateCollection(sample, BigIntify));
  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState('');

  const [txType, setTxType] = useState('MsgUpdateCollection');

  const convertFunction = txType === 'MsgUpdateCollection' ? createTxMsgUpdateCollection
    : txType === 'MsgDeleteCollection' ? createTxMsgDeleteCollection
      : txType === 'MsgCreateAddressMappings' ? createTxMsgCreateAddressMappings
        : txType === 'MsgUpdateUserApprovedTransfers' ? createTxMsgUpdateUserApprovedTransfers
          : txType === 'MsgTransferBadges' ? createTxMsgTransferBadges
            : undefined
  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet to access this page.'
      node={
        <Layout>
          <Content
            style={{
              background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
              textAlign: 'center',
              minHeight: '100vh',
            }}
          >
            <div className='primary-blue-bg'
              style={{
                marginLeft: '7vw',
                marginRight: '7vw',
                paddingLeft: '1vw',
                paddingRight: '1vw',
                paddingTop: '20px',
              }}
            >
              <Select
                className="selector primary-text primary-blue-bg"
                style={{ marginLeft: 4 }}
                defaultValue={txType}
                onChange={(value) => {
                  setTxType(value);
                }}
                suffixIcon={
                  <DownOutlined
                    className='primary-text'
                  />
                }
              >
                <Select.Option key={0} value={'MsgUpdateCollection'}>
                  MsgUpdateCollection
                </Select.Option>
                <Select.Option key={1} value={'MsgDeleteCollection'}>
                  MsgDeleteCollection
                </Select.Option>
                <Select.Option key={2} value={'MsgCreateAddressMappings'}>
                  MsgCreateAddressMappings
                </Select.Option>
                <Select.Option key={3} value={'MsgUpdateUserApprovedTransfers'}>
                  MsgUpdateUserApprovedTransfers
                </Select.Option>
                <Select.Option key={4} value={'MsgTransferBadges'}>
                  MsgTransferBadges
                </Select.Option>
              </Select>

              <Input.TextArea
                rows={30}

                className='primary-text primary-blue-bg'
                placeholder={'Enter JSON here'}
                onChange={(e) => {
                  setErr('');
                  try {
                    const msg = JSON.parse(e.target.value);

                    if (txType === 'MsgUpdateCollection') setMsg(convertMsgUpdateCollection(msg, BigIntify));
                    else if (txType === 'MsgDeleteCollection') setMsg(convertMsgDeleteCollection(msg, BigIntify));
                    else if (txType === 'MsgCreateAddressMappings') setMsg(msg);
                    else if (txType === 'MsgUpdateUserApprovedTransfers') setMsg(convertMsgUpdateUserApprovedTransfers(msg, BigIntify));
                    else if (txType === 'MsgTransferBadges') setMsg(convertMsgTransferBadges(msg, BigIntify));
                  } catch (e: any) {
                    console.error(e);
                    setErr(e.message);
                  }
                }}
              />
              {err && <div className='flex-center' style={{ color: 'red' }}>
                {err}
              </div>}
              <br />
              {txType === 'MsgUpdateCollection' && <>
                <Typography.Text copyable={
                  {
                    text: JSON.stringify(sample, null, 2),
                    tooltips: ['Copy', 'Copied!'],
                  }
                } className='primary-text'>
                  Copy Sample
                </Typography.Text>
                <Typography.Text copyable={
                  {
                    text: JSON.stringify(sample2, null, 2),
                    tooltips: ['Copy', 'Copied!'],
                  }
                } className='primary-text'>
                  Copy Sample 2
                </Typography.Text>
              </>}
              <Divider />


              <Button type='primary' onClick={() => {
                setVisible(true);
              }}>Broadcast Transaction</Button>



              {msg &&
                <TxModal
                  visible={visible}
                  setVisible={setVisible}
                  createTxFunction={convertFunction}
                  txCosmosMsg={msg}
                  txName={txType}
                />}
            </div>
          </Content>
        </Layout>
      }
    />
  );
}

export default Broadcast;
