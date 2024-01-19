import { ClusterOutlined, FileProtectOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Divider, Row, Typography, notification } from 'antd';
import { SignInWithBitBadges as SignInWithBitBadgesButton } from 'blockin/dist/ui';
import { useRouter } from 'next/router';
import { NextPage } from 'next/types';
import { useEffect } from 'react';
import { batchFetchAndUpdateMetadata } from '../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from '../components/badges/BadgeAvatar';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { ToolIcon, tools } from '../components/display/ToolIcon';
import { BITCOIN_LOGO, COSMOS_LOGO, ETH_LOGO, SOLANA_LOGO } from '../constants';


export const LandingCard = ({ content, customClass, }: {
  content: JSX.Element,
  customClass: string
}) => {

  return <div className='flex'>
    <Card className={customClass + " card-bg rounded-lg"}
      style={{
        border: '1px solid gray',
      }}>
      <div className='landing-card secondary-text' >
        {content}
      </div>
    </Card >
  </div>
}


const Home: NextPage = () => {
  const router = useRouter();
  // const browseContext = useBrowseContext();

  // const featuredBadges = (browseContext.browse?.badges?.featured ?? []).filter(x => x.collection.collectionId != 2n);
  const featuredBadges = [{
    collectionId: 1n,
    badgeIds: [{ start: 1n, end: 20n }],
  }, {
    collectionId: 16n,
    badgeIds: [{ start: 1n, end: 10n }],
  }]

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
      collectionId: 16n,
      metadataToFetch: {
        badgeIds: [{ start: 1n, end: 20n }],
      }
    }]);
  }, []);

  const SignInButton = <>
    <SignInWithBitBadgesButton
      onSignAndBlockinVerify={async () => {
        if (window && window.opener) {
          return
        }
        notification.success({
          message: 'Success',
          description: `On a site that uses Sign In with BitBadges, you would now be signed in to the website with your selected address if you met the authentication and badge ownership requirements.`
        });
      }}
      props={{
        className: 'blockin-button',
        style: {
          width: '100%',
          backgroundColor: '#131233',
          fontSize: 14, fontWeight: 600, color: 'white',
        }
      }}

      popupParams={{
        name: 'BitBadges Sign In Example',
        description: 'This is just an example for signing in with BitBadges. Websites can use this to authenticate users by outsourcing all authentication logic to a Sign In with BitBadges popup.',
        image: 'https://bitbadges.io/images/bitbadgeslogo.png',
        allowAddressSelect: true,
        skipVerify: true,
        challengeParams: {
          domain: 'https://xyz.com',
          statement: 'This is just an example of Sign In with BitBadges. Nothing is done with this sign in attempt.',
          address: '', //overriden by allowAddressSelect
          uri: 'https://xyz.com',
          nonce: 'abc123',
          notBefore: undefined,
          issuedAt: new Date(Date.now()).toISOString(),
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          resources: [],
          assets: [{
            chain: 'BitBadges',
            collectionId: 1,
            assetIds: [{ start: 1, end: 1 }],
            mustSatisfyForAllAssets: true,
            mustOwnAmounts: { start: 1, end: 1 },
          }],
        }
      }} />
  </>

  return (
    <>
      {/* gradient-bg  */}
      <div className='landing-padding gradient-bg'>
        <Row className='flex-around ' style={{ textAlign: 'start', flexWrap: 'wrap', alignItems: 'normal', minHeight: '60vh' }}>
          <Col md={14} sm={24} xs={24} style={{ alignItems: "center", height: '100%', marginTop: '10vh' }}>
            <div className='collect-title capitalize primary-text flex flex-wrap' style={{
              alignItems: 'center'
            }}><span className='mr-2'>Collect {' '}</span><img src='/images/bitbadgeslogotext.png' alt='BitBadges Logo' className='inline-logo primary-pink' />
              {' '} to build your digital identity!</div>
            <br />
            <p className='secondary-text' style={{ fontSize: 14 }}>
              BitBadges is the <b>all-in-one</b>, multi-chain platform for creating, collecting, managing, and verifying digital NFT badges.
              This is a beta version of BitBadges which is completely free for users. </p>
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
          {/* Custom scrollbar */}
          <Col md={10} sm={24} xs={24} style={{ alignItems: "normal", height: '100%', marginTop: '10vh', marginBottom: '10vh' }}>
            {/* <div style={{ maxWidth: 400, justifyContent: 'center' }}>
                  <img src="/images/bitbadgeslogo.png" alt="BitBadges Logo" className='landing-logo' />
                </div> */}
            <div style={{ paddingRight: 4, paddingLeft: 4, alignItems: 'normal', maxHeight: 400, overflowY: 'auto' }} className='flex-center full-width' >

              <div className='flex-center flex-wrap full-width primary-text '>
                {
                  [...featuredBadges].map((badge) => {
                    const { collectionId, badgeIds } = badge;
                    // const collectionId = collection.collectionId;

                    const ids = [];
                    for (const badgeIdRange of badgeIds) {
                      for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
                        ids.push((i));
                      }
                    }
                    return ids.map((badgeId, idx) => {

                      return <div key={idx} className='flex-between flex-wrap' style={{ margin: 2, flexWrap: 'wrap' }}>

                        <BadgeAvatar
                          size={85}
                          // size={size && selectedId === badgeId ? size * 1.5 : size}
                          collectionId={collectionId}
                          badgeId={badgeId}
                          showId={false}
                          showSupplys={false}
                        />

                      </div>
                    })
                  })
                }
              </div>
            </div>
          </Col>
        </Row>

      </div>
      <div className='landing-padding'>
        <Row className='grid grid-cols-1 gap-3 mt-12'>


          <div className='grid lg:grid-cols-2 gap-10'>

            <div >
              <div style={{ marginBottom: 12, marginLeft: -4 }} className=''>
                <img src="/images/bitbadgeslogotext.png" alt="BitBadges Logo" className='h-[4rem]' />
              </div>
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
                How to verify ownership?
              </Typography.Text>
              <br />

              <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                {"All badges are public, meaning you can verify the authenticity and ownership of anyone's badges at any time, both digitally and in-person. "}

                This is possible because BitBadges uses a public, decentralized blockchain to store badges, meaning no one can censor, forge, or fake ownership of badges.


              </Typography.Text>
              <br />
              <br />
              <Typography.Text strong className='primary-text primary-text' style={{ fontSize: 24 }}>
                What is betanet?
              </Typography.Text>
              <br />

              <Typography.Text className='secondary-text' style={{ fontSize: 14 }}>
                BitBadges is currently in a beta phase. This means that the platform is not yet intended for production use.
                Bugs and issues are expected. However, we believe it is stable enough for users to start using it and providing feedback.
                This allows us to build a better product for you in the long term!
                <br /> <br />
                Betanet is completely free to use for users. Once mainnet launches, badges and profiles can optionally be migrated.
                $BADGE will be redistributed via an airdrop based on betanet contributions. Treat betanet as a subsidized testnet.
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
            <div className="container" style={{ marginTop: 12, maxHeight: 300 }}>
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

              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={3n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Certain badges might offer utility, like access to an event or authenticating you for a website. For example, a ticket badge might get you into a concert.
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard noBorder inheritBg title='Achievements' subtitle='' md={8} sm={24} xs={24}>
              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={5n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Show off your achievement badges in your portfolio, like a degree or certification. Badges can be used to prove your skills and experience.
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard noBorder inheritBg title='Reputation' subtitle='' md={8} sm={24} xs={24}>
              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={9n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Your badges become your digital identity. Some might positively impact your reputation while others might negatively impact your reputation.
              </div>
            </InformationDisplayCard>

            <InformationDisplayCard noBorder inheritBg title='Contributions' subtitle='' md={8} sm={24} xs={24}>
              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={6n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Contributions to a project can be rewarded with a badge, like a badge for contributing to an open-source project.
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard noBorder inheritBg title='For Fun' subtitle='' md={8} sm={24} xs={24}>
              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={19n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Some badges might be just collected for fun, like a souvenir badge.
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard noBorder inheritBg title='Protocols' subtitle='' md={8} sm={24} xs={24}>
              <br /><BadgeAvatar size={150} collectionId={1n} badgeId={15n} /> <br />
              <div className='secondary-text' style={{ fontSize: 14 }}>
                Use badges to implement protocols, such as the
                <a href='https://docs.bitbadges.io/overview/ecosystem/bitbadges-follow-protocol' target='_blank' className='text-vivid-blue' rel="noreferrer"> BitBadges Follow Protocol</a>,
                or an attendance protocol.
              </div>
            </InformationDisplayCard>
          </div>




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
                      <Avatar
                        src={BITCOIN_LOGO}
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
                      One interface for all chains.
                      The same badge can be owned by Ethereum  <Avatar
                        src={ETH_LOGO}
                        size={25}
                      />, Solana <Avatar
                        src={SOLANA_LOGO}
                        size={25}
                      />, Bitcoin <Avatar
                        src={BITCOIN_LOGO}
                        size={25}
                      />, and Cosmos <Avatar
                        src={COSMOS_LOGO}
                        size={25}
                      /> users.
                      {` Prior to BitBadges, building multi-chain applications (espcially if token-gated) was a nightmare
                      due to needing to support each chain\'s preferred tooling and infrastructure. Now, it is all in one place!`}

                    </Typography.Text></>
                }
              />
              <LandingCard
                customClass='secondary-text '
                content={
                  <>
                    {SignInButton}
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Authentication
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      Using our suite of authentication tools, you can authenticate users
                      from any supported chain all in one place and with the same badge.
                      This can be done digitally (e.g. gating websites with the the Sign In with BitBadges button as seen above) or in-person (e.g. presenting QR codes at an event).
                      <br />
                      <br />


                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                customClass='secondary-text '
                content={
                  <><ClusterOutlined
                    className='figma-blue'
                    style={{ fontSize: 48 }}
                  />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Scalable
                    </Typography.Text>
                    <br /> <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      BitBadges is built as a decentralized, open-source Cosmos SDK blockchain that leverages intuitive ideas to scale.
                      Notably, BitBadges supports multiple methods of storing balances depending on the use case,
                      including storing balances off-chain where users never need to interact with the blockchain and pay gas fees.
                      Learn more about the options <a href='https://docs.bitbadges.io/overview/concepts/balances-types' target='_blank'>here</a>.
                    </Typography.Text>
                  </>
                }
              />
              <LandingCard
                customClass='secondary-text '
                content={
                  <><FileProtectOutlined
                    className='figma-blue'
                    style={{ fontSize: 48 }}
                  />
                    <br />
                    <br />
                    <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                      Token Standard
                    </Typography.Text>
                    <br />
                    <br />
                    <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                      The BitBadges token (badge) standard is state-of-the-art compared to existing token standards (ERC20, ERC721, etc)
                      and does not require smart contracts.
                      The standard is ever-evolving and natively supports never-before-seen
                      features like time-dependent ownership,
                      fine-grained transferability requirements, and hybrid off-chain balances. Learn more
                      <a href='https://docs.bitbadges.io/overview/' target='_blank'> here</a>.

                    </Typography.Text>
                  </>
                }
              />
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
