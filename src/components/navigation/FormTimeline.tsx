/* eslint-disable react-hooks/exhaustive-deps */
import {
    Typography,
    Form,
} from 'antd';
import React, { ReactNode, useEffect } from 'react';
import { useState } from 'react';
import { PRIMARY_TEXT } from '../../constants';

import { FormNavigationHeader } from './FormNavigationHeader';


export interface TimelineItem {
    disabled?: boolean;
    node: ReactNode;
    title: string | ReactNode;
    description: string | ReactNode;
    doNotDisplay?: boolean;
}

export function FormTimeline({
    items,
    onFinish
}: {
    items: TimelineItem[]
    onFinish?: () => void
}) {
    const [formStepNum, setFormStepNum] = useState(1);
    const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

    const filteredItems = items.filter((item) => !item.doNotDisplay);

    const incrementStep = () => {
        setFormStepNum(formStepNum + 1);
        setNextButton(formStepNum + 1);
    };

    const decrementStep = () => {
        if (formStepNum === 1) {
            return;
        }

        setFormStepNum(formStepNum - 1);
        setNextButton(formStepNum - 1);
    };


    const setNextButton = (newStepNum: number) => {
        setNextButtonDisabled(!!filteredItems[newStepNum - 1]?.disabled);
    };

    useEffect(() => {
        setNextButton(formStepNum);

        if (formStepNum === filteredItems.length && onFinish) {
            onFinish();
        }
    }, [filteredItems, formStepNum])

    const getTitleElem = (title: string | ReactNode) => {
        return (
            <div
                style={{
                    justifyContent: 'center',
                    display: 'flex',
                }}
            >
                <Typography.Text
                    style={{
                        color: PRIMARY_TEXT,
                        fontSize: 20,
                        marginBottom: 10,
                    }}
                    strong
                >
                    {title}
                </Typography.Text>
            </div>
        );
    };

    const getTitleDescription = (description: string | ReactNode) => {
        return (
            <div
                style={{
                    justifyContent: 'center',
                    display: 'flex',
                    marginBottom: 10,
                }}
            >
                <Typography.Text
                    style={{
                        color: PRIMARY_TEXT,
                        fontSize: 14,
                        textAlign: 'center',
                    }}
                    strong
                >
                    {description}
                </Typography.Text>
            </div>
        );
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <Form.Provider>
                <FormNavigationHeader
                    decrementStep={decrementStep}
                    incrementStep={incrementStep}
                    stepNum={formStepNum}
                    finalStepNumber={filteredItems.length}
                    nextButtonDisabled={nextButtonDisabled}
                />

                <Form
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 14 }}
                    layout="horizontal"
                >
                    {getTitleElem(filteredItems[formStepNum - 1].title)}
                    {getTitleDescription(filteredItems[formStepNum - 1].description)}
                    {filteredItems[formStepNum - 1].node}
                </Form>
            </Form.Provider>
        </div>
    );
}
