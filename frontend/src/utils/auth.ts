import { wechatLogin } from "../api/user";
/**
 * 微信登录
 */
export const login = async () => {
  try {
    // 1. 调用 wx.login 获取 code
    const loginRes = await uni.login();
    const code = loginRes.code;
    console.log(code);
    
    if (!code) {
      throw new Error("获取 code 失败");
    }
    
    // 2. 用 code 去后端登录
    const result: any = await wechatLogin(code);
    if (result.code === 0) {
      // 3. 登录成功，保存 token 和用户信息
      uni.setStorageSync("token", result.data.token);
      uni.setStorageSync("userInfo", result.data.user);
      return result.data.user;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("登录失败", error);
    uni.showToast({
      title: "登录失败",
      icon: "none",
    });
    throw error;
  }
};

/**
 * 检查是否已登录
 */
export const isLoggedIn = () => {
  const token = uni.getStorageSync("token");
  return !!token;
};

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return uni.getStorageSync("userInfo");
};

/**
 * 退出登录
 */
export const logout = () => {
  uni.removeStorageSync("token");
  uni.removeStorageSync("userInfo");
};
