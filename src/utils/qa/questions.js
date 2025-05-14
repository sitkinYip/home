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
      question: ['欲穷千里目','更上___层楼'],
      placeholder: '请输入4位阿拉伯数字',
      answer: '1',
      thread: [{
        type: 'text',
        content: '请在蜂巢输入取件码领取下一条线索:',
      }, {
        type: 'text',
        content: '5320',
      }, {
        type: 'url',
        content: '点此查看地图位置',
        url: 'https://www.baidu.com'
      }, {
        type: 'img',
        content: '点此查看图片',
        url: 'https://www.baidu.com'
      }]
    }
  }