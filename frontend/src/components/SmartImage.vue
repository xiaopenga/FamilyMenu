<template>
  <image
    class="smart-image"
    :src="localPath || placeholder"
    :mode="mode"
    @click="onClick"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { BASE_URL } from "../utils/request";

const props = withDefaults(
  defineProps<{
    src: string;
    mode?: string;
    placeholder?: string;
  }>(),
  {
    mode: "aspectFill",
    placeholder: "",
  },
);

const emit = defineEmits(["click"]);

const localPath = ref("");
const retryCount = ref(0);
const MAX_RETRY = 3; // 最多重试 3 次

// 下载图片（带重试）
const downloadImage = async (url: string) => {
  if (!url) {
    localPath.value = "";
    return;
  }

  // 如果是本地路径，直接用
  if (url.startsWith("wxfile://") || url.startsWith("http://tmp")) {
    localPath.value = url;
    return;
  }

  // 如果是相对路径，拼接完整 URL
  const fullUrl = url.startsWith("http") ? url : BASE_URL + url;

  try {
    const res = await uni.downloadFile({
      url: fullUrl,
      header: {},
    });

    if (res.statusCode === 200) {
      localPath.value = res.tempFilePath;
      retryCount.value = 0; // 下载成功，重置重试次数
    } else {
      console.error("图片下载失败，状态码：", res.statusCode);
      handleRetry(url);
    }
  } catch (error) {
    console.error("图片下载失败", error);
    handleRetry(url);
  }
};

// 处理重试
const handleRetry = (url: string) => {
  if (retryCount.value < MAX_RETRY) {
    retryCount.value++;
    console.log(`图片下载重试第 ${retryCount.value} 次`);
    // 延迟 1 秒后重试
    setTimeout(() => {
      downloadImage(url);
    }, 1000);
  } else {
    console.error("图片下载失败，已达最大重试次数");
    localPath.value = props.placeholder;
  }
};

// 监听 src 变化
watch(
  () => props.src,
  (newSrc) => {
    retryCount.value = 0; // 切换图片时重置重试次数
    downloadImage(newSrc);
  },
  { immediate: true },
);

const onClick = () => {
  emit("click");
};
</script>

<style scoped>
.smart-image {
  width: 100%;
  height: 100%;
  min-height: 200rpx;
  background-color: #f5f5f5; /* 加载中/失败时的背景色 */
}
</style>
