import { Col, Row, Typography } from "antd";

const { Text } = Typography;

export function InformationDisplayCard({
  title,
  children,
  span,
  noBorder,
  xs,
  sm,
  md,
  style,
  lg,
  xl,
  xxl,

}: {
  title: string | React.ReactNode
  children?: React.ReactNode
  span?: number,
  noBorder?: boolean
  xs?: number,
  sm?: number,
  md?: number,
  lg?: number,
  xl?: number,
  xxl?: number,
  style?: React.CSSProperties
}) {
  return (
    <Col
      xl={xl ? xl : undefined} xxl={xxl ? xxl : undefined}
      xs={xs ? xs : undefined} md={md ? md : undefined} sm={sm ? sm : undefined} lg={lg ? lg : undefined}
      className="gradient-bg"
      span={span ? span : undefined} style={{
        ...style, padding: 17, minHeight: 100, border: noBorder ? undefined : '1px solid white', borderRadius: 10,


      }}>
      <div className="primary-text">
        <Row className='full-width flex-center' style={{ alignItems: 'normal' }}>
          <Col className='full-width'>
            {title &&
              <Row className='full-width flex-center' style={{ alignItems: 'normal', textAlign: 'center' }}>
                <Text strong style={{ fontSize: 22 }} className="primary-text full-width">
                  {title}
                </Text>
              </Row>}
            {children}
          </Col>
        </Row>
      </div>
    </Col>
  );
}