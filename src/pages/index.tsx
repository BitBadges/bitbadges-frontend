import { Button, Col, Divider, Layout, Row, Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { NextPage } from 'next/types';
// import LiteYouTubeEmbed from 'react-lite-youtube-embed';
// import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
import Image from 'next/image';
import { useRouter } from 'next/router';


const Home: NextPage = () => {
  const router = useRouter();
  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        <div className='primary-blue-bg'
          style={{
            marginLeft: '10vw',
            marginRight: '10vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
            minHeight: '80vh'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', minHeight: '100%' }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
              <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height="300px" width="300px" quality={100} />
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 24 }}>BitBadges</Typography.Text> */}
              <Typography.Text strong className='secondary-text' style={{ fontSize: 18 }}>Issue digital, verifiable badges on the blockchain!</Typography.Text>
              <div className='flex'>
                <Button
                  className='screen-button'
                  style={{ marginTop: '20px' }}
                  onClick={() => {
                    router.push('/browse');
                  }}
                >
                  Explore
                </Button>
                <Button
                  className='screen-button'
                  style={{ marginTop: '20px', marginLeft: 8 }}
                  href="https://docs.bitbadges.io/overview"
                  target='_blank'
                >
                  Learn More
                </Button>
              </div>
              <Divider />
              <Divider />
              {/* <div className='flex-center'> */}

              {/* </div> */}

            </div>

          </div>
          <Row className='flex-center'>
            <Col md={12} sm={24} xs={24}>
              {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> */}
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 24 }}>Team</Typography.Text> */}
              <br />
              <div className="container">
                <iframe
                  className='responsive-iframe'
                  // width={'100%'}
                  // height={249 * 1.2}
                  src="https://www.youtube.com/embed/vgL1BR4PZNU"
                  title="Create a Badge in 45 Seconds w/ BitBadges"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* </div> */}
            </Col>
          </Row>
        </div>


        <Divider />

      </Content >
    </Layout >
  )
}

export default Home
