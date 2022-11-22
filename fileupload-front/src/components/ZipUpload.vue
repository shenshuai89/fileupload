<template>
  <div class="container"><input type="file" accept="*" ref="uploadFile" @change="upload" class="input-upload" />压缩包上传</div>
</template>

<script>
import axios from "axios";
import JSZip from "jszip";
export default {
  name: "",
  data() {
    return {};
  },
  methods: {
    async upload() {
      if (!this.$refs.uploadFile.files.length) return;
      const files = Array.from(this.$refs.uploadFile.files);
      let zipFileName = files[0].name;
      let zipFile = await this.generateZipFile(zipFileName, files);
      let formData = new FormData();
      formData.append("file", zipFile, zipFileName);
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post("/single", formData, {
          onUploadProgress: function (progressEvent) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(percentCompleted);
          },
        });
    },
    // 生成压缩包
    generateZipFile(zipName, files, options = { type: "blob", compression: "DEFLATE" }) {
      return new Promise((resolve, reject) => {
        const zip = new JSZip();
        for (let i = 0; i < files.length; i++) {
          zip.file(files[i].webkitRelativePath, files[i]);
        }
        zip.generateAsync(options).then(function (blob) {
          zipName = zipName || Date.now() + ".zip";
          const zipFile = new File([blob], zipName, {
            type: "application/zip",
          });
          resolve(zipFile);
        });
      });
    },
  },
};
</script>
<style scoped>
.container {
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
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;
  cursor: pointer;
}
</style>
