import { Layout, Typography } from 'antd';
import { getAbbreviatedAddress } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';

const { Content } = Layout;

export const ShareButton = ({ data, text, width = 150 }: { data: ShareData; text?: string; width?: number }) => {
  if (!global.navigator.canShare) return <></>;

  if (!global.navigator.canShare(data)) return <></>;

  return (
    <button
      className="landing-button primary-text"
      style={{ width, margin: 2 }}
      onClick={async () => {
        await navigator.share(data);
      }}>
      {text ?? 'Share'}
    </button>
  );
};

function SaveForLater() {
  const router = useRouter();
  const { value } = router.query;

  if (!value) return <></>;

  return (
    <Content className="full-area" style={{ minHeight: '100vh', padding: 8 }}>
      <div className="flex-center">
        <InformationDisplayCard
          title="Save for Later"
          md={12}
          xs={24}
          sm={24}
          style={{ marginTop: '10px' }}
          subtitle={'Save this value for later via anyway you prefer (e.g. bookmark, copy, email it to yourself, etc.)'}>
          <br />
          <div className="flex-center">
            <Typography.Text className="primary-text" copyable={{ text: value as string }} style={{ fontSize: 30, fontWeight: 'bold' }}>
              {getAbbreviatedAddress(value as string)}
            </Typography.Text>
          </div>
          <br />
          <div className="flex-center">
            <ShareButton data={{ title: 'Claim Badge', text: value as string }} />
          </div>
        </InformationDisplayCard>
      </div>
    </Content>
  );
}

export default SaveForLater;
