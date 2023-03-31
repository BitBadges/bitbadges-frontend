import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import React from 'react';
import { PRIMARY_TEXT } from '../../constants';


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
            <div>
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: '#ddd',
                        fontSize: 17,
                        cursor: backButtonDisabled ? 'not-allowed' : undefined,
                        visibility: stepNum === 1 ? 'hidden' : undefined
                    }}
                    onClick={() => decrementStep()}
                    className="opacity link-button"
                    disabled={backButtonDisabled || stepNum === 1}
                >
                    <CaretLeftFilled size={40} />
                    Back
                </button>
            </div>
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
            <div>
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: '#ddd',
                        fontSize: 17,
                        cursor: nextButtonDisabled ? 'not-allowed' : undefined,
                        visibility: stepNum === finalStepNumber ? 'hidden' : undefined
                    }}
                    onClick={() => incrementStep()}
                    className="opacity link-button"
                    disabled={nextButtonDisabled || stepNum === finalStepNumber}

                >
                    Next
                    <CaretRightFilled size={40} />
                </button>
            </div>
        </div>
    );
}
