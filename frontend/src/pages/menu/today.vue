<template>
  <view class="today-menu">
    <!-- 空状态 -->
    <view class="empty" v-if="menuList.length === 0">
      <text class="empty-icon">🍽️</text>
      <text class="empty-text">还没有选菜哦~</text>
      <view class="empty-btn" @click="goBack">去选菜</view>
    </view>

    <!-- 有菜品时 -->
    <view class="menu-content" v-else>
      <!-- 菜品列表 -->
      <view class="dish-card" v-for="(item, index) in menuList" :key="item.id">
        <SmartImage class="dish-image" :src="item.image" mode="aspectFill" />
        <view class="dish-info">
          <view class="dish-name">{{ item.name }}</view>
          <view class="dish-desc">{{ item.description || "暂无描述" }}</view>
          <view class="dish-meta">
            <text v-if="item.cookTime" class="meta-item"
              >⏱ {{ item.cookTime }}分钟</text
            >
          </view>
        </view>
        <!-- 删除按钮 -->
        <view class="delete-btn" @click="removeDish(index)">
          <text class="delete-icon">×</text>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="bottom-bar">
        <view class="total-info">
          <text class="total-text">共 {{ menuList.length }} 道菜</text>
        </view>
        <view class="action-buttons">
          <view class="btn btn-clear" @click="clearAll">清空</view>
          <view class="btn btn-share" @click="shareToFamily">分享给家人</view>
        </view>
      </view>
    </view>
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-text">共 {{ menuList.length }} 道菜</text>
      </view>
      <view class="action-buttons">
        <view class="btn btn-random" @click="showRandomModal = true"
          >随机抽选</view
        >
        <view class="btn btn-save" @click="saveToHistory">保存到历史</view>
        <view class="btn btn-clear" @click="clearAll">清空</view>
        <view class="btn btn-share" @click="shareToFamily">分享给家人</view>
      </view>
    </view>
  </view>
  <!-- 随机抽选弹窗 -->
  <view class="random-modal" v-if="showRandomModal">
    <view class="modal-mask" @click="closeRandomModal"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">🎲 随机抽选</text>
        <text class="modal-close" @click="closeRandomModal">×</text>
      </view>

      <!-- 步骤1：选择标签和数量 -->
      <view class="modal-body" v-if="randomStep === 1">
        <view class="form-item">
          <text class="form-label">选择标签（可不选）</text>
          <view class="tag-select-list">
            <view
              v-for="tag in allTags"
              :key="tag.id"
              class="tag-select-item"
              :class="{ active: selectedRandomTags.includes(tag.id) }"
              :style="
                selectedRandomTags.includes(tag.id)
                  ? {
                      backgroundColor: tag.color + '30',
                      borderColor: tag.color,
                      color: tag.color,
                    }
                  : {}
              "
              @click="toggleRandomTag(tag.id)"
            >
              {{ tag.name }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">抽取数量</text>
          <view class="quantity-selector">
            <view class="qty-btn" @click="randomCount > 1 && randomCount--"
              >-</view
            >
            <text class="qty-num">{{ randomCount }}</text>
            <view class="qty-btn" @click="randomCount < 10 && randomCount++"
              >+</view
            >
          </view>
        </view>

        <view class="modal-footer">
          <view class="btn btn-primary" @click="doRandom">开始抽选</view>
        </view>
      </view>

      <!-- 步骤2：展示结果 -->
      <view class="modal-body" v-else-if="randomStep === 2">
        <view class="result-title"
          >为你抽到了 {{ randomResult.length }} 道菜：</view
        >
        <view class="result-list">
          <view class="result-item" v-for="item in randomResult" :key="item.id">
            <SmartImage
              class="result-image"
              :src="item.image"
              mode="aspectFill"
            />
            <text class="result-name">{{ item.name }}</text>
          </view>
        </view>

        <view class="modal-footer">
          <view class="btn btn-secondary" @click="randomStep = 1"
            >重新抽选</view
          >
          <view class="btn btn-primary" @click="confirmRandom"
            >加入今日点餐</view
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShareAppMessage, onShow } from "@dcloudio/uni-app";
import SmartImage from "../../components/SmartImage.vue";
import { getTagList } from "../../api/tag";
import { getDishList } from "../../api/dish";
import { saveHistory, getRecentDishIds } from "../../api/history";
import { BASE_URL } from "../../utils/request";

