import dayjs from "dayjs";

export function isTimeReached(targetDate) {
  const now = dayjs();
  const date = dayjs(targetDate);
  // 处理没有时分秒的情况（自动补全日开始时间）
  const processedDate = date.startOf("day").isSame(date) ? date.startOf("day") : date;

  return now.valueOf() >= processedDate.valueOf();
}

export function getQueryParam(param, url) {
  try {
    const searchParams = url
      ? new URL(url, window.location.href).searchParams
      : new URLSearchParams(window.location.search);

    const values = searchParams.getAll(param);

    // 返回数组或 null 保持类型一致性
    return values.length > 0 ? values : null;
  } catch (e) {
    // URL 解析失败时返回 null
    return null;
  }
}
export function checkAnswer(answer, correctAnswer) {
  if (typeof answer !== "string" || typeof correctAnswer !== "string") {
    return false;
  }

  try {
    // 高性能正则表达式 (预编译避免重复创建)
    const regex = /[\s\p{P}]/gmu;

    // 统一标准化处理
    const process = (str) =>
      str
        .normalize("NFKC") // 统一字符格式（全角转半角等）
        .replace(regex, "") // 移除所有空格和标点
        .toLowerCase(); // 统一转为小写（如需区分大小写可去掉）

    return process(answer) === process(correctAnswer);
  } catch (e) {
    return false; // 异常时返回错误
  }
}
export const qaData = {
  1: {
    question: [
      "题目1:",
      { text: "我不落泪,情绪__碎", tips: "周杰伦-跨时代" },
      {
        text: "听见你说,朝阳起又落",
        tips: "歌手",
      },
      {
        text: "我看着,没剩多少时间",
      },
      {
        text: "能许愿好想多一天,我们的明天",
        tips: "歌曲对应的电视剧",
      },
    ],
    placeholder: "请输入4位阿拉伯数字",
    answer: "0520",
    thread: [
      {
        type: "text",
        content: "请在蜂巢输入取件码领取下一条线索:",
      },
      {
        type: "text",
        content: "取件码: 0717",
      },
      {
        type: "text",
        content: "取手机号: 13684941369",
      },
      {
        type: "url",
        content: "点此查看蜂巢地图位置",
        url: "https://surl.amap.com/AzGkcIR1Acqd",
      },
      {
        type: "img",
        content: "点此查看详细图片",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/inekicatiom1.jpg",
      },
    ],
  },
  2: {
    question: [
      "题目2:",
      {
        img: `https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/qa/qa1.png`,
      },
      { text: "她说了啥?", tips: "15个字，出自甄嬛传" },
    ],
    placeholder: "输入剧里原台词",
    answer: "这几年的情爱与时光究竟是错付了",
    thread: [
      {
        type: "text",
        content: "请前往奈雪的茶领取问题3的密码:",
      },
      {
        type: "url",
        content: "点此查看奈雪地图位置",
        url: "https://surl.amap.com/1nabJLHsd1d",
      },
      {
        type: "text",
        content: "取餐码 {取餐码}",
      },
      {
        type: "text",
        content: "凭借取餐码取餐后即可知道问题3",
      },
      {
        type: "text",
        content: "知道问题后扫描下方二维码查看问题3作答",
      },
      {
        type: "img",
        // content: "点我查看问题3二维码",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/qrcode/3.png",
      },
      {
        type: "video",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/video/qa2.mp4",
        content: "点我查看原剧片段",
        state: "ckickplay",
      },
    ],
  },
  3: {
    question: ["题目3:", { text: `"请回答奶茶上备注的问题`, tips: "这是一个冷笑话" }],
    placeholder: "请输入两个字,这是一个脑筋急转弯的问题",
    answer: "吉他",
    thread: [
      {
        type: "text",
        content: "恭喜获得专属补给",
      },
      {
        type: "text",
        content: "希望这杯奶茶能给你的旅途带来新的能量",
      },
      {
        type: "text",
        content: "接下来请前往下一个目的地吧",
      },
      {
        type: "text",
        content: "线索地址: 广州市海珠区鼎新路88号 ",
      },
      {
        type: "url",
        content: "点此查看下一个柜子的位置",
        url: "https://surl.amap.com/2tZVmIFldSe",
      },
      {
        type: "text",
        content: "取件码: 2929",
      },
      {
        type: "text",
        content: "取手机号: 13684941369",
      },
      {
        type: "img",
        content: "点此查看详细图片",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/aliwz.jpg",
        imgList: [
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/aliwz.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/aliwz2.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/aliwz1.jpg"
        ],
      },
      {
        type: "video",
        content: "点此查看引导视频",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/video/yd.mp4"
      }
    ],
  },
  4: {
    question: [
      "题目四",
      {
        img: `https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/qa/qa2.png`,
      },
      { text: `她说了什么？`, tips: "5个字 或许可以想到蓝色的外卖平台" },
    ],
    placeholder: "输入5个字，电视剧台词",
    answer: "你真是饿了",
    thread: [
      {
        type: "text",
        content: "恭喜解锁下一个地址:",
      },
      {
        type: "text",
        content: "终点近在咫尺了！！！",
      },
      {
        type: "url",
        content: "点此查看IF HOURS地图位置",
        url: "https://www.amap.com/place/B0FFHLKBMA",
      },
      {
        type: "img",
        content: "点此查看路线引导图",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/1.jpg",
        imgList: [
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/1.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/2.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/3.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/4.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/5.jpg",
          "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/location/hotel/new/6.jpg",
        ],
      },
      {
        type: "text",
        content: "地址",
      },
      {
        type: "text",
        content: "广州天河区猎德街道花城大道16号铂林国际公寓A座",
      },
      {
        type: "video",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/video/qa4.mp4",
        content: "点我查看原剧片段",
        state: "ckickplay",
      },
    ],
  },
  5: {
    question: [
      "尊敬的冒险者",
      { text: `恭喜你披星戴月到达这里` },
      { text: `如果你愿意告诉我你晚饭想吃什么的话`, tips: "建议具体到菜系" },
      { text: `我就会把房间号告诉你`, tips: "此题无需解谜" },
    ],
    placeholder: "想吃什么呢",
    answer: "all",
    isOpenEndedQuestions: true,
    thread: [
      {
        type: "text",
        content: "恭喜你解锁了最终目的地!!",
      },
      {
        type: "text",
        content: "房间号: {房间号}",
      },
      {
        type: "url",
        content: "要不要点我试试看?",
        url: "https://vae.sitkin.top",
      },
    ],
  },
};

