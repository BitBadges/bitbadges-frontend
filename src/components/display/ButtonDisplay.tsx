import { Avatar, Badge, Layout, Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';

const { Content } = Layout;
const { Text } = Typography;

export interface ButtonDisplayProps {
  name: string | ReactNode;
  icon: JSX.Element;
  onClick: () => void;
  count?: number;
  tooltipMessage?: string | ReactNode;
  disabled?: boolean;
}

export function ButtonDisplay({ buttons }: { buttons: ButtonDisplayProps[] }) {
  return (
    <Content className="flex">
      <div className="full-width flex-center" style={{ padding: '10', marginTop: 8 }}>
        {buttons.map((button, idx) => {
          return (
            <Tooltip
              key={idx}
              title={<div style={{ textAlign: 'center' }}> {button.tooltipMessage ? button.tooltipMessage : button.name}</div>}
              placement="bottom"
              style={{ textAlign: 'center' }}
            >
              <div style={{ minWidth: 75 }}>
                {/* //This is the antd Badge */}
                <Badge count={button.count}>
                  <Avatar
                    style={{
                      marginBottom: 1,
                      cursor: button.disabled ? 'not-allowed' : 'pointer',
                      fontSize: 20,
                      padding: 0,
                      margin: 0,
                      alignItems: 'center'
                    }}
                    size="large"
                    onClick={button.disabled ? () => {} : button.onClick}
                    className="styled-button"
                  >
                    {button.icon}
                  </Avatar>
                </Badge>
                <div style={{ marginTop: 3 }}>
                  <Text className="primary-text">{button.name}</Text>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Content>
  );
}
