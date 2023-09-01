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
}: {
  onSwitchChange: (selectedIdx: number, newSelectedOptionTitle: string) => void;
  options: SwitchFormOption[];
  helperMessage?: string;
}) {

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
                  border: option.isSelected ? '1px solid #1890ff' : undefined,
                  cursor: option.disabled ? 'not-allowed' : undefined,
                  overflowWrap: 'break-word',
                }}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  onSwitchChange(index, option.title);
                  // setCanShowSelected(true);
                }}
              >
                <Meta
                  title={
                    <div className='primary-text'
                      style={{
                        fontSize: 20,
                        fontWeight: 'bolder',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
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