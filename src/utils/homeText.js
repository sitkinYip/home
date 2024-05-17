import dayjs from "dayjs";

const defaultTitle = import.meta.env.VITE_DESC_HELLO;
const defaultContent = import.meta.env.VITE_DESC_TEXT;

// 对于日期展示特地文案配置项
const HomeTextConfig = [
  {
    date: [
      "2024/05/20",
      "2024/05/21",
      "2024/05/22",
      "2024/05/23",
      "2024/05/24",
      "2024/05/25",
      "2024/05/26",
    ],
    title: [
      {
        date: "2024/05/20",
        text: "To 郭涵",
      },
      {
        date: "all",
        text: "郭涵姐生日狂欢周第{{index}}天",
      },
    ],
    content: [
      {
        date: "2024/05/20",
        text: "生日快乐！烟火向星辰，所愿皆成真。~",
      },
      {
        date: "2024/05/21",
        text: "生日快乐！岁岁年年，万喜万般宜~",
      },
      {
        date: "all",
        text: "祝你温柔浪漫，不失爱与果敢; 朝朝如愿，岁岁如意平安~",
      },
    ],
  },
];

function findTextByDate() {
  const givenDate = dayjs(Date.now()).format("YYYY/MM/DD");
  let result = { title: defaultTitle, content: defaultContent };

  // 循环遍历HomeTextConfig数组查找匹配的日期
  for (const item of HomeTextConfig) {
    // 检查当前项的日期是否包含给定的日期
    if (item.date.includes(givenDate)) {
      // 如果title是字符串，直接返回它
      if (typeof item.title === "string") {
        result.title = item.title;
      } else {
        // 如果title是数组，遍历它寻找匹配项
        let titleMatch = item.title.find((t) => t.date === givenDate);
        if (titleMatch) {
          result.title = titleMatch.text;
        } else {
          // 如果是所有日期的通用title（带'all'标签）
          let allTitle = item.title.find((t) => t.date === "all");
          if (allTitle) {
            // 替换'{{index}}'为当前项的索引位置加1
            let indexValue = item.date.indexOf(givenDate) + 1;
            result.title = allTitle.text.replace("{{index}}", indexValue);
          }
        }
      }

      // 对content的处理逻辑与title相同
      if (typeof item.content === "string") {
        result.content = item.content;
      } else {
        let contentMatch = item.content.find((c) => c.date === givenDate);
        if (contentMatch) {
          result.content = contentMatch.text;
        } else {
          // 如果是所有日期的通用content（带'all'标签）
          let allContent = item.content.find((c) => c.date === "all");
          if (allContent) {
            // 替换'{{index}}'为当前项的索引位置加1
            let indexValue = item.date.indexOf(givenDate) + 1;
            result.content = allContent.text.replace("{{index}}", indexValue);
          }
        }
      }

      return result;
    }
  }

  // 如果没有任何匹配项，返回默认的title和content
  return result;
}

export { findTextByDate };
