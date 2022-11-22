<script setup>
import { ref } from "vue";
import ImageUploadDemo from "./components/ImageUploadDemo.vue";
import MultipleUploadDemo from "./components/MultipleUploadDemo.vue";
import ClipboardUpload from "./components/ClipboardUpload.vue";
import DirectoryUpload from "./components/DirectoryUpload.vue";
import DragUpload from "./components/DragUpload.vue";
import ZipUpload from "./components/ZipUpload.vue";
import CropperUpload from "./components/CropperUpload.vue";
import BigfileUpload from "./components/BigfileUpload.vue";
import CameraUpload from "./components/CameraUpload.vue";
const titleList = [
  { name: "图片上传", id: 0, component: ImageUploadDemo },
  { name: "多图上传", id: 1, component: MultipleUploadDemo },
  { name: "复制上传", id: 2, component: ClipboardUpload },
  { name: "目录上传", id: 3, component: DirectoryUpload },
  { name: "拖拽上传", id: 4, component: DragUpload },
  { name: "压缩包上传", id: 5, component: ZipUpload },
  { name: "裁切上传", id: 6, component: CropperUpload },
  { name: "大文件上传", id: 7, component: BigfileUpload },
  { name: "拍照上传", id: 8, component: CameraUpload },
];
const currentIndex = ref(0);
</script>

<template>
  <div class="container">
    <div class="tab-panel">
      <div v-for="(item,index) in titleList" :key="item.id" class="tab-panel-item" @click="currentIndex = index">
        {{ item.name }}
      </div>
    </div>
    <div class="tab-content">
      <div class="tab-item">
        <component :is="titleList[currentIndex].component"></component>
      </div>
    </div>
  </div>
  ··
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  font-size: 16px;
}
.tab-panel {
  height: 40px;
  color: #000;
  display: flex;
  flex-direction: row;
  cursor: pointer;
}
.tab-panel :hover {
  background: #eeeeee;
}
.tab-panel-item {
  width: 100px;
  height: 40px;
  line-height: 40px;
}
.tab-content {
  height: 400px;
}
</style>
