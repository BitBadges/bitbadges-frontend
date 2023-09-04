import { Avatar, Button, Card, Col, Divider, Layout, Row, Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { NextPage } from 'next/types';
import { ClockCircleOutlined, ContactsOutlined, DatabaseOutlined, DeploymentUnitOutlined, DownOutlined, FieldTimeOutlined, FileProtectOutlined, FormOutlined, GlobalOutlined, SwapOutlined, SyncOutlined, TeamOutlined, UpOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../bitbadges-api/contexts/CollectionsContext';
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
    collections.batchFetchAndUpdateMetadata(featuredBadges.map(b => {
      return {
        collectionId: b.collectionId,
        metadataToFetch: {
          badgeIds: [{ start: b.badgeId, end: b.badgeId }]
        }
      }
    }));
  }, []);

  return (
    <Layout>
      <Content
        className='primary-blue-bg'
        style={{
          //background: `linear-gradient(0deg, #3e83f8 10%, #001529 100%)`,
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        <div
          // className='primary-blue-bg'
          style={{
            marginLeft: '2vw',
            marginRight: '2vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
            minHeight: '70vh'
          }}
        >
          <div style={{ minHeight: '70vh', }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
              <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height="300px" width="300px" quality={60} />
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 26 }}>BitBadges</Typography.Text> */}
              <Typography.Text strong className='secondary-text' style={{ fontSize: 24 }}>Collect badges and build your digital identity!</Typography.Text>
              {/* <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                BitBadges is a community-driven ecosystem for creating, collecting, and sharing digital badges regardless of what blockchain you r. Badges can be created for any purpose, such as an attendance badge, event tickets, a gym membership, or a college diploma.
              </Typography.Text> */}
              <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>This is a beta version of BitBadges which is completely subsidized for users. Badges and profiles (not $BADGE) can optionally be migrated to mainnet once launched.</Typography.Text>
              {/* <br />
              <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>Experiment and let us know if you have any feedback!</Typography.Text> */}
              <div className='flex'>
                <Button
                  size='large'
                  className='styled-button'
                  style={{ marginTop: '20px' }}
                  onClick={() => {
                    router.push('/browse/badges');
                  }}
                >
                  Explore
                </Button>

                <Button
                  size='large'
                  className='styled-button'
                  style={{ marginTop: '20px', marginLeft: 8 }}
                  href="https://docs.bitbadges.io/overview"
                  target='_blank'
                >
                  Learn More
                </Button>
                <Button
                  size='large'
                  className='styled-button'
                  style={{ marginTop: '20px', marginLeft: 8 }}
                  href="https://discord.com/invite/TJMaEd9bar"
                  target='_blank'
                >
                  Feedback?
                </Button>
              </div>
              <br />
              {/* <div className='flex-center'> */}

              {/* </div> */}

            </div>
            <br />
            <div style={{ paddingRight: 4, paddingLeft: 4 }}>
              <div className='flex-center flex-wrap full-width primary-text'>
                {
                  featuredBadges.map((badge, idx) => {
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
            <Divider />
            <Row className='flex-between' style={{ alignItems: 'normal' }}>
              <LandingCard
                content={<>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 36 }}>
                    Create
                  </Typography.Text>


                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                    Badges can be created for any purpose, such as an attendance badge, event tickets, a gym membership, or a college diploma.
                  </Typography.Text></>
                }
              />
              <LandingCard
                content={<>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 36 }}>
                    Distribute
                  </Typography.Text>
                  <br />

                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                    Distribute your created badges to users in a variety of ways, such as whitelists, passwords, codes, emails, or QR codes.
                  </Typography.Text>
                </>
                }
              />
              <LandingCard
                content={<>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 36 }}>
                    Display
                  </Typography.Text>
                  <br />

                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                    As you collect and earn more badges, your digital identity portfolio expands, and you can show it off to the world!
                  </Typography.Text>
                </>
                }
              />

              <LandingCard
                content={<>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 36 }}>
                    Verify
                  </Typography.Text>
                  <br />

                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                    Verify ownership of badges using our verification tools, allowing you to offer gated utility like event tickets, membership benefits, or access to a website.
                  </Typography.Text>
                </>
                }
              />
            </Row>

          </div>

          <br />
          <br />

          <Row className='flex-between'

            style={{

              textAlign: 'center',
            }}
          >
            <Col md={11} sm={24} xs={24}>
              {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> */}
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 26 }}>Team</Typography.Text> */}
              <br />
              <div className="container">
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

              {/* </div> */}
            </Col>
            <Col md={11} sm={24} xs={24}>
              {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> */}
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 26 }}>Team</Typography.Text> */}
              <br />
              <div className="container">
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

              {/* </div> */}
            </Col>
          </Row>
          {/* </div>
      </Content>
      <Content
        style={{
          //background: `linear-gradient(0deg, #001529 10%, #3e83f8 100%)`,
          textAlign: 'center',
          minHeight: '60vh',
        }}
      >
        <div
          className='primary-blue-bg'
          style={{
            marginLeft: '10vw',
            marginRight: '10vw',
            paddingLeft: '2vw',
            paddingRight: '2vw',
            paddingTop: '20px',
            minHeight: '80vh'
          }}
        > */}
          <Divider />
          <Divider />
          <Row className='flex-between' style={{ alignItems: 'normal', }}>

            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                    Decentralized
                  </Typography.Text>
                  <br />
                  <DeploymentUnitOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges are created and stored on a blockchain meaning the network does not rely on any centralized entity that can censor, modify, forge, or delete badges.
                  </Typography.Text>

                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is also committed to decentralization in other ways, such as the protocol being governed by the $BADGE token and having a community-driven, open-source ecosystem.
                  </Typography.Text>
                  {/* <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    We always provide the option for 60% decentralization, but we also offer some hybrid approaches where some features are decentralized and some are not.
                  </Typography.Text> */}
                </>
              }
            />
            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                    Cross-Chain
                  </Typography.Text>
                  <br />
                  <br />
                  <div className='flex-center'>
                    <Avatar
                      src={ETH_LOGO}
                      size={60}
                    />
                    <SwapOutlined style={{ fontSize: 40, marginRight: 16, marginLeft: 16 }} />
                    <Avatar
                      src={COSMOS_LOGO}
                      size={60}
                    />
                  </div>

                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges are not limited to one blockchain ecosystem and can be sent cross-chain (currently supports Ethereum and Cosmos with Bitcoin and Solana planned next).
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Existing solutions are limited to only one ecosystem at a time. This is a major limitation because to support all of a potential userbase, a product must support all of the blockchains that its users use.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Imagine a concert ticket that was limited to only Android users because the tickets only support Android. This is the current state of blockchain products.
                  </Typography.Text>

                </>
              }
            />


            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                    Scalable
                  </Typography.Text>
                  <br />
                  <GlobalOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Through newly innovated features seen below, BitBadges is able to scale to millions of users and billions of badges.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    New features coupled with our architecture that is designed in a way that uses no smart contracts (expensive) means we can decrease the resources used per collection over 1000x.
                  </Typography.Text>

                </>
              }
            />

            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                    Rapidly Evolving
                  </Typography.Text>
                  <br />
                  <SyncOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges will evolve with the times and continuously add new features to meet the needs of the community.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Existing products are stuck using the same rigid interface that cannot evolve easily. New research and devlopment in the blockchain space is happening at a rapid pace.
                    BitBadges is designed to add new features on the fly.
                  </Typography.Text>
                </>
              }
            />


          </Row>
          <Divider />

          <Row className='flex-center'>
            <Col md={12} sm={24} xs={24}>
              <Typography.Text strong className='primary-text' style={{ fontSize: 32 }}>
                Features
              </Typography.Text>
            </Col>
          </Row>

          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <Col md={24} sm={24} xs={24}>
              <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
                Check out some of our favorite innovative features of BitBadges below!
              </Typography.Text>
            </Col>
          </Row>


          <br />



          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <>
              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Address Lists
                    </Typography.Text>
                    <br />
                    <TeamOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Create address lists to easily manage and organize users. No complexity of a token, just a simple list. These lists can be used for a variety of purposes, such as whitelists, blacklists, and more.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      These lists can be stored on-chain or off-chain.
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Lists are invertible meaning you can natively make a list that includes ALL EXCEPT some specified addresses.
                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Time-Based Accounting
                    </Typography.Text>
                    <br />
                    <Avatar
                      src={<FieldTimeOutlined size={80} style={{ fontSize: 80 }} />}
                      size={80}
                      style={{ marginTop: 16, marginBottom: 16 }}
                    />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Instead of just balance amounts, BitBadges stores balances associated to specific time periods (Bob owns x1 from January 1 to February 1).
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      This allows for more complex use cases such as a gym membership that expires after 1 month or having a clearly defined token release schedule.
                    </Typography.Text>
                  </>
                }
              />



              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Balance Types
                    </Typography.Text>
                    <br />
                    <DatabaseOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      BitBadges supports different balance types, such as storing balances off-chain (via a typical server) or inheriting balances from a parent collection.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      These are alternatives to the standard method of storing everything on the blockchain. Each offers their own pros and cons.
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      For example, when balances are stored off-chain, it is much more efficient, and users never have to interact with the blockchain! However, it introduces another centralized trust factor and does not support any on-chain transfer functionality.
                    </Typography.Text>
                  </>
                }
              />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Incoming Approvals
                    </Typography.Text>
                    <br />
                    <ContactsOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      In addition to standard outgoing approvals, BitBadges also supports incoming approvals. This allows users to control which badges they receive, from who, and how many.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      For example, this can be used to prevent spamming of badges, block specific users, and implement opt-in only badges.
                    </Typography.Text>
                  </>
                }
              />
            </>

          </Row>

          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <>
              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      No Smart Contracts
                    </Typography.Text>
                    <br />
                    <FileProtectOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      BitBadges uses a registry architecture as opposed to individual smart contracts for each badge, which results in increased scalability, consistenecy, and security.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      The existing model of individual smart contracts often results in many vulnerabilities and is not scalable.
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>

                      With the registry architecture, the same code is reused for all badges, making it more consistent plus easier to maintain, upgrade, and become more battle-tested over time.
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      We do support smart contracts for implementing unsupported functionality, but they are optional and should not be needed for most badges.
                    </Typography.Text>
                  </>
                }
              />

              <br />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Batch Transfers
                    </Typography.Text>
                    <br />
                    <Avatar
                      src={<SwapOutlined size={80} style={{ fontSize: 60 }} />}
                      size={80}
                      style={{ marginTop: 16, marginBottom: 16 }}
                    />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      All accounting uses number ranges, meaning batch transfers can be done in a single, efficient transaction (e.g. transfer x1 of badge IDs 1-60000).
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      This is a major improvement over existing products that require processing each individual badge transfer separately.
                    </Typography.Text>
                  </>
                }
              />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Time-Based Details
                    </Typography.Text>
                    <br />
                    <ClockCircleOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />

                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Certain collection details (such as metadata) are timeline-based, meaning they can be scheduled to have different values at different times.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      This enables, for example, metadata to automatically change at a certain time without any manual intervention (blockchain transaction).
                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 26 }}>
                      Fine-Grained Transferability
                    </Typography.Text>
                    <br />
                    <FormOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Instead of badges being simply transferable or non-transferable, BitBadges supports a wide range of transferability options.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      For example, badges can be revokable, freezable, transferable only by users who own a different badge, transferable only once, transferable only to a specific user, or transferable only to a specific user for a specific time period. Or, any combination of these options!
                    </Typography.Text>

                  </>
                }
              />

            </>

          </Row>
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

        </div>


        <Divider />
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
        </div>


      </Content >
    </Layout >
  )
}

export default Home
