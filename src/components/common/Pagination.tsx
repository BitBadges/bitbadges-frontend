import { Pagination as PaginationAntD } from 'antd';
import { Numberify } from 'bitbadgesjs-proto';

export function Pagination({ currPage, onChange, total, pageSize, showOnSinglePage, showPageJumper }: {
  currPage: number, onChange: (page: number) => void, total: number, pageSize: number, showOnSinglePage?: boolean, showPageJumper?: boolean
}) {
  return <div className='flex-center'>
    <PaginationAntD
      className={'primary-text inherit-bg'}
      style={{ fontSize: 14 }}
      defaultCurrent={1}
      current={Numberify(currPage)}
      total={total}
      pageSize={pageSize}
      onChange={(page) => {
        //if > safe intefer
        if (page > Number.MAX_SAFE_INTEGER) {
          alert('The selected page number is too big.');
          return
        }

        onChange(page);
      }}
      showLessItems
      showSizeChanger={false}
      size='small'
      hideOnSinglePage={!showOnSinglePage}
      showQuickJumper={showPageJumper}
      showTotal={showPageJumper ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : undefined}
    />
  </div>
}