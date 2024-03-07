import { WarningOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';

const { Text } = Typography;

export function ReportedWrapper({ node, reported }: { node: JSX.Element; reported?: boolean }) {
  return (
    <>
      {!reported ? (
        node
      ) : (
        <>
          <div
            className="inherit-bg"
            style={{
              textAlign: 'center',
              marginTop: 16
            }}
          >
            <div>
              <Content>
                <Text strong style={{ fontSize: 20, color: 'orange' }} className="primary-text">
                  <WarningOutlined />{' '}
                  {
                    'The content you are requesting has been marked as reported and non-compliant with our terms of service. Please contact us if you believe this is in error.'
                  }
                </Text>
              </Content>
            </div>
          </div>
          {node}
        </>
      )}
    </>
  );
}
