// composables/useUniverse.js
import { reactive, onMounted, onUnmounted } from "vue";


export function useUniverse(canvasRef) {
  const state = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    starDensity: 0.216,
    speedCoeff: 0.05,
    starCount: 0,
    stars: [],
    animationFrameId: null,
  });

  function windowResizeHandler() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.starCount = state.width * state.starDensity;
    canvasRef.value.width = state.width;
    canvasRef.value.height = state.height;

    // 重置并重新初始化所有星星
    state.stars.forEach((star) => star.reset());
  }

  function createUniverse() {
    state.stars = [];
    for (let i = 0; i < state.starCount; i++) {
      state.stars.push(new Star(state));
    }
  }

  function draw() {
    const universe = canvasRef.value.getContext("2d");
    universe.clearRect(0, 0, state.width, state.height);
    state.stars.forEach((star) => {
      star.move();
      star.fadeIn();
      star.fadeOut();
      star.draw(universe);
    });
    console.log('universe', universe)
    state.animationFrameId = window.requestAnimationFrame(draw);
  }

  // Star class
  class Star {
    constructor(state) {
      this.state = state;
      this.reset();
    }
  
    reset() {
      this.giant = getProbability(3);
      this.comet = this.giant || this.state.first ? false : getProbability(10);
      this.x = getRandInterval(0, this.state.width - 10);
      this.y = getRandInterval(0, this.state.height);
      this.r = getRandInterval(1.1, 2.6);
      this.dx = getRandInterval(this.state.speedCoeff, 6 * this.state.speedCoeff) +
        (this.comet + 1 - 1) * this.state.speedCoeff * getRandInterval(50, 120) +
        this.state.speedCoeff * 2;
      this.dy = -getRandInterval(this.state.speedCoeff, 6 * this.state.speedCoeff) -
        (this.comet + 1 - 1) * this.state.speedCoeff * getRandInterval(50, 120);
      this.fadingOut = null;
      this.fadingIn = true;
      this.opacity = 0;
      this.opacityTresh = getRandInterval(.2, 1 - (this.comet + 1 - 1) * .4);
      this.do = getRandInterval(0.0005, 0.002) + (this.comet + 1 - 1) * .001;
    }
  
    fadeIn() {
      if (this.fadingIn) {
        this.opacity += this.do;
        if (this.opacity >= this.opacityTresh) {
          this.fadingIn = false;
          this.fadingOut = true;
        }
      }
    }
  
    fadeOut() {
      if (this.fadingOut) {
        this.opacity -= this.do / 2;
        if (this.opacity <= 0) {
          this.fadingOut = false;
          this.reset();
        }
      }
    }
  
    draw(universe) {
      universe.beginPath();
      if (this.giant) {
        universe.fillStyle = `rgba(180,184,240,${this.opacity})`;
        universe.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
      } else if (this.comet) {
        universe.fillStyle = `rgba(226,225,224,${this.opacity})`;
        universe.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false);
        // 画彗星的尾巴
        for (let i = 0; i < 30; i++) {
          universe.fillStyle = `rgba(226,225,224,${this.opacity - (this.opacity / 20) * i})`;
          universe.rect(this.x - this.dx / 4 * i, this.y - this.dy / 4 * i - 2, 2, 2);
          universe.fill();
        }
      } else {
        universe.fillStyle = `rgba(226,225,142,${this.opacity})`;
        universe.rect(this.x, this.y, this.r, this.r);
      }
      universe.closePath();
      universe.fill();
    }
  
    move() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.fadingOut === false) {
        this.reset();
      }
      if (this.x > this.state.width - (this.state.width / 4) || this.y < 0) {
        this.fadingOut = true;
      }
    }
  }
  
  function getProbability(percents) {
    return ((Math.floor(Math.random() * 1000) + 1) < percents * 10);
  }
  
  function getRandInterval(min, max) {
    return (Math.random() * (max - min) + min);
  }
  

  onMounted(() => {
    createUniverse(); // 创建星系
    state.animationFrameId = requestAnimationFrame(draw);
    window.addEventListener("resize", windowResizeHandler);
    windowResizeHandler(); // 此函数调整canvas大小并触发 createUniverse，但未直接调用绘制函数
    draw();
  });
  

  onUnmounted(() => {
    window.cancelAnimationFrame(state.animationFrameId);
    window.removeEventListener("resize", windowResizeHandler);
  });
  state.starCount = Math.round(state.width * state.height / state.starDensity);
  createUniverse();

  return state;
}
