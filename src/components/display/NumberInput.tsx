import { InputNumber } from 'antd';
import { Balance } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

export function NumberInput({
    value,
    setValue,
    darkMode,
    title,
    min
}: {
    value: number,
    setValue: (value: number) => void,
    darkMode?: boolean
    title?: string
    min: number
}) {
    return <div style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className='flex-between' style={{ flexDirection: 'column' }} >
            <b>{title}</b>
            <InputNumber
                min={min >= 0 ? min : 1}
                title='Amount'
                value={value} onChange={
                    (value: number) => {
                        if (!value || value <= 0) {
                            setValue(0);
                        }
                        else {
                            setValue(value);
                        }
                    }
                }
                style={darkMode ? {
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                } : undefined}
            />
        </div>
    </div>
}
