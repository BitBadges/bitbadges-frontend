import {
  CopyOutlined,
  EyeOutlined,
  FlagOutlined,
  LinkOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { Avatar, Col, Tooltip, message, notification } from 'antd';
import { addToBatchArray } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { updateAccountInfo } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { updateAccount, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { ReportModal } from '../tx-modals/ReportModal';
import { GO_MAX_UINT_64 } from '../../utils/dates';

export function BadgeButtonDisplay({
  website,
  collectionId,
  listId,
  badgeId,
  socials,
}: {
  website?: string,
  collectionId?: bigint,
  badgeId?: bigint,
  listId?: string,
  socials?: {
    [key: string]: string
  }
}) {
  const chain = useChainContext();
  const [reportIsVisible, setReportIsVisible] = useState(false);
  const signedInAccount = useAccount(chain.address);

  const twitterLink = 'https://x.com/' + socials?.twitter;
  const telegramLink = 'https://t.me/' + socials?.telegram;
  const githubLink = 'https://github.com/' + socials?.github;
  const discordLink = 'https://discord.com/invite/' + socials?.discord;

  const isPreview = collectionId === NEW_COLLECTION_ID && !listId
  return (
    <div>

      <div style={{ display: 'flex' }}>
        {socials?.twitter && (
          <a href={twitterLink} target="_blank" rel="noreferrer">
            <Tooltip title="X (formerly Twitter)" placement="bottom">
              <Avatar
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer', backgroundColor: 'black' }}
                size="large"
                onClick={isPreview ? undefined : () => { }}
                className="styled-button-normal account-socials-button"
              >
                <img src="/images/x-logo.svg" style={{ width: 24, height: 24, }} />
                {/* <TwitterOutlined /> */}
              </Avatar>
            </Tooltip>
          </a>
        )}
        {socials?.telegram && (
          <a href={telegramLink} target="_blank" rel="noreferrer">
            <Tooltip title="Telegram" placement="bottom">
              <Avatar
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => { }}
                className="styled-button-normal account-socials-button"
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
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => { }}
                className="styled-button-normal account-socials-button"
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
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => { }}
                className="styled-button-normal account-socials-button"
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
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => { }}
                className="styled-button-normal account-socials-button"
              >
                <LinkOutlined />
              </Avatar>
            </Tooltip>
          </a>
        )}

        {signedInAccount && chain.address && chain.loggedIn && !listId && !!collectionId && <a
          onClick={isPreview ? undefined : async () => {

            const mainWatchlistPage = signedInAccount?.watchlists?.badges.find(x => x.title === 'Main') ?? { title: 'Main', description: '', items: [] };

            const newBadges = addToBatchArray(mainWatchlistPage.items, [{
              collectionId: collectionId,
              badgeIds: !!badgeId ? [{ start: badgeId, end: badgeId }] : [{ start: 1n, end: GO_MAX_UINT_64 }],
            }]);

            //Update or append
            let newPages;
            if (signedInAccount?.watchlists?.badges.find(x => x.title === 'Main')) {
              newPages = signedInAccount?.watchlists?.badges.map(x => {
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
                  items: newBadges
                },
                ...signedInAccount?.watchlists?.badges ?? []
              ]
            }
            await updateAccountInfo({
              ...signedInAccount,
              watchlists: {
                badges: newPages,
                lists: signedInAccount?.watchlists?.lists ?? []
              }
            });

            updateAccount({
              ...signedInAccount,
              watchlists: {
                badges: newPages,
                lists: signedInAccount?.watchlists?.lists ?? []
              }
            });

            notification.success({
              message: 'Success',
              description: 'Added to watchlist!',
            });
          }}
          target="_blank" rel="noreferrer">
          <Tooltip title="Add to Watchlist" placement="bottom">
            <Avatar
              style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
              size="large"
              className="styled-button-normal account-socials-button"
              src={<EyeOutlined />}
            />
          </Tooltip>
        </a>}

        {signedInAccount && chain.address && chain.loggedIn && listId && <a
          onClick={isPreview ? undefined : async () => {

            const mainWatchlistPage = signedInAccount?.watchlists?.lists?.find(x => x.title === 'Main') ?? { title: 'Main', description: '', items: [] };

            const newListIds = [...new Set([...mainWatchlistPage.items, listId])];

            let newPages;
            //Update or append
            if (signedInAccount?.watchlists?.lists?.find(x => x.title === 'Main')) {
              newPages = signedInAccount?.watchlists?.lists?.map(x => {
                if (x.title === 'Main') {
                  return {
                    ...x,
                    listIds: newListIds
                  }
                }
                return x;
              });

            } else {

              newPages = [
                {
                  title: 'Main',
                  description: '',
                  items: newListIds
                },
                ...signedInAccount?.watchlists?.lists ?? []
              ]
            }
            await updateAccountInfo({
              ...signedInAccount,
              watchlists: {
                badges: signedInAccount?.watchlists?.badges ?? [],
                lists: newPages
              }
            });
            updateAccount({
              ...signedInAccount,
              watchlists: {
                badges: signedInAccount?.watchlists?.badges ?? [],
                lists: newPages
              }
            });

            notification.success({
              message: 'Success',
              description: 'Added to watchlist!',
            });
          }}
          target="_blank" rel="noreferrer">
          <Tooltip title="Add to Watchlist" placement="bottom">
            <Avatar
              style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
              size="large"
              className="styled-button-normal account-socials-button"
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
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => {
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
            <Tooltip title="Share on X" placement="left">
              <Avatar
                style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
                size="large"
                onClick={isPreview ? undefined : () => {
                  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    window.location.href
                  )}`;


                  window.open(shareUrl, '_blank');
                }}
                className="styled-button account-socials-button"
              >
                <img src="/images/x-logo.svg" style={{ width: 24, height: 24, }} />
                {/* <TwitterOutlined /> */}
              </Avatar>
            </Tooltip>
          </div>
        </>} placement="bottom">
          <Avatar
            style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
            size="large"
            className="styled-button-normal account-socials-button"
          >
            <ShareAltOutlined />
          </Avatar>
        </Tooltip> : <Tooltip title={<>
          Share
        </>} placement="bottom">
          <Avatar
            style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
            size="large"
            className="styled-button-normal account-socials-button"
            onClick={isPreview ? undefined : () => {
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
            style={{ cursor: isPreview ? 'not-allowed' : 'pointer' }}
            size="large"
            className="styled-button-normal account-socials-button"
            onClick={isPreview ? undefined : () => {
              setReportIsVisible(true);
            }}
          >
            <FlagOutlined />
          </Avatar>
          <ReportModal
            visible={reportIsVisible}
            setVisible={setReportIsVisible}
            collectionId={collectionId}
            listId={listId}
          />
        </Tooltip>
      </div>
      <Col md={0} sm={1} xs={1} style={{ height: '5px' }} />
    </div>
  );
}
