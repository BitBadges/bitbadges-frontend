import { Col, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';

export function WalletFooter() {
  return (
    <>
      <Content
        className='primary-blue-bg full-width'
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 5rem',
          minHeight: '20vh',
          paddingTop: '100px',
        }}
      >

        <footer id="footer" className="dark full-width">
          <div className="footer-wrap">
            <Row className='flex-center' style={{ width: '100%' }}>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }}>
                  <h4 className='primary-text'>Links</h4>
                  <div>
                    <a target="_blank " href="https://docs.bitbadges.io/overview">
                      Documentation
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <h4 className='primary-text'>Socials</h4>
                  <div>
                    <a target="_blank " href="http://ant.design">
                      Discord
                    </a>
                  </div>

                </div>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <div>
                    <a target="_blank" rel="noreferrer" href="">
                      Twitter
                    </a>
                  </div>
                </div>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/bitbadges">
                      GitHub
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <h4 className='primary-text'>Policies</h4>
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf">
                      Terms of Service
                    </a>
                  </div>
                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>

                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <h4 className='primary-text'>Other</h4>
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
