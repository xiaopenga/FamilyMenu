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

    <!-- 有数据时显示列表 -->
    <view class="list-content" v-else-if="list.length > 0">
      <!-- 原来的菜品列表代码，保持不变 -->
      <view
        v-for="item in list"
        :key="item.id"
        class="dish-card"
        @click="goToDetail(item.id)"
      >
        <SmartImage class="dish-image" :src="item.image" mode="aspectFill" />
        <view class="dish-info">
          <view class="dish-name">{{ item.name }}</view>
          <view class="dish-desc">{{ item.description || "暂无描述" }}</view>
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
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more">
        <text v-if="loading">加载中...</text>
        <text v-else-if="noMore">没有更多了</text>
        <text v-else>上拉加载更多</text>
      </view>
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
import { onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import { getDishList } from "../../api/dish";
import { getTagList } from "../../api/tag";
import SmartImage from "../../components/SmartImage.vue";

// 数据
const list = ref<any[]>([]);
const keyword = ref("");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const noMore = ref(false);
const error = ref(false); // 加上这一行，记录是否加载失败

// 加载列表
const loadList = async (isRefresh = false) => {
  if (loading.value) return;

  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
    list.value = [];
    error.value = false; // 加上这一行，刷新时重置错误状态
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
          : undefined, // 把数组转成逗号分隔的字符串
    });
    console.log("菜品列表数据：", res.list); // 加上这一行，看看图片 URL 是什么

    if (page.value === 1) {
      list.value = res.list;
    } else {
      list.value = [...list.value, ...res.list];
    }

    total.value = res.total;

    // 判断是否还有更多
    if (list.value.length >= total.value) {
      noMore.value = true;
    } else {
      page.value++;
    }
  } catch (err: any) {
    console.error("加载列表失败", err);
    // 只有首次加载（page=1）失败才显示错误状态
    if (page.value === 1) {
      err.value = true;
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
  // 重新加载列表
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

// 页面加载时获取数据
onMounted(() => {
  loadTags(); // 加载标签
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

/* 列表内容 */
.list-content {
  padding: 20rpx 30rpx;
}

/* 菜品卡片 */
.dish-card {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
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

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 30rpx;
  font-size: 24rpx;
  color: #999;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 100rpx 0;
  font-size: 28rpx;
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

/* 空状态优化 */
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
