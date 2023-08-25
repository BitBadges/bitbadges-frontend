import {
  CopyOutlined,
  FlagOutlined,
  LinkOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Col, Layout, Tooltip, message } from 'antd';
import { SupportedChain } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';

const { Content } = Layout;

export function AccountButtonDisplay({
  addressOrUsername,
  bio,
  profilePic,
  website,
  hideButtons
}: {
  addressOrUsername: string,
  bio?: string,
  profilePic?: string,
  website?: string,
  hideButtons?: boolean
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const router = useRouter();
  const accountInfo = accounts.getAccount(addressOrUsername);

  const address = accountInfo?.address
  const avatar = accountInfo?.profilePicUrl ?? accountInfo?.avatar;
  const profilePicSrc = profilePic ? (
    profilePic
  ) : (
    <BlockiesAvatar avatar={avatar} address={address?.toLowerCase() ?? ''} fontSize={200} shape='circle' />
  );

  const isSameAccount = chain.cosmosAddress === accountInfo?.cosmosAddress

  // const blockScanLink = 'https://chat.blockscan.com/index?a=' + address;
  const openSeaLink = 'https://opensea.io/' + address;
  const etherscanLink = 'https://etherscan.io/address/' + address;
  const twitterLink = 'https://twitter.com/' + accountInfo?.twitter;
  const telegramLink = 'https://t.me/' + accountInfo?.telegram;
  const githubLink = 'https://github.com/' + accountInfo?.github;
  const discordLink = 'https://discord.com/users/' + accountInfo?.discord;

  return (
    <div>
      {!hideButtons && <div style={{ position: 'absolute', right: 10, top: 74, display: 'flex' }}>
        {accountInfo?.chain === SupportedChain.ETH && (
          <a href={openSeaLink} target="_blank" rel="noreferrer">
            <Tooltip title="OpenSea" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="screen-button account-socials-button"
                src={"https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.png"}
              >
              </Avatar>
            </Tooltip>
          </a>
        )}

        {accountInfo?.chain === SupportedChain.ETH && (
          <a href={etherscanLink} target="_blank" rel="noreferrer">
            <Tooltip title="Etherscan" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="screen-button account-socials-button"
                src={"https://etherscan.io/images/brandassets/etherscan-logo-circle-light.svg"}
              >

              </Avatar>
            </Tooltip>
          </a>
        )}

        {accountInfo?.twitter && (
          <a href={twitterLink} target="_blank" rel="noreferrer">
            <Tooltip title="Twitter" placement="bottom">
              <Avatar
                size="large"
                onClick={() => { }}
                className="screen-button account-socials-button"
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
                className="screen-button account-socials-button"
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
                className="screen-button account-socials-button"
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
                className="screen-button account-socials-button"
                src={"https://global-uploads.webflow.com/5e157548d6f7910beea4e2d6/604150242d4c6f111dc4e0e8_AMXD2mEvYtyJeooktUtHlCW0f3vrpbwrCN0KjvULcmHdfWBRaAyxA9cSiPn_t6wHhI4mm1qbImd2ewbgBQwm-EtT8hZVevgGiACcBFZ58UQC6EPLcV-mQtaHVb02PzhRrjrpYsnz.png"}
              >
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
                className="screen-button account-socials-button"
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
                className="screen-button account-socials-button"
              >
                <CopyOutlined />
              </Avatar>
            </Tooltip>
            <Tooltip title="Share on Twitter" placement="left">
              <Avatar
                size="large"
                onClick={() => {
                  const tweetMessage = `Check out ${isSameAccount ? 'my' : addressOrUsername + "\'s"} profile on BitBadges!\n\n`;

                  const shareUrl = `https://twitter.com/intent/tweet?text=${tweetMessage}&url=${encodeURIComponent(
                    window.location.href
                  )}`;

                  window.open(shareUrl, '_blank');
                }}
                className="screen-button account-socials-button"
              >
                <TwitterOutlined />
              </Avatar>
            </Tooltip>
          </div>
        </>} placement="bottom">
          <Avatar
            size="large"
            className="screen-button account-socials-button"
          >
            <ShareAltOutlined />
          </Avatar>
        </Tooltip>
        <Tooltip title={<>
          Report
        </>} placement="bottom">
          <Avatar
            size="large"
            className="screen-button account-socials-button"
            onClick={() => {
              //send email
              window.open('mailto:andrew@bitbadges.org');
            }}
          >
            <FlagOutlined />
          </Avatar>
        </Tooltip>

        {isSameAccount && (
          <Tooltip title="Settings" placement="bottom">
            <Avatar
              size="large"
              onClick={() => {
                router.push(
                  `/account/${address}/settings`
                );
                // message.success('Copied to clipboard!');
              }}
              className="screen-button account-socials-button"
            >
              <SettingOutlined />
            </Avatar>
          </Tooltip>
        )}
      </div>}
      <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />
      <Content
        className='flex-center'
        style={{
          padding: '0',
          textAlign: 'center',
          color: 'white',
          paddingBottom: 10,
        }}
      >
        <div className='full-width'>
          <div
            style={{
              padding: '0',
              textAlign: 'center',
              color: 'white',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <Avatar size={200} src={profilePicSrc} />
            <div style={{ marginTop: 4 }} className='flex-center'>
              <AddressDisplay
                addressOrUsername={addressOrUsername}
                fontSize={20}
                hidePortfolioLink
              />
            </div>

            {bio && (
              <div
                className='secondary-text'
                style={{
                  fontSize: 18,
                }}
              >
                {bio}
              </div>
            )}
          </div>
        </div>
      </Content>
    </div>
  );
}
