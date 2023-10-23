import { Col, Row, Typography } from "antd";

const { Text } = Typography;

export function InformationDisplayCard({
  title,
  subtitle,
  children,
  span,
  inheritBg,
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
  subtitle?: string | React.ReactNode
  children?: React.ReactNode
  span?: number,
  noBorder?: boolean
  inheritBg?: boolean,
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
      className="gradient-bg bg-slate-50 border-0 dark:bg-blue-black"
      span={span ? span : undefined} style={{
        ...style, minHeight: 100,
        padding: 6

      }}>
      <div className="primary-text gradient-bg " style={{
        border: noBorder ? undefined : '1px solid darkgrey',
        background: inheritBg ? 'inherit' : undefined,
        borderRadius: 10, padding: 17, height: '100%'
      }}>
        <Row className='full-width flex-center' style={{ alignItems: 'normal' }}>
          <Col className='full-width'>
            {title &&
              <Row className='full-width flex-center' style={{ alignItems: 'normal', textAlign: 'center' }}>
                <Text strong style={{ fontSize: 22 }} className="primary-text full-width">
                  {title}
                </Text>
              </Row>}
            {subtitle &&
              <Row className='full-width flex-center' style={{ alignItems: 'normal', textAlign: 'center' }}>
                <Text strong style={{ fontSize: 12 }} className="secondary-text full-width">
                  {subtitle}
                </Text>
              </Row>}

            {children}
          </Col>
        </Row>
      </div>
    </Col>
  );
}