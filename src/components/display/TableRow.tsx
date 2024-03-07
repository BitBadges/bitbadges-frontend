import { Col, Row, Typography } from 'antd';
import { ReactNode } from 'react';

const { Text } = Typography;

export function TableRow({
  label,
  value,
  labelSpan,
  valueSpan,
  customClass,
  mobileFormat
}: {
  label: string | ReactNode;
  value: string | ReactNode;
  labelSpan?: number;
  valueSpan?: number;
  customClass?: string;
  mobileFormat?: boolean;
}) {
  return (
    <>
      <Row style={{ alignItems: 'normal' }} className={'full-width ' + customClass}>
        <Col
          xs={mobileFormat ? 0 : 0}
          sm={mobileFormat ? 0 : 0}
          md={mobileFormat ? 0 : labelSpan ? labelSpan : 16}
          lg={mobileFormat ? 0 : labelSpan ? labelSpan : 16}
          style={{ textAlign: 'left', paddingLeft: 10 }}
        >
          <Text style={{ fontSize: 16 }} className="primary-text">
            {label}
          </Text>
        </Col>
        <Col
          xs={mobileFormat ? 0 : 0}
          sm={mobileFormat ? 0 : 0}
          md={mobileFormat ? 0 : valueSpan ? valueSpan : 8}
          lg={mobileFormat ? 0 : valueSpan ? valueSpan : 16}
          style={{ textAlign: 'right', paddingRight: 10 }}
        >
          <Text style={{ fontSize: 16 }} className="primary-text">
            {value}
          </Text>
        </Col>
      </Row>
      <Row style={{ alignItems: 'normal' }} className="full-width">
        <Col
          xs={mobileFormat ? 24 : 24}
          sm={mobileFormat ? 24 : 24}
          md={mobileFormat ? 24 : 0}
          lg={mobileFormat ? 24 : 0}
          style={{ textAlign: 'center' }}
        >
          <Text strong style={{ fontSize: 16 }} className="primary-text">
            {label}
          </Text>
        </Col>
        <Col
          xs={mobileFormat ? 24 : 24}
          sm={mobileFormat ? 24 : 24}
          md={mobileFormat ? 24 : 0}
          lg={mobileFormat ? 24 : 0}
          style={{ textAlign: 'center', marginBottom: 10 }}
        >
          <div className="flex-center">
            <Text style={{ fontSize: 16 }} className="primary-text">
              {value}
            </Text>
          </div>
        </Col>
      </Row>
    </>
  );
}
