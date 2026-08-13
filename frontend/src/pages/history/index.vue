<template>
  <view class="history-page">
    <!-- 月份切换 -->
    <view class="month-header">
      <view class="month-btn" @click="prevMonth">‹</view>
      <text class="month-title">{{ currentYear }}年{{ currentMonth }}月</text>
      <view class="month-btn" @click="nextMonth">›</view>
    </view>

    <!-- 星期标题 -->
    <view class="week-header">
      <text class="week-item" v-for="day in weekDays" :key="day">{{
        day
      }}</text>
    </view>

    <!-- 日历格子 -->
    <view class="calendar-grid">
      <view
        class="calendar-cell"
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="{
          empty: !day.day,
          today: day.isToday,
          selected: day.date === selectedDate,
          hasHistory: day.hasHistory,
        }"
        @click="day.day && selectDate(day.date)"
      >
        <text class="day-num">{{ day.day || "" }}</text>
        <view class="history-dot" v-if="day.hasHistory"></view>
      </view>
    </view>

    <!-- 选中日期的历史记录 -->
    <view class="history-detail">
      <view class="detail-title"> {{ selectedDateText }} 吃了什么 </view>

      <!-- 加载中 -->
      <view class="loading" v-if="loading">
        <text>加载中...</text>
      </view>

      <!-- 没有记录 -->
      <view class="no-record" v-else-if="dayDishes.length === 0">
        <text>这天没有记录哦~</text>
      </view>

      <!-- 菜品列表 -->
      <view class="dish-list" v-else>
        <view
          class="dish-card"
          v-for="item in dayDishes"
          :key="item.id"
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
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { getMonthHistory, getDayHistory } from "../../api/history";
import SmartImage from "../../components/SmartImage.vue";

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

// 当前显示的年月
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// 选中的日期
const selectedDate = ref("");
const selectedDateText = ref("");

// 当月有历史记录的日期集合
const historyDates = ref<Set<string>>(new Set());

// 当天的菜品列表
const dayDishes = ref<any[]>([]);
const loading = ref(false);

// 生成日历数据
const calendarDays = computed(() => {
  const days: any[] = [];

  // 当月第一天
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1);
  const firstDayWeek = firstDay.getDay(); // 0-6，0是周日

  // 当月天数
  const daysInMonth = new Date(
    currentYear.value,
    currentMonth.value,
    0,
  ).getDate();

  // 今天
  const today = new Date();
  const todayStr = formatDate(today);

  // 前面的空格
  for (let i = 0; i < firstDayWeek; i++) {
    days.push({ day: null, date: "", isToday: false, hasHistory: false });
  }

  // 当月的天
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i);
    const dateStr = formatDate(date);
    days.push({
      day: i,
      date: dateStr,
      isToday: dateStr === todayStr,
      hasHistory: historyDates.value.has(dateStr),
    });
  }

  return days;
});

// 格式化日期 YYYY-MM-DD
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 加载当月历史记录
const loadMonthHistory = async () => {
  try {
    const res: any = await getMonthHistory(
      currentYear.value,
      currentMonth.value,
    );
    // 把有记录的日期存到集合里
    const dates = new Set<string>();
    res.forEach((item: any) => {
      const date = new Date(item.date);
      dates.add(formatDate(date));
    });
    historyDates.value = dates;
  } catch (error) {
    console.error("加载月度历史失败", error);
  }
};

// 选择日期，加载当天历史
const selectDate = async (date: string) => {
  selectedDate.value = date;
  selectedDateText.value = date;
  loading.value = true;
  dayDishes.value = [];

  try {
    const res: any = await getDayHistory(date);
    dayDishes.value = res.dishes || [];
  } catch (error) {
    console.error("加载当日历史失败", error);
    uni.showToast({ title: "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
};

// 上一个月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  loadMonthHistory();
};

// 下一个月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  loadMonthHistory();
};

// 跳转到详情
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/dish/detail?id=${id}`,
  });
};

onMounted(() => {
  // 默认选中今天
  const today = formatDate(new Date());
  selectDate(today);
  loadMonthHistory();
});
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 月份切换 */
.month-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  background-color: #fff;
  gap: 60rpx;
}

.month-btn {
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

.month-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  min-width: 200rpx;
  text-align: center;
}

/* 星期标题 */
.week-header {
  display: flex;
  background-color: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.week-item {
  flex: 1;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

/* 日历格子 */
.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  background-color: #fff;
  padding: 10rpx;
}

.calendar-cell {
  width: calc(100% / 7);
  height: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.calendar-cell.empty {
  background-color: transparent;
}

.day-num {
  font-size: 28rpx;
  color: #333;
}

.calendar-cell.today .day-num {
  color: #ff6b6b;
  font-weight: bold;
}

.calendar-cell.selected {
  background-color: #fff0f0;
}

.calendar-cell.selected .day-num {
  color: #ff6b6b;
  font-weight: bold;
}

/* 有历史记录的小圆点 */
.history-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #4ecdc4;
  margin-top: 6rpx;
}

/* 历史详情 */
.history-detail {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.detail-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.loading,
.no-record {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #999;
}

/* 菜品卡片 */
.dish-card {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.dish-card:last-child {
  border-bottom: none;
}

.dish-image {
  width: 140rpx;
  height: 140rpx;
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
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.dish-desc {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.dish-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag {
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 20rpx;
  background-color: #f0f0f0;
  color: #666;
}
</style>
