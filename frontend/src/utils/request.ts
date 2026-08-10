const BASE_URl = "http://localhost:3000";

/**
 * 封装请求方法
 */
export const request = (options: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: any;
}) => {
  return new Promise((resolve, reject) => {
    // 从本地获取 token
    const token = uni.getStorageSync("token");

    uni.request({
      url: BASE_URl + options.url,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      success: (res) => {
        // 2xx 状态码都算成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const result = res.data as any;
          // 业务成功
          if (result.code === 0) {
            resolve(result.data); // 直接返回 data 部分
          } else {
            // 业务失败
            uni.showToast({
              title: result.message || "请求失败",
              icon: "none",
            });

            // 如果是 401，跳转到登录（或者重新登录）
            if (result.code === 401) {
              uni.removeStorageSync("token");
              uni.removeStorageSync("userInfo");
              // 可以在这里跳转到登录页，或者触发重新登录
            }

            reject(result);
          }
        } else {
          uni.showToast({
            title: "网络错误",
            icon: "none",
          });
          reject(res);
        }
      },
      fail: (err) => {
        uni.showToast({
          title: "网络错误",
          icon: "none",
        });
        reject(err);
      },
    });
  });
};
