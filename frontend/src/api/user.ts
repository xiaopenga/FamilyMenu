import { request } from "../utils/request";

/**
 * 微信登录
 */
export const wechatLogin = (code: string) => {
  return request({
    url: "/user/wechat-login",
    method: "POST",
    data: { code },
  });
};

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return request({
    url: "/user/info",
    method: "GET",
  });
};
