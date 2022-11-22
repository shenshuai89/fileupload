<template>
  <div id="dropArea" ref="dropArea">
    <p>拖拽上传文件</p>
    <div id="imagePreview" ref="imagePreview"></div>
  </div>
</template>

<script lang='ts'>
import axios from "axios";
export default {
  name: "dragUpload",
  data() {
    return {
      IMAGE_MIME_REGEX: /^image\/(jpe?g|gif|png)$/i,
      dropAreaEle: null,
      imgPreviewEle: null,
    };
  },
  mounted() {
    const dropAreaEle = this.$refs.dropArea;
    const imgPreviewEle = this.$refs.imagePreview;
    this.dropAreaEle = dropAreaEle;
    this.imgPreviewEle = imgPreviewEle;

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      dropAreaEle.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });
    ["dragenter", "dragover"].forEach(eventName => {
      dropAreaEle.addEventListener(eventName, this.highlight, false);
    });
    ["dragleave", "drop"].forEach(eventName => {
      dropAreaEle.addEventListener(eventName, this.unhighlight, false);
    });
    dropAreaEle.addEventListener("drop", this.handleDrop, false);
  },
  methods: {
    preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    // 高亮显示
    highlight(e) {
      this.dropAreaEle.classList.add("highlighted");
    },
    // 取消高亮
    unhighlight(e) {
      this.dropAreaEle.classList.remove("highlighted");
    },
    // 处理拖动
    handleDrop(e) {
      const dt = e.dataTransfer;
      const files = [...dt.files];
      files.forEach(file => {
        this.previewImage(file, this.imgPreviewEle);
      });
      files.forEach(file => {
        this.upload({
          url: "/single",
          file,
        });
      });
    },
    // 预览图片
    previewImage(file, container) {
      if (this.IMAGE_MIME_REGEX.test(file.type)) {
        // FileReader 为了做本地预览
        const reader = new FileReader();
        reader.onload = function (e) {
          let img = document.createElement("img");
          img.src = e.target.result;
          img.style = "width: 100%";
          container.append(img);
        };
        reader.readAsDataURL(file);
      }
    },
    upload({ url, file, fieldName = "file" }) {
      // FormData 为了做文件上传
      let formData = new FormData();
      formData.set(fieldName, file);
      axios
        .create({
          baseURL: "http://localhost:3123/upload",
          timeout: 60000,
        })
        .post("/single", formData, {
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
#dropArea {
  width: 300px;
  height: 300px;
  border: 1px dashed gray;
  margin-bottom: 20px;
}
#dropArea p {
  text-align: center;
  color: #999;
}
#dropArea.highlighted {
  background-color: #ddd;
}
#imagePreview {
  max-height: 250px;
  overflow-y: scroll;
}
#imagePreview img {
  width: 100% !important;
  display: block;
  margin: auto;
}
</style>
