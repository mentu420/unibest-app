export interface HttpResult<T = any> {
  code: number
  msg: string
  result: T
  data: T
}

export interface PaginationRequest {
  currPage?: number
  pageSize?: number
}
export interface PaginationResponse extends Required<PaginationRequest> {
  totalPage: number
  totalCount: number
}

export interface HttpPaginated<T = any> extends HttpResult<T>, PaginationResponse {}
