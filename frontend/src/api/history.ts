import { request } from "../utils/request";

// 保存今日点餐到历史记录
export const saveHistory = (dishIds: number[]) => {
  return request({
    url: "/history/save",
    method: "POST",
    data: { dishIds },
  });
};

// 获取某月的历史记录
export const getMonthHistory = (year: number, month: number) => {
  return request({
    url: `/history/month?year=${year}&month=${month}`,
    method: "GET",
  });
};

// 获取某天的历史记录
export const getDayHistory = (date: string) => {
  return request({
    url: `/history/day?date=${date}`,
    method: "GET",
  });
};

// 获取最近 N 天吃过的菜品 ID
export const getRecentDishIds = (days: number = 3) => {
  return request({
    url: `/history/recent-dishes?days=${days}`,
    method: "GET",
  });
};
