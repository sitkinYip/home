import dayjs, { ConfigType } from "dayjs";

export function isTimeReached(targetDate: ConfigType) {
  const now = dayjs();
  const date = dayjs(targetDate);
  // 处理没有时分秒的情况（自动补全日开始时间）
  const processedDate = date.startOf("day").isSame(date) ? date.startOf("day") : date;

  return now.valueOf() >= processedDate.valueOf();
}

export function getQueryParam(param: string, url?: string) {
  try {
    const searchParams = url
      ? new URL(url, window.location.href).searchParams
      : new URLSearchParams(window.location.search);

    const values = searchParams.getAll(param);

    // 返回数组或 null 保持类型一致性
    return values.length > 0 ? values : null;
  } catch (e) {
    console.error("获取查询参数失败:", e);
    // URL 解析失败时返回 null
    return null;
  }
}

export function checkAnswer(answer: string, correctAnswer: string) {
  if (typeof answer !== "string" || typeof correctAnswer !== "string") {
    return false;
  }

  try {
    // 高性能正则表达式 (预编译避免重复创建)
    const regex = /[\s\p{P}]/gmu;

    // 统一标准化处理
    const process = (str: string) =>
      str
        .normalize("NFKC") // 统一字符格式（全角转半角等）
        .replace(regex, "") // 移除所有空格和标点
        .toLowerCase(); // 统一转为小写（如需区分大小写可去掉）

    return process(answer) === process(correctAnswer);
  } catch (e) {
    console.error("检查答案失败:", e);
    return false; // 异常时返回错误
  }
}

export const getQaInfo = async (): Promise<any[]> => {
  try {
    const res = await fetch(
      "https://blog.sitkin.top/apis/api.content.halo.run/v1alpha1/singlepages",
    );
    const data = await res.json();
    const list =
      data?.items?.map((item: any) => {
        const content = item?.status?.excerpt;
        const title = item?.spec?.title;

        return {
          title,
          content,
        };
      }) || [];
    console.log("list", list);
    return list;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export function replaceTemplateStrings(str: string, arr: any[]) {
  if (typeof str !== "string" || !Array.isArray(arr)) {
    return str;
  }

  try {
    // 创建映射表提升查询性能
    const map = new Map();
    for (const item of arr) {
      if (!item || typeof item !== "object" || !("title" in item) || !("content" in item)) {
        throw new Error("Invalid array item structure");
      }
      map.set(item.title, item.content);
    }

    // 使用正则表达式进行一次性替换
    return str.replace(/\{([^{}]+)\}/g, (match, key) => {
      return map.has(key) ? map.get(key) : match;
    });
  } catch (e) {
    console.error("替换字符串失败:", e);
    // 出现任何异常返回原字符串
    return str;
  }
}

export /**
 * 过滤特殊字符，仅保留中文、英文、数字
 * @param str 原始字符串
 * @returns 过滤后的纯净字符串
 */
function filterSpecialChars(str: string) {
  // 使用正则表达式匹配非中文、英文、数字的字符，并替换为空字符串
  // 正则说明：
  // \u4e00-\u9fa5 : 匹配所有中文
  // a-zA-Z        : 匹配所有英文字母
  // 0-9           : 匹配所有数字
  // /gu           : g表示全局匹配，u表示使用Unicode匹配模式
  return str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/gu, "");
}

export function clickCounter<T extends any[]>(callback: (...args: T) => void, threshold: number) {
  let clickCount = 0; // 记录点击次数
  let timeout: any; // 定时器变量

  // 绑定点击事件的处理函数
  function handleClick(...args: T) {
    clearTimeout(timeout); // 清除之前的定时器

    clickCount++; // 每次点击增加计数

    if (clickCount === threshold) {
      // 当点击次数达到阈值时触发回调函数
      callback(...args);

      // 重置点击计数
      clickCount = 0;
    } else {
      // 创建一个新的定时器，在1秒后重置点击计数
      timeout = setTimeout(function () {
        clickCount = 0;
      }, 1000);
    }
  }

  return handleClick;
}

const eventHandler = (cacheKey: string) => {
  localStorage.removeItem(cacheKey);
  console.log("缓存已清空");
  ElMessage.success("缓存已清空");
};

export const HeaderClickCounter = clickCounter(eventHandler, 5);
