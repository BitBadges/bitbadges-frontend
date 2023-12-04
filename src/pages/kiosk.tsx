import { Layout } from 'antd';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../components/wrappers/RegisterWrapper';

const { Content } = Layout;

function KioskScreen({ codes }: { codes?: string[] }) {
  // const router = useRouter();
  console.log(codes);
  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect and sign in to view this page.'}
      node={
        <RegisteredWrapper
          node={
            <Content
              className="full-area"
              style={{ minHeight: '100vh', padding: 8 }}
            >

            </Content>
          }
        />
      }
    />
  );
}

export default KioskScreen;
