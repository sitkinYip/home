<template>
  <div class="pc-generator">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h2 style="margin: 0">JSON 生成器 (PC版)</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showImport = true">导入 JSON</el-button>
            <el-button type="success" @click="copyJson">复制 JSON</el-button>
            <el-button type="warning" @click="handlePreview">查看数据</el-button>
            <el-button @click="$router.back()">返回</el-button>
          </div>
        </div>
      </el-header>

      <el-main>
        <el-tabs v-model="activeTab" type="border-card">
          <!-- QuestionItemList Tab -->
          <el-tab-pane label="QuestionItemList" name="question">
            <div v-for="(item, index) in questionList" :key="index" class="list-item-card">
              <div class="card-header">
                <span>Item {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  icon="Delete"
                  @click="removeQuestionItem(index)"
                />
              </div>
              <el-form label-width="100px">
                <el-form-item label="Text">
                  <el-input v-model="item.text" type="textarea" autosize placeholder="问题文本" />
                </el-form-item>
                <el-form-item label="Tips">
                  <el-input v-model="item.tips" type="textarea" autosize placeholder="提示文本" />
                </el-form-item>
                <el-form-item label="Image URL">
                  <el-input v-model="item.img" placeholder="图片链接" />
                </el-form-item>
                <el-form-item label="Video URL">
                  <el-input v-model="item.video" placeholder="视频链接" />
                </el-form-item>
              </el-form>
            </div>
            <div class="actions-bar">
              <el-button type="primary" icon="Plus" @click="addQuestionItem">添加条目</el-button>
              <el-button
                v-if="questionList.length > 0"
                type="danger"
                icon="Delete"
                @click="removeLastQuestionItem"
                >删除最后一条</el-button
              >
            </div>
          </el-tab-pane>

          <!-- ThreadItemList Tab -->
          <el-tab-pane label="ThreadItemList" name="thread">
            <div v-for="(item, index) in threadList" :key="index" class="list-item-card">
              <div class="card-header">
                <span>Item {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  icon="Delete"
                  @click="removeThreadItem(index)"
                />
              </div>
              <el-form label-width="100px">
                <el-form-item label="Type">
                  <el-radio-group v-model="item.type">
                    <el-radio label="text">Text</el-radio>
                    <el-radio label="url">URL</el-radio>
                    <el-radio label="img">Image</el-radio>
                    <el-radio label="video">Video</el-radio>
                    <el-radio label="letter">Letter</el-radio>
                    <el-radio label="topic">Topic</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="Content">
                  <el-input
                    v-model="item.content"
                    type="textarea"
                    autosize
                    placeholder="主要内容/标题/文本"
                  />
                </el-form-item>
                <el-form-item label="URL">
                  <el-input v-model="item.url" placeholder="跳转链接或资源地址" />
                </el-form-item>
                <el-form-item label="Path">
                  <el-input v-model="item.path" placeholder="内部路由地址" />
                </el-form-item>

                <!-- ImgList -->
                <el-form-item label="Img List">
                  <div class="nested-list">
                    <div
                      v-for="(_img, imgIndex) in item.imgList || []"
                      :key="imgIndex"
                      class="nested-item"
                    >
                      <el-input
                        :model-value="item.imgList![imgIndex]"
                        @update:model-value="(val: any) => (item.imgList![imgIndex] = val)"
                        placeholder="图片链接"
                        style="flex: 1"
                      />
                      <el-button
                        type="danger"
                        icon="Delete"
                        plain
                        circle
                        size="small"
                        @click="removeImgItem(item, imgIndex)"
                      />
                    </div>
                    <el-button size="small" type="primary" icon="Plus" @click="addImgItem(item)"
                      >添加图片</el-button
                    >
                  </div>
                </el-form-item>

                <el-form-item label="State">
                  <el-input v-model="item.state" placeholder="例如: ckickplay" />
                </el-form-item>
                <el-form-item label="NextIndex">
                  <el-input
                    v-model.number="item.nextIndex"
                    placeholder="跳转到第几题 例如: 1 需要选择type为topic"
                  />
                </el-form-item>

                <!-- Query Params -->
                <el-form-item label="Query Params">
                  <div class="nested-list">
                    <div
                      v-for="(param, pIndex) in item.queryParams"
                      :key="pIndex"
                      class="nested-item"
                    >
                      <el-input v-model="param.key" placeholder="Key" style="flex: 1" />
                      <el-input v-model="param.value" placeholder="Value" style="flex: 1" />
                      <el-button
                        type="danger"
                        icon="Delete"
                        plain
                        circle
                        size="small"
                        @click="removeQueryParam(item, pIndex)"
                      />
                    </div>
                    <el-button size="small" type="primary" icon="Plus" @click="addQueryParam(item)"
                      >添加参数</el-button
                    >
                  </div>
                </el-form-item>
              </el-form>
            </div>
            <div class="actions-bar">
              <el-button type="primary" icon="Plus" @click="addThreadItem">添加条目</el-button>
              <el-button
                v-if="threadList.length > 0"
                type="danger"
                icon="Delete"
                @click="removeLastThreadItem"
                >删除最后一条</el-button
              >
            </div>
          </el-tab-pane>

          <!-- ParagraphConfigList Tab -->
          <el-tab-pane label="ParagraphConfigList" name="paragraph">
            <div v-for="(item, index) in paragraphList" :key="index" class="list-item-card">
              <div class="card-header">
                <span>Item {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  icon="Delete"
                  @click="removeParagraphItem(index)"
                />
              </div>
              <el-form label-width="100px">
                <el-form-item label="Content">
                  <el-input
                    v-model="item.content"
                    type="textarea"
                    autosize
                    placeholder="段落内容"
                  />
                </el-form-item>
                <el-form-item label="Align">
                  <el-radio-group v-model="item.align">
                    <el-radio label="left">Left</el-radio>
                    <el-radio label="center">Center</el-radio>
                    <el-radio label="right">Right</el-radio>
                    <el-radio label="top">Top</el-radio>
                    <el-radio label="bottom">Bottom</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="Delay (ms)">
                  <el-input v-model.number="item.delay" type="number" placeholder="延迟时间" />
                </el-form-item>
                <el-form-item label="Audio">
                  <el-input v-model="item.audio" placeholder="音频地址" />
                </el-form-item>
              </el-form>
            </div>
            <div class="actions-bar">
              <el-button type="primary" icon="Plus" @click="addParagraphItem">添加条目</el-button>
              <el-button
                v-if="paragraphList.length > 0"
                type="danger"
                icon="Delete"
                @click="removeLastParagraphItem"
                >删除最后一条</el-button
              >
            </div>
          </el-tab-pane>

          <!-- OptionItemList Tab -->
          <el-tab-pane label="OptionItemList" name="option">
            <div v-for="(item, index) in optionList" :key="index" class="list-item-card">
              <div class="card-header">
                <span>Item {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  icon="Delete"
                  @click="removeOptionItem(index)"
                />
              </div>
              <el-form label-width="100px">
                <el-form-item label="Key" required>
                  <el-input v-model="item.key" placeholder="选项编号 (A, B, 1, 2...)" />
                </el-form-item>
                <el-form-item label="Text">
                  <el-input v-model="item.text" type="textarea" autosize placeholder="选项文本" />
                </el-form-item>
                <el-form-item label="Image URL">
                  <el-input v-model="item.img" placeholder="图片链接" />
                </el-form-item>
                <el-form-item label="Video URL">
                  <el-input v-model="item.video" placeholder="视频链接" />
                </el-form-item>
              </el-form>
            </div>
            <div class="actions-bar">
              <el-button type="primary" icon="Plus" @click="addOptionItem">添加条目</el-button>
              <el-button
                v-if="optionList.length > 0"
                type="danger"
                icon="Delete"
                @click="removeLastOptionItem"
                >删除最后一条</el-button
              >
            </div>
          </el-tab-pane>

          <!-- FinalLevelConfig Tab -->
          <el-tab-pane label="FinalLevelConfig" name="finalLevel">
            <div class="list-item-card">
              <div class="card-header">
                <span>Main Config</span>
              </div>
              <el-form label-width="100px">
                <el-form-item label="Path">
                  <el-input v-model="finalLevelConfig.path" placeholder="Path string" />
                </el-form-item>
                <el-form-item label="Link">
                  <el-input v-model="finalLevelConfig.link" placeholder="Link URL" />
                </el-form-item>

                <!-- Query Params -->
                <el-form-item label="Query Params">
                  <div class="nested-list">
                    <div
                      v-for="(param, pIndex) in finalLevelConfig.queryParams"
                      :key="pIndex"
                      class="nested-item"
                    >
                      <el-input v-model="param.key" placeholder="Key" style="flex: 1" />
                      <el-input v-model="param.value" placeholder="Value" style="flex: 1" />
                      <el-button
                        type="danger"
                        icon="Delete"
                        plain
                        circle
                        size="small"
                        @click="removeFinalLevelQueryParam(pIndex)"
                      />
                    </div>
                    <el-button
                      size="small"
                      type="primary"
                      icon="Plus"
                      @click="addFinalLevelQueryParam"
                      >添加参数</el-button
                    >
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <!-- Import Dialog -->
    <el-dialog v-model="showImport" title="导入 JSON" width="50%">
      <el-input
        v-model="importContent"
        type="textarea"
        :rows="10"
        placeholder="在此粘贴 JSON 数据..."
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImport = false">取消</el-button>
          <el-button type="primary" @click="handleImport"> 确定 </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="showPreview" title="数据预览" width="50%">
      <el-input v-model="previewContent" type="textarea" :rows="15" readonly />
    </el-dialog>
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
.pc-generator {
  height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.list-item-card {
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-weight: bold;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.actions-bar {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.nested-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.nested-item {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
