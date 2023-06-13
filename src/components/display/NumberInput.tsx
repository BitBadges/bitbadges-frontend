import { InputNumber } from 'antd';


export function NumberInput({
  value,
  setValue,
  title,
  min
}: {
  value: number,
  setValue: (value: number) => void,
  title?: string
  min: number
}) {
  return <div style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div className='flex-between flex-column'>
      <b>{title}</b>
      <InputNumber
        min={min >= 0 ? min : 1}
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
        className='primary-text primary-blue-bg'
      />
    </div>
  </div>
}
