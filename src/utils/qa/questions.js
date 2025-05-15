
import dayjs from 'dayjs';

export function isTimeReached(targetDate) {
  // 处理没有时分秒的情况（自动补全日开始时间）
  const date = dayjs(targetDate).startOf('day').isSame(targetDate) 
    ? dayjs(targetDate).startOf('day')
    : dayjs(targetDate);

  return dayjs().isSameOrAfter(date);
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
      { text: "__落成泥碾作尘，只有香如故", tips: "提示：陆游笔下凋谢的决绝，答案藏在花瓣碎片中" },
      {
        text: "庐山东南__老峰，青天削出金芙蓉",
        tips: "提示：李白笔下的仙山高度，答案在神州名山之首",
      },
      {
        text: "__个黄鹂鸣翠柳，一行白鹭上青天",
        tips: "提示：杜甫诗中的春日生机，答案在鸟鸣对偶间",
      },
      {
        text: "__山不见人，但闻人语响",
        tips: "提示：无径人踪",
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
  2: {    question: [
      { text: "__落成泥碾作尘，只有香如故", tips: "提示：陆游笔下凋谢的决绝，答案藏在花瓣碎片中" },
    ],
    placeholder: "请输入4位阿拉伯数字",
    answer: "0520",
  },
};
