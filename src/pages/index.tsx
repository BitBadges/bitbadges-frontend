import { AuditOutlined, BarcodeOutlined, ClockCircleOutlined, CloudServerOutlined, ClusterOutlined, ContactsOutlined, ControlOutlined, DatabaseOutlined, DeploymentUnitOutlined, DownOutlined, FieldTimeOutlined, FileProtectOutlined, GlobalOutlined, IdcardOutlined, LikeOutlined, LockOutlined, QrcodeOutlined, SafetyOutlined, SendOutlined, TeamOutlined, UpOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Divider, Row, Typography } from 'antd';
import { useRouter } from 'next/router';
import { NextPage } from 'next/types';
import { useEffect, useState } from 'react';
import { useCollectionsContext } from '../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from '../components/badges/BadgeAvatar';
import { ToolIcon, tools } from '../components/display/ToolIcon';
import { BITCOIN_LOGO, COSMOS_LOGO, ETH_LOGO, SOLANA_LOGO, CHAIN_LOGO } from '../constants';


export const LandingCard = ({ content, additionalContent, customClass, onClick }: {
  content: JSX.Element,
  additionalContent?: JSX.Element,
  onClick?: () => void,
  customClass: string
}) => {

  const [showMore, setShowMore] = useState<boolean>(false);

  return <Col>
    <div className='dark'>

      <Card hoverable={!!additionalContent} className={customClass}
        style={{
          // height: showMore ? undefined : additionalContent ? 360 : 179,
          borderRadius: 15,
          // background: `linear-gradient(0deg, black 10%, #001529 100%)`,
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
    <>
      {/* gradient-bg  */}
      <div className='landing-padding'      >
        <Row className='flex-around' style={{ textAlign: 'start', flexWrap: 'wrap', alignItems: 'normal' }}>
          <Col md={14} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '10vh' }}>
            <span className='primary-text collect-title capitalize text-slate-700 dark:text-white' style={{


            }}>Collect {' '}

              <img src='/images/bitbadgeslogotext.png' alt='BitBadges Logo' className='inline-logo primary-pink' />
              <img src='/images/bitbadgeslogo.png' alt='BitBadges Logo' className='inline-logo primary-pink' />{' '} to build your digital identity!</span>
            <br />
            <br />
            <p className='secondary-text text-gray-400 capitalize' style={{ fontSize: 14 }}>This is a beta version of BitBadges which is completely subsidized for users. Badges and profiles can optionally be migrated to mainnet once launched. We will redistribute $BADGE via an airdrop based on betanet contributions.</p>
            <div className='flex flex-wrap full-width mt-3'>
              <Button
                size='large'
                className='bg-vivid-pink rounded border-0 text-white hover:bg-transparent hover:text-vivid-pink  focus:bg-vivid-pink focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-pink'
                style={{ margin: 10, marginLeft: 0, }}
                onClick={() => {
                  router.push('/browse');
                }}
              >
                Explore
              </Button>
              <Button
                size='large'
                className='bg-vivid-pink rounded border-0 text-white hover:bg-transparent hover:text-vivid-pink  focus:bg-vivid-pink focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-pink'
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
                className='bg-vivid-pink rounded border-0 text-white hover:bg-transparent hover:text-vivid-pink  focus:bg-vivid-pink focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-pink'
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
                className='bg-vivid-pink rounded border-0 text-white hover:bg-transparent hover:text-vivid-pink  focus:bg-vivid-pink focus:text-white focus:border-0 hover:border-color-pink-600 hover:border hover:border-vivid-pink'
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

        <Row className='grid grid-cols-1 gap-3 mt-12'>
          <LandingCard
            content={<>
              <img src="/images/bitbadgeslogo.png" alt="BitBadges Logo" className='h-[10rem]' />

              <br />
              <br />
              <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 24 }}>
                What is BitBadges?
              </Typography.Text>
              <br />
              <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14 }}>
                Think of badges as digital tokens that you can collect and own.
                Chances are, you already own several digital badges, like a social media verification checkmark or concert tickets.
              </Typography.Text>
              <br />
              <br />
              <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14 }}>
                BitBadges is the <b>all-in-one</b> platform for creating, collecting, managing, and displaying these badges.
              </Typography.Text>
            </>
            }
            customClass="bg-white border-0 dark:bg-blue-black"
          />
        </Row>

        <Row className='grid lg:grid-cols-3 xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 mt-5'>
          <LandingCard
            content={<>
              <BarcodeOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
              >

              </BarcodeOutlined>

              <SafetyOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />
              <IdcardOutlined className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />

              <br />
              <br />
              <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 24 }}>
                How are badges used?
              </Typography.Text>
              <br />
              <Typography.Text className='secondary-text text-gray-400 ' style={{ fontSize: 14 }}>
                Badges can be used for all sorts of things, giving you various benefits and value.

                Some might be handy in the real world, like a ticket badge getting you into a concert, while others can be purely digital.
                Some may signify something about your reputation, like a community service badge.
                It all depends on the badge!
              </Typography.Text>
            </>
            }
            customClass='bg-white border-0 dark:bg-blue-black h-[20rem]'
          />
          <LandingCard

            content={<>
              <SendOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
              />

              <QrcodeOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />
              <LockOutlined className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />

              <br />
              <br />
              <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 24 }}>
                How to collect badges?
              </Typography.Text>
              <br />
              <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14 }}>
                The creator or manager of a badge collection decides how to distribute the badges for that collection. Distribution options include whitelists, passwords, codes, claims, emails, direct airdrops, QR codes, and more.
              </Typography.Text>
              {/* <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                    BitBadges is also <b>multi-chain</b>, meaning the same badge can be collected by users from different blockchain ecosystems, such as Ethereum  <Avatar
                      src={ETH_LOGO}
                      size={25}
                    /> and Cosmos <Avatar
                      src={COSMOS_LOGO}
                      size={25}
                    />.
                  </Typography.Text> */}


            </>
            }
            customClass='bg-white border-0 dark:bg-blue-black h-[20rem]'
          />



          <LandingCard
            content={<>
              <CloudServerOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
              />

              <AuditOutlined
                className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />
              <DeploymentUnitOutlined className='figma-blue text-vivid-pink'
                style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }} />

              <br />
              <br />
              <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 24 }}>
                How is ownership verified?
              </Typography.Text>
              <br />

              <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14 }}>
                {"All badges are public, meaning you can view anyone's portfolio and verify the authenticity and ownership of their badges at any time."}
              </Typography.Text>
              <br />
              <br />
              <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14 }}>
                This is possible because BitBadges uses a public, decentralized blockchain to store badges, meaning no one can censor, forge, or fake ownership of badges.
              </Typography.Text>
            </>
            }
            customClass='bg-white border-0 dark:bg-blue-black h-[20rem]'
          />
        </Row>

        <Divider />
        <Row className='flex-center'>
          <Col md={11} sm={24} xs={24} style={{ alignItems: "normal", height: '100%' }} >
            <div className="container" style={{ marginTop: 12, }}>
              <iframe
                className='responsive-iframe rounded-2xl'
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
                className='responsive-iframe rounded-2xl'
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
        </Row >
        <br />
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
            <Typography.Text strong className='secondary-text text-base text-gray-400 font-normal dark:text-slate-100' style={{ fontSize: 16 }}>
              {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
              Check out some of the features and customization options for BitBadges below! Learn more about all offered features <a href='https://docs.bitbadges.io/overview' target='_blank' className='text-vivid-pink' rel="noreferrer">here</a>.
            </Typography.Text>
          </Col>
        </Row>


        <br />


      </div>
      {/* reverse-gradient-bg  */}
      <div className='landing-padding mt-4'>
        <Row className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3' style={{ alignItems: 'normal' }}>
          <>
            <LandingCard
              content={<>
                <TeamOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                <br />
                <br />
                <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                  Address Lists
                </Typography.Text>
                <br />
                <br />
                <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                  Create address lists to easily manage and organize users. These lists can be used for a variety of purposes, such as whitelists, blacklists, and more.
                </Typography.Text>
              </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <>
                  <FieldTimeOutlined
                    className='text-vivid-pink'
                    style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Time-Based Accounting
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    Instead of just balance amounts, BitBadges stores balances associated to specific time periods (Bob owns x1 from January 1 to February 1).
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <><ClusterOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Scalable
                  </Typography.Text>
                  <br /> <br />
                  <Typography.Text className='secondary-text text-gray-500' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is able to scale to millions of users and billions of badges through its innovative technology.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <>
                  <ContactsOutlined
                    className='text-vivid-pink'
                    style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Incoming / Outgoing Approvals
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    Approve users to transfer on your behalf (outgoing) or restrict who can transfer to you (incoming).
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <><LikeOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Reviews
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    Leave reviews on users and collections to help others identify trustworthy users and collections.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <><SendOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Batch Transfers
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    All accounting uses number ranges, meaning batch transfers can be done in a single, efficient transaction (e.g. transfer x1 of badge IDs 1-60000).
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />
          </>
        </Row>


        <Row className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3 mt-3' style={{ alignItems: 'normal' }}>
          <>
            <LandingCard
              content={
                <><ClockCircleOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Time-Based Details
                  </Typography.Text>
                  <br /><br />

                  <Typography.Text className='secondary-text text-gray-500' style={{ fontSize: 14, marginTop: 8 }}>
                    Certain collection details (such as metadata) are timeline-based, meaning they can be scheduled to have different values at different times.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />
            <LandingCard
              content={
                <><GlobalOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Announcements
                  </Typography.Text>
                  <br /><br />

                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    Send announcements to all owners in a collection, enabling you to easily communicate with your badge holders.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <><ControlOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Customizable Transferability
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    Instead of badges being simply transferable or non-transferable, BitBadges supports a wide range of transferability options that can be clearly displayed to users.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[17rem]'
            />

            <LandingCard
              content={
                <>
                  <div className='flex' style={{ alignItems: 'center' }}>
                    <Avatar
                      src={CHAIN_LOGO}
                      size={48}
                      style={{ marginRight: 8 }}

                    />
                  </div>
                  <br />

                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Multi-Chain
                  </Typography.Text>


                  <br />
                  <br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    The same badge can be owned by users from different blockchain ecosystems. We currently support Ethereum  <Avatar
                      src={ETH_LOGO}
                      size={25}
                    /> and Cosmos <Avatar
                      src={COSMOS_LOGO}
                      size={25}
                    /> users, and we plan to integrate
                    Solana <Avatar
                      src={SOLANA_LOGO}
                      size={25}
                    />, Bitcoin <Avatar
                      src={BITCOIN_LOGO}
                      size={25}
                    />, and more soon.
                  </Typography.Text></>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[18rem]'
            />

            <LandingCard
              content={
                <>
                  <DatabaseOutlined
                    className='text-vivid-pink'
                    style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                  />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    Off-Chain Balances
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges supports multiple balance types, such as storing balances off-chain (via a typical server) as opposed to on the blockchain. Each balance type offers its own pros and cons.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[18rem]'
            />

            <LandingCard
              content={
                <><FileProtectOutlined
                  className='text-vivid-pink'
                  style={{ fontSize: 40, marginLeft: 8, marginRight: 8 }}
                />
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text text-slate-700 dark:text-white' style={{ fontSize: 20 }}>
                    No Smart Contracts Needed
                  </Typography.Text>
                  <br /><br />
                  <Typography.Text className='secondary-text text-gray-400' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges reuses the same interface for badges as opposed to individually implemented smart contracts. This results in increased scalability, maintainability, consistency, and security.
                  </Typography.Text>
                </>
              }
              customClass='bg-white border-0 dark:bg-blue-black h-[18rem]'
            />
          </>

        </Row>

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

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }} className='dark'>
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
