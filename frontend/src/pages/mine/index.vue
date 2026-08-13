<template>
  <view class="mine-page">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <image class="avatar" :src="userInfo.avatar" mode="aspectFill" />
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || "微信用户" }}</text>
        <text class="user-id">ID: {{ userInfo.id || "-" }}</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="goToHistory">
        <text class="menu-icon">📅</text>
        <text class="menu-text">历史记录</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserInfo } from "../../api/user";

const userInfo = ref<any>({});

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 先从本地存储取（取出来已经是对象了，不需要 JSON.parse）
    const localUser = uni.getStorageSync("userInfo");
    if (localUser) {
      userInfo.value = localUser; // 直接赋值，不用 parse
    }

    // 再从接口获取最新的
    const res: any = await getUserInfo();
    userInfo.value = res;
    uni.setStorageSync("userInfo", res); // 直接存对象，不用 JSON.stringify
  } catch (error) {
    console.error("获取用户信息失败", error);
  }
};

// 跳转到历史记录
const goToHistory = () => {
  uni.navigateTo({
    url: "/pages/history/index",
  });
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 用户信息卡片 */
.user-card {
  display: flex;
  align-items: center;
  padding: 60rpx 40rpx;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  background-color: #fff;
}

.user-info {
  margin-left: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 菜单列表 */
.menu-list {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 36rpx;
  color: #ccc;
}
</style>
