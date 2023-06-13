import { Col, Row, Typography } from "antd";

const { Text } = Typography;

export function InformationDisplayCard({
  title,
  children,
  span,
  noBorder
}: {
  title: string | React.ReactNode
  children?: React.ReactNode
  span?: number,
  noBorder?: boolean
}) {
  return (
    <Col span={span ? span : 24} style={{ padding: 8, minHeight: 100, border: noBorder ? undefined : '1px solid white', borderRadius: 10 }}>
      <div className="primary-text">
        <Row className='full-width flex-center'>
          <Col className='full-width'>
            <Row className='full-width flex-center'>
              <Text strong style={{ fontSize: 22 }} className="primary-text">
                {title}
              </Text>
            </Row>
            {children}
          </Col>
        </Row>
      </div>
    </Col>
  );
}