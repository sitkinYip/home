<template>
  <div class="weather" v-if="weatherData.adCode.city && weatherData.weather.weather">
    <span>{{ weatherData.adCode.city }}&nbsp;</span>
    <span>{{ weatherData.weather.weather }}&nbsp;</span>
    <span>{{ weatherData.weather.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.weather.winddirection?.endsWith("风")
          ? weatherData.weather.winddirection
          : weatherData.weather.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.weather.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getGeoWeather, getQWeatherNow, getIpLocation } from "@/api";
import { Error } from "@icon-park/vue-next";

// 和风天气 Key
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 天气数据
const weatherData = reactive({
  adCode: {
    city: null, // 城市
    adcode: null, // 城市编码
  },
  weather: {
    weather: null, // 天气现象
    temperature: null, // 实时气温
    winddirection: null, // 风向描述
    windpower: null, // 风力级别
  },
});

// 取出天气平均值
const getTemperature = (min, max) => {
  try {
    // 计算平均值并四舍五入
    const average = (Number(min) + Number(max)) / 2;
    return Math.round(average);
  } catch (error) {
    console.error("计算温度出现错误：", error);
    return "NaN";
  }
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 检查 Key 是否配置
    if (!mainKey) {
      weatherData.adCode = {
        city: "未配置",
        adcode: null,
      };
      onError("请在 .env 中配置和风天气 Key");
      return;
    }

    // 1. 获取地理位置
    let locationParam = null;
    try {
      // 尝试通过 IP 获取位置 (https://ipapi.co/json/)
      const ipLoc = await getIpLocation();
      if (ipLoc.latitude && ipLoc.longitude) {
        // 和风天气要求经度在前，纬度在后
        locationParam = `${ipLoc.longitude.toFixed(2)},${ipLoc.latitude.toFixed(2)}`;
      }
    } catch (e) {
      console.error("IP 定位失败，将尝试默认参数", e);
    }

    // 如果 IP 定位失败，尝试使用默认值 (可选: 北京 116.40,39.90 作为兜底，或者让 API 报错)
    // 这里如果 params 为空，API 会报错，所以我们给个 fallback 或者抛出
    if (!locationParam) {
      console.warn("无法获取自动定位，尝试使用北京作为默认地点");
      locationParam = "116.40,39.90";
    }

    // 2. 获取城市 ID (GeoAPI)
    const geoResult = await getGeoWeather(mainKey, locationParam);
    console.log("Geo Result:", geoResult);

    if (geoResult.code !== "200") {
      throw new Error(`位置查询失败: ${geoResult.code}`);
    }

    const { name, id } = geoResult.location[0];

    weatherData.adCode = {
      city: name,
      adcode: id,
    };

    // 2. 获取实时天气
    const weatherResult = await getQWeatherNow(mainKey, id);
    console.log("Weather Result:", weatherResult);

    if (weatherResult.code !== "200") {
      throw new Error(`天气查询失败: ${weatherResult.code}`);
    }

    const now = weatherResult.now;
    weatherData.weather = {
      weather: now.text,
      temperature: now.temp,
      winddirection: now.windDir,
      windpower: now.windScale,
    };
  } catch (error) {
    console.error("天气信息获取失败:", error);
    onError("天气信息获取失败");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
