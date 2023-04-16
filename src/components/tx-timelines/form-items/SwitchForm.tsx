import { Card, Col, Row, Typography } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { ReactNode, useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';

interface SwitchFormOption {
    title: string;
    message: string | ReactNode;
    isSelected: boolean;
    disabled?: boolean;
}

export function SwitchForm({
    onSwitchChange,
    options,
    helperMessage,
    noSelectUntilClick,
}: {
    onSwitchChange: (selectedIdx: number, newSelectedOptionTitle: string) => void;
    options: SwitchFormOption[];
    helperMessage?: string;
    noSelectUntilClick?: boolean;
}) {
    const [canShowSelected, setCanShowSelected] = useState<boolean>(noSelectUntilClick ? false : true);

    return (
        <>
            <div>
                <Row
                    style={{
                        padding: '0',
                        textAlign: 'center',
                        color: PRIMARY_TEXT,
                        justifyContent: 'center',
                        display: 'flex',
                        flexWrap: 'wrap',
                    }}
                >
                    {options.map((option, index) => {
                        return <Col md={12} sm={24} xs={24} key={index} style={{ display: 'flex' }}>
                            <Card
                                key={index}
                                hoverable
                                style={{
                                    width: '100%',
                                    margin: 8,
                                    textAlign: 'center',
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                    border: option.isSelected && canShowSelected ? '1px solid #1890ff' : undefined,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    cursor: option.disabled ? 'not-allowed' : undefined
                                }}
                                onClick={() => {
                                    if (option.disabled) {
                                        return;
                                    }
                                    onSwitchChange(index, option.title);
                                    setCanShowSelected(true);
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
                        </Col>
                    })}
                </Row>
                <Typography style={{ color: 'lightgrey', textAlign: 'center' }}>
                    {helperMessage}
                </Typography>
            </div >
        </>
    )
}