import { Avatar, Card } from 'antd';

export const tools = [{
  name: 'Sketch.io',
  url: 'https://sketch.io/sketchpad/',
  icon: <img height="auto" src="https://sketch.io/media/Sketch_S.svg" alt="sketch.io" />,
  description: 'Sketchpad is an online drawing application -- written in canvas',
  toolType: 'Creation',
  createdBy: 'sketch.io',
  communityBuilt: true
},
// {
//   name: 'Email',
//   url: 'https://bitbadges-email-distribution-tool-trevormil.vercel.app/',
//   icon: <MailOutlined />,
//   description: 'Distribute claim codes via email.',
//   distributionMethod: DistributionMethod.Codes,
//   createdBy: 'BitBadges',
//   toolType: 'Distribution',
//   communityBuilt: true
// }, 
{
  name: 'Excalidraw',
  url: 'https://excalidraw.com/',
  icon: <img height="auto" src="https://avatars.githubusercontent.com/u/59452120" alt="Excalidraw" />,
  description: 'Virtual whiteboard for sketching hand-drawn like diagrams.',
  createdBy: 'Excalidraw',
  toolType: 'Creation',
  communityBuilt: true
},
{
  name: 'QR Codes',
  url: 'https://docs.bitbadges.io/',
  icon: <img height="auto" src="https://www.qrstuff.com/images/default_qrcode.png" alt="QR Codes" />,
  description: 'Generate QR codes for badge claims natively via the BitBadges app.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Whitelists',
  url: 'https://docs.bitbadges.io/',
  icon: <img height="auto" src="https://cdn1.iconfinder.com/data/icons/cybersecurity-1/512/Whitelisting-512.png" alt="Whitelists" />,
  description: 'Whitelist users to claim badges natively via the BitBadges app.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Passwords / Codes',
  url: 'https://docs.bitbadges.io/',
  icon: <img height="auto" src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-vector-lock-icon-png-image_1028350.jpg" alt="Passwords" />,
  description: 'Restrict badge claims to users with a password or unique code.',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true,
  native: true
},
{
  name: 'Direct Message',
  url: 'https://docs.bitbadges.io/',
  icon: <img height="auto" src="https://cdn.icon-icons.com/icons2/3065/PNG/512/send_contact_dm_icon_190941.png" alt="DM Icon"></img>,
  description: 'Use your favorite social media site to distribute codes or alert users that they can claim your badge!',
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true
},

{
  name: 'Blockin',
  url: 'https://blockin.vercel.app/',
  icon: <img height="auto" src="https://www.gitbook.com/cdn-cgi/image/width=40,dpr=2,height=40,fit=contain,format=auto/https%3A%2F%2F3632080616-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FAwjdYgEsUkK9cCca5DiU%252Ficon%252FzXgOPDuxXwqaOUVRHtGf%252Fblockinlogo.PNG%3Falt%3Dmedia%26token%3Dc2ba0238-82ec-48ac-841e-9b0268eb9148" alt="Blockin" />,
  description: 'Badge-gate websites with Blockin: a universal, multi-chain Web3 sign-in standard.',
  createdBy: 'Blockin',
  toolType: 'Verification',
  communityBuilt: true
},
{
  name: 'Mailchimp',
  url: 'https://mailchimp.com/',
  icon: <img height="auto" src="https://s3.amazonaws.com/www-inside-design/uploads/2018/10/mailchimp-sq.jpg" alt="Mailchimp" />,
  description: 'Distribute claim codes via email or SMS with Mailchimp.',
  createdBy: 'Mailchimp',
  toolType: 'Distribution',
  communityBuilt: true
},

{
  name: 'Twilio',
  url: 'https://www.twilio.com/',
  icon: <img height="auto" src="https://www.vectorlogo.zone/logos/twilio/twilio-icon.svg" alt="Twilio" />,
  description: 'Distribute claim codes via email or SMS with Twilio.',
  createdBy: 'Twilio',
  toolType: 'Distribution',
  communityBuilt: true
},
{
  name: 'Rafflecopter',
  url: 'https://www.rafflecopter.com/',
  icon: <img height="auto" src="https://2.bp.blogspot.com/-_NSxLoZu4Hg/U9ZRbXDnRrI/AAAAAAAAmwA/zA_s2fQYNho/s1600/rafflecopter_logo_name_0.png" alt="Rafflecopter" />,
  description: 'Run a raffle or giveaway with Rafflecopter. Distribute badges to the winner!',
  createdBy: 'RaffleCopter',
  toolType: 'Distribution',
  communityBuilt: true
},
{
  name: 'Paperform',
  url: 'https://paperform.co/',
  icon: <img height="auto" src="data:image/png;base64,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" alt="Paperform" />,
  description: 'Collect addresses at an in-person event for your whitelists with Paperform.',
  createdBy: 'Paperform',
  toolType: 'Collect',
  communityBuilt: true
}


]

export function ToolIcon({
  name
}: {
  name: string
}) {
  const tool = tools.find(tool => tool.name === name);

  if (!tool) {
    return null;
  }

  return (
    <Card hoverable style={{ margin: 8, maxWidth: 300, display: 'inline' }} className='primary-text primary-blue-bg'
      onClick={() => {
        window.open(tool.url)
      }}
    >
      <div className='flex-between' style={{ alignItems: 'normal', width: '100%' }}>
        <div style={{ marginRight: 10 }}>
          <Avatar size={50} src={tool.icon} />

        </div>
        <div className='flex-center flex-column '>
          <div className='flex-around'>
            <div className='primary-text' style={{ display: 'inline' }}>
              <b>
                {tool.name}
              </b>
            </div>

          </div>
          <div className='primary-text'>
            {tool.description}
          </div>
        </div>
      </div>
    </Card>
  );
}
