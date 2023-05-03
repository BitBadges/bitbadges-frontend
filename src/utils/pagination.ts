//Assumes currPage is valid
export const getPageDetails = (currPage: number, pageSize: number, min: number, max: number) => {
  const startIdNum = (currPage - 1) * pageSize + min;
  const endIdNum = max < startIdNum + pageSize - 1 ? max : startIdNum + pageSize - 1;

  return { start: startIdNum, end: endIdNum };
}