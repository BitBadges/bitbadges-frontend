import React from 'react';
import { Layout } from 'antd';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { TxTimeline } from '../../components/tx-timelines/TxTimeline';

const { Content } = Layout;

function Mint() {
  return (
    <DisconnectedWrapper
      message='Please connect a wallet to access the Mint page.'
      node={
        <RegisteredWrapper
          message='Please register to access the Mint page.'
          node={
            <Layout>
              <Content
                style={{
                  background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
                  textAlign: 'center',
                  minHeight: '100vh',
                }}
              >
                <div className="primary-text">Mint</div>
                <div className='primary-blue-bg'
                  style={{
                    marginLeft: '7vw',
                    marginRight: '7vw',
                    paddingLeft: '1vw',
                    paddingRight: '1vw',
                    paddingTop: '20px',
                  }}
                >
                  <TxTimeline txType='NewCollection' />
                </div>
              </Content>
            </Layout>
          }
        />
      }
    />
  );
}

export default Mint;
