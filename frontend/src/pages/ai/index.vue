<template>
  <view class="chat-page">
    <!-- 右上角操作按钮 -->
    <view class="top-actions">
      <view class="action-btn" @click="goToHistory">
        <text>历史</text>
      </view>
      <view class="action-btn" @click="createNewChat">
        <text>新对话</text>
      </view>
    </view>
    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      scroll-y
      :scroll-into-view="scrollToId"
      scroll-with-animation
    >
      <view
        v-for="(msg, index) in messages"
        :key="msg.id || index"
        :id="'msg-' + index"
        class="message-item"
        :class="{
          user: msg.role === 'user',
          assistant: msg.role === 'assistant',
        }"
      >
        <!-- AI 消息 -->
        <view class="message-content assistant" v-if="msg.role === 'assistant'">
          <view class="avatar ai-avatar">🤖</view>
          <view class="ai-message-wrapper">
            <view class="bubble ai-bubble" v-if="msg.content">
              <text class="bubble-text">{{ msg.content }}</text>
            </view>
            <!-- 推荐菜品卡片 -->
            <view class="dish-cards" v-if="msg.dishes && msg.dishes.length > 0">
              <view class="dish-card" v-for="dish in msg.dishes" :key="dish.id">
                <SmartImage
                  class="dish-card-image"
                  :src="getDishImage(dish)"
                  mode="aspectFill"
                />
                <view class="dish-card-info">
                  <view class="dish-card-name">{{ dish.name }}</view>
                  <view class="dish-card-desc">{{
                    dish.description || "暂无描述"
                  }}</view>
                  <view class="dish-card-tags">
                    <text
                      v-for="tag in dish.tags"
                      :key="tag"
                      class="dish-card-tag"
                    >
                      {{ tag }}
                    </text>
                  </view>
                </view>
                <view class="dish-card-action" @click="addToTodayMenu(dish)">
                  <text class="action-text">加入</text>
                </view>
              </view>
            </view>
            <!-- 新菜谱卡片 -->
            <view
              class="new-recipe-cards"
              v-if="msg.newRecipes && msg.newRecipes.length > 0"
            >
              <view
                class="new-recipe-card"
                v-for="(recipe, idx) in msg.newRecipes"
                :key="idx"
              >
                <view class="recipe-header">
                  <text class="recipe-badge">AI 新菜谱</text>
                  <text class="recipe-name">{{ recipe.name }}</text>
                </view>
                <view class="recipe-info">
                  <text class="recipe-label">食材：</text>
                  <text class="recipe-value">{{ recipe.ingredients }}</text>
                </view>
                <view class="recipe-info">
                  <text class="recipe-label">做法：</text>
                  <text class="recipe-value">{{ recipe.steps }}</text>
                </view>
                <view class="recipe-save-btn" @click="saveNewRecipe(recipe)">
                  保存到菜品库
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 用户消息 -->
        <view class="message-content user" v-else-if="msg.role === 'user'">
          <view class="bubble user-bubble">
            <text class="bubble-text">{{ msg.content }}</text>
          </view>
          <view class="avatar user-avatar">👤</view>
        </view>
      </view>

      <!-- 加载中提示 -->
      <view class="message-item assistant" v-if="loading">
        <view class="message-content assistant">
          <view class="avatar ai-avatar">🤖</view>
          <view class="bubble ai-bubble">
            <text class="bubble-text">正在思考中...</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入栏 -->
    <view class="input-bar">
      <input
        class="message-input"
        v-model="inputText"
        placeholder="输入你想吃什么..."
        confirm-type="send"
        :disabled="loading"
        @confirm="handleSend"
      />
      <view
        class="send-btn"
        :class="{ disabled: loading || !inputText.trim() }"
        @click="handleSend"
      >
        发送
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { onShow, onLoad } from "@dcloudio/uni-app";
import {
  createConversation,
  getConversationMessages,
} from "../../api/ai";
import { BASE_URL } from "../../utils/request";
import SmartImage from "../../components/SmartImage.vue";

// 当前对话 ID
const conversationId = ref<number | null>(null);
// 消息列表
const messages = ref<any[]>([]);
// 输入框内容
const inputText = ref("");
// 加载状态
const loading = ref(false);
// 滚动到的位置
const scrollToId = ref("");

