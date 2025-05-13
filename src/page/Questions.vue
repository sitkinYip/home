<template>
    <div class="questions-box">
        <div class="ask">
            <div class="yuan yuan_wz">
                <div class="yuan min"></div>
            </div>
            <div class="icon_box"></div>
            <div class="q_title">郭涵的生日寻宝游戏:</div>
            <div class="qa_content_text">
                <p>1. 寻宝游戏是啥？</p>
                <p>2. 寻宝游戏怎么玩？</p>
                <p>3. 寻宝游戏怎么玩？</p>
                <p>4. 寻宝游戏怎么玩？</p>
                <p>5. 寻宝游戏怎么玩？</p>
                <p>6. 寻宝游戏怎么玩？</p>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
.questions-box {
    width: 100vw;
    height: 100vh;
    background-color: #FFFFFF;
    box-sizing: border-box;
    padding: 0 26vpx;
    padding-top: 24vpx;

    // padding-top: 68vpx;
    .ask {
        position: relative;
        box-sizing: border-box;
        padding: 24vpx;
        width: 342vpx;
        min-height: 200vpx;
        border-radius: 10vpx;
        background-color: #F8F8F8;

        .icon_box {
            width: 21vpx;
            height: 24vpx;
            background-image: url("../assets/suo.png");
            background-size: 100%;
        }

        .q_title {
            box-sizing: border-box;
            padding: 12vpx 0;
            color: #999999;
            font-size: 17vpx;
        }

        .qa_content_text {
            box-sizing: border-box;
            color: #2C2C2C;
            font-size: 16vpx;

            div,
            p {
                color: #2C2C2C;
            }
        }
    }

    .yuan {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 128vpx;
        height: 128vpx;
        border-radius: 50%;
        border: solid 2vpx rgba(0, 0, 0, 0.1);

        .min {
            width: 64vpx;
            height: 64vpx;
        }
    }

    .yuan_wz {
        position: absolute;
        right: 2vpx;
        top: 2vpx;
    }
}
</style>
