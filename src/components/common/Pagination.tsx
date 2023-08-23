import { Pagination as PaginationAntD } from 'antd';

export function Pagination({ currPage, onChange, total, pageSize, showOnSinglePage, lightTheme }: { lightTheme?: boolean, currPage: number, onChange: (page: number) => void, total: number, pageSize: number, showOnSinglePage?: boolean }) {
  return <div className='flex-center'>
    <PaginationAntD
      className={lightTheme ? undefined : 'primary-text primary-blue-bg dark'}
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
      hideOnSinglePage={!showOnSinglePage}
    />
  </div>
}