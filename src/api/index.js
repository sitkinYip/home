// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

/**
 * 和风天气 API
 * https://dev.qweather.com/
 */

// 获取 IP 地理位置 (ipwho.is)
export const getIpLocation = async () => {
  const res = await fetch("https://ipwho.is/");
  return await res.json();
};

// 获取地理位置信息 (GeoAPI)
// m954e55put.re.qweatherapi.com/geo/v2/city/lookup?location=116.40,39.90&key=YOUR_KEY
export const getGeoWeather = async (key, location) => {
  const res = await fetch(
    `https://m954e55put.re.qweatherapi.com/geo/v2/city/lookup?location=${location}&key=${key}`,
    {
      headers: {
        "X-QW-Api-Key": key,
      },
    }
  );
  return await res.json();
};

// 获取实时天气 (Weather API)
// m954e55put.re.qweatherapi.com/v7/weather/now?location=101010100&key=YOUR_KEY
export const getQWeatherNow = async (key, locationId) => {
  const res = await fetch(
    `https://m954e55put.re.qweatherapi.com/v7/weather/now?location=${locationId}&key=${key}`,
    {
      headers: {
        "X-QW-Api-Key": key,
      },
    }
  );
  return await res.json();
};
