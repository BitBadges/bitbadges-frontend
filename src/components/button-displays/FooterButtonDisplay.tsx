import { FacebookOutlined, GithubOutlined, InstagramOutlined, LinkedinOutlined, RedditOutlined, SlackOutlined, TwitterOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';

export function FooterButtonDisplay({
}: {
  }) {

  // const blockScanLink = 'https://chat.blockscan.com/index?a=' + address;
  // const companySiteLink = "https://bitbadges.org";
  // const documentationLink = "https://docs.bitbadges.io/overview";
  // const projectBoardLink = "https://github.com/bitbadges/projects";
  const githubLink = "https://github.com/bitbadges";
  const twitterLink = "https://twitter.com/BitBadges_";
  const discordLink = "https://discord.com/invite/TJMaEd9bar";
  const linkedInLink = "https://linkedin.com/company/bitbadges";
  const facebookLink = "https://facebook.com/profile.php?id=100092259215026";
  const instagramLink = "https://instagram.com/bitbadges_official/";
  const slackLink = "https://bitbadges.slack.com/join/shared_invite/zt-1tws89arl-TMSK_4bdTLOLdyp177811Q#/shared-invite/email";
  const crunchbaseLink = "https://www.crunchbase.com/organization/bitbadges";
  const redditLink = "https://www.reddit.com/r/BitBadges/";
  const telegramLink = "https://t.me/BitBadges";
  // const termsOfServiceLink = "https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf";
  // const privacyPolicyLink = "https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf";



  return (
    <div>
      <div className='flex-center flex-wrap'>
        <a href={githubLink} target="_blank" rel="noreferrer">
          <Tooltip title="GitHub" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<GithubOutlined />}
            />
          </Tooltip>
        </a>

        <a href={twitterLink} target="_blank" rel="noreferrer">
          <Tooltip title="Twitter" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<TwitterOutlined />}
            />
          </Tooltip>
        </a>



        <a href={linkedInLink} target="_blank" rel="noreferrer">
          <Tooltip title="LinkedIn" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<LinkedinOutlined />}
            />
          </Tooltip>
        </a>

        <a href={facebookLink} target="_blank" rel="noreferrer">
          <Tooltip title="Facebook" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<FacebookOutlined />}
            />
          </Tooltip>
        </a>

        <a href={instagramLink} target="_blank" rel="noreferrer">
          <Tooltip title="Instagram" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<InstagramOutlined />}
            />
          </Tooltip>
        </a>

        <a href={slackLink} target="_blank" rel="noreferrer">
          <Tooltip title="Slack" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<SlackOutlined />}
            />
          </Tooltip>
        </a>



        <a href={redditLink} target="_blank" rel="noreferrer">
          <Tooltip title="Reddit" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={<RedditOutlined />}
            />
          </Tooltip>
        </a>

        <a href={telegramLink} target="_blank" rel="noreferrer">
          <Tooltip title="Telegram" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={"https://1000logos.net/wp-content/uploads/2021/04/Telegram-logo.png"}
            />
          </Tooltip>
        </a>

        <a href={crunchbaseLink} target="_blank" rel="noreferrer">
          <Tooltip title="Crunchbase" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={"https://secure.gravatar.com/avatar/195717ff022793b6339f2d53783ea08a?s=500&d=mm&r=g"}
            />
          </Tooltip>
        </a>

        <a href={discordLink} target="_blank" rel="noreferrer">
          <Tooltip title="Discord" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="screen-button account-socials-button"
              src={"https://global-uploads.webflow.com/5e157548d6f7910beea4e2d6/604150242d4c6f111dc4e0e8_AMXD2mEvYtyJeooktUtHlCW0f3vrpbwrCN0KjvULcmHdfWBRaAyxA9cSiPn_t6wHhI4mm1qbImd2ewbgBQwm-EtT8hZVevgGiACcBFZ58UQC6EPLcV-mQtaHVb02PzhRrjrpYsnz.png"}
            />
          </Tooltip>
        </a>

      </div>
      <br />
    </div>
  );
}
