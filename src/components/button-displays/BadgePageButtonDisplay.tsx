import {
  LinkOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { Avatar, Col, Tooltip, message } from 'antd';

export function BadgeButtonDisplay({
  website,
}: {
  website?: string,
}) {

  return (
    <div>
      <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />
      <div style={{ position: 'absolute', right: 10, top: 74, display: 'flex' }}>
        {website && (
          <a href={website} target="_blank" rel="noreferrer">
            <Tooltip title="Website" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="screen-button account-socials-button"
              >
                <LinkOutlined />
              </Avatar>
            </Tooltip>
          </a>
        )}
        <Tooltip title="Share (Copy Link)" placement="bottom">
          <Avatar
            size="large"
            onClick={() => {
              navigator.clipboard.writeText(
                window.location.href
              );
              message.success('Copied to clipboard!');
            }}
            className="screen-button account-socials-button"
          >
            <ShareAltOutlined />
          </Avatar>
        </Tooltip>
      </div>
    </div>
  );
}
