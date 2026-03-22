<template>
  <div class="banquet-order-generator">
    <van-nav-bar title="盛宴 - 婚宴定金回复生成器" />

    <van-form>
      <van-cell-group inset title="基础信息">
        <van-field v-model="customerName" label="客户称呼" placeholder="请输入姓氏或姓名，如'蚁'">
          <template #button>
            <div class="switch-wrapper">
              <span>自动补"府"</span>
              <van-switch v-model="useFu" size="20px" />
            </div>
          </template>
        </van-field>

        <van-field
          v-model="floorName"
          is-link
          readonly
          label="选择大厅"
          placeholder="点击选择楼层与大厅"
          @click="showFloorPicker = true"
        />
        <van-popup v-model:show="showFloorPicker" round position="bottom">
          <van-picker
            :columns="floorColumns"
            @cancel="showFloorPicker = false"
            @confirm="onConfirmFloor"
          />
        </van-popup>

        <van-field
          v-model="dateDisplay"
          is-link
          readonly
          label="婚宴日期"
          placeholder="点击选择日期"
          @click="showDatePicker = true"
        />
        <van-popup v-model:show="showDatePicker" round position="bottom">
          <van-date-picker
            v-model="currentDate"
            title="选择日期"
            :min-date="minDate"
            :max-date="maxDate"
            @cancel="showDatePicker = false"
            @confirm="onConfirmDate"
          />
        </van-popup>

        <van-field name="timeOfDay" label="宴席场次">
          <template #input>
            <van-radio-group v-model="timeOfDay" direction="horizontal">
              <van-radio name="午">午间</van-radio>
              <van-radio name="夜">夜间</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <van-cell-group inset title="费用信息" class="mt-4">
        <van-field v-model="deposit" type="digit" label="定金金额" placeholder="请输入定金">
          <template #extra>元</template>
        </van-field>

        <van-field
          v-model="basePrice"
          type="digit"
          :label="floor === 1 && enableExtraRule ? '20桌内费用' : '全包费用'"
          placeholder="请输入基础费用"
        >
          <template #extra>元</template>
        </van-field>

        <van-cell v-if="floor === 1" center title="启用加收规则 (超桌/音响)">
          <template #right-icon>
            <van-switch v-model="enableExtraRule" size="20px" />
          </template>
        </van-cell>

        <template v-if="floor === 1 && enableExtraRule">
          <van-field
            v-model="extraPerTable"
            type="digit"
            label="超桌加收"
            placeholder="超出每桌加收金额"
          >
            <template #extra>元/桌</template>
          </van-field>
          <van-field
            v-model="extraAudio"
            type="digit"
            label="音响加收"
            placeholder="布场音响加收金额"
          >
            <template #extra>元</template>
          </van-field>
        </template>
      </van-cell-group>
    </van-form>

    <div class="result-section">
      <div class="result-title">文案预览：</div>
      <div class="result-box">
        {{ generatedText }}
      </div>
      <div class="action-btn">
        <van-button type="primary" block round @click="copyText"> 一键复制文案 </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { showToast } from "vant";
import lunisolar from "lunisolar";

// --- 基础状态 ---
const customerName = ref("");
const useFu = ref(true);

// 新增：午/夜场状态，默认'夜'
const timeOfDay = ref("夜");

const floorColumns = [
  { text: "一楼玫瑰厅", value: 1, defaultPrice: 4800 },
  { text: "二楼牡丹厅", value: 2, defaultPrice: 6800 },
  { text: "三楼百合厅", value: 3, defaultPrice: 8800 },
];
const showFloorPicker = ref(false);
const floor = ref(1);
const floorName = ref("一楼玫瑰厅");

const onConfirmFloor = ({ selectedOptions }: any) => {
  const option = selectedOptions[0];
  floor.value = option.value;
  floorName.value = option.text;
  basePrice.value = option.defaultPrice.toString();
  enableExtraRule.value = option.value === 1;
  showFloorPicker.value = false;
};

// 日期状态
const today = new Date();
const showDatePicker = ref(false);
const currentDate = ref([
  today.getFullYear().toString(),
  (today.getMonth() + 1).toString().padStart(2, "0"),
  today.getDate().toString().padStart(2, "0"),
]);
const minDate = new Date(today.getFullYear() - 1, 0, 1);
const maxDate = new Date(today.getFullYear() + 5, 11, 31);
const dateDisplay = ref(
  `${currentDate.value[0]}年${currentDate.value[1]}月${currentDate.value[2]}日`,
);

const onConfirmDate = ({ selectedValues }: any) => {
  dateDisplay.value = `${selectedValues[0]}年${selectedValues[1]}月${selectedValues[2]}日`;
  showDatePicker.value = false;
};

// 费用相关状态
const deposit = ref("1000");
const basePrice = ref("4800");
const enableExtraRule = ref(true);
const extraPerTable = ref("200");
const extraAudio = ref("1800");

// --- 核心计算属性：生成最终文案 ---
const generatedText = computed(() => {
  const namePart = customerName.value
    ? `${customerName.value}${useFu.value ? "府" : ""}`
    : "某某府";

  const year = parseInt(currentDate.value[0]);
  const month = parseInt(currentDate.value[1]);
  const day = parseInt(currentDate.value[2]);

  const l = lunisolar(new Date(year, month - 1, day));
  const lunarStr = `${l.lunar.getMonthName()}${l.lunar.getDayName()}`;

  // 变更 1：将写死的“夜”替换为动态变量 timeOfDay.value
  const datePart = `国历${month}月${day}日（农历${lunarStr}）${timeOfDay.value}`;

  let pricePart = "";
  if (floor.value === 1 && enableExtraRule.value) {
    pricePart = `此厅20桌内${basePrice.value || 0}超过每桌加收${extraPerTable.value || 0}。布场音响加收${extraAudio.value || 0}，`;
  } else {
    // 变更 2：在非一楼或一口价规则后面加上中文逗号
    pricePart = `此厅全包费用${basePrice.value || 0}，`;
  }

  // 组装最后的结果
  let result = `现收到${namePart}定${floorName.value}于${datePart}举行婚宴定金${deposit.value || 0}元，${pricePart}请核对是否正确？`;

  return result;
});

// --- 剪贴板复制功能 ---
const copyText = async () => {
  if (!generatedText.value) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(generatedText.value);
      showToast("文案已复制到剪贴板");
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedText.value;
      textArea.style.position = "absolute";
      textArea.style.opacity = "0";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();

      if (successful) {
        showToast("文案已复制到剪贴板");
      } else {
        showToast("复制失败，请在预览区长按手动复制");
      }
    }
  } catch (err) {
    showToast("复制失败，请在预览区长按手动复制");
  }
};
</script>

<style scoped>
.banquet-order-generator {
  height: 100vh;
  overflow-y: auto;
  background-color: #f7f8fa;
  padding-bottom: 44px;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #646566;
}

.mt-4 {
  margin-top: 16px;
}

.result-section {
  margin: 24px 16px;
}

.result-title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.result-box {
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.6;
  color: #323233;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 80px;
  word-break: break-all;
}

.action-btn {
  margin-top: 24px;
}
</style>
