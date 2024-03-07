//[token].tsx

import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../constants';
import { Divider } from '../../components/display/Divider';
import { CheckCircleFilled } from '@ant-design/icons';
import { Spin } from 'antd';

export default function EmailVerify() {
  const router = useRouter();
  const { token } = router.query;
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function verifyEmail() {
      if (token) {
        const res = await axios.get(`${BACKEND_URL}/api/v0/verifyEmail/${token}`, {
          withCredentials: true
        });

        if (res.data.success) {
          setVerified(true);
        }
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <>
      <Divider />
      <div className="primary-text full-width" style={{ minHeight: '100vh', textAlign: 'center' }}>
        {verified ? (
          <>
            <div className="full-width" style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              <>
                Email verified <CheckCircleFilled style={{ color: 'green' }} />!
              </>
            </div>
            <br />
            <div className="full-width secondary-text" style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
              <>You can now close this page.</>
            </div>
          </>
        ) : (
          <div className="full-width" style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
            <>
              Verifying email <Spin size="large" />
              ...
            </>
          </div>
        )}
      </div>
    </>
  );
}