// 初始化：创建或加载对话
const initConversation = async () => {
  try {
    // 先从本地存储取今天的对话 ID
    const today = new Date().toDateString();
    const savedDate = uni.getStorageSync("aiConversationDate");
    const savedId = uni.getStorageSync("aiConversationId");

    if (savedDate === today && savedId) {
      // 今天已有对话，加载历史消息
      conversationId.value = savedId;
      await loadMessages(savedId);
    } else {
      // 新的一天，创建新对话
      const res: any = await createConversation();
      conversationId.value = res.id;
      uni.setStorageSync("aiConversationId", res.id);
      uni.setStorageSync("aiConversationDate", today);
      messages.value = [];
    }
  } catch (error) {
    console.error("初始化对话失败", error);
    uni.showToast({ title: "初始化失败", icon: "none" });
  }
};

// 加载历史消息
const loadMessages = async (id: number) => {
  try {
    const res: any = await getConversationMessages(id);
    messages.value = res;
    scrollToBottom();
  } catch (error) {
    console.error("加载消息失败", error);
    // 对话可能被删除了，自动创建新对话
    uni.showToast({ title: "对话不存在，已创建新对话", icon: "none" });
    await createNewChat();
  }
};

// 发送消息
const handleSend = async () => {
  if (!inputText.value.trim() || loading.value || !conversationId.value) {
    return;
  }

  const content = inputText.value.trim();
  inputText.value = "";
  loading.value = true;

  messages.value.push({
    role: "user",
    content,
  });

  messages.value.push({
    role: "assistant",
    content: "",
    dishes: [],
    newRecipes: [],
  });

  const lastIndex = messages.value.length - 1;

  streamSendMessage(
    conversationId.value,
    content,
    (text) => {
      messages.value[lastIndex].content += text;
      scrollToBottom();
    },
    () => {
      loading.value = false;
      scrollToBottom();
    },
    (err) => {
      console.error("发送失败", err);
      messages.value[lastIndex].content = "抱歉，我出了点问题，请稍后再试。";
      loading.value = false;
      scrollToBottom();
    },
    (dishes) => {
      messages.value[lastIndex].dishes = dishes;
      scrollToBottom();
    },
    (recipes) => {
      messages.value[lastIndex].newRecipes = recipes;
      scrollToBottom();
    },
  );
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    scrollToId.value = "msg-" + (messages.value.length - 1);
  });
};

// 流式发送消息
const streamSendMessage = (
  conversationId: number,
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  onDishes?: (dishes: any[]) => void,
  onNewRecipes?: (recipes: any[]) => void,
) => {
  const token = uni.getStorageSync("token");

  const requestTask = uni.request({
    url: BASE_URL + `/ai/conversation/${conversationId}/stream`,
    method: "POST",
    data: { content },
    enableChunked: true,
    header: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    success: (res) => {
      console.log("流式请求完成", res);
    },
    fail: (err) => {
      onError(err);
    },
  });

  let buffer = ""; // 缓冲区，处理粘包

  (requestTask as any).onChunkReceived((res: any) => {
    const chunk = arrayBufferToString(res.data);
    buffer += chunk;

    // 按 SSE 分隔符分割
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || ""; // 最后一部分可能不完整，留到下一次

    for (const part of parts) {
      if (part.startsWith("data: ")) {
        const dataStr = part.replace("data: ", "");
        if (dataStr === "[DONE]") {
          onDone();
          return;
        }
        try {
          const data = JSON.parse(dataStr);
          if (data.type === "newRecipes" && data.recipes) {
            if (onNewRecipes) {
              onNewRecipes(data.recipes);
            }
            continue;
          }
          if (data.error) {
            onError(data.error);
            return;
          }
          if (data.type === "dishes" && data.dishes) {
            if (onDishes) {
              onDishes(data.dishes);
            }
            continue;
          }
          if (data.content) {
            onChunk(data.content);
          }
        } catch (e) {
          console.error("解析失败", e, dataStr);
        }
      }
    }
  });

  return requestTask;
};

// ArrayBuffer 转字符串
const arrayBufferToString = (buffer: ArrayBuffer) => {
  const uint8 = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < uint8.length; i++) {
    str += String.fromCharCode(uint8[i]);
  }
  return decodeURIComponent(escape(str));
};

// 获取菜品图片地址
const getDishImage = (dish: any) => {
  if (!dish.image) return "";
  return dish.image.startsWith("http") ? dish.image : dish.image;
};

// 加入今日点餐
const addToTodayMenu = (dish: any) => {
  const data = uni.getStorageSync("todayMenuList");
  let menuList = data ? JSON.parse(data) : [];

  const exists = menuList.find((item: any) => item.id === dish.id);
  if (exists) {
    uni.showToast({ title: "已在今日点餐中", icon: "none" });
    return;
  }

  menuList.push({
    id: dish.id,
    name: dish.name,
    image: dish.image,
    description: dish.description,
    cookTime: dish.cookTime,
  });

  uni.setStorageSync("todayMenuList", JSON.stringify(menuList));
  uni.showToast({ title: "已加入今日点餐", icon: "success" });
};

