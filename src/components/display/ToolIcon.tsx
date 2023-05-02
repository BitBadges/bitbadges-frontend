import { LinkOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Card } from 'antd';
import { DistributionMethod } from 'bitbadgesjs-utils';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

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
}]

export function ToolIcon({
  name,
  setDistributionMethod
}: {
  name: string,
  setDistributionMethod?: (newDistributionMethod: DistributionMethod) => void
}) {
  const tool = tools.find(tool => tool.name === name);

  if (!tool) {
    return null;
  }

  return (
    <Card hoverable style={{ margin: 10, width: 240, background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
      onClick={() => {
        if (setDistributionMethod && tool.distributionMethod) {
          setDistributionMethod(tool.distributionMethod)
        }
        window.open(tool.url)
      }}
    >
      <Card.Meta
        avatar={<Avatar src={tool.icon} />}
        title={
          <div style={{ color: PRIMARY_TEXT }}>
            {tool.name}
            <LinkOutlined style={{ marginLeft: 10 }} />
            {tool.communityBuilt &&
              <TeamOutlined style={{ marginLeft: 10 }} />}

          </div>}
        description={<div style={{ color: PRIMARY_TEXT }}>

          {tool.description}
        </div>}
        style={{ color: PRIMARY_TEXT }}
      />
    </Card>
  );
}
