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
  socials,
}: {
  website?: string,
  collectionId?: bigint,
  mappingId?: string,
  socials?: {
    [key: string]: string
  }
}) {
  const [reportIsVisible, setReportIsVisible] = useState(false);
  const accountInfo = socials;

  const twitterLink = 'https://twitter.com/' + accountInfo?.twitter;
  const telegramLink = 'https://t.me/' + accountInfo?.telegram;
  const githubLink = 'https://github.com/' + accountInfo?.github;
  const discordLink = 'https://discord.com/invite/' + accountInfo?.discord;

  return (
    <div>

      <div style={{ position: 'absolute', right: 10, display: 'flex' }}>
        {accountInfo?.twitter && (
          <a href={twitterLink} target="_blank" rel="noreferrer">
            <Tooltip title="Twitter" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="styled-button account-socials-button"
                src={"https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg"}
              >
                {/* <TwitterOutlined /> */}
              </Avatar>
            </Tooltip>
          </a>
        )}
        {accountInfo?.telegram && (
          <a href={telegramLink} target="_blank" rel="noreferrer">
            <Tooltip title="Telegram" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="styled-button account-socials-button"
                src={"https://1000logos.net/wp-content/uploads/2021/04/Telegram-logo.png"}
              >
              </Avatar>
            </Tooltip>
          </a>
        )}
        {accountInfo?.github && (
          <a href={githubLink} target="_blank" rel="noreferrer">
            <Tooltip title="GitHub" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="styled-button account-socials-button"
                // src={ }
                src={"https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
              >
                {/* <GithubOutlined /> */}
              </Avatar>
            </Tooltip>
          </a>
        )}
        {accountInfo?.discord && (
          <a href={discordLink} target="_blank" rel="noreferrer">
            <Tooltip title="Discord" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="styled-button account-socials-button"
                src={"https://global-uploads.webflow.com/5e157548d6f7910beea4e2d6/604150242d4c6f111dc4e0e8_AMXD2mEvYtyJeooktUtHlCW0f3vrpbwrCN0KjvULcmHdfWBRaAyxA9cSiPn_t6wHhI4mm1qbImd2ewbgBQwm-EtT8hZVevgGiACcBFZ58UQC6EPLcV-mQtaHVb02PzhRrjrpYsnz.png"}
              >
                {/* <DiscordOutlined /> */}
              </Avatar>
            </Tooltip>
          </a>
        )}

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
