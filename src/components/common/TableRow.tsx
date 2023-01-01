import { Col, Row, Typography } from "antd"
import { ReactNode } from "react"
import { PRIMARY_TEXT } from "../../constants";

const { Text } = Typography;

export function TableRow({
    label, value, labelSpan, valueSpan
}: {
    label: string | ReactNode,
    value: string | ReactNode
    labelSpan?: number,
    valueSpan?: number
}) {
    return <Row>
        <Col span={labelSpan ? labelSpan : 16} style={{ textAlign: 'left', paddingLeft: 10 }}>
            <Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>
                {label}
            </Text>
        </Col>
        <Col span={valueSpan ? valueSpan : 8} style={{ textAlign: 'right', paddingRight: 10 }}>
            <Text style={{ fontSize: 16, color: PRIMARY_TEXT }}>
                {value}
            </Text>
        </Col>
    </Row>
}