import { request } from "../utils/request";

/**
 * 获取标签列表
 */
export const getTagList = (category?: string) => {
  return request({
    url: "/tag/list",
    method: "GET",
    data: category ? { category } : {},
  });
};

/**
 * 创建标签
 */
export const createTag = (data: any) => {
  return request({
    url: "/tag",
    method: "POST",
    data,
  });
};

/**
 * 更新标签
 */
export const updateTag = (id: number, data: any) => {
  return request({
    url: `/tag/${id}`,
    method: "PUT",
    data,
  });
};

/**
 * 删除标签
 */
export const deleteTag = (id: number) => {
  return request({
    url: `/tag/${id}`,
    method: "DELETE",
  });
};
