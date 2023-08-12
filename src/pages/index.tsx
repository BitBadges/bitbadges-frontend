import { Avatar, Button, Card, Col, Divider, Layout, Row, Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { NextPage } from 'next/types';
// import LiteYouTubeEmbed from 'react-lite-youtube-embed';
// import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { ApiOutlined, BankOutlined, ClockCircleOutlined, ContactsOutlined, ControlOutlined, DatabaseOutlined, DeploymentUnitOutlined, DownOutlined, EditOutlined, FieldTimeOutlined, FileProtectOutlined, FormOutlined, GlobalOutlined, LikeOutlined, LockOutlined, SwapOutlined, SyncOutlined, TeamOutlined, UpOutlined } from '@ant-design/icons';
import { COSMOS_LOGO, ETH_LOGO } from '../constants';


const LandingCard = ({ content, additionalContent }: {
  content: JSX.Element,
  additionalContent?: JSX.Element
}) => {

  const [showMore, setShowMore] = useState<boolean>(false);

  return <Col md={6} sm={24} xs={24} style={{
    padding: 6, display: 'flex',
  }}>
    <div>

      <Card hoverable className='primary-blue-bg primary-text' style={{ minHeight: 360, borderRadius: 15 }}>
        <div className='landing-card' onClick={() => setShowMore(!showMore)}>
          {content}
          {additionalContent && showMore && additionalContent}
          <br />
          <br />
          {/* {/* <Button className='screen-button' onClick={() => setShowMore(!showMore)}>{showMore ? 'Show Less' : 'Show More'}</Button> */}
          {!showMore ? <DownOutlined /> : <UpOutlined />}
        </div>
      </Card >
    </div>

  </Col >
}

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
          <div style={{ display: 'flex', justifyContent: 'space-around', minHeight: '60%' }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
              <Image src="/images/bitbadgeslogo.png" alt="BitBadges Logo" height="300px" width="300px" quality={60} />
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 20 }}>BitBadges</Typography.Text> */}
              <Typography.Text strong className='secondary-text' style={{ fontSize: 24 }}>Collect badges and build your Web3 identity!</Typography.Text>
              {/* <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                BitBadges is a community-driven ecosystem for creating, collecting, and sharing digital badges regardless of what blockchain you r. Badges can be created for any purpose, such as an attendance badge, event tickets, a gym membership, or a college diploma.
              </Typography.Text> */}
              <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>Note this is a beta version of BitBadges for testing purposes which is completely subsidized for users. Please let us know if you have any feedback!</Typography.Text>
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
              <br />
              {/* <div className='flex-center'> */}

              {/* </div> */}

            </div>

          </div>
          <Row className='flex-center'>
            <Col md={18} sm={24} xs={24}>
              {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> */}
              {/* <Typography.Text strong className='primary-text' style={{  fontSize: 20 }}>Team</Typography.Text> */}
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

          <Divider />
          <Divider />

          {/* <Row className='flex-center'>
            <Col md={12} sm={24} xs={24}>
              <Typography.Text strong className='primary-text' style={{ fontSize: 32 }}>
                What is BitBadges?
              </Typography.Text>
            </Col>
          </Row>
          <br />
          <Row className='flex-center'>
            <Col md={24} sm={24} xs={24}>
              <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                BitBadges is a community-driven ecosystem for creating, collecting, and sharing digital badges. Badges can be created for any purpose, such as an attendance badge, event tickets, a gym membership, or a college diploma.
                All badges are public, so as you accumulate more over time, your digital identity portfolio expands, and you can show it off to the world!
              </Typography.Text>
              <br />
              <br />
              <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>

              </Typography.Text>
            </Col>
          </Row>
          <Divider />

          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <Col md={8} sm={24} xs={24}>
              <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>
                Supported Chains
              </Typography.Text>

              <br />
              <br />
              <Avatar
                src={ETH_LOGO}
                size={30}
                style={{ marginRight: 16 }}
              />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Ethereum
              </Typography.Text>
              <br />
              <br />
              <Avatar
                src={COSMOS_LOGO}
                size={30}
                style={{ marginRight: 16 }}
              />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Cosmos
              </Typography.Text>

              <br />
              <br />
              <br />
            </Col>
            <Col md={8} sm={24} xs={24}>
              <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>
                Distribution Methods
              </Typography.Text>
              <br />

              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Direct Transfers
              </Typography.Text>
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Whitelist
              </Typography.Text>
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Password
              </Typography.Text>
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Codes
              </Typography.Text>
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Email
              </Typography.Text>
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                QR Codes
              </Typography.Text>

              <br />
              <br />
              <br />
            </Col>

            <Col md={8} sm={24} xs={24}>
              <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>
                Verification Tools
              </Typography.Text>
              <br />
              <br />
              <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
                Badge-Gate Websites (
                <a href='https://blockin.gitbook.io/blockin/' target='_blank' rel="noreferrer">Blockin</a>
                )
              </Typography.Text>

              <br />
              <br />
              <br />
            </Col>
          </Row>
          <Row className='flex-center'>
            <Typography.Text className='primary-text' style={{ fontSize: 16 }}>
              Our current roadmap is to simply improve the user experience, add more features, and add more integrations (chains, distribution methods, verification tools, etc.).
            </Typography.Text>
          </Row>
          <Divider />
          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Cross-Chain
                  </Typography.Text>
                  <br />
                  <ApiOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges can be sent from users of one blockchain to another blockchain, such as Ethereum to Cosmos.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Existing products are limited to only one blockchain. This is a major limitation because to support all of a potential userbase, a product must support all of the blockchains that its users use.
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
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Easy to Use
                  </Typography.Text>
                  <br />
                  <LikeOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is designed to be easy to use for developers and users and also easy to integrate into existing applications.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Developers can easily integrate BitBadges into their applications by using our API and SDK.
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={

                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Community-Driven
                  </Typography.Text>
                  <br />
                  <TeamOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is powered by a community-driven ecosystem of developers, designers, and users.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Our long-term goal is to have an ecosystem of thousands of developers and designers building tools and integrations for BitBadges for any use case you can imagine.
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    No VCs
                  </Typography.Text>
                  <br />
                  <BankOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is proud to not be backed by any venture capital as a show of our commitment to decentralization.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Our plan is to fund development through a token airdrop when our mainnet launches. Allocations will be based on multiple factors, such as contributions to the community, early users, and more.
                  </Typography.Text>
                </>
              }
            />

          </Row>
          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Scalable
                  </Typography.Text>
                  <br />
                  <GlobalOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Through newly innovated features, BitBadges is able to scale to millions of users and billions of badges.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    These features include off-chain balances and batch transfers. Off-chain balances allow for balances to be stored off-chain (via a typical server) instead of on-chain (on the blockchain). Batch transfers allow for transfers of multiple badges to be done in a single, efficient transaction.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Our architecture is also designed in a way that requies no smart contracts, meaning the storage cost per badge collection is decreased from KBs to a few bytes.
                  </Typography.Text>

                </>
              }
            />
            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Secure
                  </Typography.Text>
                  <br />
                  <LockOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Through blockchain technology, BitBadges is able to provide a secure and reliable network for creating, collecting, and sharing badges.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges are created and stored on a blockchain meaning the network does not rely on any centralized entity that can censor, modify, or delete badges.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges are also secured by cryptography, meaning they cannot be forged or duplicated.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Lastly, our architecture is designed in a way that does not require individual smart contracts for each badge, which currently results in many vulnerabilities. With the registry architecture, the same code is reused for all badges, making it easier to maintain, upgrade, and become more battle-tested over time.
                  </Typography.Text>
                </>
              }
            />
            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Rapidly Evolving
                  </Typography.Text>
                  <br />
                  <SyncOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />

                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges aims to evolve with the times and continuously add new features to meet the needs of the community.
                  </Typography.Text>
                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    New research and devlopment in the blockchain space is happening at a rapid pace, but existing products are stuck using the same rigid interface. BitBadges will continuously add new features and evolve over time.
                  </Typography.Text>
                </>
              }
            />

            <LandingCard
              content={
                <>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                    Decentralized
                  </Typography.Text>
                  <br />
                  <DeploymentUnitOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    Badges are created and stored on a blockchain meaning the network does not rely on any centralized entity that can censor, modify, or delete badges.
                  </Typography.Text>

                </>
              }
              additionalContent={
                <>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    BitBadges is also committed to decentralization in other ways, such as not being backed by any venture capital and having a community-driven, open-source ecosystem.
                  </Typography.Text>
                  <br />
                  <br />
                  <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                    We also recognize many users do not care about decentralization and would rather have increased user experience. We always provide the option for 60% decentralization, but we also offer some hybrid approaches where some features are decentralized and some are not.
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

          <Row className='flex-center' style={{ alignItems: 'normal' }}>
            <Col md={24} sm={24} xs={24} >
              <Typography.Text className='secondary-text' style={{ fontSize: 16 }}>
                In addition to the typical features of blockchain tokens (transfer, approve, mint), BitBadges supports many newly innovated features such as the ones highlighted below.
                <br />
                <br />
              </Typography.Text>
            </Col>
          </Row>

          <Row className='flex-between' style={{ alignItems: 'normal' }}>
            <>
              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Time-Based Balances
                    </Typography.Text>
                    <br />
                    <Avatar
                      src={<FieldTimeOutlined size={80} style={{ fontSize: 60 }} />}
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
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Custom Transferability
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
                      For example, badges can be revokable, freezable, transferable only once, transferable only to a specific user, or transferable only to a specific user for a specific time period. Or, any combination of these options.
                    </Typography.Text>

                  </>
                }
              />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Off-Chain Balances
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
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Incoming Approvals
                    </Typography.Text>
                    <br />
                    <ContactsOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Users can approve or reject incoming transfers. This allows control over which badges they receive, from who, and how many.
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
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      No Smart Contracts
                    </Typography.Text>
                    <br />
                    <FileProtectOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      BitBadges uses a registry architecture as opposed to individual smart contracts for each badge.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      The existing model of individual smart contracts often results in many vulnerabilities and is not scalable. With the registry architecture, the same code is reused for all badges, making it easier to maintain, upgrade, and become more battle-tested over time.
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      We do want to note that we support smart contracts for implementing unsupported functionality, but they are not required to use the core functionality and should not be needed for most badges.
                    </Typography.Text>
                  </>
                }
              />

              <br />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
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
                      This is a major improvement over existing products that require processing each badge transfer separately.
                    </Typography.Text>
                  </>
                }
              />

              <LandingCard
                content={
                  <>
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
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
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Manager Permissions
                    </Typography.Text>
                    <br />
                    <ControlOutlined size={80} style={{ fontSize: 80, marginTop: 16, marginBottom: 16 }} />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Every badge collection can optionally have a manager that can have admin privileges.
                    </Typography.Text>
                  </>
                }
                additionalContent={
                  <>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Example privileges include updating the core collection details, revoking badges, freezing users, etc. These permissions can be customized on a very fine-grained level.
                    </Typography.Text>
                  </>
                }
              />
            </>

          </Row> */}

        </div>


        <Divider />




      </Content >
    </Layout >
  )
}

export default Home
