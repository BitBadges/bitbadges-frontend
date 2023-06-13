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
  return <Row style={{ alignItems: 'center' }}>
    <Col span={labelSpan ? labelSpan : 16} style={{ textAlign: 'left', paddingLeft: 10 }}>
      <Text style={{ fontSize: 16 }}className='primary-text'>
        {label}
      </Text>
    </Col>
    <Col span={valueSpan ? valueSpan : 8} style={{ textAlign: 'right', paddingRight: 10 }}>
      <Text style={{ fontSize: 16 }}className='primary-text'>
        {value}
      </Text>
    </Col>
  </Row>
}