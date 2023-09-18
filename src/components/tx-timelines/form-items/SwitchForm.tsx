import { Card, Col, Row, Typography } from 'antd';
import { ReactNode } from 'react';


interface SwitchFormOption {
  title: string;
  message: string | ReactNode;
  isSelected: boolean;
  disabled?: boolean;
}

export function SwitchForm({
  onSwitchChange,
  options,
  helperMessage,
  showCustomOption,
}: {
  onSwitchChange: (selectedIdx: number, newSelectedOptionTitle: string) => void;
  options: SwitchFormOption[];
  helperMessage?: string;
  showCustomOption?: boolean;
}) {
  if (showCustomOption && options.every(x => !x.isSelected)) {
    options.push({
      title: 'Custom',
      message: 'A custom value has been set that does not match any of the other options.',
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
          {options.map((option, index) => {
            return <Col md={12} sm={24} xs={24} key={index} className='flex'>
              <Card
                key={index}
                hoverable
                className={option.disabled ? 'primary-text tertiary-blue-bg full-width flex-center' : 'primary-text primary-blue-bg full-width flex-center'}
                style={{
                  margin: 8,
                  textAlign: 'center',
                  border: option.isSelected ? '3px solid #1890ff' : undefined,
                  cursor: option.disabled ? 'not-allowed' : undefined,
                  overflowWrap: 'break-word',
                }}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  // setCurrentSelected([index]);
                  onSwitchChange(index, option.title);
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
                <div className='secondary-text'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 14,
                    overflowWrap: 'break-word',
                    width: '100%',
                    marginTop: 8
                  }}
                >
                  {option.message}
                </div>
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