import {
  CopyOutlined,
  DeleteOutlined,
  FlagOutlined,
  LinkOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Tooltip, message, notification } from 'antd';
import { BitBadgesUserInfo, SupportedChain } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { ReportModal } from '../tx-modals/ReportModal';

export function AccountButtonDisplay({
  addressOrUsername,
  accountOverride,
  website,
  mobile,
  hideButtons,
  hideDisplay,
  customLinks,
  setCustomLinks,
  onlySocials
}: {
  addressOrUsername: string,
  accountOverride?: BitBadgesUserInfo<bigint>,
  website?: string,
  hideButtons?: boolean
  hideDisplay?: boolean
  mobile?: boolean
  customLinks?: {
    title: string,
    url: string,
    image: string
  }[]
  setCustomLinks?: (links: {
    title: string,
    url: string,
    image: string
  }[]) => void,
  onlySocials?: boolean
}) {
  const chain = useChainContext();
  const router = useRouter();
  const _accountInfo = useAccount(addressOrUsername);
  const accountInfo = accountOverride ?? _accountInfo

  const [reportIsVisible, setReportIsVisible] = useState(false);

  const address = accountInfo?.address

  const isSameAccount = chain.cosmosAddress === accountInfo?.cosmosAddress
  const openSeaLink = 'https://opensea.io/' + address;
  const etherscanLink = 'https://etherscan.io/address/' + address;
  const twitterLink = 'https://twitter.com/' + accountInfo?.twitter;
  const telegramLink = 'https://t.me/' + accountInfo?.telegram;
  const githubLink = 'https://github.com/' + accountInfo?.github;
  const stargazeLink = `https://www.stargaze.zone/p/${address?.replace('cosmos', 'stars')}/tokens`

  const isAliasAccount = !!accountInfo?.alias;

  return (
    <>
      {!hideButtons && <div style={!hideDisplay ? { display: 'flex', flexWrap: 'wrap', justifyContent: 'end', maxWidth: 400 } : { display: 'flex', flexWrap: 'wrap', justifyContent: 'start', maxWidth: 400 }}>
        {accountInfo?.chain === SupportedChain.ETH && (
          <a href={openSeaLink} target="_blank" rel="noreferrer">
            <Tooltip title="OpenSea" placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
                src={"https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.png"}
              >
              </Avatar>
            </Tooltip>
          </a>
        )}

        {accountInfo?.chain === SupportedChain.COSMOS && !isAliasAccount && (
          <a href={stargazeLink} target="_blank" rel="noreferrer">
            <Tooltip title="Stargaze" placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
                src={"https://pbs.twimg.com/profile_images/1507391623914737669/U3fR7nxh_400x400.jpg"}
              >
              </Avatar>
            </Tooltip>
          </a>
        )}

        {accountInfo?.chain === SupportedChain.ETH && (
          <a href={etherscanLink} target="_blank" rel="noreferrer">
            <Tooltip title="Etherscan" placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                style={{ backgroundColor: 'white' }}
                className="styled-button-normal account-socials-button"
                src={"https://etherscan.io/images/brandassets/etherscan-logo-circle.svg"}
              >

              </Avatar>
            </Tooltip>
          </a>
        )}

        {accountInfo?.twitter && (
          <a href={twitterLink} target="_blank" rel="noreferrer">
            <Tooltip title="Twitter" placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
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
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
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
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
                // src={ }
                src={"https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
              >
                {/* <GithubOutlined /> */}
              </Avatar>
            </Tooltip>
          </a>
        )}
        {accountInfo?.discord && (
          <Tooltip title={accountInfo?.discord} placement="bottom">
            <Avatar
              size={mobile ? undefined : 'large'}
              onClick={() => {
                if (!accountInfo?.discord) return;

                navigator.clipboard.writeText(accountInfo.discord);
                notification.info({
                  message: 'Copied to clipboard!',
                });
              }}
              className="styled-button-normal account-socials-button"
              src={"https://global-uploads.webflow.com/5e157548d6f7910beea4e2d6/604150242d4c6f111dc4e0e8_AMXD2mEvYtyJeooktUtHlCW0f3vrpbwrCN0KjvULcmHdfWBRaAyxA9cSiPn_t6wHhI4mm1qbImd2ewbgBQwm-EtT8hZVevgGiACcBFZ58UQC6EPLcV-mQtaHVb02PzhRrjrpYsnz.png"}
            >
            </Avatar>
          </Tooltip>
        )}

        {(customLinks ?? accountInfo?.customLinks)?.map((link, i) => (<div key={i}>
          <a key={i} href={link.url} target="_blank" rel="noreferrer">
            <Tooltip title={link.title} placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
                src={link.image}
              >
              </Avatar>
            </Tooltip>

          </a>
          {setCustomLinks && customLinks && <>

            <Avatar
              size={mobile ? undefined : 'large'}
              onClick={() => {
                setCustomLinks((customLinks).filter((_, j) => j !== i))
              }}
              className="styled-button-normal account-socials-button"
              style={{ border: 'none' }}
              src={<DeleteOutlined />}
            >
            </Avatar>
          </>}
        </div>
        ))}

        {website && (
          <a href={website} target="_blank" rel="noreferrer">
            <Tooltip title="Website" placement="bottom">
              <Avatar
                size={mobile ? undefined : 'large'}
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
              >
                <LinkOutlined />
              </Avatar>
            </Tooltip>
          </a>
        )}
        {!onlySocials &&
          <Tooltip title={<>
            <div style={{ textAlign: 'center' }}>
              <b>Share</b>
              <Tooltip title="Copy Link" placement="left">
                <Avatar
                  size={mobile ? undefined : 'large'}
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
                  size={mobile ? undefined : 'large'}
                  onClick={() => {
                    const tweetMessage = `Check out ${isSameAccount ? 'my' : addressOrUsername + "\'s"} profile on BitBadges!\n\n`;

                    const shareUrl = `https://twitter.com/intent/tweet?text=${tweetMessage}&url=${encodeURIComponent(
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
              size={mobile ? undefined : 'large'}
              className="styled-button-normal account-socials-button"
            >
              <ShareAltOutlined />
            </Avatar>
          </Tooltip>}

        {!onlySocials &&
          <Tooltip title={<>
            Report
          </>} placement="bottom">
            <Avatar
              size={mobile ? undefined : 'large'}
              className="styled-button-normal account-socials-button"
              onClick={() => {
                setReportIsVisible(true);
              }}
            >
              <FlagOutlined />
            </Avatar>

            <ReportModal
              addressOrUsername={address}
              visible={reportIsVisible}
              setVisible={setReportIsVisible}
            />
          </Tooltip>
        }

        {!onlySocials && isSameAccount && (
          <Tooltip title="Settings" placement="bottom">
            <Avatar
              size={mobile ? undefined : 'large'}
              onClick={() => {
                router.push(
                  `/account/${address}/settings`
                );
                // message.success('Copied to clipboard!');
              }}
              className="styled-button-normal account-socials-button"
            >
              <SettingOutlined />
            </Avatar>
          </Tooltip>
        )}


      </div>}

      {!hideDisplay && <>
      </>}
    </>
  );
}
