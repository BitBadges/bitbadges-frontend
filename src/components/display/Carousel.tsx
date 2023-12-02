import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Carousel, Col } from 'antd';
import React, { ReactNode } from 'react';

interface CustomCarouselProps {
  title: string | ReactNode
  page?: number;
  setPage?: (page: number) => void;
  total?: number;
  items: ReactNode[];
  showTotalMobile?: boolean;
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, items, page, setPage, total, showTotalMobile }) => {
  const [currPage, setCurrPage] = React.useState(page ?? 0);
  const isMobile = window.innerWidth < 768;

  return (
    <div className="primary-text">

      {!isMobile && <div className='flex-between flex-wrap invisible sm:visible'>
        {/* centered title if xs */}
        {title}
        <div className="carousel-arrows flex-center collapse sm:visible" style={{ float: 'right', marginTop: 10 }}>
          <Button
            className='bg-vivid-blue hover:opacity-75 text-white border-0'
            type="primary"
            shape="circle"
            style={{ margin: 4 }}
            icon={<LeftOutlined />}
            onClick={() => {
              if (currPage === 0) {
                if (setPage) setPage((total ? total - 1 : items.length - 1));
                setCurrPage((total ? total - 1 : items.length - 1));
              } else {
                if (setPage) setPage(currPage - 1);
                setCurrPage(currPage - 1);
              }
            }}
          />
          <Button
            className='bg-vivid-blue hover:opacity-75 text-white border-0 '
            type="primary"
            shape="circle"
            style={{ margin: 4 }}
            icon={<RightOutlined />}
            onClick={() => {
              if (currPage === (total ? total - 1 : items.length - 1)) {
                if (setPage) setPage(0);
                setCurrPage(0);
              } else {
                if (setPage) setPage(currPage + 1);
                setCurrPage(currPage + 1);
              }
            }}
          />
          <div className='secondary-text' style={{ marginLeft: '1rem', fontSize: 18, fontWeight: 'bolder' }}>

            {page ?? currPage + 1}/{total ?? items.length}
          </div>
        </div>
      </div>}
      {isMobile && <>
        <div className='flex-center'>
          {title}
          {showTotalMobile && <div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder', marginLeft: 4 }}>({total ?? items.length})</div>}
        </div>
      </>}



      <Col md={24} xs={0}>
        <Carousel
          dots={false}
          swipeToSlide={true}
          swipe={true}
          onSwipe={(direction) => {
            if (direction === 'left') {
              if (currPage === (total ? total - 1 : items.length - 1)) {
                if (setPage) setPage(0);
                setCurrPage(0);
              } else {
                if (setPage) setPage(currPage + 1);
                setCurrPage(currPage + 1);
              }
            } else {
              if (currPage === 0) {
                if (setPage) setPage((total ? total - 1 : items.length - 1));
                setCurrPage((total ? total - 1 : items.length - 1));
              } else {
                if (setPage) setPage(currPage - 1);
                setCurrPage(currPage - 1);
              }
            }
          }}
        >

          {items[currPage]}
        </Carousel>
      </Col>
      <Col md={0} xs={24}>

        <div className='flex snap-x snap-mandatory scroll-auto' style={{ width: '100%', overflowX: 'scroll' }}>
          {items.map((item, index) => {


            return (
              <div key={index} className='snap-normal snap-center' style={{ minWidth: '100%' }}>
                {item}
              </div>
            );
          })}
        </div>
      </Col>
    </div>
  );
};

export default CustomCarousel;
