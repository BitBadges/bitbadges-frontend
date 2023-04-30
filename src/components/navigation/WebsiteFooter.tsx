import { Content } from 'antd/lib/layout/layout';
import { Row, Col } from 'antd';
import React from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
export function WalletFooter() {
    return (
        <Content
            style={{
                backgroundColor: PRIMARY_BLUE,
                // borderTop: '1px solid black',
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 5rem',
                minHeight: '20vh',
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
                                {/* <div>
                                        <a target="_blank " href="https://github.com/ant-motion">
                                            app.footer.template
                                        </a>
                                    </div>
                                    <div>
                                        <a href="http://ant-design-landing.gitee.io/" target="_blank ">
                                            app.footer.chinamirror
                                        </a>
                                    </div> */}
                            </div>
                            <br/>
                        </Col>
                        <Col md={6} sm={24} xs={24}>
                            <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                                {/* <h4 style={{ color: PRIMARY_TEXT }}>app.footer.links</h4> */}
                                <h4 style={{ color: PRIMARY_TEXT }}>Socials</h4>
                                <div>
                                    <a target="_blank " href="http://ant.design">
                                        Discord
                                    </a>
                                </div>

                            </div>
                            <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                                {/* <h4 style={{ color: PRIMARY_TEXT }}>app.footer.community</h4> */}
                                
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
                            <br/>
                        </Col>
                        <Col md={6} sm={24} xs={24}>
                            <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                              <h4 style={{ color: PRIMARY_TEXT }}>Policies</h4>
                                <div>
                                    <a target="_blank" rel="noopener noreferrer" href="https://bitbadges.io/policies/termsofservice">
                                        Terms of Service
                                    </a>
                                </div>
                            </div>
                            <br/>
                        </Col>
                        <Col md={6} sm={24} xs={24}>

                            <div className="footer-center" style={{ color: PRIMARY_TEXT, textAlign: 'center' }} >
                              <h4 style={{ color: PRIMARY_TEXT }}>Other</h4>
                                <div>
                                    <a target="_blank" rel="noopener noreferrer" href="https://bitbadges.io/policies/privacy">
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
            {/* <Row justify="space-around" style={{ width: '100%' }}>
                <Col>
                    <Button
                        style={{
                            minWidth: '20vw',
                            fontWeight: 'bolder',
                            margin: '1rem',
                        }}
                        type="primary"
                        href="https://bitbadges.github.io/"
                        target="_blank"
                    >
                        Docs
                    </Button>
                </Col>
                <Col>
                    <Button
                        style={{
                            minWidth: '20vw',
                            fontWeight: 'bolder',
                            margin: '1rem',
                        }}
                        type="primary"
                        href="https://decentralizeduniversity.org/"
                        target="_blank"
                    >
                        Decentralized University
                    </Button>
                </Col>
                <Col>
                    <Button
                        style={{
                            minWidth: '20vw',
                            fontWeight: 'bolder',
                            margin: '1rem',
                        }}
                        type="primary"
                        href="https://github.com/BitBadges"
                        target={'_blank'}
                    >
                        GitHub
                    </Button>
                </Col>
            </Row> */}
        </Content>
    );
}
