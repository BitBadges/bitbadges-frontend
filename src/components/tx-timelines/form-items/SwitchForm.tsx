import { Card, Col, Row, Typography } from 'antd';
import Meta from 'antd/lib/card/Meta';
import { ReactNode, useState } from 'react';


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
  noSelectUntilClick,
}: {
  onSwitchChange: (selectedIdx: number, newSelectedOptionTitle: string) => void;
  options: SwitchFormOption[];
  helperMessage?: string;
  noSelectUntilClick?: boolean;
}) {
  const [canShowSelected, setCanShowSelected] = useState<boolean>(noSelectUntilClick ? false : true);

  return (
    <>
      <div>
        <Row className='flex-center flex-wrap primary-text'
          style={{
            padding: '0',
            textAlign: 'center',
          }}
        >
          {options.map((option, index) => {
            return <Col md={12} sm={24} xs={24} key={index} className='flex'>
              <Card
                key={index}
                hoverable
                className='primary-text primary-blue-bg full-width flex-center'
                style={{
                  margin: 8,
                  textAlign: 'center',
                  border: option.isSelected && canShowSelected ? '1px solid #1890ff' : undefined,
                  cursor: option.disabled ? 'not-allowed' : undefined
                }}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  onSwitchChange(index, option.title);
                  setCanShowSelected(true);
                }}
              >
                <Meta
                  title={
                    <div className='primary-text'
                      style={{
                        fontSize: 20,
                        fontWeight: 'bolder',
                      }}
                    >
                      {option.title}
                    </div>
                  }
                  description={
                    <div className='secondary-text full-width'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {option.message}
                    </div>
                  }
                />
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