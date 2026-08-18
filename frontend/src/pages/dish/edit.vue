<template>
  <view class="dish-edit">
    <form @submit="onSubmit">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>

        <!-- 菜名 -->
        <view class="form-item">
          <view class="label">菜名 <text class="required">*</text></view>
          <input
            class="input"
            v-model="form.name"
            placeholder="请输入菜名"
            maxlength="50"
          />
        </view>

        <!-- 描述 -->
        <view class="form-item">
          <view class="label">菜品描述</view>
          <textarea
            class="textarea"
            v-model="form.description"
            placeholder="简单描述一下这道菜"
            maxlength="200"
          />
        </view>

        <!-- 封面图 -->
        <view class="form-item">
          <view class="label">封面图 <text class="required">*</text></view>
          <view class="image-upload" @click="chooseImage">
            <SmartImage
              v-if="form.image"
              :src="form.image"
              class="preview-image"
              mode="aspectFill"
            />
            <view v-else class="upload-placeholder">
              <text class="plus">+</text>
              <text class="upload-text">上传图片</text>
            </view>
          </view>
        </view>

        <!-- 烹饪时间 -->
        <view class="form-item">
          <view class="label">烹饪时间（分钟）</view>
          <input
            class="input"
            type="number"
            v-model="form.cookTime"
            placeholder="预计烹饪时间"
          />
        </view>

        <!-- 难度 -->
        <view class="form-item">
          <view class="label">难度</view>
          <view class="difficulty-options">
            <view
              v-for="item in difficultyOptions"
              :key="item.value"
              class="difficulty-option"
              :class="{ active: form.difficulty === item.value }"
              @click="
                form.difficulty = item.value as 'EASY' | 'MEDIUM' | 'HARD'
              "
            >
              {{ item.label }}
            </view>
          </view>
        </view>

        <!-- 标签 -->
        <view class="form-item">
          <view class="label">标签 <text class="required">*</text></view>
          <view class="tag-selector">
            <view
              v-for="tag in allTags"
              :key="tag.id"
              class="tag-option"
              :class="{ selected: selectedTagIds.includes(tag.id) }"
              :style="
                selectedTagIds.includes(tag.id)
                  ? {
                      backgroundColor: tag.color + '30',
                      borderColor: tag.color,
                      color: tag.color,
                    }
                  : {}
              "
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </view>
          </view>
          <view class="add-tag-tip" @click="showAddTag = true">
            + 新建标签
          </view>
        </view>

        <!-- 餐次选择 -->
        <view class="form-item">
          <view class="label">适合餐次</view>
          <view class="meal-type-list">
            <view
              v-for="item in mealTypeOptions"
              :key="item.value"
              class="meal-type-item"
              :class="{ active: form.mealTypes.includes(item.value) }"
              @click="toggleMealType(item.value)"
            >
              {{ item.label }}
            </view>
          </view>
        </view>
      </view>

      <!-- 食材清单 -->
      <view class="form-section">
        <view class="section-title">
          食材清单 <text class="required">*</text>
          <text class="add-btn" @click="addIngredient">+ 添加</text>
        </view>

        <view
          v-for="(item, index) in form.ingredients"
          :key="index"
          class="ingredient-row"
        >
          <input
            class="ingredient-input"
            v-model="item.name"
            placeholder="食材名称"
          />
          <input
            class="amount-input"
            v-model="item.amount"
            placeholder="用量"
          />
          <text class="delete-btn" @click="removeIngredient(index)">删除</text>
        </view>

        <view v-if="form.ingredients.length === 0" class="empty-tip">
          暂无食材，点击上方添加
        </view>
      </view>

      <!-- 做法步骤 -->
      <view class="form-section">
        <view class="section-title">
          做法步骤 <text class="required">*</text>
          <text class="add-btn" @click="addStep">+ 添加</text>
        </view>

        <view v-for="(step, index) in form.steps" :key="index" class="step-row">
          <view class="step-number">{{ index + 1 }}</view>
          <textarea
            class="step-textarea"
            v-model="form.steps[index]"
            placeholder="描述这一步怎么做"
          />
          <text class="delete-btn" @click="removeStep(index)">删除</text>
        </view>

        <view v-if="form.steps.length === 0" class="empty-tip">
          暂无步骤，点击上方添加
        </view>
      </view>

      <!-- 抖音链接 -->
      <view class="form-section">
        <view class="section-title">其他</view>
        <view class="form-item">
          <view class="label">抖音参考视频链接</view>
          <input
            class="input"
            v-model="form.douyinUrl"
            placeholder="粘贴抖音视频链接"
          />
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="bottom-bar">
        <button v-if="isEdit" class="delete-btn-bottom" @click="onDelete">
          删除菜品
        </button>
        <button class="submit-btn" @click="onSubmit">
          {{ isEdit ? "保存修改" : "新增菜品" }}
        </button>
      </view>
    </form>

    <!-- 新建标签弹窗 -->
    <view class="modal" v-if="showAddTag" @click="showAddTag = false">
      <view class="modal-content" @click.stop>
        <view class="modal-title">新建标签</view>

        <view class="form-item">
          <view class="label">标签名</view>
          <input
            class="input"
            v-model="newTag.name"
            placeholder="请输入标签名"
          />
        </view>

        <view class="form-item">
          <view class="label">分类</view>
          <view class="category-options">
            <view
              v-for="item in categoryOptions"
              :key="item.value"
              class="category-option"
              :class="{ active: newTag.category === item.value }"
              @click="
                newTag.category = item.value as
                  | 'TASTE'
                  | 'TYPE'
                  | 'SCENE'
                  | 'DIFFICULTY'
              "
            >
              {{ item.label }}
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="label">颜色（可选）</view>
          <view class="color-options">
            <view
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :style="{ backgroundColor: color }"
              :class="{ active: newTag.color === color }"
              @click="newTag.color = color"
            />
          </view>
        </view>

        <view class="modal-buttons">
          <button class="cancel-btn" @click="showAddTag = false">取消</button>
          <button class="confirm-btn" @click="onAddTag">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  createDish,
  updateDish,
  deleteDish,
  getDishDetail,
} from "../../api/dish";
import { getTagList, createTag } from "../../api/tag";
import { request, uploadFile, BASE_URL } from "../../utils/request";
import SmartImage from "../../components/SmartImage.vue";

