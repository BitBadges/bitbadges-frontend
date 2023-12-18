import {
  CopyOutlined,
  EyeOutlined,
  FlagOutlined,
  LinkOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Col, Tooltip, message, notification } from 'antd';
import { useState } from 'react';
import { ReportModal } from '../tx-modals/ReportModal';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { updateAccountInfo } from '../../bitbadges-api/api';
import { addToArray } from '../../pages/account/[addressOrUsername]';
import { updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';

export function BadgeButtonDisplay({
  website,
  collectionId,
  mappingId,
  badgeId,
  socials,
}: {
  website?: string,
  collectionId?: bigint,
  badgeId?: bigint,
  mappingId?: string,
  socials?: {
    [key: string]: string
  }
}) {
  const chain = useChainContext();
  const [reportIsVisible, setReportIsVisible] = useState(false);
  const signedInAccount = useAccount(chain.address);

  const twitterLink = 'https://twitter.com/' + socials?.twitter;
  const telegramLink = 'https://t.me/' + socials?.telegram;
  const githubLink = 'https://github.com/' + socials?.github;
  const discordLink = 'https://discord.com/invite/' + socials?.discord;

  return (
    <div>

      <div style={{ position: 'absolute', right: 10, display: 'flex' }}>
        {socials?.twitter && (
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
        {socials?.telegram && (
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
        {socials?.github && (
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
        {socials?.discord && (
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

        {signedInAccount && chain.address && chain.loggedIn && !mappingId && !!collectionId && !!badgeId && <a
          onClick={async () => {

            const mainWatchlistPage = signedInAccount?.watchedBadgePages?.find(x => x.title === 'Main') ?? { title: 'Main', description: '', badges: [] };

            const newBadges = addToArray(mainWatchlistPage.badges, [{
              collectionId: collectionId,
              badgeIds: [{ start: badgeId, end: badgeId }],
            }]);

            //Update or append
            let newPages;
            if (signedInAccount?.watchedBadgePages?.find(x => x.title === 'Main')) {
              newPages = signedInAccount?.watchedBadgePages?.map(x => {
                if (x.title === 'Main') {
                  return {
                    ...x,
                    badges: newBadges
                  }
                }
                return x;
              });

            } else {
              newPages = [
                {
                  title: 'Main',
                  description: '',
                  badges: newBadges
                },
                ...signedInAccount?.watchedBadgePages ?? [],
              ]
            }
            await updateAccountInfo({
              ...signedInAccount,
              watchedBadgePages: newPages
            });

            updateAccount({
              ...signedInAccount,
              watchedBadgePages: newPages
            });

            notification.success({
              message: 'Success',
              description: 'Added to watchlist!',
            });
          }}
          target="_blank" rel="noreferrer">
          <Tooltip title="Add to Watchlist" placement="bottom">
            <Avatar
              size="large"
              className="styled-button account-socials-button"
              src={<EyeOutlined />}
            />
          </Tooltip>
        </a>}

        {signedInAccount && chain.address && chain.loggedIn && mappingId && <a
          onClick={async () => {

            const mainWatchlistPage = signedInAccount?.watchedListPages?.find(x => x.title === 'Main') ?? { title: 'Main', description: '', mappingIds: [] };

            const newMappingIds = [...new Set([...mainWatchlistPage.mappingIds, mappingId])];

            let newPages;
            //Update or append
            if (signedInAccount?.watchedListPages?.find(x => x.title === 'Main')) {
              newPages = signedInAccount?.watchedListPages?.map(x => {
                if (x.title === 'Main') {
                  return {
                    ...x,
                    mappingIds: newMappingIds
                  }
                }
                return x;
              });

            } else {

              newPages = [
                {
                  title: 'Main',
                  description: '',
                  mappingIds: newMappingIds
                },
                ...signedInAccount?.watchedListPages ?? []
              ]
            }
            await updateAccountInfo({
              ...signedInAccount,
              watchedListPages: newPages
            });
            updateAccount({
              ...signedInAccount,
              watchedListPages: newPages
            });

            notification.success({
              message: 'Success',
              description: 'Added to watchlist!',
            });
          }}
          target="_blank" rel="noreferrer">
          <Tooltip title="Add to Watchlist" placement="bottom">
            <Avatar
              size="large"
              className="styled-button account-socials-button"
              src={<EyeOutlined />}
            />
          </Tooltip>
        </a>}

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
