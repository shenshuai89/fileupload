<template>
  <div class="directory-container">
    <input type="file" accept="image/*" ref="uploadFile" @change="upload" webkitdirectory class="input-upload" />目录上传
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "",
  data() {
    return {};
  },
  methods: {
    upload() {
      if (!this.$refs.uploadFile.files.length) return;
      const files = Array.from(this.$refs.uploadFile.files);
      let formData = new FormData();
      files.forEach((file, i) => {
        formData.append(
          "file",
          files[i],
          // 为了确保@koa/multer 能正确处理文件的路径,需要对路径进行特殊处理
          files[i].webkitRelativePath.replace(/\//g, "@"),
        );
      });
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post("/dir/multiple", formData, {
          onUploadProgress: function (progressEvent) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(percentCompleted);
          },
        });
    },
  },
};
</script>
<style scoped>
.directory-container {
  display: inline-block;
  position: relative;
  width: 100px;
  height: 40px;
  border-radius: 5px;
  background-color: blue;
  color: #ffffff;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
}
.container:hover {
  background-color: #0052ff;
}
.input-upload {
  opacity: 0;
  font-size: 0;
  width: 100px;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  cursor: pointer;
}
</style>