// 难度选项
const difficultyOptions = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
];
// 餐次选项
const mealTypeOptions = [
  { value: "BREAKFAST", label: "早餐" },
  { value: "LUNCH", label: "午餐" },
  { value: "DINNER", label: "晚餐" },
];

// 切换餐次选择
const toggleMealType = (value: string) => {
  const index = form.value.mealTypes.indexOf(value);
  if (index > -1) {
    form.value.mealTypes.splice(index, 1);
  } else {
    form.value.mealTypes.push(value);
  }
};

// 表单数据
const form = ref({
  name: "",
  description: "",
  image: "",
  cookTime: "",
  difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  ingredients: [] as Array<{ name: string; amount: string }>,
  steps: [] as string[],
  douyinUrl: "",
  mealTypes: [] as string[], // ← 新增：选中的餐次
});

const dishId = ref(0);
const isEdit = computed(() => dishId.value > 0);

// 加载详情（编辑模式）
const loadDetail = async () => {
  try {
    const res: any = await getDishDetail(dishId.value);
    form.value = {
      name: res.name || "",
      description: res.description || "",
      image: res.image || "", // 直接赋值，相对路径也行，SmartImage 会处理
      cookTime: res.cookTime?.toString() || "",
      difficulty: res.difficulty || "MEDIUM",
      ingredients: res.ingredients || [],
      steps: res.steps || [],
      douyinUrl: res.douyinUrl || "",
      mealTypes: res.mealTypes || [], // ← 新增
    };
    // 回显标签
    selectedTagIds.value = res.tags?.map((item: any) => item.tagId) || [];
  } catch (error) {
    console.error("加载详情失败", error);
  }
};

// 添加食材
const addIngredient = () => {
  form.value.ingredients.push({ name: "", amount: "" });
};

// 删除食材
const removeIngredient = (index: number) => {
  form.value.ingredients.splice(index, 1);
};

// 添加步骤
const addStep = () => {
  form.value.steps.push("");
};

// 删除步骤
const removeStep = (index: number) => {
  form.value.steps.splice(index, 1);
};

