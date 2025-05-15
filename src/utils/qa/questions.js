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

export const qaData = {
  1: {
    question: [
      "题目1:",
      { text: "__落成泥碾作尘，只有香如故", tips: "陆游笔下凋谢的决绝，答案藏在花瓣碎片中" },
      {
        text: "庐山东南__老峰，青天削出金芙蓉",
        tips: "李白笔下的仙山高度，答案在神州名山之首",
      },
      {
        text: "__个黄鹂鸣翠柳，一行白鹭上青天",
        tips: "杜甫诗中的春日生机，答案在鸟鸣对偶间",
      },
      {
        text: "__山不见人，但闻人语响",
        tips: "无径人踪",
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
        content: "0520",
      },
      {
        type: "url",
        content: "点此查看蜂巢地图位置",
        url: "https://www.baidu.com",
      },
      {
        type: "img",
        content: "点此查看图片",
        url: "https://sitkin-cdn.oss-cn-heyuan.aliyuncs.com/pice/mhsg1.jpg",
      },
    ],
  },
  2: {
    question: [
      { text: `"凶我"的反义词是什么`, tips: "这是一个冷笑话" },
    ],
    placeholder: "请输入两个字,这是一个脑筋急转弯的问题",
    answer: "吉他",
    thread: [
        {
            type: "text",
            content: "请前往奈雪的茶领取问题3的密码:",
          },
          {
            type: "url",
            content: "点此查看奈雪地图位置",
            url: "https://www.baidu.com",
          },
          {
            type: "text",
            content: "取餐码 {取餐码}",
            // url: "https://www.baidu.com",
          },
          {
            type: "text",
            content: "凭借取餐码取餐后即可知道问题3的密码",
            // url: "https://www.baidu.com",
          },
    ]
  },
  3: {
    question: [
      { text: `此问题无需解谜,` },
      { text: `请完成问题2并且取餐` },
      { text: `留意奶茶杯子上的密码`, tips: "此问题无需解谜" },
    ],
    placeholder: "输入杯子上备注的密码",
    answer: "0717",
    thread: [
        {
            type: "text",
            content: "恭喜解锁下一个地址:",
          },
          {
            type: "url",
            content: "点此查看IF HOURS地图位置",
            url: "https://www.baidu.com",
          },
          {
            type: "text",
            content: "地址",
            // url: "https://www.baidu.com",
          },
          {
            type: "text",
            content: "广州天河区猎德街道花城大道16号铂林国际公寓",
            // url: "https://www.baidu.com",
          },
    ]
  },
};


export const getQaInfo= async() => {
    try {
     const res = await fetch('https://blog.sitkin.top/apis/api.content.halo.run/v1alpha1/singlepages')
     const data = await res.json()
     const list = data?.items?.map(item => {
        let content = item?.status?.excerpt
        const title = item?.spec?.title

        return {
          title,
          content
        }
     }) || []
     console.log('list', list)
      return list
    } catch (e) {
      console.error(e)
      return [];
    }
} 

export function replaceTemplateStrings(str, arr) {
    if (typeof str !== 'string' || !Array.isArray(arr)) {
      return str;
    }
  
    try {
      // 创建映射表提升查询性能
      const map = new Map();
      for (const item of arr) {
        if (
          !item ||
          typeof item !== 'object' ||
          !('title' in item) ||
          !('content' in item)
        ) {
          throw new Error('Invalid array item structure');
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