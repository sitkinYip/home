import { ref } from "vue";
import { showSuccessToast, showFailToast } from "vant";
import type { QuestionItemList, ThreadItem, ParagraphConfigList, OptionItem } from "@/types/qa";

// Extended Type for UI state
export interface EditableThreadItem extends Omit<ThreadItem, "query"> {
  query?: Record<string, string>;
  queryParams: { key: string; value: string }[];
}

export type ActiveTab = "question" | "thread" | "paragraph" | "option" | "finalLevel";

export interface EditableFinalLevelConfig {
  path?: string;
  link?: string;
  queryParams: { key: string; value: string }[];
}

export function useJsonGenerator() {
  const activeTab = ref<ActiveTab>("question");
  const showImport = ref(false);
  const importContent = ref("");

  // Data
  const questionList = ref<QuestionItemList>([]);
  const threadList = ref<EditableThreadItem[]>([]);
  const paragraphList = ref<ParagraphConfigList>([]);
  const optionList = ref<OptionItem[]>([]);
  const finalLevelConfig = ref<EditableFinalLevelConfig>({
    queryParams: [],
  });

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

  const removeLastQuestionItem = () => {
    if (questionList.value.length > 0) {
      questionList.value.pop();
    }
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

  const removeLastThreadItem = () => {
    if (threadList.value.length > 0) {
      threadList.value.pop();
    }
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

  const removeLastParagraphItem = () => {
    if (paragraphList.value.length > 0) {
      paragraphList.value.pop();
    }
  };

  // Actions for Option
  const addOptionItem = () => {
    optionList.value.push({
      key: "",
      text: "",
      img: "",
      video: "",
    });
  };

  const removeOptionItem = (index: number) => {
    optionList.value.splice(index, 1);
  };

  const removeLastOptionItem = () => {
    if (optionList.value.length > 0) {
      optionList.value.pop();
    }
  };

  const addQueryParam = (item: EditableThreadItem) => {
    if (!item.queryParams) item.queryParams = [];
    item.queryParams.push({ key: "", value: "" });
  };

  const removeQueryParam = (item: EditableThreadItem, index: number) => {
    item.queryParams.splice(index, 1);
  };

  const addImgItem = (item: EditableThreadItem) => {
    if (!item.imgList) item.imgList = [];
    item.imgList.push("");
  };

  const removeImgItem = (item: EditableThreadItem, index: number) => {
    item.imgList?.splice(index, 1);
  };

  // Actions for FinalLevelConfig
  const addFinalLevelQueryParam = () => {
    finalLevelConfig.value.queryParams.push({ key: "", value: "" });
  };

  const removeFinalLevelQueryParam = (index: number) => {
    finalLevelConfig.value.queryParams.splice(index, 1);
  };

  const showPreview = ref(false);
  const previewContent = ref("");

  // Import/Export
  const getJsonString = () => {
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
          : activeTab.value === "paragraph"
            ? paragraphList.value
            : activeTab.value === "option"
              ? optionList.value
              : (() => {
                  const query: Record<string, string> = {};
                  finalLevelConfig.value.queryParams.forEach((p) => {
                    if (p.key) query[p.key] = p.value;
                  });
                  return {
                    ...finalLevelConfig.value,
                    query: Object.keys(query).length > 0 ? query : undefined,
                    queryParams: undefined,
                  };
                })();

    // Filter out empty fields to make JSON cleaner
    const cleanData = JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        if (Array.isArray(value) && value.length === 0) return undefined;
        if (typeof value === "object" && Object.keys(value).length === 0) return undefined;
        return value;
      }),
    );

    return JSON.stringify(cleanData, null, 2);
  };

  const copyJson = () => {
    const jsonStr = getJsonString();

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

  const handlePreview = () => {
    previewContent.value = getJsonString();
    showPreview.value = true;
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importContent.value);
      if (!Array.isArray(data)) {
        showFailToast("JSON 必须是数组格式");
        return;
      }

      if (activeTab.value === "question") {
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
      } else if (activeTab.value === "paragraph") {
        paragraphList.value = data;
        showSuccessToast("导入 ParagraphList 成功");
      } else if (activeTab.value === "option") {
        optionList.value = data;
        showSuccessToast("导入 OptionItemList 成功");
      } else {
        // FinalLevelConfig
        const config = Array.isArray(data) ? data[0] : data; // Handle both array wrapping or single object if user pastes explicitly
        // Logic to parse object
        const item = config;
        const queryParams: Record<string, string>[] = [];
        if (item.query) {
          Object.entries(item.query).forEach(([key, value]) => {
            queryParams.push({ key, value: String(value) });
          });
        }
        finalLevelConfig.value = {
          ...item,
          queryParams,
        };
        showSuccessToast("导入 FinalLevelConfig 成功");
      }
      importContent.value = "";
    } catch {
      showFailToast("JSON 解析失败");
    }
  };

  return {
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
  };
}