// 今日点餐列表
const menuList = ref<any[]>([]);
// 随机抽选弹窗
const showRandomModal = ref(false);
const randomStep = ref(1); // 1: 选择标签和数量，2: 展示结果
const randomCount = ref(3);
const allTags = ref<any[]>([]);
const selectedRandomTags = ref<number[]>([]);
const randomResult = ref<any[]>([]);

// 从本地存储加载
const loadMenuList = () => {
  const data = uni.getStorageSync("todayMenuList");
  if (data) {
    menuList.value = JSON.parse(data);
  }
};

// 保存到本地存储
const saveMenuList = () => {
  uni.setStorageSync("todayMenuList", JSON.stringify(menuList.value));
};

// 删除某个菜品
const removeDish = (index: number) => {
  uni.showModal({
    title: "提示",
    content: "确定移除这道菜吗？",
    success: (res) => {
      if (res.confirm) {
        menuList.value.splice(index, 1);
        saveMenuList();
        uni.showToast({ title: "已移除", icon: "success" });
      }
    },
  });
};

// 清空所有
const clearAll = () => {
  uni.showModal({
    title: "提示",
    content: "确定清空今日点餐吗？",
    success: (res) => {
      if (res.confirm) {
        menuList.value = [];
        saveMenuList();
        uni.showToast({ title: "已清空", icon: "success" });
      }
    },
  });
};

// 返回列表页
const goBack = () => {
  uni.navigateBack();
};

// 分享给家人
const shareToFamily = () => {
  uni.showToast({
    title: "点击右上角分享",
    icon: "none",
    duration: 2000,
  });
};
// 加载标签列表
const loadTags = async () => {
  try {
    const res: any = await getTagList();
    allTags.value = res;
  } catch (error) {
    console.error("加载标签失败", error);
  }
};

// 切换标签选择
const toggleRandomTag = (tagId: number) => {
  const index = selectedRandomTags.value.indexOf(tagId);
  if (index > -1) {
    selectedRandomTags.value.splice(index, 1);
  } else {
    selectedRandomTags.value.push(tagId);
  }
};

// 执行随机抽选
const doRandom = async () => {
  uni.showLoading({ title: "抽选中..." });

  try {
    // 1. 获取所有菜品（或按标签筛选）
    const res: any = await getDishList({
      page: 1,
      pageSize: 100,
      tagIds:
        selectedRandomTags.value.length > 0
          ? selectedRandomTags.value.join(",")
          : undefined,
    });

    let dishes = res.list;

    // 2. 获取最近 3 天吃过的菜品 ID
    const recentIds: any = await getRecentDishIds(3);
    const recentIdSet = new Set(recentIds);

    // 3. 排除近期吃过的菜
    const filteredDishes = dishes.filter(
      (dish: any) => !recentIdSet.has(dish.id),
    );

    // 4. 如果排除后没有菜了，就用全部菜品
    const finalDishes = filteredDishes.length > 0 ? filteredDishes : dishes;

    // 如果排除后没有菜了，提示用户
    if (filteredDishes.length === 0 && dishes.length > 0) {
      uni.showModal({
        title: "提示",
        content: "最近 3 天这些菜都吃过啦，要包含近期吃过的菜吗？",
        success: (res) => {
          if (res.confirm) {
            // 用户确认，用全部菜品
            const finalDishes = dishes;
            const count = Math.min(randomCount.value, finalDishes.length);
            const shuffled = [...finalDishes].sort(() => Math.random() - 0.5);
            randomResult.value = shuffled.slice(0, count);
            randomStep.value = 2;
          }
        },
      });
      return;
    }

    // 5. 随机抽取
    const count = Math.min(randomCount.value, finalDishes.length);
    const shuffled = [...finalDishes].sort(() => Math.random() - 0.5);
    randomResult.value = shuffled.slice(0, count);

    // 提示排除了多少道菜
    if (filteredDishes.length < dishes.length) {
      uni.showToast({
        title: `已排除近期 ${dishes.length - filteredDishes.length} 道菜`,
        icon: "none",
        duration: 2000,
      });
    }

    randomStep.value = 2;
  } catch (error) {
    console.error("随机抽选失败", error);
    uni.showToast({ title: "抽选失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
};

// 确认加入今日点餐
const confirmRandom = () => {
  randomResult.value.forEach((dish) => {
    const exists = menuList.value.find((item) => item.id === dish.id);
    if (!exists) {
      menuList.value.push(dish);
    }
  });
  saveMenuList();
  closeRandomModal();
  uni.showToast({ title: "已加入今日点餐", icon: "success" });
};

// 关闭弹窗
const closeRandomModal = () => {
  showRandomModal.value = false;
  randomStep.value = 1;
  selectedRandomTags.value = [];
  randomResult.value = [];
};

// 保存到历史记录
const saveToHistory = () => {
  if (menuList.value.length === 0) {
    uni.showToast({ title: "还没有选菜", icon: "none" });
    return;
  }

  uni.showModal({
    title: "提示",
    content: "确定保存今日点餐到历史记录吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          const dishIds = menuList.value.map((item) => item.id);
          await saveHistory(dishIds);
          uni.showToast({ title: "已保存到历史", icon: "success" });
        } catch (error) {
          console.error("保存失败", error);
          uni.showToast({ title: "保存失败", icon: "none" });
        }
      }
    },
  });
};

