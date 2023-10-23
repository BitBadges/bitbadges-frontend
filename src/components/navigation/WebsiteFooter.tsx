import { Col, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { FooterButtonDisplay } from '../button-displays/FooterButtonDisplay';

export function WalletFooter() {
  return (
    <>
      <Content
        className='primary-blue-bg full-width mt-9'
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 2rem',
          minHeight: '20vh',
        }}
      >

        <footer id="footer" className="dark full-width pt-12" >
          <div className="footer-wrap">
            <Row className='flex-center' style={{ width: '100%', alignItems: 'normal'}}>
              <FooterButtonDisplay />
            </Row>

            <Row className='flex text-center justify-center'>
              <a target="_blank " href="https://bitbadges.org" className='text-gray-500 m-3 hover:text-vivid-pink'>
                        Company Site
              </a>
              <a target="_blank " href="https://docs.bitbadges.io/overview" className='text-gray-500 hover:text-vivid-pink m-3'>
                  Documentation
              </a>
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf" className='m-3 text-gray-500 hover:text-vivid-pink'>
                  Terms of Service
              </a>
              <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf" className='text-gray-500 m-3 hover:text-vivid-pink'>
                  Privacy Policy
              </a>
              {/* <Col md={6} sm={24} xs={24}>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }}>
                  <h4 className='primary-text text-xl'>Links</h4>
                  <div className='mt-5'>
                    <a target="_blank " href="https://bitbadges.org" className='text-vivid-pink'>
                      Company Site
                    </a>
                  </div>
                  <div>
                    <a target="_blank " href="https://docs.bitbadges.io/overview" className='text-vivid-pink'>
                      Documentation
                    </a>
                  </div>

                </div>
                <br />
              </Col>
              <Col md={6} sm={24} xs={24}>
                <div className="footer-center primary-text" style={{ textAlign: 'center' }} >
                  <h4 className='primary-text text-xl'>Policies</h4>
                  <div className='mt-5'>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Terms%20of%20Service.pdf">
                      Terms of Service
                    </a>
                  </div>
                  <div>
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/BitBadges/bitbadges.org/raw/main/policies/Privacy%20Policy.pdf">
                      Privacy Policy
                    </a>
                  </div>
                </div>
                <br />
              </Col> */}
            </Row>
          </div>
          <div className="bottom-bar">

          </div>
        </footer>
      </Content>
    </>
  );
}
