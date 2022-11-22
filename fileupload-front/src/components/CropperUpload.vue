<template>
  <div>
    <div class="upload-btn" v-if="!visible">
      <input
        ref="uploadFile"
        type="file"
        accept="image/*"
        @change.stop="uploadFileFn"
        class="upload-input"
      />图片上传
    </div>
    <div class="clip-dialog" v-show="visible">
      <VueCropper ref="cropper" v-bind="option" fixed />
      <div class="btn-group">
        <div @click="confirmDialog" class="btn-item">确定</div>
        <div @click="closeDialog" class="btn-item">取消</div>
      </div>
    </div>
    <div v-if="!visible && cropperImg" class="apksd">
      <img :src="cropperImg" alt="" />
    </div>
  </div>
</template>

<script setup>
import { VueCropper } from "vue-cropper";
import 'vue-cropper/dist/index.css'
import axios from "axios";
import { ref, reactive, nextTick, onMounted } from "vue";

const cropperImg = ref("");
const uploadFile = ref("");
const cropper = ref("");
const visible = ref(false);
const fileRawData = ref(null);
const option = reactive({
  img: "", // 裁剪图片的地址
  info: true, // 裁剪框的大小信息
  outputSize: 0.8, // 裁剪生成图片的质量
  outputType: "png", // 裁剪生成图片的格式
  canScale: false, // 图片是否允许滚轮缩放
  autoCrop: true, // 是否默认生成截图框
  autoCropWidth: 300, // 默认生成截图框宽度
  autoCropHeight: 300, // 默认生成截图框高度
  fixedBox: false, // 固定截图框大小 不允许改变
  fixed: false, // 是否开启截图框宽高固定比例
  fixedNumber: [1, 1], // 截图框的宽高比例
  full: false, // 是否输出原图比例的截图
  canMoveBox: true, // 截图框能否拖动
  original: false, // 上传图片按照原始比例渲染
  centerBox: false, // 截图框是否被限制在图片里面
  infoTrue: true, // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
});
onMounted(()=>{
  console.log(uploadFile.value, "uploadFile");
})
const createObjectURL = (object) => {
  return window.URL
    ? window.URL.createObjectURL(object)
    : window.webkitURL.createObjectURL(object);
};
const uploadFileFn = (event) => {
  console.log("Uploading file");
  fileRawData.value = event.target.files[0];
  const _url = createObjectURL(fileRawData.value);
  console.log(_url);
  nextTick(() => {
    visible.value = true;
    cropperImg.value = "";
    option.img = _url;
  });
};

const croppedAssets = (type = "blob") => {
  return new Promise((resolve, reject) => {
    if (type === "blob") {
      let result = {};
      cropper.value.getCropBlob((data) => {
        const _url = createObjectURL(data);
        result.blob = data;
        result.url = _url;
        result.file = new File([data], fileRawData.value.name, {
          ...fileRawData.value,
        });
        resolve(result);
      });
    } else {
      return cropper.value.getCropData((data) => {
        resolve(data);
      });
    }
  });
};

const confirmDialog = async () => {
  const _url = await croppedAssets("blob");
  console.log(_url);
  cropperImg.value = _url.url;
  fileRawData.value = null;
  visible.value = false;
  let formData = new FormData();
  formData.append("file", _url.file);
  axios
    .create({
      baseURL: "http://localhost:3123/upload",
      timeout: 60000,
    })
    .post("/single", formData, {
      // 监听上传进度
      onUploadProgress: function (progressEvent) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(percentCompleted);
      },
    });
};
const closeDialog = () => {
  fileRawData.value = null;
  visible.value = false;
};
const formatSize = (bytes) => {
  if (bytes === 0) {
    return "0 B";
  }
  let k = 1000,
    dm = 3,
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
</script>
<style scoped>
.upload-btn {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 40px;
  border-radius: 5px;
  background-color: blue;
  color: #ffffff;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
.upload-btn:hover {
  background-color: #0052ff;
}
.upload-input {
  opacity: 0;
  font-size: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  cursor: pointer;
}
.clip-dialog {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25);
}
.vue-cropper {
  width: 720px;
  height: 460px;
  border: 2px solid #333;
  border-radius: 12px;
  position: absolute;
  margin: auto;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}
/* .cropper-box,
.cropper-box-canvas img {
  width: 100%;
  height: 100%;
  overflow: hidden;
} */

.btn-group {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.btn-item {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 40px;
  border-radius: 5px;
  background-color: blue;
  color: #ffffff;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
.btn-item:not(:last-child) {
  margin-right: 20px;
}
.btn-item:hover {
  background-color: #0052ff;
}
</style>
