import { Button, Divider, Input, Layout, Typography } from 'antd';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { useState } from 'react';
import { TxModal } from '../../components/tx-modals/TxModal';
import { BigIntify, MsgUpdateCollection, convertMsgUpdateCollection, createTxMsgUpdateCollection } from 'bitbadgesjs-proto';

const { Content } = Layout;

const sample = require('./sample.json');
const sample2 = require('./sample2.json');

function Broadcast() {
  const [msg, setMsg] = useState<MsgUpdateCollection<bigint>>(convertMsgUpdateCollection(sample, BigIntify));
  const [visible, setVisible] = useState(false);
  const [err, setErr] = useState('');


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

              <Input.TextArea
                rows={30}
                className='primary-text primary-blue-bg'
                placeholder={'Enter MsgUpdateCollection JSON here'}
                onChange={(e) => {
                  setErr('');
                  try {
                    const msg = JSON.parse(e.target.value);

                    setMsg(convertMsgUpdateCollection(msg, BigIntify));
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
              <Divider />


              <Button type='primary' onClick={() => {
                setVisible(true);
              }}>Broadcast Transaction</Button>



              {msg &&
                <TxModal
                  visible={visible}
                  setVisible={setVisible}
                  createTxFunction={createTxMsgUpdateCollection}
                  txCosmosMsg={msg}
                  txName='Update Collection'
                />}
            </div>
          </Content>
        </Layout>
      }
    />
  );
}

export default Broadcast;
