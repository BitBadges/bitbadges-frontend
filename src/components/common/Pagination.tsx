import { Pagination as PaginationAntD } from 'antd';

export function Pagination({ currPage, onChange, total, pageSize }: { currPage: number, onChange: (page: number) => void, total: number, pageSize: number }) {
  return <div className='flex-center'>
    <PaginationAntD
      className='primary-text primary-blue-bg'
      style={{ fontSize: 14 }}
      defaultCurrent={1}
      current={currPage}
      total={total}
      pageSize={pageSize}
      onChange={(page) => {
        onChange(page);
      }}
      showLessItems
      showSizeChanger={false}
      size='small'
      hideOnSinglePage
    />
  </div>
}