export const getQaInfo = async () => {
  try {
    const res = await fetch(
      "https://blog.sitkin.top/apis/api.content.halo.run/v1alpha1/singlepages",
    );
    const data = await res.json();
    const list =
      data?.items?.map((item) => {
        let content = item?.status?.excerpt;
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

export function replaceTemplateStrings(str, arr) {
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
    // 出现任何异常返回原字符串
    return str;
  }
}

export /**
 * 过滤特殊字符，仅保留中文、英文、数字
 * @param str 原始字符串
 * @returns 过滤后的纯净字符串
 */
function filterSpecialChars(str) {
  // 使用正则表达式匹配非中文、英文、数字的字符，并替换为空字符串
  // 正则说明：
  // \u4e00-\u9fa5 : 匹配所有中文
  // a-zA-Z        : 匹配所有英文字母
  // 0-9           : 匹配所有数字
  // /gu           : g表示全局匹配，u表示使用Unicode匹配模式
  return str.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/gu, "");
}

export const userIdMap = {
  gh: "郭涵的生日",
  guohan: "郭涵的生日",
  sy: "诗颖的",
  sx: "诗鑫的",
  sitkin: "sitkin的",
};
export const userNameIdMap = {
  gh: "郭涵",
  guohan: "郭涵",
  sy: "诗颖",
  sx: "诗鑫",
  sitkin: "sitkin",
};
export function clickCounter(callback, threshold) {
  let clickCount = 0; // 记录点击次数
  let timeout; // 定时器变量

  // 绑定点击事件的处理函数
  function handleClick() {
    clearTimeout(timeout); // 清除之前的定时器

    clickCount++; // 每次点击增加计数

    if (clickCount === threshold) {
      // 当点击次数达到阈值时触发回调函数
      callback();

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

const eventHandler = () => {
  const userId = getQueryParam("user")?.[0] || "";
  const qaIndex = getQueryParam("qa")?.[0] || "1";
  localStorage.removeItem("qaIndex" + qaIndex + userId);
  alert("缓存已清空");
};

export const HeaderClickCounter = clickCounter(eventHandler, 5);
