import { ClusterOutlined, ControlOutlined, DatabaseOutlined, DeploymentUnitOutlined, DownOutlined, FieldTimeOutlined, FileProtectOutlined, QrcodeOutlined, UpOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Divider, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';
import { batchFetchAndUpdateMetadata } from '../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from '../components/badges/BadgeAvatar';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { ToolIcon, tools } from '../components/display/ToolIcon';
import { COSMOS_LOGO, ETH_LOGO, SOLANA_LOGO } from '../constants';


export const LandingCard = ({ content, customClass, }: {
  content: JSX.Element,
  customClass: string
}) => {

  return <div className='flex'>
    <Card className={customClass + " card-bg"}
      style={{
        border: '1px solid gray',
        borderRadius: 15,
      }}>
      <div className='landing-card secondary-text' >
        {content}
      </div>
    </Card >
  </div>
}


export const PrevLandingCard = ({ content, additionalContent, onClick }: {
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
          height: showMore ? undefined : additionalContent ? 360 : 260, borderRadius: 15,
          background: `linear-gradient(0deg, black 10%, #001529 100%)`,
        }} onClick={() => {
          if (onClick) onClick();
          else setShowMore(!showMore)
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
    },
    {
      collectionId: 1n,
      badgeId: 11n,
    },
    {
      collectionId: 1n,
      badgeId: 12n,
    },
    {
      collectionId: 1n,
      badgeId: 13n,
    },
    {
      collectionId: 1n,
      badgeId: 14n,
    },
    {
      collectionId: 1n,
      badgeId: 15n,
    },
    {
      collectionId: 1n,
      badgeId: 16n,
    },
    {
      collectionId: 1n,
      badgeId: 17n,
    },
    {
      collectionId: 1n,
      badgeId: 18n,
    },
    {
      collectionId: 1n,
      badgeId: 19n,
    },
    {
      collectionId: 1n,
      badgeId: 20n,
    },

  ];

  useEffect(() => {
    batchFetchAndUpdateMetadata([{
      collectionId: 1n,
      metadataToFetch: {
        badgeIds: [{ start: 1n, end: 20n }],
      }
    }, {
      collectionId: 2n,
      metadataToFetch: {
        badgeIds: [{ start: 1n, end: 20n }],
      }
    }, {
      collectionId: 3n,
      metadataToFetch: {
        badgeIds: [{ start: 1n, end: 20n }],
      }
    }]);
  }, []);

  return (
    <>
      {/* gradient-bg  */}
      <div className='landing-padding'>
        <Row className='flex-around ' style={{ textAlign: 'start', flexWrap: 'wrap', alignItems: 'normal', minHeight: '60vh' }}>
          <Col md={14} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '10vh' }}>
            <div className='collect-title capitalize primary-text flex flex-wrap' style={{
              alignItems: 'center'
            }}><span className='mr-2'>Collect {' '}</span><img src='/images/bitbadgeslogotext.png' alt='BitBadges Logo' className='inline-logo primary-pink' />
              {' '} to build your digital identity!</div>
            <br />
            <p className='secondary-text' style={{ fontSize: 14 }}>This is a beta version of BitBadges which is completely subsidized for users. Badges and profiles can optionally be migrated to mainnet once launched. $BADGE will be redistributed via an airdrop based on betanet contributions.</p>
            <div className='flex flex-wrap full-width mt-3'>
              <Button
                size='large'
                className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue  focus:bg-vivid-blue focus:text-white focus hover:border-color-pink-600 hover:border hover:border-vivid-blue'
                style={{ margin: 10, marginLeft: 0, }}
                onClick={() => {
                  router.push('/browse');
                }}
              >
                Explore
              </Button>
              <Button
                size='large'
                className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue  focus:bg-vivid-blue focus:text-white focus hover:border-color-pink-600 hover:border hover:border-vivid-blue'
                style={{ margin: 10, marginLeft: 0 }}
                onClick={() => {
                  router.push('/collections/mint');
                }}
                target='_blank'
              >
                Create
              </Button>
              <Button
                size='large'
                className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue  focus:bg-vivid-blue focus:text-white focus hover:border-color-pink-600 hover:border hover:border-vivid-blue'
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
                className='bg-vivid-blue rounded border-0 text-white hover:bg-transparent hover:text-vivid-blue  focus:bg-vivid-blue focus:text-white focus hover:border-color-pink-600 hover:border hover:border-vivid-blue'
                style={{ margin: 10, marginLeft: 0 }}
                onClick={() => {
                  window.open('https://discord.com/invite/TJMaEd9bar', '_blank');
                }}
                target='_blank'
              >
                Feedback?
              </Button>
            </div>

            {/* <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
              {status.status.nextCollectionId.toString()} Badges Created!
            </Typography.Text> */}


          </Col>
          <Col md={10} sm={24} xs={24} style={{ alignItems: "normal", height: '100%', marginTop: '10vh' }} >
            {/* <div style={{ maxWidth: 400, justifyContent: 'center' }}>
                  <img src="/images/bitbadgeslogo.png" alt="BitBadges Logo" className='landing-logo' />
                </div> */}
            <div style={{ paddingRight: 4, paddingLeft: 4, alignItems: 'normal', maxHeight: 400, overflowY: 'auto' }} className='flex-center full-width' >

              <div className='flex-center flex-wrap full-width primary-text '>
                {
                  [...featuredBadges].map((badge, idx) => {
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


        <Row className='grid grid-cols-1 gap-3 mt-12'>
          <LandingCard
            content={<>
              <div>
                <img src="/images/bitbadgeslogotext.png" alt="BitBadges Logo" className='h-[4rem]' />
              </div>
              <div className='grid lg:grid-cols-2 gap-10'>

                <div style={{ marginTop: 12 }}>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                    What is BitBadges?
                  </Typography.Text>
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    BitBadges is the <b>all-in-one</b>, multi-chain platform for creating, collecting, managing, and displaying digital NFT badges.
                  </Typography.Text>


                  <br />
                  <br />
                  <Typography.Text strong className='primary-text primary-text' style={{ fontSize: 24 }}>
                    How to collect badges?
                  </Typography.Text>
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    Badges can be collected in a variety of ways, such as scanning a QR code, entering a password, or being airdropped one.
                    The collection creator decides how badges are distributed.
                    To see how a specific collection distributes badges, check out the page for that collection.
                  </Typography.Text>

                  <br />
                  <br />
                  <Typography.Text strong className='primary-text primary-text' style={{ fontSize: 24 }}>
                    How is ownership verified?
                  </Typography.Text>
                  <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    {"All badges are public, meaning you can verify the authenticity and ownership of anyone's badges at any time, both digitally and in-person. "}

                    This is possible because BitBadges uses a public, decentralized blockchain to store badges, meaning no one can censor, forge, or fake ownership of badges.
                  </Typography.Text>

                  {/* <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    Think of badges as digital tokens that you can collect and own.
                    Chances are, you already own several digital badges, like a social media verification checkmark or concert tickets.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    Badges can be used for all sorts of things, giving you various benefits and value. Some might be handy in the real world, like a ticket badge getting you into a concert, while others can be purely digital. Some may signify something about your reputation, like a community service badge. Or, some may be just for fun, like a souvenir badge. It all depends on the badge!

                  </Typography.Text> */}

                </div>
                <div className="container" style={{ marginTop: 12 }}>
                  <iframe
                    className='responsive-iframe rounded-2xl'
                    // width={'60%'}
                    // height={209 * 1.2}
                    src="https://www.youtube.com/embed/7IbHA6LQZt4?si=v9eN4w70p3XwkmD7"
                    title="Create a Badge in 45 Seconds w/ BitBadges"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

              </div>
              <Divider />

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }} className=''>
                <InformationDisplayCard noBorder inheritBg title='Utility' subtitle='' md={8} sm={24} xs={24}>

                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={3n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Certain badges might offer utility, like access to an event or authenticating you for a website.
                  </div>
                </InformationDisplayCard>
                <InformationDisplayCard noBorder inheritBg title='Achievements' subtitle='' md={8} sm={24} xs={24}>
                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={5n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Show off your achievement badges in your portfolio, like a degree or certification.
                  </div>
                </InformationDisplayCard>
                <InformationDisplayCard noBorder inheritBg title='Reputation' subtitle='' md={8} sm={24} xs={24}>
                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={9n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Your badges become your digital identity. Some might positively impact your reputation while others might negatively impact your reputation.
                  </div>
                </InformationDisplayCard>

                <InformationDisplayCard noBorder inheritBg title='Contributions' subtitle='' md={8} sm={24} xs={24}>
                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={6n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Contributions to a project can be rewarded with a badge, like a badge for contributing to an open-source project.
                  </div>
                </InformationDisplayCard>
                <InformationDisplayCard noBorder inheritBg title='For Fun' subtitle='' md={8} sm={24} xs={24}>
                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={19n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Some badges might be just collected for fun, like a souvenir badge.
                  </div>
                </InformationDisplayCard>
                <InformationDisplayCard noBorder inheritBg title='Protocols' subtitle='' md={8} sm={24} xs={24}>
                  <br /><BadgeAvatar size={100} collectionId={1n} badgeId={15n} /> <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    Use badges to implement protocols. For example, the
                    <a href='https://docs.bitbadges.io/overview/ecosystem/bitbadges-follow-protocol' target='_blank' className='text-vivid-blue' rel="noreferrer"> BitBadges Follow Protocol</a>, or an attendance protocol.
                  </div>
                </InformationDisplayCard>
              </div>
              <Divider />
              <div className='flex-center'>
                And much more!
              </div>

            </>
            }
            customClass="secondary-text"
          />


        </Row>

      </div >
      <div className='landing-padding' style={{ textAlign: 'center' }}>
        <br />
        <br />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className='primary-text text-5xl text-[#131233] dark:text-slate-100' style={{ fontSize: 32 }}>
              Features
            </Typography.Text>
          </Col>
        </Row>


        <Row className='flex-between mt-4' style={{ alignItems: 'normal' }}>
          <Col md={24} sm={24} xs={24}>
            <Typography.Text strong className='secondary-text text-base secondary-text font-normal dark:text-slate-100' style={{ fontSize: 16 }}>
              {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
              Learn more about all offered features <a href='https://docs.bitbadges.io/overview' target='_blank' className='text-vivid-blue' rel="noreferrer">here</a>.
            </Typography.Text>
          </Col>
        </Row>


        <br />


      </div>
      {/* reverse-gradient-bg  */}

      {/* reverse-gradient-bg  */}

      < div className='landing-padding mt-4'>
        <Row className='grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-3' style={{ alignItems: 'normal' }}>
          <>
            <>
              <LandingCard
                customClass='secondary-text '
                content={
                  <>
                    <div className='flex' style={{ alignItems: 'center' }}>
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
                      <Avatar
                        src={SOLANA_LOGO}
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
                      />, Solana <Avatar
                        src={SOLANA_LOGO}
                        size={25}
                      />, and Cosmos <Avatar
                        src={COSMOS_LOGO}
                        size={25}
                      /> users, with more to come.
                    </Typography.Text></>
                }
              />
              <LandingCard
                customClass='secondary-text '
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
                      BitBadges utilizes a scalable architecture that can eventually support millions of users and badges through
                      outsourcing to off-chain storage where possible and batch operations.
                    </Typography.Text>
                  </>
                }
              />

              <LandingCard
                customClass='secondary-text '
                content={
                  <>
                    <DatabaseOutlined
                      className='figma-blue'
                      style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                    />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Hybrid Balances
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
                customClass='secondary-text '
                content={
                  <>
                    <QrcodeOutlined
                      className='figma-blue'
                      style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                    />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Seamless Authentication
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Verify badge ownership at in-person events through QR codes, or verify badge ownership digitally through <a href="https://blockin.gitbook.io/blockin/" target='_blank'>Blockin</a> and our suite of
                      authentication tools.

                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                customClass='secondary-text '
                content={<>
                  <DeploymentUnitOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Optional Decentralization
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges will ALWAYS provide full support for fully decentralized implementations.
                    However, we realize most users do not care, so we also provide hybrid approaches
                    that can be used to greatly improve user experience and scalability.
                  </Typography.Text>
                </>
                }
              />
              <LandingCard
                customClass='secondary-text '
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
                customClass='secondary-text '
                content={
                  <><ControlOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Fine-Grained Transferability
                    </Typography.Text>
                    <br /><br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Instead of badges being simply transferable or non-transferable, BitBadges supports a wide range of transferability options that can be clearly displayed to users.
                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                customClass='secondary-text '
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





              {/* <LandingCard
                customClass='secondary-text '
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
              />   */}
            </>
            <>
              {/* <LandingCard
                customClass='secondary-text '
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

              <LandingCard
                customClass='secondary-text'
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
                customClass='secondary-text '
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
                customClass='secondary-text '
                content={
                  <><OrderedListOutlined
                    className='figma-blue'
                    style={{ fontSize: 48, marginLeft: 8, marginRight: 8 }}
                  />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Address Lists
                    </Typography.Text>
                    <br /><br />

                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      As an alternative, address lists can be used to manage users without the complexity of badges (i.e. balances, permissions, transferability, etc.).
                    </Typography.Text>
                  </>
                }
              /> */}
            </>
          </>
        </Row>
      </div>

      <div className='landing-padding mt-4'>


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
            <Typography.Text strong className='primary-text text-5xl text-[#131233] dark:text-slate-100' style={{ fontSize: 32 }}>
              Ecosystem
            </Typography.Text>
          </Col>
        </Row>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} className=''>
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
