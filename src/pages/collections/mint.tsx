import React from 'react';
import { Layout } from 'antd';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { TxTimeline } from '../../components/tx-timelines/TxTimeline';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

const { Content } = Layout;

function Mint() {
  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
      node={
        <RegisteredWrapper
          message='Please register to access the Mint page.'
          node={
            <Content
              className='gradient-bg'
              style={{
                textAlign: 'center',
                minHeight: '100vh',
              }}
            >
              <div
                style={{
                  marginLeft: '7vw',
                  marginRight: '7vw',
                  paddingLeft: '1vw',
                  paddingRight: '1vw',
                  paddingTop: '20px',
                }}
              >
                <TxTimeline collectionId={NEW_COLLECTION_ID} txType='UpdateCollection' />
              </div>
            </Content>
          }
        />
      }
    />
  );
}

export default Mint;
