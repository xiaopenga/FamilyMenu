<template>
  <view class="history-page">
    <!-- 空状态 -->
    <view class="empty" v-if="list.length === 0 && !loading">
      <text class="empty-icon">💬</text>
      <text class="empty-text">还没有对话记录</text>
    </view>

    <!-- 对话列表 -->
    <view class="conversation-list" v-else>
      <view
        class="conversation-item"
        v-for="item in list"
        :key="item.id"
        @click="goToConversation(item)"
      >
        <view class="conversation-info">
          <text class="conversation-title">{{ item.title }}</text>
          <text class="conversation-time">{{
            formatTime(item.updatedAt)
          }}</text>
        </view>
        <view class="conversation-actions">
          <view class="delete-btn" @click.stop="deleteItem(item)">
            <text>删除</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 底部新对话按钮 -->
    <view class="new-chat-btn" @click="createNewChat">
      <text>+ 新对话</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  getConversationList,
  deleteConversation,
  createConversation,
} from "../../api/ai";

const list = ref<any[]>([]);
const loading = ref(false);

// 加载对话列表
const loadList = async () => {
  loading.value = true;
  try {
    const res: any = await getConversationList();
    list.value = res;
  } catch (error) {
    console.error("加载对话列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  if (isYesterday) {
    return `昨天 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 进入对话
const goToConversation = (item: any) => {
  // 把对话 ID 存到本地存储
  uni.setStorageSync("targetConversationId", item.id);
  // 用 switchTab 跳转到 AI 页面（tabBar 页面必须用 switchTab）
  uni.switchTab({
    url: "/pages/ai/index",
  });
};

// 删除对话
const deleteItem = (item: any) => {
  uni.showModal({
    title: "提示",
    content: "确定删除这个对话吗？",
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteConversation(item.id);
          list.value = list.value.filter((i) => i.id !== item.id);
          uni.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          console.error("删除失败", error);
          uni.showToast({ title: "删除失败", icon: "none" });
        }
      }
    },
  });
};

// 创建新对话
const createNewChat = async () => {
  try {
    const res: any = await createConversation();
    // 存新对话 ID
    uni.setStorageSync("targetConversationId", res.id);
    uni.switchTab({
      url: "/pages/ai/index",
    });
  } catch (error) {
    console.error("创建对话失败", error);
    uni.showToast({ title: "创建失败", icon: "none" });
  }
};

onMounted(() => {
  loadList();
});

onShow(() => {
  loadList();
});
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 140rpx;
}

/* 对话列表 */
.conversation-list {
  padding: 20rpx;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 24rpx;
  color: #999;
}

.conversation-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-shrink: 0;
}

.delete-btn {
  padding: 10rpx 20rpx;
  background-color: #fff0f0;
  color: #ff6b6b;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

/* 新对话按钮 */
.new-chat-btn {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 25rpx 80rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 40rpx;
  font-size: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 107, 107, 0.4);
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
}
</style>
