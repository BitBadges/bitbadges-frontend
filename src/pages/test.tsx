import { Divider, Layout } from 'antd';
import { PermissionsOverview } from '../components/collection-page/PermissionsInfo';

const { Content } = Layout;

export const MockCollection = {
  collectionId: 1n,
  collectionPermissions: {
    canDeleteCollection: [{
      defaultValues: {
        permittedTimes: [],
        forbiddenTimes: [],
      },
      combinations: [{
        permittedTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        forbiddenTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        }
      }]
    }],
    canArchiveCollection: [{
      defaultValues: {
        timelineTimes: [{ start: 1n, end: 150000000n }],
        permittedTimes: [{ start: 1n, end: 150000000n }],
        forbiddenTimes: [{ start: 1n, end: 150000000n }],
      },
      combinations: [{
        timelineTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        permittedTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: false
        },
        forbiddenTimesOptions: {
          invertDefault: true,
          allValues: false,
          noValues: false
        }
      }]
    }]
  }
}

function BrowsePage() {
  return (
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
            marginLeft: '10vw',
            marginRight: '10vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
          }}
        >
          <PermissionsOverview
            collectionId={0n}
            span={24}
            isOffChainBalances={false}
          />
          <Divider />
        </div>
      </Content >
    </Layout >
  );
}

export default BrowsePage;
