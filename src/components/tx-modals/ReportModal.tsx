import { CloseOutlined } from '@ant-design/icons';
import { Form, Input, Modal, Typography, notification } from 'antd';
import React, { useState } from 'react';
import { Divider } from '../display/Divider';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';
import { DisconnectedWrapper } from '../wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../wrappers/RegisterWrapper';

const { Text } = Typography;

export function ReportModal({ visible, setVisible, collectionId, addressOrUsername, mappingId }: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  collectionId?: bigint,
  addressOrUsername?: string,
  mappingId?: string
}) {

  const [reason, setReason] = useState('');



  return (

    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Report Form'}</b></div>}
      open={visible}
      style={{}}
      footer={null}
      closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
      }}
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
    > <DisconnectedWrapper
        requireLogin
        message={'Please connect your wallet and sign in to view this page.'}
        node={
          <RegisteredWrapper

            node={
              <>
                <Form
                  colon={false}
                  layout="vertical"
                  className='full-width'
                >

                  <Form.Item
                    label={
                      <Text className='primary-text' strong>
                        Reason
                      </Text>
                    }
                    className='full-width'
                  >

                    <Input.TextArea
                      autoSize
                      placeholder='Explanation'
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                      }}
                      className="form-input full-width"
                    />

                  </Form.Item>
                </Form>
                <div className='secondary-text'>
                  <b>
                    {'Please provide a reason for your report. We will review your report and take action if necessary. You may also contact us on Discord or another social media platform for further assistance.'}
                  </b>
                </div>
                <Divider />
                <div>
                  <button className='landing-button' onClick={async () => {
                    if (reason.length > 16000) {
                      alert('Reason must be less than 16,000 characters');
                      return;
                    }

                    await axios.post(`${BACKEND_URL}/api/v0/report`, {
                      collectionId: Number(collectionId),
                      addressOrUsername: addressOrUsername,
                      mappingId: mappingId,
                      reason: reason,
                    }, {
                      withCredentials: true,
                    });

                    setReason('');
                    setVisible(false);
                    notification.info({
                      message: 'Report submitted',
                      description: 'Thank you for your feedback! We will review your report and take action if necessary.',
                    })

                  }} style={{ width: '100%' }}>
                    {'Submit Report'}
                  </button>
                </div>
              </>
            }
          />
        }
      />
    </Modal>
  );
}