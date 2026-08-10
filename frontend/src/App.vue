<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { login, isLoggedIn } from "./utils/auth";
import { getUserInfo } from "./api/user";
onLaunch(() => {
  console.log("App Launch");
  // 启动时自动登录
  autoLogin();
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});

const autoLogin = async () => {
  if (isLoggedIn()) {
    console.log("已登录");
    fetchUserInfo(); // ② 已登录也调用一下，验证 token 有没有效
    return;
  }

  try {
    const userInfo = await login();
    console.log("自动登录成功", userInfo);
    fetchUserInfo();
  } catch (error) {
    console.error("自动登录失败", error);
  }
};
// ④ 新增：调用后端接口获取用户信息
const fetchUserInfo = async () => {
  try {
    console.log("开始调用获取用户信息接口...");
    const userInfo = await getUserInfo();
    console.log("✅ 获取用户信息成功:", userInfo);

    // 把最新的用户信息存到本地
    uni.setStorageSync("userInfo", userInfo);
  } catch (error) {
    console.error("❌ 获取用户信息失败:", error);
  }
};
</script>
<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}
</style>
