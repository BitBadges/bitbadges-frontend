/* eslint-disable react-hooks/exhaustive-deps */
import {
    Typography,
    Form,
} from 'antd';
import React, { ReactNode, useEffect } from 'react';
import { useState } from 'react';
import { PRIMARY_TEXT } from '../../constants';
import { FormNavigationHeader } from './FormNavigationHeader';

const CURR_TIMELINE_STEP_NUM = 1;

interface Item {
    disabled?: boolean;
    node: ReactNode;
    title: string;
    description: string;
}

export function CustomizeBadgeForm({
    setCurrStepNumber,
    items,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    items: Item[]
}) {
    const [stepNum, setStepNum] = useState(1);
    const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

    const incrementStep = () => {
        if (stepNum === items.length) {
            setCurrStepNumber(CURR_TIMELINE_STEP_NUM + 1);
        } else {
            setStepNum(stepNum + 1);
            setNextButton(stepNum + 1);
        }
    };

    const decrementStep = () => {
        if (stepNum === 1) {
            setCurrStepNumber(CURR_TIMELINE_STEP_NUM - 1);
        } else {
            setStepNum(stepNum - 1);
            setNextButton(stepNum - 1);
        }
    };


    const setNextButton = (newStepNum: number) => {
        setNextButtonDisabled(!!items[newStepNum - 1].disabled);
    };

    useEffect(() => {
        setNextButton(stepNum);
    }, [items])

    const getTitleElem = (title: string | JSX.Element) => {
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

    const getTitleDescription = (description: string | JSX.Element) => {
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
                    stepNum={stepNum}
                    finalStepNumber={items.length}
                    nextButtonDisabled={nextButtonDisabled}
                />

                <Form
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 14 }}
                    layout="horizontal"
                >
                    {getTitleElem(items[stepNum - 1].title)}
                    {getTitleDescription(items[stepNum - 1].description)}
                    {items[stepNum - 1].node}
                </Form>
            </Form.Provider>
        </div >
    );
}
