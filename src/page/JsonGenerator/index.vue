<template>
  <div class="json-generator">
    <van-nav-bar title="JSON 生成器" left-arrow @click-left="$router.back()" fixed placeholder>
      <template #right>
        <van-space>
          <van-button size="small" type="primary" @click="showImport = true">导入</van-button>
          <van-button size="small" type="success" @click="copyJson">复制</van-button>
        </van-space>
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="QuestionItemList" name="question">
        <van-form class="editor-form">
          <van-cell-group
            inset
            v-for="(item, index) in questionList"
            :key="index"
            :title="`Item ${index + 1}`"
          >
            <template #right-icon>
              <van-icon name="delete" color="red" @click="removeQuestionItem(index)" />
            </template>
            <van-field
              v-model="item.text"
              label="Text"
              placeholder="问题文本"
              autosize
              type="textarea"
            />
            <van-field
              v-model="item.tips"
              label="Tips"
              placeholder="提示文本"
              autosize
              type="textarea"
            />
            <van-field v-model="item.img" label="Image URL" placeholder="图片链接" />
            <van-field v-model="item.video" label="Video URL" placeholder="视频链接" />
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" icon="plus" @click="addQuestionItem"
              >添加条目</van-button
            >
          </div>
        </van-form>
      </van-tab>

      <van-tab title="ThreadItemList" name="thread">
        <van-form class="editor-form">
          <van-cell-group
            inset
            v-for="(item, index) in threadList"
            :key="index"
            :title="`Item ${index + 1}`"
          >
            <template #right-icon>
              <van-icon name="delete" color="red" @click="removeThreadItem(index)" />
            </template>

            <van-field name="type" label="Type">
              <template #input>
                <van-radio-group v-model="item.type" direction="horizontal">
                  <van-radio name="text">Text</van-radio>
                  <van-radio name="url">URL</van-radio>
                  <van-radio name="img">Image</van-radio>
                  <van-radio name="video">Video</van-radio>
                  <van-radio name="letter">Letter</van-radio>
                </van-radio-group>
              </template>
            </van-field>

            <van-field
              v-model="item.content"
              label="Content"
              placeholder="主要内容/标题/文本"
              autosize
              type="textarea"
            />
            <van-field v-model="item.url" label="URL" placeholder="跳转链接或资源地址" />
            <van-field v-model="item.path" label="Path" placeholder="内部路由地址" />

            <!-- ImgList Editor (Comma separated) -->
            <van-field
              :model-value="item.imgList ? item.imgList.join(',') : ''"
              @update:model-value="(val) => (item.imgList = val ? val.split(',') : [])"
              label="Img List"
              placeholder="图片链接，逗号分隔"
              autosize
              type="textarea"
            />

            <van-field v-model="item.state" label="State" placeholder="例如: ckickplay" />

            <!-- Query Editor (Key-Value Pairs) -->
            <van-cell title="Query Params" style="background: transparent; padding-left: 0">
              <template #right-icon>
                <van-button size="mini" type="primary" icon="plus" @click="addQueryParam(item)" />
              </template>
            </van-cell>
            <div
              v-for="(param, pIndex) in item.queryParams"
              :key="pIndex"
              style="display: flex; gap: 8px; margin-bottom: 8px"
            >
              <van-field
                v-model="param.key"
                placeholder="Key"
                style="flex: 1; padding: 5px 10px; border: 1px solid #ebedf0; border-radius: 4px"
              />
              <van-field
                v-model="param.value"
                placeholder="Value"
                style="flex: 1; padding: 5px 10px; border: 1px solid #ebedf0; border-radius: 4px"
              />
              <van-button
                size="small"
                icon="delete"
                type="danger"
                plain
                style="height: auto"
                @click="removeQueryParam(item, pIndex)"
              />
            </div>
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" icon="plus" @click="addThreadItem"
              >添加条目</van-button
            >
          </div>
        </van-form>
      </van-tab>

      <van-tab title="ParagraphConfigList" name="paragraph">
        <van-form class="editor-form">
          <van-cell-group
            inset
            v-for="(item, index) in paragraphList"
            :key="index"
            :title="`Item ${index + 1}`"
          >
            <template #right-icon>
              <van-icon name="delete" color="red" @click="removeParagraphItem(index)" />
            </template>
            <van-field
              v-model="item.content"
              label="Content"
              placeholder="段落内容"
              autosize
              type="textarea"
            />
            <van-field name="align" label="Align">
              <template #input>
                <van-radio-group v-model="item.align" direction="horizontal">
                  <van-radio name="left">Left</van-radio>
                  <van-radio name="center">Center</van-radio>
                  <van-radio name="right">Right</van-radio>
                  <van-radio name="top">Top</van-radio>
                  <van-radio name="bottom">Bottom</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model.number="item.delay"
              label="Delay (ms)"
              placeholder="延迟时间"
              type="digit"
            />
            <van-field v-model="item.audio" label="Audio" placeholder="音频地址" />
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" icon="plus" @click="addParagraphItem"
              >添加条目</van-button
            >
          </div>
        </van-form>
      </van-tab>
    </van-tabs>

    <!-- Import Dialog -->
    <van-dialog
      v-model:show="showImport"
      title="导入 JSON"
      show-cancel-button
      @confirm="handleImport"
    >
      <van-field
        v-model="importContent"
        rows="10"
        autosize
        type="textarea"
        placeholder="在此粘贴 JSON 数据..."
      />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { showSuccessToast, showFailToast } from "vant";
