import { Col, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
export function WalletFooter() {
  return (
    <>
      <Content
        style={{
          backgroundColor: PRIMARY_BLUE,
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 5rem',
          minHeight: '20vh',
          paddingTop: '100px',
        }}
      >

        <footer id="footer" className="dark" style={{ width: '100%' }}>
          <div className="footer-wrap">
            <Row style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>
                  <h4 style={{ color: PRIMARY_TEXT }}>Links</h4>
                  <div>
                    <a target="_blank " href="https://docs.bitbadges.io/overview">
                      Documentation
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                  <h4 style={{ color: PRIMARY_TEXT }}>Socials</h4>
                  <div>
                    <a target="_blank " href="http://ant.design">
                      Discord
                    </a>
                  </div>

                </div>
                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                  <div>
                    <a target="_blank" rel="noreferrer" href="">
                      Twitter
                    </a>
                  </div>
                </div>
                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/bitbadges">
                      GitHub
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                  <h4 style={{ color: PRIMARY_TEXT }}>Policies</h4>
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf">
                      Terms of Service
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>

                <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                  <h4 style={{ color: PRIMARY_TEXT }}>Other</h4>
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf">
                      Privacy Policy
                    </a>
                  </div>

                </div>
              </Col>
            </Row>
          </div>
          <div className="bottom-bar">

          </div>
        </footer>
      </Content>
    </>
  );
}
