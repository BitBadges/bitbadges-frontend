import { AuditOutlined, BarcodeOutlined, ClockCircleOutlined, CloudServerOutlined, ClusterOutlined, ContactsOutlined, ControlOutlined, DatabaseOutlined, DeploymentUnitOutlined, DownOutlined, FieldTimeOutlined, FileProtectOutlined, GlobalOutlined, IdcardOutlined, LikeOutlined, LockOutlined, QrcodeOutlined, SafetyOutlined, SendOutlined, TeamOutlined, UpOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Divider, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from '../components/badges/BadgeAvatar';
import { ToolIcon, tools } from '../components/display/ToolIcon';
import { COSMOS_LOGO, ETH_LOGO } from '../constants';


export const LandingCard = ({ content, additionalContent, onClick }: {
  content: JSX.Element,
  additionalContent?: JSX.Element,
  onClick?: () => void
}) => {

  const [showMore, setShowMore] = useState<boolean>(false);

  return <Col lg={6} md={24} sm={24} xs={24} style={{
    padding: 6, display: 'flex',
  }}>
    <div style={{ display: 'flex' }}>

      <Card hoverable={!!additionalContent} className='primary-blue-bg primary-text'
        style={{
          // height: showMore ? undefined : additionalContent ? 360 : 179,
          borderRadius: 15,
          background: `linear-gradient(0deg, black 10%, #001529 100%)`,
        }} onClick={() => {
          if (onClick) onClick();
          else if (additionalContent) setShowMore(!showMore)
        }}>
        <div className='landing-card' >
          {content}
          {additionalContent && showMore && additionalContent}
          {additionalContent && <>
            <br />
            <br />
            {/* {/* <Button className='styled-button' onClick={() => setShowMore(!showMore)}>{showMore ? 'Show Less' : 'Show More'}</Button> */}

            {!showMore ? <DownOutlined /> : <UpOutlined />}</>}
        </div>
      </Card >
    </div>

  </Col >
}



const Home: NextPage = () => {
  const router = useRouter();
  const collections = useCollectionsContext();

  const featuredBadges = [
    {
      collectionId: 1n,
      badgeId: 1n,
    },
    {
      collectionId: 1n,
      badgeId: 2n,
    },
    {
      collectionId: 1n,
      badgeId: 3n,
    },
    {
      collectionId: 1n,
      badgeId: 4n,
    },
    {
      collectionId: 1n,
      badgeId: 5n,
    },
    {
      collectionId: 1n,
      badgeId: 6n,
    },
    {
      collectionId: 1n,
      badgeId: 7n,
    },
    {
      collectionId: 1n,
      badgeId: 8n,
    },
    {
      collectionId: 1n,
      badgeId: 9n,
    },
    {
      collectionId: 1n,
      badgeId: 10n,
    }
  ];

  useEffect(() => {
    // collections.batchFetchAndUpdateMetadata(featuredBadges.map(b => {
    //   return {
    //     collectionId: b.collectionId,
    //     metadataToFetch: {
    //       badgeIds: [{ start: b.badgeId, end: b.badgeId }]
    //     }
    //   }
    // }));
    collections.batchFetchAndUpdateMetadata([{
      collectionId: 1n,
      metadataToFetch: {
        badgeIds: [{ start: 1n, end: 10n }]
      }
    }


    ]);
  }, []);

  // const claimCollection = collections.getCollection(2n);

  return (
    <>
      <div className='gradient-bg landing-padding'      >
        <Row className='flex-around' style={{ textAlign: 'start', flexWrap: 'wrap', alignItems: 'normal' }}>
          <Col md={14} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '10vh' }}>
            <span className='primary-text collect-title' style={{


            }}>Collect {' '}

              <img src='/images/bitbadgeslogotext.png' alt='BitBadges Logo' className='inline-logo primary-pink' />
              <img src='/images/bitbadgeslogo.png' alt='BitBadges Logo' className='inline-logo primary-pink' />{' '} to build your digital identity!</span>
            <br />
            <br />
            <p className='secondary-text' style={{ fontSize: 14 }}>This is a beta version of BitBadges which is completely subsidized for users. Badges and profiles can optionally be migrated to mainnet once launched. $BADGE will be redistributed  via an airdrop based on betanet contributions.</p>
            <div className='flex flex-wrap full-width'>
              <Button
                size='large'
                className='landing-button'
                style={{ margin: 10, marginLeft: 0, }}
                onClick={() => {
                  router.push('/browse');
                }}
              >
                Explore
              </Button>
              <Button
                size='large'
                className='landing-button'
                style={{ margin: 10, marginLeft: 0 }}
                onClick={() => {
                  router.push('/collections/mint');
                }}
                target='_blank'
              >
                Mint
              </Button>
              <Button
                size='large'
                className='landing-button'
                style={{ margin: 10, marginLeft: 0 }}
                onClick={() => {
                  window.open('https://docs.bitbadges.io/overview', '_blank');
                }}
                target='_blank'
              >
                Learn More
              </Button>
              <Button
                size='large'
                className='landing-button'
                style={{ margin: 10, marginLeft: 0 }}
                onClick={() => {
                  window.open('https://discord.com/invite/TJMaEd9bar', '_blank');
                }}
                target='_blank'
              >
                Feedback?
              </Button>
            </div>
            <Divider />
            {/* <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
              {status.status.nextCollectionId.toString()} Badges Created!
            </Typography.Text> */}


          </Col>
          <Col md={10} sm={24} xs={24} style={{ alignItems: "normal", height: '100%', marginTop: '10vh' }} >
            {/* <div style={{ maxWidth: 400, justifyContent: 'center' }}>
                  <img src="/images/bitbadgeslogo.png" alt="BitBadges Logo" className='landing-logo' />
                </div> */}
            <div style={{ paddingRight: 4, paddingLeft: 4, alignItems: 'normal' }} className='flex-center full-width' >

              <div className='flex-center flex-wrap full-width primary-text '>
                {
                  [...featuredBadges, ...featuredBadges].map((badge, idx) => {
                    const { collectionId, badgeId } = badge;
                    return <div key={idx} className='flex-between flex-wrap' style={{ margin: 2, flexWrap: 'wrap' }}>

                      <BadgeAvatar
                        size={75}
                        // size={size && selectedId === badgeId ? size * 1.5 : size}
                        collectionId={collectionId}
                        badgeId={badgeId}
                        showId={false}
                        showSupplys={false}
                      />

                    </div>
                  })
                }
              </div>
            </div>
          </Col>
        </Row>

        <Divider />
        <Divider />
        <Row className='flex-around' style={{ textAlign: 'center', flexWrap: 'wrap', alignItems: 'normal' }}>
          <Col md={24} sm={24} xs={24} style={{ alignItems: "center", height: '100%' }}>
            <Row className='flex-between flex-wrap' style={{ alignItems: 'normal' }}>


              <LandingCard
                content={<>

                  <BarcodeOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  >

                  </BarcodeOutlined>

                  <SafetyOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />
                  <IdcardOutlined className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                    What are badges?
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    Badges are digital assets that can be used to represent anything, such as achievements, memberships, and more.
                    Collecting badges and expanding your portfolio is a great way to build your digital identity.
                  </Typography.Text>

                </>
                }
              />
              <LandingCard
                content={<>

                  <img src="/images/bitbadgeslogo.png" alt="BitBadges Logo" className='' height={54} />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                    What is BitBadges?
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    BitBadges is the <b>all-in-one</b> platform for creating, collecting, managing, and displaying these badges.

                  </Typography.Text>
                </>
                }
              />
              <LandingCard

                content={<>
                  <SendOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />

                  <QrcodeOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />
                  <LockOutlined className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />

                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                    How to collect badges?
                  </Typography.Text>
                  <br /> <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    Badges can be collected in a variety of ways, such as scanning a QR code, entering a password, or being airdropped one.
                    The collection creator decides how badges are distributed.
                  </Typography.Text>
                </>
                }
              />



              <LandingCard
                content={<>
                  <CloudServerOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />

                  <AuditOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />
                  <DeploymentUnitOutlined className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }} />

                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                    How is ownership verified?
                  </Typography.Text>
                  <br /> <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    BitBadges uses a public, decentralized blockchain to store badges, meaning no one can censor, forge, or fake ownership of badges,
                    and anyone can verify the authenticity of a badge at any time.
                  </Typography.Text>
                </>
                }
              />

            </Row>

          </Col>
        </Row>




        {/* <Row className='flex-center'>
          <Col md={11} sm={24} xs={24} style={{ alignItems: "normal", height: '100%' }} >



            <div className="container" style={{ marginTop: 12, }}>
              <iframe
                className='responsive-iframe'
                // width={'60%'}
                // height={209 * 1.2}
                src="https://www.youtube.com/embed/vgL1BR4PZNU"
                title="Create a Badge in 45 Seconds w/ BitBadges"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </Col>
          <Col md={1} xs={0} sm={0} style={{ alignItems: "normal", height: '100%' }} >
          </Col>
          <Col md={11} sm={24} xs={24} style={{ alignItems: "normal", height: '100%' }} >

            <div className="container" style={{ marginTop: 12, }}>
              <iframe
                className='responsive-iframe'
                // width={'60%'}
                // height={209 * 1.2}
                src="https://www.youtube.com/embed/vgL1BR4PZNU"
                title="Create a Badge in 45 Seconds w/ BitBadges"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </Col>
        </Row > */}
        <br />
      </div >
      <div className='black-bg landing-padding' style={{ textAlign: 'center' }}>
        <Row className='flex-around' style={{ textAlign: 'start', flexWrap: 'wrap', alignItems: 'normal' }}>
          <Col md={12} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '30px' }} className='flex-center flex-column'>
            <div className="container" style={{ marginTop: 12, }}>
              <iframe
                className='responsive-iframe'
                // width={'60%'}
                // height={209 * 1.2}
                src="https://www.youtube.com/embed/vgL1BR4PZNU"
                title="Create a Badge in 45 Seconds w/ BitBadges"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </Col>
          <Col md={12} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '30px' }} className='flex-center flex-column'>

            <div className="container" style={{ marginTop: 12, }}>
              <iframe
                className='responsive-iframe'
                // width={'60%'}
                // height={209 * 1.2}
                src="https://www.youtube.com/embed/vgL1BR4PZNU"
                title="Create a Badge in 45 Seconds w/ BitBadges"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

          </Col>
        </Row>
      </div>
      <div className='black-bg landing-padding' style={{ textAlign: 'center' }}>
        <br />
        <br />

        <div className='flex flex-wrap'>
          <>
            <LandingCard
              content={
                <>
                  <div className='flex-center' style={{ alignItems: 'center' }}>
                    <Avatar
                      src={ETH_LOGO}
                      size={48}
                      style={{ marginRight: 8 }}

                    />

                    <Avatar
                      src={COSMOS_LOGO}
                      size={48}
                      style={{ marginRight: 8 }}
                    />
                  </div>
                  <br />

                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Multi-Chain
                  </Typography.Text>


                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    The same badge can be owned by users from different blockchain ecosystems. We currently support Ethereum  <Avatar
                      src={ETH_LOGO}
                      size={25}
                    /> and Cosmos <Avatar
                      src={COSMOS_LOGO}
                      size={25}
                    /> users.
                  </Typography.Text></>
              }
            />
            <LandingCard
              content={
                <><ClusterOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Scalable
                  </Typography.Text>
                  <br /> <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges utilizes a scalable architecture that can eventually support millions of users and badges.
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={
                <>
                  <DatabaseOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Balances Storage Options
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges supports multiple storage methods for balances, including storing balances off-chain for enhanced user experience and scalability.
                    Learn more about this <a href='https://docs.bitbadges.io/overview/concepts/balances-types' target='_blank'>here</a>.

                  </Typography.Text>
                </>
              }
            />
            <LandingCard
              content={
                <>
                  <FieldTimeOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Time-Dependent Ownership
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Natively, BitBadges does its accounting in a way that supports time-dependent ownership for balances (e.g. Bob owns x1 from January to March).
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={
                <><ControlOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Customizable Transferability
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Instead of badges being simply transferable or non-transferable, BitBadges supports a wide range of transferability options that can be clearly displayed to users.
                  </Typography.Text>
                </>
              }
            />
            <LandingCard
              content={
                <><FileProtectOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Smart Contracts Not Needed
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges reuses the same interface for badges as opposed to individual smart contracts. This results in increased transparency, scalability, maintainability, consistency, and security.
                  </Typography.Text>
                </>
              }
            />
            <LandingCard
              content={<>
                <TeamOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                <br />
                <br />
                <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                  Address Lists
                </Typography.Text>
                <br />
                <br />
                <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                  Create address lists to easily manage and organize users. These lists can be used for a variety of purposes, such as whitelists, blacklists, and more.
                </Typography.Text>
              </>
              }
            />





            <LandingCard
              content={
                <>
                  <ContactsOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Incoming / Outgoing Approvals
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Approve users to transfer on your behalf (outgoing) or restrict who can transfer to you (incoming).
                  </Typography.Text>
                </>
              }
            />
          </>
          <>
            <LandingCard
              content={
                <><LikeOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Reviews
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Leave reviews on users and collections to help others identify trustworthy users and collections.
                  </Typography.Text>
                </>
              }
            />
            <br />

            <LandingCard
              content={
                <><SendOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Batch Transfers
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Batch transfers can be done in a single, efficient transaction (e.g. transfer x1 of badge IDs 1-60000).
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={
                <><ClockCircleOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Time-Based Details
                  </Typography.Text>
                  <br /><br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Certain collection details (such as metadata) are timeline-based, meaning they can be scheduled to have different values at different times.
                  </Typography.Text>
                </>
              }
            />
            <LandingCard
              content={
                <><GlobalOutlined
                  className='figma-blue'
                  style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Announcements
                  </Typography.Text>
                  <br /><br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Send announcements to all owners in a collection, enabling you to easily communicate with your badge holders.
                  </Typography.Text>
                </>
              }
            />








          </>
        </div>


        <br />
        <br />

        <Typography.Text strong className='secondary-text' style={{ fontSize: 16, textAlign: 'center' }}>
          {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
          Learn more about all offered features <a href='https://docs.bitbadges.io/overview' target='_blank' rel="noreferrer">here</a>.
        </Typography.Text>

        <br />
        <br />
        {/* <Row className='flex-center' style={{ alignItems: 'normal' }}>
            <br />
            <br />
            <Col md={24} sm={24} xs={24} >
              <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                And many more!

              </Typography.Text>
            </Col>
          </Row> */}


        <Divider />

        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24} style={{ textAlign: 'center' }}>
            <Typography.Text strong className='primary-text' style={{ fontSize: 32 }}>
              Ecosystem
            </Typography.Text>
          </Col>
        </Row>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {tools.map((tool, idx) => {
            if (tool.toolType !== "Verification") return <></>

            return <div style={{ margin: 8, display: 'flex' }} key={idx}>
              <ToolIcon
                name={tool.name}
              />
            </div>
          })}
        </div>


        {/* <Divider />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className='primary-text' style={{ fontSize: 32 }}>
              Distribution Methods
            </Typography.Text>
          </Col>
        </Row>

        <Row className='flex-center' style={{ alignItems: 'normal' }}>
          <Col md={22} sm={22} xs={22}>
            <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
              Badges can be transferred directly or claimed by users via whitelists, unique codes, and passwords. This makes them compatible with many of your favorite tools and services!
            </Typography.Text>
          </Col>
        </Row>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {tools.map((tool, idx) => {
            if (tool.toolType !== "Distribution") return <></>

            return <div style={{ margin: 8, display: 'flex' }} key={idx}>
              <ToolIcon
                name={tool.name}
              />
            </div>
          })}
        </div>

        <Row className='flex-between' style={{ alignItems: 'normal' }}>
          <Col md={24} sm={24} xs={24}>
            <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
              And many more!
            </Typography.Text>
          </Col>
        </Row>

        <Divider />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className='primary-text' style={{ fontSize: 32 }}>
              Verification Tools
            </Typography.Text>
          </Col>
        </Row>

        <Row className='flex-center' style={{ alignItems: 'normal' }}>
          <Col md={22} sm={22} xs={22}>
            <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
              Use the tools below to help you authenticate your users and verify their ownership (or non-ownership) of badges!
            </Typography.Text>
          </Col>
        </Row>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {tools.map((tool, idx) => {
            if (tool.toolType !== "Verification") return <></>

            return <div style={{ margin: 8, display: 'flex' }} key={idx}>
              <ToolIcon
                name={tool.name}
              />
            </div>
          })}
        </div> */}
      </div>
    </>
  )
}

export default Home
