import { FacebookOutlined, GithubOutlined, InstagramOutlined, LinkedinOutlined, RedditOutlined, SlackOutlined, TwitterOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';

export function FooterButtonDisplay({
}: {
  }) {

  const githubLink = "https://github.com/bitbadges";
  const twitterLink = "https://twitter.com/BitBadges_";
  const discordLink = "https://discord.com/invite/TJMaEd9bar";
  const linkedInLink = "https://linkedin.com/company/bitbadges";
  const facebookLink = "https://facebook.com/profile.php?id=100092259215026";
  const instagramLink = "https://instagram.com/bitbadges_official/";
  const slackLink = "https://bitbadges.slack.com/join/shared_invite/zt-1tws89arl-TMSK_4bdTLOLdyp177811Q#/shared-invite/email";
  const redditLink = "https://www.reddit.com/r/BitBadges/";
  const telegramLink = "https://t.me/BitBadges";

  return (
    <div>
      <div className='flex-center flex-wrap w-full'>
        <a href={githubLink} target="_blank" rel="noreferrer">
          <Tooltip title="GitHub" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80  hover:bg-transparent hover:opacity-80 "
              src={<GithubOutlined />}
            />
          </Tooltip>
        </a>

        <a href={twitterLink} target="_blank" rel="noreferrer">
          <Tooltip title="Twitter" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<TwitterOutlined />}
            />
          </Tooltip>
        </a>



        <a href={linkedInLink} target="_blank" rel="noreferrer">
          <Tooltip title="LinkedIn" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<LinkedinOutlined />}
            />
          </Tooltip>
        </a>

        <a href={facebookLink} target="_blank" rel="noreferrer">
          <Tooltip title="Facebook" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<FacebookOutlined />}
            />
          </Tooltip>
        </a>

        <a href={instagramLink} target="_blank" rel="noreferrer">
          <Tooltip title="Instagram" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<InstagramOutlined />}
            />
          </Tooltip>
        </a>

        <a href={slackLink} target="_blank" rel="noreferrer">
          <Tooltip title="Slack" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<SlackOutlined />}
            />
          </Tooltip>
        </a>



        <a href={redditLink} target="_blank" rel="noreferrer">
          <Tooltip title="Reddit" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<RedditOutlined />}
            />
          </Tooltip>
        </a>

        <a href={telegramLink} target="_blank" rel="noreferrer">
          <Tooltip title="Telegram" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<svg fill='#1890ff' xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 50 50">
                <path d="M 44.376953 5.9863281 C 43.889905 6.0076957 43.415817 6.1432497 42.988281 6.3144531 C 42.565113 6.4845113 40.128883 7.5243408 36.53125 9.0625 C 32.933617 10.600659 28.256963 12.603668 23.621094 14.589844 C 14.349356 18.562196 5.2382813 22.470703 5.2382812 22.470703 L 5.3046875 22.445312 C 5.3046875 22.445312 4.7547875 22.629122 4.1972656 23.017578 C 3.9185047 23.211806 3.6186028 23.462555 3.3730469 23.828125 C 3.127491 24.193695 2.9479735 24.711788 3.015625 25.259766 C 3.2532479 27.184511 5.2480469 27.730469 5.2480469 27.730469 L 5.2558594 27.734375 L 14.158203 30.78125 C 14.385177 31.538434 16.858319 39.792923 17.402344 41.541016 C 17.702797 42.507484 17.984013 43.064995 18.277344 43.445312 C 18.424133 43.635633 18.577962 43.782915 18.748047 43.890625 C 18.815627 43.933415 18.8867 43.965525 18.957031 43.994141 C 18.958531 43.994806 18.959437 43.99348 18.960938 43.994141 C 18.969579 43.997952 18.977708 43.998295 18.986328 44.001953 L 18.962891 43.996094 C 18.979231 44.002694 18.995359 44.013801 19.011719 44.019531 C 19.043456 44.030655 19.062905 44.030268 19.103516 44.039062 C 20.123059 44.395042 20.966797 43.734375 20.966797 43.734375 L 21.001953 43.707031 L 26.470703 38.634766 L 35.345703 45.554688 L 35.457031 45.605469 C 37.010484 46.295216 38.415349 45.910403 39.193359 45.277344 C 39.97137 44.644284 40.277344 43.828125 40.277344 43.828125 L 40.310547 43.742188 L 46.832031 9.7519531 C 46.998903 8.9915162 47.022612 8.334202 46.865234 7.7402344 C 46.707857 7.1462668 46.325492 6.6299361 45.845703 6.34375 C 45.365914 6.0575639 44.864001 5.9649605 44.376953 5.9863281 z M 44.429688 8.0195312 C 44.627491 8.0103707 44.774102 8.032983 44.820312 8.0605469 C 44.866523 8.0881109 44.887272 8.0844829 44.931641 8.2519531 C 44.976011 8.419423 45.000036 8.7721605 44.878906 9.3242188 L 44.875 9.3359375 L 38.390625 43.128906 C 38.375275 43.162926 38.240151 43.475531 37.931641 43.726562 C 37.616914 43.982653 37.266874 44.182554 36.337891 43.792969 L 26.632812 36.224609 L 26.359375 36.009766 L 26.353516 36.015625 L 23.451172 33.837891 L 39.761719 14.648438 A 1.0001 1.0001 0 0 0 38.974609 13 A 1.0001 1.0001 0 0 0 38.445312 13.167969 L 14.84375 28.902344 L 5.9277344 25.849609 C 5.9277344 25.849609 5.0423771 25.356927 5 25.013672 C 4.99765 24.994652 4.9871961 25.011869 5.0332031 24.943359 C 5.0792101 24.874869 5.1948546 24.759225 5.3398438 24.658203 C 5.6298218 24.456159 5.9609375 24.333984 5.9609375 24.333984 L 5.9941406 24.322266 L 6.0273438 24.308594 C 6.0273438 24.308594 15.138894 20.399882 24.410156 16.427734 C 29.045787 14.44166 33.721617 12.440122 37.318359 10.902344 C 40.914175 9.3649615 43.512419 8.2583658 43.732422 8.1699219 C 43.982886 8.0696253 44.231884 8.0286918 44.429688 8.0195312 z M 33.613281 18.792969 L 21.244141 33.345703 L 21.238281 33.351562 A 1.0001 1.0001 0 0 0 21.183594 33.423828 A 1.0001 1.0001 0 0 0 21.128906 33.507812 A 1.0001 1.0001 0 0 0 20.998047 33.892578 A 1.0001 1.0001 0 0 0 20.998047 33.900391 L 19.386719 41.146484 C 19.35993 41.068197 19.341173 41.039555 19.3125 40.947266 L 19.3125 40.945312 C 18.800713 39.30085 16.467362 31.5161 16.144531 30.439453 L 33.613281 18.792969 z M 22.640625 35.730469 L 24.863281 37.398438 L 21.597656 40.425781 L 22.640625 35.730469 z"></path>
              </svg>}
            />
          </Tooltip>
        </a>

        <a href={discordLink} target="_blank" rel="noreferrer">
          <Tooltip title="Discord" placement="bottom">
            <Avatar
              size="large"
              onClick={() => { }}
              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
              src={<svg fill='#1890ff' xmlns="http://www.w3.org/2000/svg" height="0.8em" viewBox="0 0 640 512"><path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" /></svg>}
            />
          </Tooltip>
        </a>

      </div>
      <br />
    </div>
  );
}