import type { QuestionItemList, ThreadItem, ParagraphConfigList } from "@/types/qa";

const activeTab = ref<"question" | "thread" | "paragraph">("question");
const showImport = ref(false);
const importContent = ref("");

// Extended Type for UI state
interface EditableThreadItem extends Omit<ThreadItem, "query"> {
  query?: Record<string, string>;
  queryParams: { key: string; value: string }[];
}

// Data
const questionList = ref<QuestionItemList>([]);
const threadList = ref<EditableThreadItem[]>([]);
const paragraphList = ref<ParagraphConfigList>([]);

// Actions for Question
const addQuestionItem = () => {
  questionList.value.push({
    text: "",
    tips: "",
    img: "",
    video: "",
  });
};

const removeQuestionItem = (index: number) => {
  questionList.value.splice(index, 1);
};

// Actions for Thread
const addThreadItem = () => {
  threadList.value.push({
    type: "text",
    content: "",
    queryParams: [],
  });
};

const removeThreadItem = (index: number) => {
  threadList.value.splice(index, 1);
};

// Actions for Paragraph
const addParagraphItem = () => {
  paragraphList.value.push({
    content: "",
    align: "left",
  });
};

const removeParagraphItem = (index: number) => {
  paragraphList.value.splice(index, 1);
};

const addQueryParam = (item: EditableThreadItem) => {
  if (!item.queryParams) item.queryParams = [];
  item.queryParams.push({ key: "", value: "" });
};

const removeQueryParam = (item: EditableThreadItem, index: number) => {
  item.queryParams.splice(index, 1);
};

// Import/Export
const copyJson = () => {
  const data =
    activeTab.value === "question"
      ? questionList.value
      : activeTab.value === "thread"
        ? threadList.value.map((item) => {
            // Sync queryParams to query
            const query: Record<string, string> = {};
            item.queryParams.forEach((p) => {
              if (p.key) query[p.key] = p.value;
            });
            return {
              ...item,
              query: Object.keys(query).length > 0 ? query : undefined,
              queryParams: undefined, // Remove internal state
            };
          })
        : paragraphList.value;
  // Filter out empty fields to make JSON cleaner
  const cleanData = JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      if (Array.isArray(value) && value.length === 0) return undefined;
      if (typeof value === "object" && Object.keys(value).length === 0) return undefined;
      return value;
    }),
  );

  const jsonStr = JSON.stringify(cleanData, null, 2);

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(jsonStr)
      .then(() => {
        showSuccessToast("复制成功");
      })
      .catch(() => {
        showFailToast("复制失败");
      });
  } else {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = jsonStr;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showSuccessToast("复制成功");
  }
};

const handleImport = () => {
  try {
    const data = JSON.parse(importContent.value);
    if (!Array.isArray(data)) {
      showFailToast("JSON 必须是数组格式");
      return;
    }

    if (activeTab.value === "question") {
      // Basic validation or just trusting the user
      questionList.value = data;
      showSuccessToast("导入 QuestionList 成功");
    } else if (activeTab.value === "thread") {
      threadList.value = data.map((item: any) => {
        const queryParams: Record<string, string>[] = [];
        if (item.query) {
          Object.entries(item.query).forEach(([key, value]) => {
            queryParams.push({ key, value: String(value) });
          });
        }
        return {
          ...item,
          queryParams,
        };
      });
      showSuccessToast("导入 ThreadList 成功");
    } else {
      paragraphList.value = data;
      showSuccessToast("导入 ParagraphList 成功");
    }
    importContent.value = "";
  } catch {
    showFailToast("JSON 解析失败");
  }
};
</script>

<style scoped>
.json-generator {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}
.editor-form {
  padding-top: 10px;
}
</style>
