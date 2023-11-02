import { LinkedinOutlined } from "@ant-design/icons";
import { Avatar, Col, Row, Tooltip, Typography } from "antd";
import { LandingCard } from ".";

function About({ }: {}) {

  return (
    <div
      className='inherit-bg'
      style={{
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <div className='landing-padding' style={{ textAlign: 'center' }}>
        <br />
        <br />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className=' primary-text text-5xl text-[#131233] dark:text-slate-100' style={{ fontSize: 32 }}>
              Meet the Team
            </Typography.Text>
          </Col>
        </Row>



        <br />

        < div className='landing-padding mt-4'>
          <Row className='grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-3' style={{ alignItems: 'normal' }}>
            <>
              <>
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text '
                  content={
                    <>
                      <div className='flex-center' style={{ alignItems: 'center' }}>
                        <Avatar
                          src={'./images/andrew.png'}
                          size={120}
                          style={{ marginRight: 8 }}
                        />


                      </div>
                      <br />

                      <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                        Andrew Kamal

                      </Typography.Text>
                      <br />
                      <Typography.Text strong className='secondary-text' style={{ fontSize: 20 }}>
                        CEO and Cofounder
                      </Typography.Text>
                      <div className="flex-center">
                        <a href={'https://www.linkedin.com/in/gamer456148/'} target="_blank" rel="noreferrer">
                          <Tooltip title="LinkedIn" placement="bottom">
                            <Avatar
                              size="large"
                              onClick={() => { }}
                              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
                              src={<LinkedinOutlined />}
                            />
                          </Tooltip>
                        </a>
                      </div>
                      <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                        Andrew has built technologies for over 37 startups (as of EOY 2022) and has a profific history of entrepreneurship.

                        He recognized the need of BitBadges to transform into an independent blockchain and stop reliance on centralized platforms.
                        Andrew is leading BitBadges on business development, growth, and structure as well as consulting on special research, partnership opportunities, and grants.
                      </Typography.Text>


                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text '
                  content={
                    <>
                      <div className='flex-center' style={{ alignItems: 'center' }}>
                        <Avatar
                          src={'./images/trevor.jpg'}
                          size={120}
                          style={{ marginRight: 8 }}
                        />


                      </div>
                      <br />

                      <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                        Trevor Miller

                      </Typography.Text>
                      <br />
                      <Typography.Text strong className='secondary-text' style={{ fontSize: 20 }}>
                        CTO and Cofounder
                      </Typography.Text>
                      <div className="flex-center">
                        <a href={'https://www.linkedin.com/in/trevor-miller-1110aa1b1/'} target="_blank" rel="noreferrer">
                          <Tooltip title="LinkedIn" placement="bottom">
                            <Avatar
                              size="large"
                              onClick={() => { }}
                              className="styled-button account-socials-button border-0 bg-blue-black-100 text-vivid-blue hover:bg-transparent hover:opacity-80 "
                              src={<LinkedinOutlined />}
                            />
                          </Tooltip>
                        </a>
                      </div>
                      <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                        Trevor is the CTO and Founder of BitBadges. Trevor graduated with a 4.0 GPA from Virginia Tech in Computer Science, and has been enthusiastic in disrupting the blockchain industry and learning more about its  technologies.
                        He conceptualized and built BitBadges 1.0 and helped lead the way in building and infrastructure for BitBadges to be an independent blockchain.
                      </Typography.Text></>
                  }
                />
              </>
            </>
          </Row>
        </div>


      </div>

      <div className='landing-padding' style={{ textAlign: 'center' }}>
        <br />
        <br />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className='primary-text text-5xl text-[#131233] dark:text-slate-100' style={{ fontSize: 32 }}>
              Why BitBadges?
            </Typography.Text>
          </Col>
        </Row>

        <Row className='flex-between mt-4' style={{ alignItems: 'normal' }}>
          <Col md={24} sm={24} xs={24}>
            <Typography.Text strong className='secondary-text text-base secondary-text font-normal dark:text-slate-100' style={{ fontSize: 16 }}>
              {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
              To learn more and for more complete explanations, <a href='https://docs.bitbadges.io' target='_blank' className='text-vivid-blue' rel="noreferrer">visit our documentation</a>.
            </Typography.Text>
          </Col>
        </Row>

        <br />

        < div className='landing-padding mt-4'>
          <Row className='grid grid-cols-1 lg:grid-cols-1 md:grid-cols-1 gap-3' style={{ alignItems: 'normal' }}>
            <>
              <>
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Need for BitBadges
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Digital blockchain tokens have great potential and infinitely many use cases, but the existing infrastructure is simply not good enough.
                          Existing interfaces are limited in functionality, lack consistency, limited scalability, and much more.
                          BitBadges aims to build out this infrastructure, so blockchain tokens can realize their potential.
                          We aim to make blockchain more accessible for everyone
                          and build projects that are oriented towards adaptable, high-speed, peer-to-peer usecases.




                          {/* Through years of research, BitBadges is proud to introduce new features that have never been seen before in the blockchain space.<br /><br /> */}
                          {' '}Learn more <a href='https://docs.bitbadges.io' target='_blank' className='text-vivid-blue' rel="noreferrer">here</a>.
                        </Typography.Text>

                      </div>


                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Why are we better?
                        </Typography.Text>
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          In addition to all the new features highlighted on the landing page, what makes our product better than competitors?
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Multi-Chain
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          The same badge can be owned by users from different blockchain ecosystems.
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Decentralized
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          We keep decentralization as a core principle, as opposed to some of our competitors who rely on more centralized architectures and censoring.

                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Rapidly-Evolving
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Instead of relying on a rigid token standard that is not adaptable to new features,
                          we iterate fast and constantly add new features to our token standard.

                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Community-Driven and Open-Source
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          By being open-source and developer friendly, we aim to facilitate an ecosystem of community-driven projects, tools, and more built on top of BitBadges.

                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Scalability, Security, and Ease of Use
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Our product is scalable, easy to use, and battle-tested.

                        </Typography.Text>
                      </div>


                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Target Audiences
                        </Typography.Text>
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Badges can be created for infinitely many use cases, so BitBadges has many different target audiences.
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Creators
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          BitBadges offers several opportunities for creators whether it is for artists, event management, or musicians.
                          For example, ticket badges can be created for events, concerts, etc.
                          Using BitBadges, the tickets can be distributed in a peer-to-peer manner (no trusted third party),
                          are more secure, more maintainable
                          and much cheaper!
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Memberships
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Badges can be used for memberships and offering gated utility only to members.
                          Because badges are stored on the blockchain, no one can forge, censor, or modify memberships in an undesired manner.
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Authentication
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Badges can be used for digital authentication, such as granting access to a website or granting access to certain features.
                          Check out Blockin which offers native badge-gating for websites with BitBadges.
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          Recognition
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Badges are a great way to verify and display your achievements.
                          We envision that displaying educational achievements as badges will be a popular use case moving forward.
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          For Fun
                        </Typography.Text>

                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          Badges can also just be collected for fun!
                          Maybe you collect a souvenir badge from every place you travel.
                        </Typography.Text>
                        <br />
                        <br />
                        <Typography.Text className='primary-text' strong style={{ fontSize: 16, marginTop: 8 }}>
                          And more!
                        </Typography.Text>


                      </div>


                    </>
                  }
                />
              </>
            </>
          </Row>
        </div>
        <br />
        <Col md={24} sm={24} xs={24}>
          <Typography.Text strong className='secondary-text text-base secondary-text font-normal' style={{ fontSize: 16 }}>

          </Typography.Text>
        </Col>
      </div>

      <div className='landing-padding' style={{ textAlign: 'center' }}>
        <br />
        <br />
        <Row className='flex-center'>
          <Col md={12} sm={24} xs={24}>
            <Typography.Text strong className='primary-text text-5xl text-[#131233] dark:text-slate-100' style={{ fontSize: 32 }}>
              Our History
            </Typography.Text>
          </Col>
        </Row>


        <br />

        < div className='landing-padding mt-4'>
          <Row className='grid grid-cols-1 lg:grid-cols-1 md:grid-cols-1 gap-3' style={{ alignItems: 'normal' }}>
            <>
              <>
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Version 1.0
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          March-June 2021
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`Trevor releases the first version of BitBadges on the BitClout (now DeSo) platform.
                          The original idea behind BitBadges was to display a portfolio of badges on every user's social media profile,
                          which allowed one to verifiably build thier digital identity through badges and display it on thier social media.\n\n
                          However, soon after release, BitBadges realized that it could not realize its potential without becoming its own entity.`}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Andrew becomes Co-Founder
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          June 2021
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`Andrew becomes a co-founder of BitBadges. 
                          Trevor is supportive and the two start focusing on how BitBadges will keep thriving during their busy study/work schedules.`}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />

                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          BitBadges 2.0 Announced
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          August 2021
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`After much internal discussions about potential expansion opportunities and potential 
                          future integrations, BitBadges 2.0 was announced. 
                          BitBadges 2.0 is the dubbed name for an independent BitBadges with the same key principles in mind.
                          The vision of BitBadges 2.0 is to build out a full stack ecosystem for supporting badges. This includes the underlying blockchain, frontends, development tools, and much more.
                          BitBadges 2.0 development begins. 
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Preprint and Digital Challenge XPrize
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          September 2021
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`BitBadges starts its brainstorming and development phase. 
                          Andrew publishes a paper on IACR preprints on a "A Privacy-Preserving Distributed Identity Offline-First PoCP Blockchain Paradigm" discussing his potential vision for BitBadges 2.0. Trevor starts experimentation with CouchDB for beta way before the technological core migrates to the Cosmos SDK Platform.
                          
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          BitBadges is Incorporated
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          March 2022
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`BitBadges is officially incorporated (originally in the state of Delaware). Andrew and Trevor both own 3.75M shares. Andrew holds his shares in his startup, and both Andrew and Trevor's shares get diluted proportionally. BitBadges is officially a company, and ready to build technologies to take BitBadges to the next level..
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Development
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          March 2022 - December 2023
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`Trevor and Andrew continue developing BitBadges and plan for the beta release of BitBadges.
                          This time period not only consists of building out the BitBadges ecosystem but also research and development 
                          into other areas that could benefit BitBadges. 
                          Trevor completes his master's degree in Computer Science and gets his thesis on blockchain technologies and privacy-preserving protocols published at ICCCN 2023.
                          Additionally, during his time at university, Trevor becomes a co-founder of Blockin which is the multi-chain sign-in standard used by BitBadges.
                          Andrew continues to pursue other projects that plan to integrate BitBadges, such as Stark Drones, Mentors4EDU, and more.
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Betanet Release
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          TBD
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`The development phase is now in its later stages, as BitBadges releases a betanet. Betanet is a way to do a soft release in order to get feedback, iron out bugs, and build the best possible product. Betanet is subsidized for users at no cost.
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
                <LandingCard
                  customClass='bg-white dark:bg-blue-black secondary-text flex full-width'
                  content={
                    <>
                      <div style={{ textAlign: 'left' }}>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Mainnet Release
                        </Typography.Text>
                        <br />
                        <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                          TBD
                        </Typography.Text>

                        <br />
                        <br />
                        <Typography.Text className='secondary-text' style={{ fontSize: 14, marginTop: 8 }}>
                          {`Development has been completed, and a successful betanet is completed. BitBadges is now ready to go live with an official mainnet.
                          `}
                        </Typography.Text>

                      </div>

                    </>
                  }
                />
              </>
            </>
          </Row>
        </div>


      </div>
    </div>
  );
}

export default About;
