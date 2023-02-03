import React, { ReactNode, useEffect, useState } from 'react';
import { Typography, Card } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import Meta from 'antd/lib/card/Meta';

interface SwitchFormOption {
    title: string;
    message: string | ReactNode;
    isSelected: boolean;
}

export function SwitchForm({
    onSwitchChange,
    options,
    helperMessage,
}: {
    onSwitchChange: (newSelectedOptionTitle: string) => void;
    options: SwitchFormOption[];
    helperMessage?: string;
}) {
    return (
        <>
            <div>
                <div
                    style={{
                        padding: '0',
                        textAlign: 'center',
                        color: PRIMARY_TEXT,
                        justifyContent: 'center',
                        // alignItems: 'center',
                        // marginTop: 20,
                        display: 'flex',
                        flexWrap: 'wrap',
                    }}
                >
                    {options.map((option, index) => {
                        return <Card
                            key={index}
                            hoverable
                            style={{
                                width: '45%',
                                margin: 8,
                                textAlign: 'center',
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                                border: option.isSelected ? '1px solid #1890ff' : undefined,
                                display: 'flex',
                                justifyContent: 'center',
                                // alignItems: 'center',
                                // minHeight: 150,
                            }}
                            onClick={() => {
                                onSwitchChange(option.title);
                            }}
                        >
                            <Meta
                                title={
                                    <div
                                        style={{
                                            fontSize: 20,
                                            color: PRIMARY_TEXT,
                                            fontWeight: 'bolder',
                                        }}
                                    >
                                        {option.title}
                                    </div>
                                }
                                description={
                                    <div
                                        style={{
                                            color: SECONDARY_TEXT,
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        {option.message}
                                    </div>
                                }
                            />
                        </Card>
                    })}
                </div>
                <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                    {helperMessage}
                </Typography>
            </div>
        </>
    )
}