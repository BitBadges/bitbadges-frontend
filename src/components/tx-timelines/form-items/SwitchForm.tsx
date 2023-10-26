import { Card, Col, Row, Typography } from 'antd';
import { ReactNode } from 'react';


interface SwitchFormOption {
  title: string;
  message: string | ReactNode;
  isSelected: boolean;
  disabled?: boolean;
  additionalNode?: ReactNode;
}

export function SwitchForm({
  onSwitchChange,
  options,
  helperMessage,
  showCustomOption,
  fullWidthCards
}: {
  onSwitchChange: (selectedIdx: number, newSelectedOptionTitle: string) => void;
  options: (SwitchFormOption | undefined)[];
  helperMessage?: string;
  showCustomOption?: boolean;
  fullWidthCards?: boolean;
}) {
  const filteredOptions = options.filter(x => x) as SwitchFormOption[];
  if (showCustomOption && filteredOptions.every(x => !x.isSelected)) {
    filteredOptions.push({
      title: 'Custom',
      message: 'A custom value has been set that does not match any of the other options.',
      isSelected: true,
    })
  }

  return (
    <>
      <div>
        <Row className='flex-center flex-wrap dark:text-white'
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
                className={option.disabled ? 'dark:text-white tertiary-blue-bg full-width flex-center' : 'dark:text-white inherit-bg full-width flex-center'}
                style={{
                  textAlign: 'center',
                  border: option.isSelected ? '3px solid #1890ff' : undefined,
                  cursor: option.disabled ? 'not-allowed' : undefined,
                  overflowWrap: 'break-word',
                  alignItems: 'normal',
                  background: option.disabled ? '#192c3e' : `linear-gradient(0deg, black 10%, #001529 100%)`,
                }}
                bodyStyle={{ width: '100%', textAlign: 'center' }}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  // setCurrentSelected([index]);
                  onSwitchChange(index, option.title);
                }}
              >
                <div className='dark:text-white'
                  style={{
                    fontSize: 24,
                    fontWeight: 'bolder',
                    overflowWrap: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {option.title}
                </div>
                <div className='text-gray-400 full-width'
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
                    {option.additionalNode}
                  </div>
                  : <></>}

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