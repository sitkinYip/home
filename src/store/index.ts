import { defineStore } from "pinia";

export interface MainState {
  imgLoadStatus: boolean; // 壁纸加载状态
  innerWidth: number | null; // 当前窗口宽度
  coverType: string; // 壁纸种类
  siteStartShow: boolean; // 建站日期显示
  musicClick: boolean; // 音乐链接是否跳转
  musicIsOk: boolean; // 音乐是否加载完成
  musicVolume: number; // 音乐音量;
  musicOpenState: boolean; // 音乐面板开启状态
  backgroundShow: boolean; // 壁纸展示状态
  boxOpenState: boolean; // 盒子开启状态
  mobileOpenState: boolean; // 移动端开启状态
  mobileFuncState: boolean; // 移动端功能区开启状态
  setOpenState: boolean; // 设置页面开启状态
  playerState: boolean; // 当前播放状态
  playerTitle: string | null; // 当前播放歌曲名
  playerArtist: string | null; // 当前播放歌手名
  playerLrc: string; // 当前播放歌词
  playerLrcShow: boolean; // 是否显示底栏歌词
  footerBlur: boolean; // 底栏模糊
  playerAutoplay: boolean; // 是否自动播放
  playerLoop: "all" | "one" | "none"; // 循环播放 "all", "one", "none"
  playerOrder: "list" | "random"; // 循环顺序 "list", "random"
}

export const mainStore = defineStore("main", {
  state: (): MainState => {
    return {
      imgLoadStatus: false,
      innerWidth: null,
      coverType: "0",
      siteStartShow: false,
      musicClick: false,
      musicIsOk: false,
      musicVolume: 0,
      musicOpenState: false,
      backgroundShow: false,
      boxOpenState: false,
      mobileOpenState: false,
      mobileFuncState: false,
      setOpenState: false,
      playerState: false,
      playerTitle: null,
      playerArtist: null,
      playerLrc: "歌词加载中",
      playerLrcShow: true,
      footerBlur: true,
      playerAutoplay: false,
      playerLoop: "all",
      playerOrder: "list",
    };
  },
  getters: {
    // 获取歌词
    getPlayerLrc(state: MainState): string {
      return state.playerLrc;
    },
    // 获取歌曲信息
    getPlayerData(state: MainState): { name: string | null; artist: string | null } {
      return {
        name: state.playerTitle,
        artist: state.playerArtist,
      };
    },
    // 获取页面宽度
    getInnerWidth(state: MainState): number | null {
      return state.innerWidth;
    },
  },
  actions: {
    // 更改当前页面宽度
    setInnerWidth(value: number) {
      this.innerWidth = value;
      if (value >= 720) {
        this.mobileOpenState = false;
        this.mobileFuncState = false;
      }
    },
    // 更改播放状态
    setPlayerState(value: boolean) {
      if (value) {
        this.playerState = false;
      } else {
        this.playerState = true;
      }
    },
    // 更改歌词
    setPlayerLrc(value: string) {
      this.playerLrc = value;
    },
    // 更改歌曲数据
    setPlayerData(title: string, artist: string) {
      this.playerTitle = title;
      this.playerArtist = artist;
    },
    // 更改壁纸加载状态
    setImgLoadStatus(value: boolean) {
      this.imgLoadStatus = value;
    },
  },
  persist: {
    key: "data",
    storage: window.localStorage,
    paths: [
      "coverType",
      "musicVolume",
      "siteStartShow",
      "musicClick",
      "playerLrcShow",
      "footerBlur",
      "playerAutoplay",
      "playerLoop",
      "playerOrder",
    ],
  },
});
