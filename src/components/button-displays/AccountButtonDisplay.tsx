import {
  CopyOutlined,
  DeleteOutlined,
  FlagOutlined,
  LinkOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Avatar, Col, Layout, Tooltip, message, notification } from 'antd';
import { SupportedChain } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';

import { useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';
import { ReportModal } from '../tx-modals/ReportModal';

const { Content } = Layout;

export function AccountButtonDisplay({
  addressOrUsername,
  bio,
  profilePic,
  website,
  hideButtons,
  hideDisplay,
  customLinks,
  setCustomLinks,
  onlySocials
}: {
  addressOrUsername: string,
  bio?: string,
  profilePic?: string,
  website?: string,
  hideButtons?: boolean
  hideDisplay?: boolean
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
  const accountInfo = useAccount(addressOrUsername);
  // const signedInAccountInfo = useAccount(chain.address);

  const [reportIsVisible, setReportIsVisible] = useState(false);

  const address = accountInfo?.address
  const avatar = accountInfo?.profilePicUrl ?? accountInfo?.avatar;
  const profilePicSrc = profilePic ? (
    profilePic
  ) : (
    <BlockiesAvatar avatar={avatar} address={address?.toLowerCase() ?? ''} fontSize={200} shape='circle' />
  );

  const isSameAccount = chain.cosmosAddress === accountInfo?.cosmosAddress

  const openSeaLink = 'https://opensea.io/' + address;
  const etherscanLink = 'https://etherscan.io/address/' + address;
  const twitterLink = 'https://twitter.com/' + accountInfo?.twitter;
  const telegramLink = 'https://t.me/' + accountInfo?.telegram;
  const githubLink = 'https://github.com/' + accountInfo?.github;
  const stargazeLink = `https://www.stargaze.zone/p/${address?.replace('cosmos', 'stars')}/tokens`

  // const [loading, setLoading] = useState(false);
  // const [followDetails, setFollowDetails] = useState<GetFollowDetailsRouteSuccessResponse<bigint>>();
  // const [following, setFollowing] = useState(false);
  const isAliasAccount = !!accountInfo?.alias;

  // useEffect(() => {
  //   if (!signedInAccountInfo?.cosmosAddress) return;
  //   getFollowDetails({ cosmosAddress: signedInAccountInfo.cosmosAddress }).then(setFollowDetails);
  // }, [signedInAccountInfo?.cosmosAddress]);

  // useEffect(() => {

  //   async function checkFollowing() {
  //     if (!accountInfo?.cosmosAddress || !followDetails || followDetails.followingCollectionId <= 0 || hideButtons) return;
  //     const balanceDoc = await fetchBalanceForUser(followDetails.followingCollectionId, accountInfo.cosmosAddress);
  //     if (getBalanceForIdAndTime(1n, BigInt(Date.now()), balanceDoc.balances) > 0n) {
  //       setFollowing(true);
  //     }
  //   }
  //   checkFollowing();
  // }, [followDetails, accountInfo?.cosmosAddress, hideButtons]);

  // const addToFollowCollection = async () => {
  //   if (loading || !accountInfo?.cosmosAddress) return;
  //   if (following) {
  //     notification.success({
  //       message: 'Success',
  //       description: 'You are already following this user.',
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   if (!followDetails || followDetails.followingCollectionId <= 0) {
  //     message.error('You must set up a follow collection before following users. Go to Create -> Badge Collection -> Template -> Follow Collection.');
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     await setTransfersForExistingBalancesMapAndAddToStorage(followDetails.followingCollectionId, [{
  //       from: 'Mint',
  //       toAddresses: [accountInfo?.cosmosAddress ?? ''],
  //       balances: [{ amount: 1n, badgeIds: [{ start: 1n, end: 1n }], ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }] }]
  //     }], 'centralized', true);

  //     setFollowing(true);
  //   } catch (e) {

  //   }
  //   setLoading(false);
  // }

  // const removeFromFollowCollection = async () => {
  //   if (loading || !accountInfo?.cosmosAddress) return;

  //   if (!following) {
  //     notification.success({
  //       message: 'Success',
  //       description: 'You are already not following this user.',
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   if (!followDetails || followDetails.followingCollectionId <= 0) {
  //     message.error('You must set up a follow collection before following users. Go to Create -> Badge Collection -> Template -> Follow Collection.');
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     await removeBalancesFromExistingBalancesMapAndAddToStorage(followDetails.followingCollectionId, [accountInfo.cosmosAddress ?? ''], 'centralized', true);
  //     setFollowing(false);
  //   } catch (e) {

  //   }
  //   setLoading(false);
  // }


  return (
    <div>
      {!hideButtons && <div style={!hideDisplay ? { position: 'absolute', right: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'end', maxWidth: 400 } : { display: 'flex', flexWrap: 'wrap', justifyContent: 'start', maxWidth: 400 }}>
        {accountInfo?.chain === SupportedChain.ETH && (
          <a href={openSeaLink} target="_blank" rel="noreferrer">
            <Tooltip title="OpenSea" placement="bottom">
              <Avatar
                size="large"
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
                size="large"
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
                size="large"
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
                size="large"
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
                size="large"
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
                size="large"
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
              size="large"
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
                size="large"
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
                src={link.image}
              >
              </Avatar>
            </Tooltip>

          </a>
          {setCustomLinks && customLinks && <>

            <Avatar
              size="large"
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
                size="large"
                onClick={() => { }}
                className="styled-button-normal account-socials-button"
              >
                <LinkOutlined />
              </Avatar>
            </Tooltip>
          </a>
        )}

        {/* {!onlySocials && chain.loggedIn && !isSameAccount && !following && (
          <Tooltip title="Follow with the BitBadges Follow Protocol" placement="bottom">
            <Avatar

              size="large"
              onClick={async () => {
                await addToFollowCollection();
              }}
              className="styled-button-normal account-socials-button"
            >
              {loading ? <Spin /> : <UserAddOutlined />}
            </Avatar>
          </Tooltip>
        )}

        {!onlySocials && chain.loggedIn && !isSameAccount && following && (
          <Tooltip title="Unfollow with the BitBadges Follow Protocol" placement="bottom">
            <Avatar

              size="large"
              onClick={async () => {
                await removeFromFollowCollection();
              }}
              className="styled-button-normal account-socials-button"
            >
              {loading ? <Spin /> : <UserDeleteOutlined />}
            </Avatar>
          </Tooltip>
        )} */}

        {!onlySocials &&
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
              size="large"
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
              size="large"
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
              size="large"
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
        {!hideButtons &&
          <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />}
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
        </Content></>}
    </div>
  );
}
