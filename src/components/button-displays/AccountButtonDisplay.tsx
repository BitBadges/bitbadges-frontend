import {
    LinkOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import { Avatar, Layout, Tooltip, message, Col } from 'antd';
import { BitBadgesUserInfo, SupportedChain } from 'bitbadges-sdk';
import { PRIMARY_TEXT, SECONDARY_TEXT, WEBSITE_HOSTNAME } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';

const { Content } = Layout;

export function AccountButtonDisplay({
    accountInfo,
    bio,
    profilePic,
    website,
}: {
    accountInfo: BitBadgesUserInfo,
    bio?: string,
    profilePic?: string,
    website?: string,
}) {
    const address = accountInfo.address;
    const avatar = accountInfo.avatar;
    const profilePicSrc = profilePic ? (
        profilePic
    ) : (
        <BlockiesAvatar avatar={avatar} address={address.toLowerCase()} blockiesScale={40} />
    );

    // const blockScanLink = 'https://chat.blockscan.com/index?a=' + address;
    const openSeaLink = 'https://opensea.io/' + address;
    const etherscanLink = 'https://etherscan.io/address/' + address;
    const twitterLink = 'https://twitter.com/' + accountInfo.twitter;
    const telegramLink = 'https://t.me/' + accountInfo.telegram;
    const githubLink = 'https://github.com/' + accountInfo.github;
    const discordLink = 'https://discord.com/users/' + accountInfo.discord;

    return (
        <div>
            <div style={{ position: 'absolute', right: 10, top: 74 }}>
                {accountInfo.chain === SupportedChain.ETH && (
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

                {accountInfo.chain === SupportedChain.ETH && (
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

                {accountInfo.twitter && (
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
                {accountInfo.telegram && (
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
                {accountInfo.github && (
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
                {accountInfo.discord && (
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
                {/* <Tooltip title="Message this user via our in-site direct messaging system." placement="bottom">
                    <Avatar
                        size="large"
                        onClick={() => { }}
                        className="screen-button account-socials-button"
                    >
                        <MailOutlined />
                    </Avatar>
                </Tooltip> */}
                <Tooltip title="Share (Copy Link)" placement="bottom">
                    <Avatar
                        size="large"
                        onClick={() => {
                            navigator.clipboard.writeText(
                                `https://${WEBSITE_HOSTNAME}/account/${address}`
                            );
                            message.success('Copied to clipboard!');
                        }}
                        className="screen-button account-socials-button"
                    >
                        <ShareAltOutlined />
                    </Avatar>
                </Tooltip>
            </div>
            <Col md={0} sm={1} xs={1} style={{ height: '50px' }} />
            <Content
                style={{
                    padding: '0',
                    textAlign: 'center',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingBottom: 10,
                }}
            >
                <div style={{ width: '100%' }}>
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
                        <Avatar size={150} src={profilePicSrc} />
                        <div style={{ marginTop: 4, justifyContent: 'center', display: 'flex' }}>
                            <AddressDisplay
                                userInfo={accountInfo}
                                fontSize={20}
                                fontColor={PRIMARY_TEXT}
                                hidePortfolioLink
                            // showTooltip
                            />
                        </div>

                        {bio && (
                            <div
                                style={{
                                    fontSize: 18,
                                    color: SECONDARY_TEXT,
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
