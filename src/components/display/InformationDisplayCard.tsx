import { Col, Row, Typography } from 'antd';

const { Text } = Typography;

export function InformationDisplayCard({
  title,
  subtitle,
  children,
  noPadding,
  span,
  inheritBg,
  noBorder,
  xs,
  sm,
  md,
  style,
  lg,
  xl,
  xxl
}: {
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  children?: React.ReactNode;
  noPadding?: boolean;
  span?: number;
  noBorder?: boolean;
  inheritBg?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  style?: React.CSSProperties;
}) {
  return (
    <Col
      xl={xl ? xl : undefined}
      xxl={xxl ? xxl : undefined}
      xs={xs ? xs : undefined}
      md={md ? md : undefined}
      sm={sm ? sm : undefined}
      lg={lg ? lg : undefined}
      className="overflow-x-auto"
      span={span ? span : undefined}
      style={{
        ...style,
        minHeight: 100,
        padding: noPadding ? 0 : 6
      }}>
      <div
        className="primary-text card-bg rounded-lg"
        style={{
          border: noBorder ? undefined : '1px solid darkgrey',
          background: inheritBg ? 'inherit' : undefined,
          height: '100%',
          padding: 12
        }}>
        {title && (
          <Row className="full-width flex-center" style={{ alignItems: 'normal', textAlign: 'center' }}>
            <Text strong style={{ fontSize: 22 }} className="primary-text full-width">
              {title}
            </Text>
          </Row>
        )}
        {subtitle && (
          <Row className="full-width flex-center" style={{ alignItems: 'normal', textAlign: 'center' }}>
            <Text strong style={{ fontSize: 12 }} className="secondary-text full-width">
              {subtitle}
            </Text>
          </Row>
        )}
        <div className="">{children}</div>
      </div>
    </Col>
  );
}
