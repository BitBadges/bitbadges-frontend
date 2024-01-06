import { WarningOutlined } from '@ant-design/icons';
import { Card, Col, Row, Typography } from 'antd';
import { ReactNode } from 'react';


interface SwitchFormOption {
  title: string | ReactNode;
  message: string | ReactNode;
  isSelected: boolean;
  disabled?: boolean;
  additionalNode?: () => ReactNode;
}

export function SwitchForm({
  onSwitchChange,
  options,
  helperMessage,
  showCustomOption,
  fullWidthCards
}: {
  onSwitchChange: (selectedIdx: number) => void;
  options: (SwitchFormOption | undefined)[];
  helperMessage?: string;
  showCustomOption?: boolean;
  fullWidthCards?: boolean;
}) {
  const filteredOptions = options.filter(x => x) as SwitchFormOption[];
  let customValueIdx = -1;
  if (showCustomOption && filteredOptions.every(x => !x.isSelected)) {
    customValueIdx = filteredOptions.length;
    filteredOptions.push({
      title: <>Custom <WarningOutlined style={{ color: 'orange' }}></WarningOutlined></>,
      message: 'A custom value has been set that does not match any of the other options. This typically happens because the value was set manually, or you went back to a previous step and changed a detail that this depends on (oftentimes, the number of badges). If this was not intentional, please select one of the other options.',
      isSelected: true,
    })
  }

  return (
    <>
      <div>
        <Row className='flex-center flex-wrap primary-text'
          style={{
            padding: '0',
            textAlign: 'center',
            alignItems: 'normal',
            overflowWrap: 'break-word',
          }}
        >
          {filteredOptions.map((option, index) => {
            return <Col md={fullWidthCards ? 24 : 12} sm={24} xs={24} key={index} className='flex' style={{ padding: 8 }}>
              <Card
                key={index}
                hoverable
                className={option.disabled ? 'primary-text tertiary-blue-bg full-width flex-center card-bg' : 'primary-text card-bg full-width flex-center rounded-lg'}
                style={{
                  textAlign: 'center',
                  border: option.isSelected ? '3px solid #1890ff' : undefined,
                  cursor: option.disabled ? 'not-allowed' : undefined,
                  overflowWrap: 'break-word',
                  alignItems: 'normal',
                  background: option.disabled ? '#192c3e' : undefined
                }}
                bodyStyle={{ width: '100%', textAlign: 'center' }}
                onClick={() => {
                  if (option.disabled) return;
                  if (index === customValueIdx) return;

                  onSwitchChange(index);
                }}
              >

                <div className='primary-text'
                  style={{
                    fontSize: 24,
                    fontWeight: 'bolder',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {option.title}
                </div>
                <div className='secondary-text full-width'
                  style={{
                    // display: 'flex',
                    alignItems: 'center',
                    fontSize: 14,
                    overflowWrap: 'break-word',
                    width: '100%',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  {option.message}
                </div>
                {option.additionalNode && option.isSelected ?
                  <div className='full-width' onClick={(e) => e.stopPropagation()}>
                    <br />
                    <br />
                    {option.additionalNode()}
                  </div>
                  : <></>}

              </Card>
            </Col>
          })}
        </Row>
        <Typography className='secondary-text' style={{ textAlign: 'center' }}>
          {helperMessage}
        </Typography>
      </div >
    </>
  )
}