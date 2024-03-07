import { Form, notification } from 'antd';
import axios from 'axios';
import { useState } from 'react';
import { BACKEND_URL } from '../../constants';
import { Divider } from '../display/Divider';
import { GenericModal } from '../display/GenericModal';
import { GenericTextAreaFormInput } from '../tx-timelines/form-items/MetadataForm';

export function ReportModal({
  visible,
  setVisible,
  collectionId,
  addressOrUsername,
  listId
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  collectionId?: bigint;
  addressOrUsername?: string;
  listId?: string;
}) {
  const [reason, setReason] = useState('');

  return (
    <GenericModal visible={visible} setVisible={setVisible} title={'Report Form'} requireConnected requireLoggedIn>
      <Form colon={false} layout="vertical" className="full-width">
        <GenericTextAreaFormInput required label="Reason" value={reason} setValue={setReason} placeholder="Explanation" />
      </Form>
      <div className="secondary-text">
        <b>
          {
            'Please provide a reason for your report. We will review your report and take action if necessary. You may also contact us on Discord or another social media platform for further assistance.'
          }
        </b>
      </div>
      <Divider />
      <div>
        <button
          className="landing-button"
          onClick={async () => {
            if (reason.length > 16000) {
              alert('Reason must be less than 16,000 characters');
              return;
            }

            await axios.post(
              `${BACKEND_URL}/api/v0/report`,
              {
                collectionId: Number(collectionId),
                addressOrUsername: addressOrUsername,
                listId: listId,
                reason: reason
              },
              {
                withCredentials: true
              }
            );

            setReason('');
            setVisible(false);
            notification.info({
              message: 'Report submitted',
              description: 'Thank you for your feedback! We will review your report and take action if necessary.'
            });
          }}
          style={{ width: '100%' }}>
          {'Submit Report'}
        </button>
      </div>
    </GenericModal>
  );
}
