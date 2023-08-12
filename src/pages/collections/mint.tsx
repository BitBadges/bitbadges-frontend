import React from 'react';
import { Layout } from 'antd';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
// import { MSG_PREVIEW_ID, TxTimeline } from '../../components/tx-timelines/TxTimeline';
import { CreateTxMsgUpdateCollectionModal } from '../../components/tx-modals/CreateTxMsgUpdateCollection';
import { TxTimeline, MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';

const { Content } = Layout;

function Mint() {
  return (
    <DisconnectedWrapper
      requireLogin
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
                <div className='primary-blue-bg'
                  style={{
                    marginLeft: '7vw',
                    marginRight: '7vw',
                    paddingLeft: '1vw',
                    paddingRight: '1vw',
                    paddingTop: '20px',
                  }}
                >
                  <TxTimeline collectionId={MSG_PREVIEW_ID} txType='UpdateCollection' isModal={false} />
                  {/* <CreateTxMsgUpdateCollectionModal
                    visible={true}
                    setVisible={() => { }}
                    collectionId={0n}
                  /> */}
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