// 小程序分享配置
onShareAppMessage(() => {
  const dishNames = menuList.value.map((item) => item.name).join("、");

  // 用第一道菜的图片作为分享封面
  let firstDishImage = "";
  if (menuList.value.length > 0 && menuList.value[0].image) {
    const img = menuList.value[0].image;
    firstDishImage = img.startsWith("http") ? img : BASE_URL + img;
  }

  return {
    title: `今天吃：${dishNames}`,
    path: "/pages/index/index",
    imageUrl: firstDishImage,
  };
});

onMounted(() => {
  loadMenuList();
  loadTags(); // 加上这一行
});

// 页面显示时重新加载
onShow(() => {
  loadMenuList();
});
</script>

<style scoped>
.today-menu {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 160rpx;
}

/* 菜品卡片 */
.dish-card {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.dish-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dish-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.dish-desc {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dish-meta {
  margin-top: 10rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

/* 删除按钮 */
.delete-btn {
  position: absolute;
  right: 20rpx;
  top: 20rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  font-size: 30rpx;
  color: #999;
  line-height: 1;
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
  justify-content: space-between;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.total-info {
  flex: 1;
}

.total-text {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.btn {
  padding: 15rpx 30rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.btn-clear {
  background-color: #f5f5f5;
  color: #666;
}

.btn-share {
  background-color: #ff6b6b;
  color: #fff;
}

/* 空状态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 20rpx 60rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
/* 随机抽选按钮 */
.btn-random {
  background-color: #4ecdc4;
  color: #fff;
}

/* 弹窗 */
.random-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600rpx;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: bold;
}

/* 标签选择 */
.tag-select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag-select-item {
  padding: 10rpx 25rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666;
  background-color: #fff;
}

/* 数量选择器 */
.quantity-selector {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.qty-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
}

.qty-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  min-width: 60rpx;
  text-align: center;
}

/* 抽选结果 */
.result-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.result-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.result-item {
  width: 160rpx;
  text-align: center;
}

.result-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
  margin-bottom: 10rpx;
}

.result-name {
  font-size: 24rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗底部 */
.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.btn-primary {
  flex: 1;
  background-color: #ff6b6b;
  color: #fff;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 30rpx;
  font-size: 28rpx;
}

.btn-secondary {
  flex: 1;
  background-color: #f5f5f5;
  color: #666;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 30rpx;
  font-size: 28rpx;
}
.btn-save {
  background-color: #ffa726;
  color: #fff;
}
.btn-history {
  background-color: #9c27b0;
  color: #fff;
}
</style>
