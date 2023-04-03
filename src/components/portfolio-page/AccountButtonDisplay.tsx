import {
    InstagramOutlined,
    LinkOutlined,
    MailOutlined,
    ShareAltOutlined,
    TwitterOutlined,
} from '@ant-design/icons';
import { Avatar, Layout, Tooltip, message } from 'antd';
import { BitBadgesUserInfo } from 'bitbadges-sdk';
import { PRIMARY_TEXT, SECONDARY_TEXT, WEBSITE_HOSTNAME } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';

const { Content } = Layout;

export function AccountButtonDisplay({
    accountInfo,
    bio,
    profilePic,
    twitter,
    instagram,
    website,
}: {
    accountInfo: BitBadgesUserInfo,
    bio?: string,
    profilePic?: string,
    twitter?: string,
    instagram?: string,
    website?: string,
}) {
    const address = accountInfo.address;
    const avatar = accountInfo.avatar;
    const profilePicSrc = profilePic ? (
        profilePic
    ) : (
        <BlockiesAvatar avatar={avatar} address={address.toLowerCase()} blockiesScale={40} />
    );

    const blockScanLink = 'https://chat.blockscan.com/index?a=' + address;

    return (
        <div>
            <div style={{ position: 'absolute', right: 10, top: 74 }}>
                {twitter && (
                    <a href={twitter} target="_blank" rel="noreferrer">
                        <Tooltip title="Twitter" placement="bottom">
                            <Avatar
                                size="large"
                                onClick={() => { }}
                                className="screen-button account-socials-button"
                            >
                                <TwitterOutlined />
                            </Avatar>
                        </Tooltip>
                    </a>
                )}
                {instagram && (
                    <a href={instagram} target="_blank" rel="noreferrer">
                        <Tooltip title="Instagram" placement="bottom">
                            <Avatar
                                size="large"
                                onClick={() => { }}
                                className="screen-button account-socials-button"
                            >
                                <InstagramOutlined />
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
                <Tooltip title="Message this User" placement="bottom">
                    <a href={blockScanLink} target="_blank" rel="noreferrer">
                        <Avatar
                            size="large"
                            onClick={() => { }}
                            className="screen-button account-socials-button"
                        >
                            <MailOutlined />
                        </Avatar>
                    </a>
                </Tooltip>
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
                                fontSize={30}
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
