import { LinkOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Card } from 'antd';
import { DistributionMethod } from 'bitbadgesjs-utils';

export const tools = [{
  name: 'Sketch.io',
  url: 'https://sketch.io/sketchpad/',
  icon: <img height="auto" src="https://sketch.io/media/Sketch_S.svg" alt="sketch.io" />,
  description: 'Sketchpad is an online drawing application -- written in canvas',
  createdBy: 'sketch.io',
  communityBuilt: true
}, {
  name: 'Email',
  url: 'https://bitbadges-email-distribution-tool-trevormil.vercel.app/',
  icon: <MailOutlined />,
  description: 'Distribute codes via email.',
  distributionMethod: DistributionMethod.Codes,
  createdBy: 'BitBadges',
  communityBuilt: false
}, {
  name: 'Excalidraw',
  url: 'https://excalidraw.com/',
  icon: <img height="auto" src="https://avatars.githubusercontent.com/u/59452120" alt="Excalidraw" />,
  description: 'Virtual whiteboard for sketching hand-drawn like diagrams.',
  createdBy: 'Excalidraw',
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
    <Card hoverable style={{ margin: 10, width: 240 }} className='primary-text primary-blue-bg'
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
              <TeamOutlined style={{ marginLeft: 10 }} />}

          </div>}
        description={<div className='primary-text'>
          {tool.description}
        </div>}
        className='primary-text'
      />
    </Card>
  );
}
