import { request } from "../utils/request";

/**
 * 获取菜品列表
 */
export const getDishList = (params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  tagIds?: string;
}) => {
  return request({
    url: "/dish/list",
    method: "GET",
    data: params,
  });
};

/**
 * 获取菜品详情
 */
export const getDishDetail = (id: number) => {
  return request({
    url: `/dish/${id}`,
    method: "GET",
  });
};
/**
 * 新增菜品
 */
export const createDish = (data: any) => {
  return request({
    url: "/dish",
    method: "POST",
    data,
  });
};

/**
 * 更新菜品
 */
export const updateDish = (id: number, data: any) => {
  return request({
    url: `/dish/${id}`,
    method: "PUT",
    data,
  });
};

/**
 * 删除菜品
 */
export const deleteDish = (id: number) => {
  return request({
    url: `/dish/${id}`,
    method: "DELETE",
  });
};
