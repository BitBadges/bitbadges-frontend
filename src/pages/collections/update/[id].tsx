import { Layout } from 'antd';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../../components/wrappers/RegisterWrapper';
// import { MSG_PREVIEW_ID, TxTimeline } from '../../components/tx-timelines/TxTimeline';
import { useRouter } from 'next/router';
import { TxTimeline } from '../../../components/tx-timelines/TxTimeline';

const { Content } = Layout;

function Update() {
  const router = useRouter();

  const { id } = router.query;

  if (!id) {
    return null;
  }

  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet to access this page.'
      node={
        <RegisteredWrapper
          message='Please register to access this page.'
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
                  <TxTimeline collectionId={BigInt(id as string)} txType='UpdateCollection' isModal={false} />

                </div>
              </Content>
            </Layout>
          }
        />
      }
    />
  );
}

export default Update;