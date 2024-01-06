
import { Avatar, Col } from 'antd';


import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useLayoutEffect, useState } from 'react';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { BlockiesAvatar } from '../address/Blockies';
import { AccountButtonDisplay } from '../button-displays/AccountButtonDisplay';
import { BitBadgesUserInfo } from 'bitbadgesjs-utils';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';

export function AccountHeader({ accountInfoOverride, addressOrUsername, multiDisplay, profilePic }: {
  addressOrUsername: string;
  multiDisplay?: boolean,
  accountInfoOverride?: BitBadgesUserInfo<bigint>
  profilePic?: string
}) {
  const [showMore, setShowMore] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const currAccount = useAccount(addressOrUsername);
  const accountInfo = accountInfoOverride ?? currAccount;
  const address = accountInfo?.address;
  const avatar = accountInfo?.avatar;

  const profilePicSrc = profilePic || accountInfo?.profilePicUrl || accountInfo?.avatar || <BlockiesAvatar avatar={avatar} address={address?.toLowerCase() ?? ''} fontSize={300} />

  useLayoutEffect(() => {
    // Calculate the height of the content inside the description div
    const descriptionElement = document.getElementById('description' + addressOrUsername);
    const descriptionElement2 = document.getElementById('description2' + addressOrUsername);

    const height = descriptionElement?.clientHeight ?? 0;
    const height2 = descriptionElement2?.clientHeight ?? 0;
    setContentHeight(Math.max(height, height2));

  }, [addressOrUsername, accountInfo?.readme]);


  if (multiDisplay) {
    return <div className='flex flex-wrap primary-text'>
      <Col style={{ textAlign: 'start', width: '100%' }}      >
        <div className='flex-center flex-column' style={{ width: '100%' }}>
          <div>
            <div className='flex-center flex-column'>
              <div style={{ flex: '0 0 300px' }}>
                <Avatar src={profilePicSrc} size={300} shape='square' className='rounded-lg' />
              </div>
            </div>
          </div>
          <div style={{ overflow: 'hidden', textAlign: 'center' }}>
            <div >
              <AddressDisplay addressOrUsername={addressOrUsername} fontSize={30} />
            </div>
          </div>
        </div>
      </Col>
    </div>
  }

  const Bio = <>
    <div className='primary-text' id={'description2' + addressOrUsername} style={{ whiteSpace: 'normal', maxHeight: showMore ? undefined : '300px' }}>
      <MarkdownDisplay markdown={accountInfo?.readme ?? ''} />
    </div>
  </>


  return <>
    <div className='primary-text'>
      <div className='flex flex-wrap'>
        <Col style={{ textAlign: 'start', width: '100%' }}>
          <Col md={24} xs={0} sm={0} style={{ minHeight: 200, marginTop: 10 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 300px', marginRight: '32px' }}>
                <Avatar src={profilePicSrc} size={300} shape='square' className='rounded-lg' />
              </div>
              <div style={{ flex: '1', overflow: 'hidden' }}>
                {!multiDisplay &&
                  <div className='flex-between flex-wrap '>
                    <div>
                      <AddressDisplay addressOrUsername={addressOrUsername} fontSize={24} />
                    </div>
                    <div className=''>
                      <AccountButtonDisplay addressOrUsername={addressOrUsername} accountOverride={accountInfoOverride} />
                    </div>
                  </div>
                }
                {Bio}
              </div>

            </div>
          </Col>

          <Col md={0} xs={24} sm={24} style={{ minHeight: 200, marginTop: 10 }}>
            <div className='flex-center flex-column'>
              <div style={{ flex: '0 0 300px' }}>
                <Avatar src={profilePicSrc} size={300} shape='square' className='rounded-lg' />
              </div>
            </div>
            <div style={{ flex: '1', overflow: 'hidden', marginTop: 10 }}>
              {!multiDisplay &&
                <div className='flex-between flex-wrap'>
                  <div className='full-width flex-center-if-mobile'>
                    <AddressDisplay addressOrUsername={addressOrUsername} fontSize={20} />
                  </div>
                  <br />
                  <div className='full-width flex-center-if-mobile'>
                    <AccountButtonDisplay addressOrUsername={addressOrUsername} mobile />
                  </div>
                </div>
              }
              <br />
              {Bio}
            </div>
          </Col>
          {contentHeight >= 300 && (
            <div className='flex-between flex-wrap' style={{ marginTop: '10px' }}>
              <div></div>
              <div>
                <a onClick={() => { setShowMore(!showMore) }}>
                  {showMore ? <FullscreenOutlined /> : <FullscreenExitOutlined />} {showMore ? 'Show Less' : 'Show More'}
                </a>
              </div>
            </div>
          )}
        </Col>
        <br />
      </div>
      <br />
    </div>
  </ >
}