import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';
import { PRIMARY_TEXT } from '../../../constants';

export function FormNavigationHeader({
    decrementStep,
    incrementStep,
    stepNum,
    backButtonDisabled,
    nextButtonDisabled,
    finalStepNumber,
}: {
    decrementStep: () => void;
    incrementStep: () => void;
    stepNum: number;
    backButtonDisabled?: boolean;
    nextButtonDisabled?: boolean;
    finalStepNumber: number;
}) {
    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <button
                style={{
                    backgroundColor: 'inherit',
                    color: '#ddd',
                    fontSize: 17,
                    cursor: backButtonDisabled ? 'not-allowed' : undefined,
                }}
                onClick={() => decrementStep()}
                className="opacity link-button"
                disabled={backButtonDisabled}
            >
                <CaretLeftFilled size={40} />
                Back
            </button>
            <Typography.Text
                strong
                style={{
                    color: PRIMARY_TEXT,
                    fontSize: 20,
                    marginLeft: 50,
                    marginRight: 50,
                }}
            >
                {stepNum} / {finalStepNumber}
            </Typography.Text>

            <button
                style={{
                    backgroundColor: 'inherit',
                    color: '#ddd',
                    fontSize: 17,
                    cursor: nextButtonDisabled ? 'not-allowed' : undefined,
                }}
                onClick={() => incrementStep()}
                className="opacity link-button"
                disabled={nextButtonDisabled}
            >
                Next
                <CaretRightFilled size={40} />
            </button>
        </div>
    );
}
