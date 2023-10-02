import { InputNumber } from 'antd';


export function NumberInput({
  value,
  setValue,
  title,
  min,
  max
}: {
  value: number,
  setValue: (value: number) => void,
  title?: string
  min: number,
  max?: number
}) {
  return <div style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div className='flex-between flex-column'>
      <b>{title}</b>
      <InputNumber
        defaultValue={value}
        min={min >= 0 ? min : 1}
        max={max}
        title='Amount'
        value={value}
        onChange={
          (value: number) => {
            if (!value || value <= 0) {
              setValue(0);
            }
            else {
              setValue(value);
            }
          }
        }
        className='primary-text inherit-bg'
      />
    </div>
  </div>
}
