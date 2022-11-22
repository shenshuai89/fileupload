<template>
  <div>
    <div @click="startCamera" class="camera-button">拍照上传</div>
    <div class="camera-container" v-if="showCamera" :style="{ width: videoWidth, height: videoHeight }">
      <video ref="video" :width="videoWidth" :height="videoHeight" autoplay class="camera-video"></video>
      <div class="webcam-actions">
        <div :class="['webcam-button', getUserMediaError && 'p-disabled']" @click="phoneClick">拍照</div>
        <div @click="closeCameraFn" class="camera-button">关闭摄像头</div>
      </div>
      <canvas ref="canvas" :width="videoWidth" :height="videoHeight" style="display: none"></canvas>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "cameraUpload",
  data() {
    return {
      showCamera: false,
      getUserMediaError: false,
      canvas: null,
      video: null,
      videoDevices: [],
      videoDeviceIndex: 0,
      videoWidth: 1280,
      videoHeight: 720,
    };
  },
  methods: {
    // 点击开始拍照
    startCamera() {
      this.showCamera = true;
      this.takePictureStart(1280, 720);
    },
    // 打开摄像头，获取摄像头设备
    takePictureStart(WIDTH, HEIGHT) {
      this.$nextTick(() => {
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
        this.video = this.$refs["video"];
        this.canvas = this.$refs["canvas"];
        // 获取摄像头设备信息
        try {
          navigator.mediaDevices.enumerateDevices().then(devices => {
            this.videoDevices = [];
            devices.forEach(device => {
              let deviceKind = device.kind;
              if (deviceKind.match(/^video.*/)) {
                this.videoDevices.push(device);
              }
            });
            this.switchCamera();
          });
        } catch (err) {
          console.log("获取设备失败：" + JSON.stringify(err));
        }
      });
    },
    switchCamera() {
      // 如果是开着的，先关闭
      // this.closeCameraFn();
      this.openCameraFn();
      this.videoDeviceIndex = this.videoDeviceIndex++ % this.videoDevices.length;
    },
    // 执行打开摄像头 方法
    openCameraFn() {
      if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
        this.getUserMedia(
          {
            audio: false,
            video: {
              width: this.WIDTH,
              height: this.HEIGHT,
              deviceId: this.videoDevices[this.videoDeviceIndex].deviceId,
            },
          },
          stream => {
            // 打开摄像头并在屏幕上播放
            this.video.srcObject = stream;
            this.video.play();
            this.getUserMediaError = false;
          },
          err => {
            this.getUserMediaError = true;
            console.log("开启摄像头失败：" + err);
          },
        );
      }
    },
    // 获取开启用户摄像头的api
    getUserMedia(constraints, success, error) {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia(constraints, success, error);
      } else if (navigator.mozGetUserMedia) {
        navigator.mozGetUserMedia(constraints, success, error);
      } else if (navigator.getUserMedia) {
        navigator.getUserMedia(constraints, success, error);
      }
    },
    // 点击拍照按钮
    async phoneClick() {
      const phone = await this.takePicture();
      if (!phone) {
        return;
      }
      // 拍照完成，关闭摄像头
      this.closeCameraFn();
      // 上传拍照的内容
      this.uploadFiles([phone]);
    },
    // 获取摄像头流数据，并截图保存为图片
    takePicture() {
      let context2d = this.canvas.getContext("2d");
      context2d.drawImage(this.video, 0, 0, this.WIDTH, this.HEIGHT);
      return new Promise((resolve, reject) => {
        // 如果被用户禁止掉
        if (this.getUserMediaError) {
          reject(false);
          return false;
        }
        this.canvas.toBlob(blob => {
          if (!blob) {
            return reject(null);
          }
          resolve(new File([blob], Date.now() + ".png"));
        }, "image/png");
      });
    },
    uploadFiles(postFiles) {
      let arr = [];

      postFiles.forEach(rawFile => {
        let fileReader = new FileReader();
        const { type, size, name } = rawFile;
        fileReader.readAsDataURL(rawFile);
        fileReader.onload = e => {
          const fileObj = {
            file: rawFile,
            readAsURL: e.target.result,
            type: type,
            size: size,
            fileName: name,
            formatSize: this.formatSize(size),
          };
          arr.push(fileObj);
          this.upload(fileObj);
        };
      });
    },
    upload(fileObj) {
      let formData = new FormData();
      formData.append("file", fileObj.file, fileObj.fileName);
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
    // 关闭摄像头
    closeCameraFn() {
      if (this.video.srcObject) {
        try {
          let tracks = this.video.srcObject.getTracks();
          for (let track of tracks) {
            track.stop();
            this.showCamera = false;
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        this.showCamera = false;
      }
    },
    // 文件大小格式化处理
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
.camera-button {
  display: inline-block;
  padding: 8px 16px;
  height: 40px;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  background-color: #0073ea;
}
.camera-container {
  position: relative;
  width: 1280px;
  height: 720px;
  border: 1px solid #eeeeee;
  border-radius: 10px;
  box-shadow: 3px 6px 9px rgba(116, 76, 76, 0.36);
}
.camera-video {
  position: absolute;
  top: auto;
  bottom: auto;
  left: auto;
  right: auto;
  z-index: 9;
}
.webcam-actions {
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  bottom: -40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 18px;
}
.webcam-button {
  padding: 8px 16px;
  height: 40px;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  background-color: #0073ea;
}
</style>
