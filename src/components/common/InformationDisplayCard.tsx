import { Col, Divider, Row, Typography } from "antd";
import { PRIMARY_TEXT } from "../../constants";

const { Text } = Typography;


export function InformationDisplayCard({
    title,
    children,
    span
}: {
    title: string | React.ReactNode
    children?: React.ReactNode
    span?: number
}) {
    return (
        <Col span={span ? span : 24} style={{ minHeight: 100, border: '1px solid white', borderRadius: 10 }}>
            <div
                style={{
                    color: PRIMARY_TEXT,
                }}>
                <Row style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Col style={{ width: '100%' }}>
                        {/* <Col span={11}> */}
                        <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                                {title}
                            </Text>
                        </Row>
                        <Divider style={{ margin: "0px 0px", color: 'gray', background: 'gray' }}></Divider>
                        {children}
                    </Col>
                </Row>
            </div>
        </Col>
    );
}