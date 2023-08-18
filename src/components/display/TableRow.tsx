import { Col, Row, Typography } from "antd";
import { ReactNode } from "react";


const { Text } = Typography;

export function TableRow({
  label, value, labelSpan, valueSpan
}: {
  label: string | ReactNode,
  value: string | ReactNode
  labelSpan?: number,
  valueSpan?: number
}) {
  //media query if > 450 px
  // let isMobile = false;
  // if (typeof window !== 'undefined') {
  //   isMobile = window.innerWidth < 450;
  // }

  return <><Row style={{ alignItems: 'normal' }} className="full-width">
    <Col xs={0} sm={0} md={labelSpan ? labelSpan : 16} lg={labelSpan ? labelSpan : 16} style={{ textAlign: 'left', paddingLeft: 10 }}>
      <Text style={{ fontSize: 16 }} className='primary-text'>
        {label}
      </Text>
    </Col>
    <Col xs={0} sm={0} md={valueSpan ? valueSpan : 8} lg={valueSpan ? valueSpan : 16} style={{ textAlign: 'right', paddingRight: 10 }}>
      <Text style={{ fontSize: 16 }} className='primary-text'>
        {value}
      </Text>
    </Col>
  </Row>
    <Row style={{ alignItems: 'normal' }} className="full-width">
      <Col xs={24} sm={24} md={0} lg={0} style={{ textAlign: 'center' }}>
        <Text strong style={{ fontSize: 16 }} className='primary-text'>
          {label}
        </Text>
      </Col>
      <Col xs={24} sm={24} md={0} lg={0} style={{ textAlign: 'center', marginBottom: 10 }} >
        <div className="flex-center">
          <Text style={{ fontSize: 16 }} className='primary-text'>
            {value}
          </Text>
        </div>
      </Col>
    </Row>
  </>
}