import {
  CopyOutlined,
  FlagOutlined,
  LinkOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Col, Tooltip, message } from 'antd';
import { useState } from 'react';
import { ReportModal } from '../tx-modals/ReportModal';

export function BadgeButtonDisplay({
  website,
  collectionId,
  mappingId,
}: {
  website?: string,
  collectionId?: bigint,
  mappingId?: string,
}) {
  const [reportIsVisible, setReportIsVisible] = useState(false);


  console.log(global.navigator && global.navigator.canShare && global.navigator.canShare({
    url: window.location.href,
  }));
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

        {!(global.navigator && global.navigator.canShare && global.navigator.canShare(
          {
            url: window.location.href,
          }
        )) ? <Tooltip title={<>
          <div style={{ textAlign: 'center' }}>
            <b>Share</b>
            <Tooltip title="Copy Link" placement="left">
              <Avatar
                size="large"
                onClick={() => {
                  global.navigator.clipboard.writeText(
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
        </Tooltip> : <Tooltip title={<>
          Share
        </>} placement="bottom">
          <Avatar
            size="large"
            className="styled-button account-socials-button"
            onClick={() => {
              navigator.share({

                url: window.location.href,
              });

            }}
          >
            <ShareAltOutlined />
          </Avatar>
        </Tooltip>}



        <Tooltip title={<>
          Report
        </>} placement="bottom">
          <Avatar
            size="large"
            className="styled-button account-socials-button"
            onClick={() => {
              setReportIsVisible(true);
            }}
          >
            <FlagOutlined />
          </Avatar>
          <ReportModal
            visible={reportIsVisible}
            setVisible={setReportIsVisible}
            collectionId={collectionId}
            mappingId={mappingId}
          />
        </Tooltip>
      </div>
      <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />
    </div>
  );
}
