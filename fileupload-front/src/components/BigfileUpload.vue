<template>
  <div class="big-file-upload">
    <div class="submit-button"><input type="file" id="uploadFile" ref="uploadFile" @change="uploadFile" /><span>大文件上传</span></div>
  </div>
</template>

<script lang='ts'>
import axios from "axios";
import SparkMD5 from "spark-md5";
export default {
  name: "",
  data() {
    return {
      uploadFileEle: null,
      request: null,
    };
  },
  mounted() {
    this.uploadFileEle = this.$refs.uploadFile;
    this.request = axios.create({
      baseURL: "http://localhost:3123/upload",
      timeout: 10000,
    });
  },
  methods: {
    async uploadFile() {
      if (!this.uploadFileEle.files.length) return;
      const file = this.uploadFileEle.files[0]; // 获取待上传的文件
      const fileMd5 = await this.calcFileMD5(file); // 计算文件的MD5
      const fileStatus = await this.checkFileExist(
        // 判断文件是否已存在
        "/exists",
        file.name,
        fileMd5,
      );
      if (fileStatus.data && fileStatus.data.isExists) {
        alert("文件已上传[秒传]");
        return;
      } else {
        await this.upload({
          url: "/big/single",
          file, // 文件对象
          fileMd5, // 文件MD5值
          fileSize: file.size, // 文件大小
          chunkSize: 1 * 1024 * 1024, // 分块大小
          chunkIds: fileStatus.data.chunkIds, // 已上传的分块列表
          poolLimit: 3, // 限制的并发数
        });
      }
      await this.concatFiles("/concatFiles", file.name, fileMd5);
    },
    upload({ url, file, fileMd5, fileSize, chunkSize, chunkIds, poolLimit = 1 }) {
      const chunks = typeof chunkSize === "number" ? Math.ceil(fileSize / chunkSize) : 1;
      return this.asyncPool(poolLimit, [...new Array(chunks).keys()], i => {
        if (chunkIds.indexOf(i + "") !== -1) {
          // 已上传的分块直接跳过
          return Promise.resolve();
        }
        let start = i * chunkSize;
        let end = i + 1 == chunks ? fileSize : (i + 1) * chunkSize;
        const chunk = file.slice(start, end); // 对文件进行切割
        // 上传文件 chunk 块
        return this.uploadChunk({
          url,
          chunk,
          chunkIndex: i,
          fileMd5,
          fileName: file.name,
        });
      });
    },
    // 执行文件拼接操作
    concatFiles(url, name, md5) {
      return this.request.get(url, {
        params: {
          name,
          md5,
        },
      });
    },
    // 上传 chunk 文件
    uploadChunk({ url, chunk, chunkIndex, fileMd5, fileName }) {
      let formData = new FormData();
      formData.set("file", chunk, fileMd5 + "-" + chunkIndex);
      formData.set("name", fileName);
      formData.set("timestamp", Date.now());
      return this.request.post(url, formData);
    },
    // 检查文件是否已经存在
    checkFileExist(url, name, md5) {
      return this.request
        .get(url, {
          params: {
            name,
            md5,
          },
        })
        .then(response => response.data);
    },
    // 并发上传文件
    async asyncPool(poolLimit, array, iteratorFn) {
      const ret = []; // 存储所有的异步任务
      const executing = []; // 存储正在执行的异步任务
      for (const item of array) {
        // 调用iteratorFn函数创建异步任务
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p); // 保存新的异步任务

        // 当poolLimit值小于或等于总任务个数时，进行并发控制
        if (poolLimit <= array.length) {
          // 当任务完成后，从正在执行的任务数组中移除已完成的任务
          const e = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e); // 保存正在执行的异步任务
          if (executing.length >= poolLimit) {
            await Promise.race(executing); // 等待较快的任务执行完成
          }
        }
      }
      return Promise.all(ret);
    },
    // 计算文件的md5值
    calcFileMD5(file) {
      return new Promise((resolve, reject) => {
        // 拆分成小chunk文件，每一个2M
        let chunkSize = 2097152, // 2M
          chunks = Math.ceil(file.size / chunkSize),
          currentChunk = 0,
          spark = new SparkMD5.ArrayBuffer(),
          fileReader = new FileReader(); // 重要提示：FileReader 仅用于以安全的方式从用户（远程）系统读取文件内容

        fileReader.onload = e => {
          spark.append(e.target.result);
          currentChunk++;
          if (currentChunk < chunks) {
            loadNext();
          } else {
            resolve(spark.end());
          }
        };

        fileReader.onerror = e => {
          reject(fileReader.error);
          reader.abort();
        };

        function loadNext() {
          let start = currentChunk * chunkSize,
            end = start + chunkSize >= file.size ? file.size : start + chunkSize;
          fileReader.readAsArrayBuffer(file.slice(start, end)); // file 是二进制 blog 文件
        }
        loadNext();
      });
    },
  },
};
</script>
<style scoped>
.submit-button {
  display: inline-block;
  padding: 8px 16px;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  background-color: blue;
  position: relative;
}
.submit-button:hover {
  background-color: #0052ff;
}
.submit-button span {
  display: inline-block;
  cursor: pointer;
}
#uploadFile {
  opacity: 0;
  font-size: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}
</style>