// 选择图片并上传
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0];

      // 先显示本地图片预览
      form.value.image = tempFilePath;

      try {
        // 上传到后端
        const uploadRes: any = await uploadFile(tempFilePath);
        console.log("上传返回：", uploadRes); // 加上这一行，看看返回了什么
        // 只存相对路径，不拼接 BASE_URL
        form.value.image = uploadRes.url;

        uni.showToast({ title: "上传成功", icon: "success" });
      } catch (error) {
        console.error("上传失败", error);
        form.value.image = "";
        uni.showToast({ title: "上传失败", icon: "none" });
      }
    },
  });
};

// 提交表单
const onSubmit = async () => {
  // 1. 校验菜名
  if (!form.value.name.trim()) {
    uni.showToast({ title: "请输入菜名", icon: "none" });
    return;
  }

  // 2. 校验封面图
  if (!form.value.image) {
    uni.showToast({ title: "请上传封面图", icon: "none" });
    return;
  }

  // 3. 校验标签
  if (selectedTagIds.value.length === 0) {
    uni.showToast({ title: "请至少选择一个标签", icon: "none" });
    return;
  }

  // 4. 校验食材清单
  const validIngredients = form.value.ingredients.filter((item) =>
    item.name.trim(),
  );
  if (validIngredients.length === 0) {
    uni.showToast({ title: "请至少添加一个食材", icon: "none" });
    return;
  }

  // 5. 校验做法步骤
  const validSteps = form.value.steps.filter((step) => step.trim());
  if (validSteps.length === 0) {
    uni.showToast({ title: "请至少添加一个步骤", icon: "none" });
    return;
  }

  try {
    // 组装数据
    const submitData: any = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      image: form.value.image, // 直接用，已经是相对路径
      cookTime: form.value.cookTime
        ? parseInt(form.value.cookTime, 10)
        : undefined,
      difficulty: form.value.difficulty,
      ingredients: validIngredients, // 用过滤后的有效食材
      steps: validSteps, // 用过滤后的有效步骤
      douyinUrl: form.value.douyinUrl.trim(),
      tagIds: selectedTagIds.value,
      mealTypes: form.value.mealTypes, // ← 新增
    };

    if (isEdit.value) {
      // 编辑模式
      await updateDish(dishId.value, submitData);
      uni.showToast({ title: "修改成功", icon: "success" });
    } else {
      // 新增模式
      await createDish(submitData);
      uni.showToast({ title: "新增成功", icon: "success" });
    }

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    console.error("提交失败", error);
    uni.showToast({ title: "提交失败，请重试", icon: "none" });
  }
};

// 删除菜品
const onDelete = () => {
  uni.showModal({
    title: "确认删除",
    content: "确定要删除这道菜吗？删除后无法恢复",
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteDish(dishId.value);
          uni.showToast({ title: "删除成功", icon: "success" });
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/index/index",
            });
          }, 1500);
        } catch (error) {
          console.error("删除失败", error);
        }
      }
    },
  });
};

// 所有标签
const allTags = ref<any[]>([]);
// 已选的标签 id
const selectedTagIds = ref<number[]>([]);

// 加载所有标签
const loadTags = async () => {
  try {
    const res: any = await getTagList();
    allTags.value = res;
  } catch (error) {
    console.error("加载标签失败", error);
  }
};

// 切换标签选中状态
const toggleTag = (tagId: number) => {
  const index = selectedTagIds.value.indexOf(tagId);
  if (index > -1) {
    selectedTagIds.value.splice(index, 1);
  } else {
    selectedTagIds.value.push(tagId);
  }
};

// 新建标签弹窗
const showAddTag = ref(false);
const newTag = ref({
  name: "",
  category: "TASTE" as "TASTE" | "TYPE" | "SCENE" | "DIFFICULTY",
  color: "#ff6b6b",
});

// 分类选项
const categoryOptions = [
  { label: "口味", value: "TASTE" },
  { label: "类型", value: "TYPE" },
  { label: "场景", value: "SCENE" },
  { label: "难度", value: "DIFFICULTY" },
];

// 颜色选项
const colorOptions = [
  "#ff6b6b",
  "#ffa94d",
  "#ffd43b",
  "#69db7c",
  "#4dabf7",
  "#9775fa",
  "#f783ac",
  "#868e96",
];

