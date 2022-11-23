<template>
  <div>
    <div>一次可以选多个图上传</div>
    <div class="container">
      <template v-if="imageDataList.length === 0">
        <input ref="uploadFile" type="file" accept="image/*" @change="uploadFile" class="input-upload" multiple />图片上传
      </template>
      <template v-else>
        <div v-for="(image, index) in imageDataList" :key="index">
          <img
            :src="image"
            style="width: 100%; height: 100%; position: absolute; left: 0; z-index: 99; border-radius: 50%"
            :style="{ top: 100 * index + 'px' }"
          />

          <div class="re-upload" :style="{ top: 100 * index + 'px' }">
            <input
              :ref="'updateFile' + index"
              type="file"
              accept="image/*"
              @change="updateUploadFile(index)"
              style="opacity: 0; width: 100%; height: 100%; position: absolute; left: 0; cursor: pointer"
            />重新编辑
          </div>
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
      imageDataList: [],
    };
  },
  methods: {
    uploadFile() {
      if (!this.$refs.uploadFile.files.length) return;
      const files = Array.from(this.$refs.uploadFile.files);
      // console.log("upload", files);
      files.forEach((file, index) => {
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
          this.imageDataList.push(e.target.result);
        };
      });
      this.requestUpload(files);
    },
    // 对上传的数据进行更新
    updateUploadFile(index) {
      if (!this.$refs["updateFile" + index][0].files.length) return;
      const file = this.$refs["updateFile" + index][0].files[0];
      // console.log("upload", file);
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
        // this.imageDataList[index] = e.target.result;
        Vue.set(this.imageDataList, index, e.target.result);
      };
      this.requestUpload([file]);
    },
    requestUpload(files) {
      let imageData = new FormData();
      //
      files.forEach(file => {
        imageData.append("file", file);
      });
      // console.log(imageData);
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post("/multiple", imageData, {
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
