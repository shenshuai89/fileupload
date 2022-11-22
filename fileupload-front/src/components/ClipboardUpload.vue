<template>
  <div>
    <div id="uploadArea" ref="uploadArea">
      <p>请先复制图片后再执行粘贴操作</p>
    </div>
    <p>只能是复制网页图片，或者截图工作的截图，复制本地图片只能复制处理文件名称，无法进行上传</p>
  </div>
</template>

<script lang='ts'>
import axios from "axios";
export default {
  name: "ClipboardUpload",
  data() {
    return {
      IMAGE_MIME_REGEX: /^image\/(jpe?g|gif|png)$/i,
    };
  },
  mounted() {
    const uploadAreaEle = this.$refs.uploadArea;
    this.uploadAreaEle = uploadAreaEle;
    uploadAreaEle.addEventListener("paste", async e => {
      e.preventDefault();
      const files = [];
      if (navigator.clipboard) {
        const hasFocus = document.hasFocus();
        if (hasFocus) {
          let clipboardItems = await navigator.clipboard.read();
          for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
              const blob = await clipboardItem.getType(type);
              const fileName = await blob.text();
              // 只有是图片格式的文件，才进行上传和预览
              if (this.IMAGE_MIME_REGEX.test(type)) {
                this.previewImage(blob, uploadAreaEle);
                files.push(blob);
              }
            }
          }
        }
      } else {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (this.IMAGE_MIME_REGEX.test(items[i].type)) {
            let file = items[i].getAsFile();
            this.previewImage(file, uploadAreaEle);
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        confirm("剪贴板检测到图片文件，是否执行上传操作？") &&
          this.upload({
            url: "/multiple",
            files,
          });
      }
    });
  },
  methods: {
    previewImage(file, container) {
      const reader = new FileReader();
      reader.onload = e => {
        let img = document.createElement("img");
        // 将 blob 数据显示到前端
        img.src = e.target.result;
        img.style = "width: 100%";
        container.append(img);
      };
      reader.readAsDataURL(file);
    },
    upload({ url, files, fieldName = "file" }) {
      let formData = new FormData();
      files.forEach(file => {
        if (!this.IMAGE_MIME_REGEX.exec(file.type)) return;
        let fileName = +new Date() + "." + this.IMAGE_MIME_REGEX.exec(file.type)[1];
        formData.append(fieldName, file, fileName);
      });
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post(url, formData, {
          // 监听上传进度
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
#uploadArea {
  width: 400px;
  height: 400px;
  border: 1px dashed gray;
  display: table-cell;
  vertical-align: middle;
}
#uploadArea p {
  text-align: center;
  color: #999;
}
#uploadArea img {
  max-width: 100%;
  max-height: 100%;
  display: block;
  margin: auto;
}
</style>
