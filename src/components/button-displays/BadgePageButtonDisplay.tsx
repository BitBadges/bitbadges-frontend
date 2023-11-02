import {
  CopyOutlined,
  FlagOutlined,
  LinkOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Col, Tooltip, message } from 'antd';

export function BadgeButtonDisplay({
  website,
}: {
  website?: string,
}) {

  return (
    <div>

      <div style={{ position: 'absolute', right: 10, display: 'flex' }}>
        {website && (
          <a href={website} target="_blank" rel="noreferrer">
            <Tooltip title="Website" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="styled-button account-socials-button"
              >
                <LinkOutlined />
              </Avatar>
            </Tooltip>
          </a>
        )}

        <Tooltip title={<>
          <div style={{ textAlign: 'center' }}>
            <b>Share</b>
            <Tooltip title="Copy Link" placement="left">
              <Avatar
                size="large"
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.href
                  );
                  message.success('Copied to clipboard!');
                }}
                className="styled-button account-socials-button"
              >
                <CopyOutlined />
              </Avatar>
            </Tooltip>
            <Tooltip title="Share on Twitter" placement="left">
              <Avatar
                size="large"
                onClick={() => {
                  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    window.location.href
                  )}`;

                  window.open(shareUrl, '_blank');
                }}
                className="styled-button account-socials-button"
              >
                <TwitterOutlined />
              </Avatar>
            </Tooltip>
          </div>
        </>} placement="bottom">
          <Avatar
            size="large"
            className="styled-button account-socials-button"
          >
            <ShareAltOutlined />
          </Avatar>
        </Tooltip>
        <Tooltip title={<>
          Report
        </>} placement="bottom">
          <Avatar
            size="large"
            className="styled-button account-socials-button"
            onClick={() => {
              //send email
              window.open('mailto:andrew@bitbadges.org');
            }}
          >
            <FlagOutlined />
          </Avatar>
        </Tooltip>
      </div>
      <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />
    </div>
  );
}
