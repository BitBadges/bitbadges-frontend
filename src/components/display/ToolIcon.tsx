import { LinkOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Card, Tooltip } from 'antd';
import { DistributionMethod } from 'bitbadgesjs-utils';

export const tools = [{
  name: 'Sketch.io',
  url: 'https://sketch.io/sketchpad/',
  icon: <img height="auto" src="https://sketch.io/media/Sketch_S.svg" alt="sketch.io" />,
  description: 'Sketchpad is an online drawing application -- written in canvas',
  toolType: 'Creation',
  createdBy: 'sketch.io',
  communityBuilt: true
}, {
  name: 'Email',
  url: 'https://bitbadges-email-distribution-tool-trevormil.vercel.app/',
  icon: <MailOutlined />,
  description: 'Distribute claim codes via email.',
  distributionMethod: DistributionMethod.Codes,
  createdBy: 'BitBadges',
  toolType: 'Distribution',
  communityBuilt: true
}, {
  name: 'Excalidraw',
  url: 'https://excalidraw.com/',
  icon: <img height="auto" src="https://avatars.githubusercontent.com/u/59452120" alt="Excalidraw" />,
  description: 'Virtual whiteboard for sketching hand-drawn like diagrams.',
  createdBy: 'Excalidraw',
  toolType: 'Creation',
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

}]

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
    <Card hoverable style={{ margin: 10, maxWidth: 300 }} className='primary-text primary-blue-bg'
      onClick={() => {
        window.open(tool.url)
      }}
    >
      <Card.Meta
        avatar={<Avatar src={tool.icon} />}
        title={
          <div className='primary-text'>
            {tool.name}
            <LinkOutlined style={{ marginLeft: 10 }} />
            {tool.communityBuilt &&
              <Tooltip title={`Built by ${tool.createdBy
                }`} placement="bottom">
                <TeamOutlined style={{ marginLeft: 10 }} />
              </Tooltip>}

          </div>}
        description={<div className='primary-text'>
          {tool.description}
        </div>}
        className='primary-text'
      />
    </Card>
  );
}