// 新建标签
const onAddTag = async () => {
  if (!newTag.value.name.trim()) {
    uni.showToast({ title: "请输入标签名", icon: "none" });
    return;
  }

  try {
    const res: any = await createTag({
      name: newTag.value.name.trim(),
      category: newTag.value.category,
      color: newTag.value.color,
    });

    // 把新标签加到列表里
    allTags.value.unshift(res);
    // 自动选中新标签
    selectedTagIds.value.push(res.id);

    // 关闭弹窗，重置表单
    showAddTag.value = false;
    newTag.value = {
      name: "",
      category: "TASTE",
      color: "#ff6b6b",
    };

    uni.showToast({ title: "创建成功", icon: "success" });
  } catch (error) {
    console.error("创建标签失败", error);
  }
};

// 页面加载
onLoad((options: any) => {
  // 先加载标签列表
  loadTags();

  if (options.id) {
    dishId.value = parseInt(options.id, 10);
    loadDetail();
  }

  // 新增：从 AI 新菜谱预填
  const draft = uni.getStorageSync("newRecipeDraft");
  if (draft) {
    const recipe = JSON.parse(draft);
    form.value.name = recipe.name;
    // 食材解析（逗号分隔）
    if (recipe.ingredients) {
      form.value.ingredients = recipe.ingredients
        .split(/[,，]/)
        .map((item: string) => ({
          name: item.trim(),
          amount: "",
        }));
    }
    // 做法解析（分号分隔）
    if (recipe.steps) {
      form.value.steps = recipe.steps
        .split(/[;；]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    // 用完清除
    uni.removeStorageSync("newRecipeDraft");
    uni.showToast({ title: "已预填菜谱信息", icon: "none" });
  }
});
</script>

<style scoped>
.dish-edit {
  padding-bottom: 160rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.form-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-btn {
  font-size: 26rpx;
  color: #ff6b6b;
  font-weight: normal;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.required {
  color: #ff6b6b;
}

.input {
  height: 80rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  height: 160rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 图片上传 */
.image-upload {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ccc;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.plus {
  font-size: 60rpx;
  line-height: 1;
  margin-bottom: 10rpx;
}

.upload-text {
  font-size: 24rpx;
}

/* 难度选择 */
.difficulty-options {
  display: flex;
  gap: 20rpx;
}

.difficulty-option {
  flex: 1;
  height: 70rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
}

.difficulty-option.active {
  border-color: #ff6b6b;
  background-color: #fff0f0;
  color: #ff6b6b;
}

/* 食材清单 */
.ingredient-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.ingredient-input {
  flex: 1;
  height: 70rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
}

.amount-input {
  width: 150rpx;
  height: 70rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 15rpx;
  font-size: 26rpx;
}

.delete-btn {
  font-size: 24rpx;
  color: #ff6b6b;
  flex-shrink: 0;
}

/* 做法步骤 */
.step-row {
  display: flex;
  gap: 15rpx;
  margin-bottom: 20rpx;
  align-items: flex-start;
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
  margin-top: 10rpx;
}

.step-textarea {
  flex: 1;
  height: 120rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 15rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.empty-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #fff;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  flex: 1;
  height: 80rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 40rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn-bottom {
  width: 200rpx;
  height: 80rpx;
  background-color: #fff;
  color: #ff6b6b;
  border: 1rpx solid #ff6b6b;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 标签选择 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag-option {
  padding: 10rpx 25rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #fff;
}

.tag-option.selected {
  background-color: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.add-tag-tip {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #ff6b6b;
}
/* 弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 600rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 30rpx;
}

/* 分类选择 */
.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.category-option {
  flex: 1;
  min-width: 120rpx;
  height: 60rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
}

.category-option.active {
  border-color: #ff6b6b;
  background-color: #fff0f0;
  color: #ff6b6b;
}

/* 颜色选择 */
.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.color-option {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 0 0 2rpx #e0e0e0;
}

.color-option.active {
  box-shadow: 0 0 0 4rpx #333;
}

/* 弹窗按钮 */
.modal-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.cancel-btn {
  flex: 1;
  height: 70rpx;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 35rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-btn {
  flex: 1;
  height: 70rpx;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 餐次选择 */
.meal-type-list {
  display: flex;
  gap: 20rpx;
}

.meal-type-item {
  padding: 15rpx 40rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  background-color: #fff;
}

.meal-type-item.active {
  background-color: #fff0f0;
  border-color: #ff6b6b;
  color: #ff6b6b;
}
</style>
