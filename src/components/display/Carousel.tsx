import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Col } from 'antd';
import React, { ReactNode, useEffect, useMemo } from 'react';

interface CustomCarouselProps {
  title: string | ReactNode
  page?: number;
  setPage?: (page: number) => void;
  total?: number;
  items: ReactNode[];
  showTotalMobile?: boolean;
  numPerPage: number
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, items, page, setPage, total, showTotalMobile, numPerPage }) => {
  const [currPage, setCurrPage] = React.useState(page ?? 0);
  const [isMobile, setIsMobile] = React.useState(false);


  //group the items into pages of size numPerPage
  const groupedItems: ReactNode[][] = useMemo(() => {
    const grouped: ReactNode[][] = [];
    for (let i = 0; i < items.length; i += numPerPage) {
      grouped.push(items.slice(i, i + numPerPage));
    }
    return grouped;
  }, [items, numPerPage]);

  useEffect(() => {
    setCurrPage(0);
  }, [items])

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsToDisplay = groupedItems.map((items, index) => {
    if (index !== currPage) return null;

    return items.map((item) => {
      return item;
    });
  }).filter(x => x).flat();

  const hasNoItems = itemsToDisplay.length === 0;

  return (
    <div className="primary-text">

      {!isMobile && <div className='flex-between flex-wrap invisible sm:visible'>
        {/* centered title if xs */}
        {title}
        <div className="carousel-arrows flex-center collapse sm:visible" style={{ float: 'right', marginTop: 10 }}>
          {!hasNoItems && <>
            <Button
              className='bg-vivid-blue hover:opacity-75 text-white border-0'
              type="primary"
              shape="circle"
              style={{ margin: 4 }}
              icon={<LeftOutlined />}
              onClick={() => {
                if (currPage === 0) {
                  if (setPage) setPage((total ? total - 1 : groupedItems.length - 1));
                  setCurrPage((total ? total - 1 : groupedItems.length - 1));
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
                if (currPage === (total ? total - 1 : groupedItems.length - 1)) {
                  if (setPage) setPage(0);
                  setCurrPage(0);
                } else {
                  if (setPage) setPage(currPage + 1);
                  setCurrPage(currPage + 1);
                }
              }}
            />
          </>}
          <div className='secondary-text' style={{ marginLeft: '1rem', fontSize: 18, fontWeight: 'bolder' }}>
            {hasNoItems ? '0/0' : <>
              {page ?? currPage + 1}/{total ?? groupedItems.length}</>}
          </div>
        </div>
      </div>}
      {isMobile && <>
        <div className='flex'>
          {title}
          {showTotalMobile && <div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder', marginLeft: 4 }}>({total ?? groupedItems.length})</div>}
        </div>
      </>}



      <Col md={24} xs={0}>
        <div className='flex full-width'>
          {itemsToDisplay.map((item) => {
            return item;
          })}
        </div>
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
