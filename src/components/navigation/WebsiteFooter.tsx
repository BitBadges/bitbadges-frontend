import { Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { useRouter } from 'next/router';
import { FooterButtonDisplay } from '../button-displays/FooterButtonDisplay';

export function WalletFooter() {
  const router = useRouter();


  
  return (
    <>
      <Content
        className="bg-black full-width mt-9"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 2rem',
          minHeight: '20vh'
        }}
      >
        <footer id="footer" className="full-width pt-12">
          <div className="footer-wrap">
            <Row className="flex-center" style={{ width: '100%', alignItems: 'normal' }}>
              <FooterButtonDisplay />
            </Row>

            <Row className="flex text-center justify-center">
              <a target="_blank " onClick={async () => await router.push('/about')} className="text-gray-500 m-3 hover:text-vivid-blue">
                About
              </a>
              <a target="_blank " href="https://docs.bitbadges.io/overview" className="text-gray-500 hover:text-vivid-blue m-3">
                Documentation
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/BitBadges/bitbadges-frontend/raw/main/public/Terms%20of%20Service.pdf"
                className="m-3 text-gray-500 hover:text-vivid-blue"
              >
                Terms of Service
              </a>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/BitBadges/bitbadges-frontend/raw/main/public/Privacy%20Policy.pdf"
                className="text-gray-500 m-3 hover:text-vivid-blue"
              >
                Privacy Policy
              </a>
            </Row>
            <br />
            <Row className="text-gray-500 flex text-center justify-center">
              <div className="">
                {`None of what is being said or presented on this website is investment or financial advice. BitBadges is a utility, not a financial asset or instrument. Information provided on this website is "as-is".`}
              </div>
            </Row>
            <Row className="text-gray-500 flex text-center justify-center my-1">
              <br />
              <br />
              <div>© Copyright 2024 BITBADGES, INC. All Rights Reserved.</div>
            </Row>
          </div>
        </footer>
      </Content>
    </>
  );
}