// 跳转到历史对话
const goToHistory = () => {
  uni.navigateTo({
    url: "/pages/ai/history",
  });
};

// 创建新对话
const createNewChat = async () => {
  try {
    const res: any = await createConversation();
    conversationId.value = res.id;
    uni.setStorageSync("aiConversationId", res.id);
    uni.setStorageSync("aiConversationDate", new Date().toDateString());
    messages.value = [];
  } catch (error) {
    console.error("创建对话失败", error);
    uni.showToast({ title: "创建失败", icon: "none" });
  }
};
// 保存新菜谱到菜品库（跳转到新增页预填）
const saveNewRecipe = (recipe: any) => {
  // 把菜谱信息存到本地存储，新增页面读取后预填
  uni.setStorageSync("newRecipeDraft", JSON.stringify(recipe));
  uni.navigateTo({
    url: "/pages/dish/edit",
  });
};

onShow(() => {
  const targetId = uni.getStorageSync("targetConversationId");
  if (targetId) {
    uni.removeStorageSync("targetConversationId");
    conversationId.value = targetId;
    uni.setStorageSync("aiConversationId", targetId);
    uni.setStorageSync("aiConversationDate", new Date().toDateString());
    messages.value = [];
    loadMessages(targetId); // 这里 loadMessages 已经有容错了
    return;
  }

  if (conversationId.value) {
    loadMessages(conversationId.value); // 这里也有容错
  }
});

// 页面加载时接收参数
onLoad((options: any) => {
  // 首次进入时初始化
  initConversation();
});
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
}

.message-item {
  margin-bottom: 30rpx;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
}

.message-content.user {
  flex-direction: row-reverse;
}

/* 头像 */
.avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.ai-avatar {
  background-color: #e3f2fd;
}

.user-avatar {
  background-color: #ffebee;
}

/* 气泡 */
.bubble {
  max-width: 70%;
  padding: 20rpx 25rpx;
  border-radius: 20rpx;
  word-break: break-all;
}

.ai-bubble {
  background-color: #fff;
  border-top-left-radius: 5rpx;
}

.user-bubble {
  background-color: #ff6b6b;
  border-top-right-radius: 5rpx;
}

.user-bubble .bubble-text {
  color: #fff;
}

.bubble-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 底部输入栏 */
.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #e0e0e0;
  gap: 20rpx;
}

.message-input {
  flex: 1;
  height: 70rpx;
  background-color: #f5f5f5;
  border-radius: 35rpx;
  padding: 0 25rpx;
  font-size: 28rpx;
}

.send-btn {
  padding: 15rpx 35rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
}

.send-btn.disabled {
  background-color: #ccc;
}
/* 临时测试按钮 */
.test-btn {
  position: fixed;
  top: 200rpx;
  right: 30rpx;
  padding: 15rpx 25rpx;
  background-color: #4ecdc4;
  color: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
  z-index: 100;
}

/* AI 消息包装器 */
.ai-message-wrapper {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

/* 推荐菜品卡片 */
.dish-cards {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.dish-card {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 15rpx;
  gap: 15rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.dish-card-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.dish-card-info {
  flex: 1;
  min-width: 0;
}

.dish-card-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.dish-card-desc {
  font-size: 22rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6rpx;
}

.dish-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
}

.dish-card-tag {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  background-color: #fff0f0;
  color: #ff6b6b;
  border-radius: 10rpx;
}

.dish-card-action {
  flex-shrink: 0;
  padding: 12rpx 20rpx;
  background-color: #ff6b6b;
  border-radius: 25rpx;
}

.action-text {
  font-size: 22rpx;
  color: #fff;
}
/* 右上角操作按钮 */
.top-actions {
  position: fixed;
  top: 10rpx;
  right: 20rpx;
  display: flex;
  gap: 15rpx;
  z-index: 100;
}

.action-btn {
  padding: 10rpx 20rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
/* 新菜谱卡片 */
.new-recipe-cards {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-top: 10rpx;
}

.new-recipe-card {
  background-color: #fff8e1;
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid #ffe082;
}

.recipe-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.recipe-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background-color: #ff9800;
  color: #fff;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.recipe-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.recipe-info {
  margin-bottom: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
}

.recipe-label {
  color: #ff9800;
  font-weight: bold;
}

.recipe-value {
  color: #666;
}

.recipe-save-btn {
  margin-top: 15rpx;
  padding: 15rpx 0;
  background-color: #ff9800;
  color: #fff;
  text-align: center;
  border-radius: 25rpx;
  font-size: 26rpx;
}
</style>
