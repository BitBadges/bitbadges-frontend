import React, { ReactNode, useEffect, useState } from 'react';
import { Typography, Switch, Card } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import Meta from 'antd/lib/card/Meta';
const { Text } = Typography;

export function SwitchForm({
    onSwitchChange,
    selectedMessage,
    unselectedMessage,
    helperMessage,
    isOptionOneSelected,
    isOptionTwoSelected,
}: {
    onSwitchChange: (isOptionOneSelected: boolean, isOptionTwoSelected: boolean) => void;
    selectedMessage: string | ReactNode;
    unselectedMessage: string | ReactNode;
    helperMessage?: string | ReactNode;
    isOptionOneSelected: boolean;
    isOptionTwoSelected: boolean;
}) {
    return (
        <>
            {/* <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: 100,
                }}
            >

                <Switch
                    checked={value}
                    onChange={() => {
                        const currValue = value;
                        setValue(!currValue);
                        onSwitchChange(!currValue);
                    }}
                />
            </div>
            <div
                style={{
                    marginTop: 10,
                    textAlign: 'center',
                }}
            >
                <Text style={{ color: 'white' }}>
                    {value &&
                        <>{selectedMessage}</>}
                    {!value &&
                        <>{unselectedMessage}</>}
                </Text>
            </div> */}
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

                    }}
                >
                    <Card
                        hoverable
                        style={{
                            width: '45%',
                            margin: 8,
                            textAlign: 'center',
                            backgroundColor: PRIMARY_BLUE,
                            color: PRIMARY_TEXT,
                            border: isOptionOneSelected ? '1px solid #1890ff' : undefined,
                            display: 'flex',
                            justifyContent: 'center',
                            // alignItems: 'center',
                            // minHeight: 150,
                        }}
                        onClick={() => {
                            onSwitchChange(true, false);
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
                                    {'No'}
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
                                    {unselectedMessage}
                                </div>
                            }
                        />
                    </Card>
                    <Card
                        style={{
                            margin: 8,
                            width: '45%',
                            textAlign: 'center',
                            backgroundColor: PRIMARY_BLUE,
                            color: PRIMARY_TEXT,
                            display: 'flex',
                            justifyContent: 'center',
                            // alignItems: 'center',
                            border: isOptionTwoSelected ? '1px solid #1890ff' : undefined,
                            // minHeight: 150,  
                        }}
                        hoverable
                        onClick={() => {
                            onSwitchChange(false, true);
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
                                    {'Yes'}
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
                                    {selectedMessage}
                                </div>
                            }
                        />
                    </Card>
                </div>
                <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                    {helperMessage}
                </Typography>
            </div>
        </>
    )
}