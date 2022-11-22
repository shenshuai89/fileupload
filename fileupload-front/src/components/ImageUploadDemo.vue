<template>
  <div>
    <div>单文件上传</div>
    <div @click="uploadFile" class="container">
      <template v-if="!imageData">
        <input ref="uploadFile" type="file" accept="image/*" @change="uploadFile" class="input-upload" />图片上传
      </template>
      <template v-else>
        <img :src="imageData" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 99; border-radius: 50%" />
        <div class="re-upload">
          <input
            ref="uploadFile"
            type="file"
            accept="image/*"
            @change="uploadFile"
            style="opacity: 0; width: 100%; height: 100%; position: absolute; top: 0; left: 0; cursor: pointer"
          />重新编辑
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      imageData: null,
    };
  },
  methods: {
    uploadFile() {
      if (!this.$refs.uploadFile.files.length) return;
      const file = this.$refs.uploadFile.files[0];
      console.log("upload", file);
      let fileReader = new FileReader();
      // 可以将file或Blob文件转 base64
      fileReader.readAsDataURL(file);
      const { type, size, name } = file;
      fileReader.onload = e => {
        const fileObj = {
          file: file,
          readAsURL: e.target.result,
          type: type,
          size: size,
          fileName: name,
          formatSize: this.formatSize(size),
        };
        // 支持本地预览
        this.imageData = e.target.result;
      };
      this.requestUpload(file);
    },
    requestUpload(file) {
      let imageData = new FormData();
      // 这里设置的第一个参数，要和后端接收数据时的名称相对应
      imageData.set("file", file);
      // console.log(imageData);
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post("/single", imageData, {
          onUploadProgress: function (progressEvent) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(percentCompleted);
          },
        });
    },
    formatSize(bytes) {
      if (bytes === 0) {
        return "0 B";
      }
      let k = 1000,
        dm = 3,
        sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
  },
};
</script>

<style scoped>
.container {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: blue;
  color: #ffffff;
  line-height: 80px;
  text-align: center;
  cursor: hand;
}
.container:hover {
  background-color: #0052ff;
}
.input-upload {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  cursor: pointer;
}
.re-upload {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 100;
  opacity: 0;
  cursor: pointer;
  pointer-events: auto;
}
.re-upload:hover {
  opacity: 1;
}
</style>
