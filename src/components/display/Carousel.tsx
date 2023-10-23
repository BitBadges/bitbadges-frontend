import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Carousel } from 'antd';
import React, { ReactNode } from 'react';

interface CustomCarouselProps {
  title: string | ReactNode
  page?: number;
  setPage?: (page: number) => void;
  total?: number;
  items: ReactNode[];
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, items, page, setPage, total }) => {
  const [currPage, setCurrPage] = React.useState(page ?? 0);



  return (
    <div className="custom-carousel primary-text">
      <div className='flex-between flex-wrap'>

        {title}
        <div className="carousel-arrows flex-center " style={{ float: 'right', marginTop: 10 }}>
          <Button
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
          <div style={{ marginLeft: '1rem', fontSize: 18, fontWeight: 'bolder' }}>

            {page ?? currPage + 1}/{total ?? items.length}
          </div>
        </div>
      </div>
      <Carousel dots={false}
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
        {items.map((_, i) => (
          <div key={i}>
            {
              total ? items[0] :
                items[currPage]}
          </div>
        ))}
      </Carousel>

    </div>
  );
};

export default CustomCarousel;