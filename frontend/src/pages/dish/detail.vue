<template>
  <view class="dish-detail" v-if="dish">
    <!-- 菜品图片 -->
    <view class="detail-header">
      <SmartImage class="detail-image" :src="dish.image" mode="aspectFill" />
    </view>

    <!-- 基本信息 -->
    <view class="info-section">
      <view class="dish-name">{{ dish.name }}</view>
      <view class="dish-desc" v-if="dish.description">{{
        dish.description
      }}</view>

      <view class="meta-row">
        <text v-if="dish.cookTime" class="meta-item"
          >⏱ 预计 {{ dish.cookTime }} 分钟</text
        >
        <text class="meta-item">难度：{{ difficultyText }}</text>
      </view>

      <!-- 标签 -->
      <view class="tag-list" v-if="dish.tags && dish.tags.length > 0">
        <text
          v-for="tagItem in dish.tags"
          :key="tagItem.tag.id"
          class="tag"
          :style="{
            backgroundColor: tagItem.tag.color + '20',
            color: tagItem.tag.color,
          }"
        >
          {{ tagItem.tag.name }}
        </text>
      </view>
    </view>

    <!-- 食材清单 -->
    <view
      class="section"
      v-if="dish.ingredients && dish.ingredients.length > 0"
    >
      <view class="section-title">🥬 食材清单</view>
      <view class="ingredient-list">
        <view
          v-for="(item, index) in dish.ingredients"
          :key="index"
          class="ingredient-item"
        >
          <text class="ingredient-name">{{ item.name }}</text>
          <text class="ingredient-amount" v-if="item.amount">{{
            item.amount
          }}</text>
        </view>
      </view>
    </view>

    <!-- 做法步骤 -->
    <view class="section" v-if="dish.steps && dish.steps.length > 0">
      <view class="section-title">👨‍🍳 做法步骤</view>
      <view class="step-list">
        <view
          v-for="(step, index) in dish.steps"
          :key="index"
          class="step-item"
        >
          <view class="step-number">{{ (index as number) + 1 }}</view>
          <view class="step-content">{{ step }}</view>
        </view>
      </view>
    </view>

    <!-- 抖音参考链接 -->
    <view class="section" v-if="dish.douyinUrl">
      <view class="section-title">🎬 参考视频</view>
      <view class="douyin-box" @click="copyDouyinUrl">
        <text class="douyin-text">{{ dish.douyinUrl }}</text>
        <text class="copy-btn">点击复制</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="edit-btn" @click="goToEdit">编辑菜品</button>
      <view class="btn btn-add-menu" @click="addToTodayMenu">
        <text>加入今日点餐</text>
      </view>
      <view class="btn btn-edit" @click="goToEdit">
        <text>编辑</text>
      </view>
    </view>
  </view>

  <view class="loading" v-else>
    <text>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getDishDetail } from "../../api/dish";
import SmartImage from "../../components/SmartImage.vue";

const dish = ref<any>(null);
const dishId = ref(0);

// 难度文本
const difficultyText = computed(() => {
  const map: Record<string, string> = {
    EASY: "简单",
    MEDIUM: "中等",
    HARD: "困难",
  };
  return map[dish.value?.difficulty] || "未知";
});

// 加载详情
const loadDetail = async () => {
  try {
    const res: any = await getDishDetail(dishId.value);
    dish.value = res;
  } catch (error) {
    console.error("加载详情失败", error);
  }
};

// 复制抖音链接
const copyDouyinUrl = () => {
  uni.setClipboardData({
    data: dish.value.douyinUrl,
    success: () => {
      uni.showToast({
        title: "链接已复制",
        icon: "success",
      });
    },
  });
};
// 跳转到编辑页面
const goToEdit = () => {
  uni.navigateTo({
    url: `/pages/dish/edit?id=${dishId.value}`,
  });
};

// 加入今日点餐
const addToTodayMenu = () => {
  // 从本地存储读取现有列表
  const data = uni.getStorageSync("todayMenuList");
  let menuList = data ? JSON.parse(data) : [];

  // 检查是否已经添加过
  const exists = menuList.find((item: any) => item.id === dish.value.id);
  if (exists) {
    uni.showToast({ title: "已在今日点餐中", icon: "none" });
    return;
  }

  // 添加到列表
  menuList.push({
    id: dish.value.id,
    name: dish.value.name,
    image: dish.value.image,
    description: dish.value.description,
    cookTime: dish.value.cookTime,
  });

  // 保存到本地存储
  uni.setStorageSync("todayMenuList", JSON.stringify(menuList));
  uni.showToast({ title: "已加入今日点餐", icon: "success" });
};

// 页面加载时获取 id，然后加载详情
onLoad((options: any) => {
  if (options.id) {
    dishId.value = parseInt(options.id, 10);
    loadDetail();
  }
});
</script>

<style scoped>
.dish-detail {
  padding-bottom: 140rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dish-image {
  width: 100%;
  height: 400rpx;
  background-color: #e0e0e0;
}

.info-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.dish-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.dish-desc {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.meta-row {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  background-color: #f0f0f0;
  color: #666;
}

.section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

/* 食材清单 */
.ingredient-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.ingredient-item:last-child {
  border-bottom: none;
}

.ingredient-name {
  font-size: 28rpx;
  color: #333;
}

.ingredient-amount {
  font-size: 28rpx;
  color: #999;
}

/* 做法步骤 */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.step-item {
  display: flex;
  gap: 20rpx;
}

.step-number {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: #ff6b6b;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  padding-top: 8rpx;
}

/* 抖音链接 */
.douyin-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
}

.douyin-text {
  font-size: 24rpx;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 20rpx;
}

.copy-btn {
  font-size: 24rpx;
  color: #ff6b6b;
  flex-shrink: 0;
}

.loading {
  text-align: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}
/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.edit-btn {
  width: 100%;
  height: 80rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 40rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-header {
  width: 100%;
  height: 400rpx; /* 父容器有高度，SmartImage 才能撑起来 */
}
/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.btn-add-menu {
  background-color: #ff6b6b;
  color: #fff;
}

.btn-edit {
  background-color: #f5f5f5;
  color: #666;
}
</style>
