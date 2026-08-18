<template>
  <view class="dish-list">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索菜名"
        confirm-type="search"
        @confirm="onSearch"
      />
    </view>

    <!-- 标签筛选栏 -->
    <scroll-view class="tag-filter" scroll-x="true" v-if="allTags.length > 0">
      <view
        class="tag-item"
        :class="{ active: selectedTagIds.length === 0 }"
        @click="clearTagFilter"
      >
        全部
      </view>
      <view
        v-for="tag in allTags"
        :key="tag.id"
        class="tag-item"
        :class="{ active: selectedTagIds.includes(tag.id) }"
        :style="
          selectedTagIds.includes(tag.id)
            ? {
                backgroundColor: tag.color + '30',
                borderColor: tag.color,
                color: tag.color,
              }
            : {}
        "
        @click="toggleTagFilter(tag.id)"
      >
        {{ tag.name }}
      </view>
    </scroll-view>

    <!-- 首次加载中 -->
    <view class="loading-center" v-if="loading && list.length === 0 && !error">
      <text>加载中...</text>
    </view>

    <!-- 加载失败 -->
    <view class="error-center" v-else-if="error">
      <text class="error-text">加载失败，点击重试</text>
      <view class="retry-btn" @click="loadList(true)">重新加载</view>
    </view>

    <!-- 有数据时显示左右联动列表 -->
    <view class="main-content" v-else-if="list.length > 0">
      <!-- 左侧分类导航 -->
      <scroll-view class="left-nav" scroll-y="true">
        <view
          v-for="(item, index) in mealTypeList"
          :key="item.value"
          class="nav-item"
          :class="{ active: currentMealType === item.value }"
          @click="scrollToMealType(item.value, index)"
        >
          {{ item.label }}
        </view>
      </scroll-view>

      <!-- 右侧菜品列表 -->
      <scroll-view
        class="right-list"
        scroll-y="true"
        :scroll-into-view="scrollIntoViewId"
        @scroll="onRightScroll"
      >
        <!-- 每个餐次一个分组 -->
        <view
          v-for="meal in mealTypeList"
          :key="meal.value"
          :id="'group-' + meal.value"
          class="meal-group"
        >
          <view class="group-title">{{ meal.label }}</view>

          <!-- 该餐次下的菜品 -->
          <view
            v-for="item in getDishesByMealType(meal.value)"
            :key="item.id"
            class="dish-card"
            @click="goToDetail(item.id)"
          >
            <SmartImage
              class="dish-image"
              :src="item.image"
              mode="aspectFill"
            />
            <view class="dish-info">
              <view class="dish-name">{{ item.name }}</view>
              <view class="dish-desc">{{
                item.description || "暂无描述"
              }}</view>
              <view class="dish-meta">
                <text v-if="item.cookTime" class="meta-item"
                  >⏱ {{ item.cookTime }}分钟</text
                >
                <view class="tag-list">
                  <text
                    v-for="tagItem in item.tags"
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
              <!-- 加入今日点餐按钮 -->
              <view class="add-btn" @click.stop="addToTodayMenu(item)">+</view>
            </view>
          </view>

          <!-- 该餐次下没有菜品 -->
          <view
            class="empty-group"
            v-if="getDishesByMealType(meal.value).length === 0"
          >
            暂无{{ meal.label }}菜品
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="noMore">没有更多了</text>
          <text v-else>上拉加载更多</text>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx"></view>
      </scroll-view>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-else>
      <text class="empty-icon">🍽️</text>
      <text class="empty-text">暂无菜品，快去添加吧~</text>
      <view class="empty-btn" @click="goToAdd">去添加</view>
    </view>

    <!-- 浮动新增按钮 -->
    <view class="fab-button" @click="goToAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import { getDishList } from "../../api/dish";
import { getTagList } from "../../api/tag";
import SmartImage from "../../components/SmartImage.vue";

// 餐次列表
const mealTypeList = [
  { value: "BREAKFAST", label: "早餐" },
  { value: "LUNCH", label: "午餐" },
  { value: "DINNER", label: "晚餐" },
];

// 数据
const list = ref<any[]>([]);
const keyword = ref("");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const noMore = ref(false);
const error = ref(false);

// 左右联动相关
const currentMealType = ref("BREAKFAST");
const scrollIntoViewId = ref("");

// 今日点餐列表（先存在本地，后面可以存后端）
const todayMenuList = ref<any[]>([]);

// 按餐次筛选菜品（兼容没有 mealTypes 的旧数据）
const getDishesByMealType = (mealType: string) => {
  return list.value.filter((item) => {
    // 如果没有 mealTypes 字段，默认归到午餐和晚餐
    if (!item.mealTypes || item.mealTypes.length === 0) {
      return mealType === "LUNCH" || mealType === "DINNER";
    }
    return item.mealTypes.includes(mealType);
  });
};

// 点击左侧分类，滚动到右侧对应分组
const scrollToMealType = (mealType: string) => {
  currentMealType.value = mealType;
  scrollIntoViewId.value = "group-" + mealType;
};

// 防抖定时器
let scrollTimer: any = null;

