import { InputNumber } from 'antd';


export function NumberInput({
  value,
  setValue,
  title,
  min,
  max,
  disabled
}: {
  value: number,
  setValue: (value: number) => void,
  title?: string
  min: number,
  max?: number,
  disabled?: boolean
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
        disabled={disabled}
        onChange={
          (value: number | null) => {
            if (!value || value <= 0) {
              setValue(0);
            }
            else {
              setValue(value);
            }
          }
        }
        className='dark:text-white inherit-bg'
      />
    </div>
  </div>
}
