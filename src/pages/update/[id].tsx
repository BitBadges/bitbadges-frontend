import { Layout } from 'antd';
import { useRouter } from 'next/router';
import { TxTimeline } from '../../components/tx-timelines/TxTimeline';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';

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
      message='Please connect a wallet and sign in to access this page.'
      node={
        <RegisteredWrapper
          message='Please register to access this page.'
          node={
            <Content
              style={{
                textAlign: 'center',
                minHeight: '100vh',
              }}
            >
              <div
                style={{
                  marginLeft: '3vw',
                  marginRight: '3vw',
                  paddingLeft: '1vw',
                  paddingRight: '1vw',
                  paddingTop: '20px',
                }}
              >
                <TxTimeline
                  addressMappingId={
                    (id as string).indexOf("_") >= 0 ? id as string : undefined
                  }
                  collectionId={
                    !((id as string).indexOf("_") >= 0) ? BigInt(id as string) : undefined
                  } />

              </div>
            </Content>
          }
        />
      }
    />
  );
}

export default Update;
