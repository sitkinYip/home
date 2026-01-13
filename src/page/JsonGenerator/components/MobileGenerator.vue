<template>
  <div class="mobile-generator">
    <van-nav-bar title="JSON 生成器" left-arrow @click-left="$router.back()" fixed placeholder>
      <template #right>
        <van-space>
          <van-button size="small" type="primary" @click="showImport = true">导入</van-button>
          <van-button size="small" type="success" @click="copyJson">复制</van-button>
          <van-button size="small" type="warning" @click="handlePreview">查看</van-button>
        </van-space>
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" sticky :swipe-threshold="3">
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
            <van-button
              round
              block
              type="danger"
              icon="delete"
              style="margin-top: 10px"
              @click="removeLastQuestionItem"
              v-if="questionList.length > 0"
              >删除最后一条</van-button
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
                  <van-radio name="topic">Topic</van-radio>
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

            <!-- ImgList Editor (Dynamic List) -->
            <van-cell title="Img List" style="background: transparent; padding-left: 0">
              <template #right-icon>
                <van-button size="mini" type="primary" icon="plus" @click="addImgItem(item)" />
              </template>
            </van-cell>
            <div
              v-for="(_img, imgIndex) in item.imgList || []"
              :key="imgIndex"
              style="display: flex; gap: 8px; margin-bottom: 8px"
            >
              <van-field
                :model-value="item.imgList![imgIndex]"
                @update:model-value="(val) => (item.imgList![imgIndex] = val)"
                placeholder="图片链接"
                style="flex: 1; padding: 5px 10px; border: 1px solid #ebedf0; border-radius: 4px"
              />
              <van-button
                size="small"
                icon="delete"
                type="danger"
                plain
                style="height: auto"
                @click="removeImgItem(item, imgIndex)"
              />
            </div>

            <van-field v-model="item.state" label="State" placeholder="例如: ckickplay" />
            <van-field
              v-model="item.nextIndex"
              label="NextIndex"
              placeholder="跳转到第几题 例如: 1 需要选择type为topic"
            />

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
            <van-button
              round
              block
              type="danger"
              icon="delete"
              style="margin-top: 10px"
              @click="removeLastThreadItem"
              v-if="threadList.length > 0"
              >删除最后一条</van-button
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
            <van-button
              round
              block
              type="danger"
              icon="delete"
              style="margin-top: 10px"
              @click="removeLastParagraphItem"
              v-if="paragraphList.length > 0"
              >删除最后一条</van-button
            >
          </div>
        </van-form>
      </van-tab>

      <van-tab title="OptionItemList" name="option">
        <van-form class="editor-form">
          <van-cell-group
            inset
            v-for="(item, index) in optionList"
            :key="index"
            :title="`Item ${index + 1}`"
          >
            <template #right-icon>
              <van-icon name="delete" color="red" @click="removeOptionItem(index)" />
            </template>
            <van-field
              v-model="item.key"
              label="Key"
              placeholder="选项编号 (A, B, 1, 2...)"
              required
            />
            <van-field
              v-model="item.text"
              label="Text"
              placeholder="选项文本"
              autosize
              type="textarea"
            />
            <van-field v-model="item.img" label="Image URL" placeholder="图片链接" />
            <van-field v-model="item.video" label="Video URL" placeholder="视频链接" />
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" icon="plus" @click="addOptionItem"
              >添加条目</van-button
            >
            <van-button
              round
              block
              type="danger"
              icon="delete"
              style="margin-top: 10px"
              @click="removeLastOptionItem"
              v-if="optionList.length > 0"
              >删除最后一条</van-button
            >
          </div>
        </van-form>
      </van-tab>

      <van-tab title="FinalLevelConfig" name="finalLevel">
        <van-form class="editor-form">
          <van-cell-group inset title="Config">
            <van-field v-model="finalLevelConfig.path" label="Path" placeholder="Path string" />
            <van-field v-model="finalLevelConfig.link" label="Link" placeholder="Link URL" />

            <!-- Query Params Editor -->
            <van-cell title="Query Params" style="background: transparent; padding-left: 0">
              <template #right-icon>
                <van-button
                  size="mini"
                  type="primary"
                  icon="plus"
                  @click="addFinalLevelQueryParam"
                />
              </template>
            </van-cell>
            <div
              v-for="(param, pIndex) in finalLevelConfig.queryParams"
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
                @click="removeFinalLevelQueryParam(pIndex)"
              />
            </div>
          </van-cell-group>
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

    <!-- Preview Dialog -->
    <van-dialog v-model:show="showPreview" title="数据预览" confirm-button-text="关闭">
      <van-field v-model="previewContent" rows="15" autosize type="textarea" readonly />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { useJsonGenerator } from "../composables/useJsonGenerator";

const {
  activeTab,
  showImport,
  importContent,
  showPreview,
  previewContent,
  questionList,
  threadList,
  paragraphList,
  optionList,
  finalLevelConfig,
  addQuestionItem,
  removeQuestionItem,
  removeLastQuestionItem,
  addThreadItem,
  removeThreadItem,
  removeLastThreadItem,
  addParagraphItem,
  removeParagraphItem,
  removeLastParagraphItem,
  addOptionItem,
  removeOptionItem,
  removeLastOptionItem,
  addQueryParam,
  removeQueryParam,
  addImgItem,
  removeImgItem,
  addFinalLevelQueryParam,
  removeFinalLevelQueryParam,
  copyJson,
  handlePreview,
  handleImport,
} = useJsonGenerator();
</script>

<style scoped>
.mobile-generator {
  height: 100vh;
  overflow-y: auto;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}
.editor-form {
  padding-top: 10px;
}
</style>
