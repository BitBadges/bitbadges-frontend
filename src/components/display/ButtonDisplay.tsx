import { Avatar, Badge, Layout, Tooltip, Typography, } from 'antd';
import { ReactNode } from 'react';
import { PRIMARY_TEXT } from '../../constants';


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

export function ButtonDisplay({
    buttons
}: {
    buttons: ButtonDisplayProps[];
}) {
    return (
        <Content style={{ display: 'flex' }}>
            <div
                style={{
                    width: '100%',
                    padding: '10',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 8,
                    // marginBottom: 30,
                }}
            >
                {buttons.map((button, idx) => {
                    return (
                        <Tooltip
                            key={idx}
                            title={<div style={{ textAlign: 'center' }}> {button.tooltipMessage ? button.tooltipMessage : button.name}</div>}
                            placement='bottom'
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ minWidth: 75 }}>
                                {/* //This is the antd Badge */}
                                <Badge count={button.count} >
                                    <Avatar
                                        style={{
                                            marginBottom: 1,
                                            cursor: button.disabled ? 'not-allowed' : 'pointer',
                                            fontSize: 20,
                                            padding: 0,
                                            margin: 0,
                                            alignItems: 'center',

                                        }}
                                        size="large"
                                        onClick={button.disabled ? () => { } : button.onClick}
                                        className="screen-button"
                                    >
                                        {button.icon}
                                    </Avatar>
                                </Badge>
                                <div style={{ marginTop: 3 }}>
                                    <Text style={{ color: PRIMARY_TEXT }}>
                                        {button.name}
                                    </Text>
                                </div>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </Content>
    );
}