// 右侧滚动时，计算当前在哪个分组（加防抖）
const onRightScroll = (e: any) => {
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }
  scrollTimer = setTimeout(() => {
    const query = uni.createSelectorQuery();
    mealTypeList.forEach((meal) => {
      query.select("#group-" + meal.value).boundingClientRect((rect: any) => {
        if (rect && rect.top <= 150 && rect.bottom > 150) {
          currentMealType.value = meal.value;
        }
      });
    });
    query.exec();
  }, 100); // 100ms 防抖
};

// 从本地存储加载
const loadTodayMenu = () => {
  const data = uni.getStorageSync("todayMenuList");
  if (data) {
    todayMenuList.value = JSON.parse(data);
  }
};

// 保存到本地存储
const saveTodayMenu = () => {
  uni.setStorageSync("todayMenuList", JSON.stringify(todayMenuList.value));
};

// 加入今日点餐
const addToTodayMenu = (dish: any) => {
  const exists = todayMenuList.value.find((item) => item.id === dish.id);
  if (exists) {
    uni.showToast({ title: "已在今日点餐中", icon: "none" });
    return;
  }
  todayMenuList.value.push(dish);
  saveTodayMenu(); // 保存到本地存储
  uni.showToast({ title: "已加入今日点餐", icon: "success" });
};

// 加载列表
const loadList = async (isRefresh = false) => {
  if (loading.value) return;

  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
    list.value = [];
    error.value = false;
  }

  if (noMore.value) return;

  loading.value = true;
  try {
    const res: any = await getDishList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      tagIds:
        selectedTagIds.value.length > 0
          ? selectedTagIds.value.join(",")
          : undefined,
    });

    if (page.value === 1) {
      list.value = res.list;
    } else {
      list.value = [...list.value, ...res.list];
    }

    total.value = res.total;

    if (list.value.length >= total.value) {
      noMore.value = true;
    } else {
      page.value++;
    }
  } catch (err: any) {
    console.error("加载列表失败", err);
    if (page.value === 1) {
      error.value = true;
    } else {
      uni.showToast({ title: "加载失败", icon: "none" });
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const onSearch = () => {
  loadList(true);
};

// 跳转到详情
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/dish/detail?id=${id}`,
  });
};

// 跳转到新增页面
const goToAdd = () => {
  uni.navigateTo({
    url: "/pages/dish/edit",
  });
};

// 所有标签
const allTags = ref<any[]>([]);
// 已选的标签 id
const selectedTagIds = ref<number[]>([]);

// 加载标签列表
const loadTags = async () => {
  try {
    const res: any = await getTagList();
    allTags.value = res;
  } catch (error) {
    console.error("加载标签失败", error);
  }
};

// 切换标签筛选
const toggleTagFilter = (tagId: number) => {
  const index = selectedTagIds.value.indexOf(tagId);
  if (index > -1) {
    selectedTagIds.value.splice(index, 1);
  } else {
    selectedTagIds.value.push(tagId);
  }
  loadList(true);
};

// 清除标签筛选
const clearTagFilter = () => {
  selectedTagIds.value = [];
  loadList(true);
};

// 上拉加载更多
onReachBottom(() => {
  loadList();
});

// 下拉刷新
onPullDownRefresh(async () => {
  try {
    await loadList(true);
  } finally {
    uni.stopPullDownRefresh();
  }
});

// 页面加载时获取数据
onMounted(() => {
  loadTags();
});
onShow(() => {
  noMore.value = false;
  loadList();
  loadTodayMenu(); // 加上这一行
});
</script>

<style scoped>
.dish-list {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 搜索栏 */
.search-bar {
  padding: 20rpx 30rpx;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-input {
  height: 70rpx;
  background-color: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

/* 标签筛选栏 */
.tag-filter {
  white-space: nowrap;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.tag-item {
  display: inline-block;
  padding: 10rpx 25rpx;
  margin-right: 15rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #fff;
}

.tag-item.active {
  background-color: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

/* 左右联动主区域 */
.main-content {
  display: flex;
  height: calc(100vh - 200rpx);
}

/* 左侧导航 */
.left-nav {
  width: 160rpx;
  height: 100%;
  background-color: #f5f5f5;
}

.nav-item {
  padding: 40rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.nav-item.active {
  background-color: #fff;
  color: #ff6b6b;
  font-weight: bold;
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 40rpx;
  background-color: #ff6b6b;
  border-radius: 0 6rpx 6rpx 0;
}

/* 右侧列表 */
.right-list {
  flex: 1;
  height: 100%;
  padding: 20rpx;
}

/* 餐次分组 */
.meal-group {
  margin-bottom: 40rpx;
}

.group-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
  border-left: 6rpx solid #ff6b6b;
}

.empty-group {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #999;
}

/* 菜品卡片 */
.dish-card {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.dish-image {
  width: 180rpx;
  height: 180rpx;
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
  font-size: 32rpx;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background-color: #f0f0f0;
  color: #666;
}

/* 加入今日点餐按钮 */
.add-btn {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background-color: #ff6b6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  line-height: 1;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 30rpx;
  font-size: 24rpx;
  color: #999;
}

/* 浮动按钮 */
.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #ff6b6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(255, 107, 107, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 60rpx;
  line-height: 1;
  font-weight: 300;
}

/* 居中加载 */
.loading-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  font-size: 28rpx;
  color: #999;
}

/* 居中错误 */
.error-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.error-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.retry-btn {
  padding: 15rpx 50rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 30rpx;
  font-size: 26rpx;
}

/* 空状态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 150rpx 0;
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
</style>
