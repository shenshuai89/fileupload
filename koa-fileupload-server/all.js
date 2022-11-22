const path = require("path");
const fs = require("fs");
const util = require("util");
const Koa = require("koa");
const staticServe = require("koa-static");
const cors = require("@koa/cors");
const multer = require("@koa/multer");
const Router = require("@koa/router");
const fse = require("fs-extra");
const readdir = util.promisify(fs.readdir); // 读取文件目录
const unlink = util.promisify(fs.unlink); // 删除文件

const app = new Koa();
const router = new Router();
const PORT = 3123;
const TMP_DIR = path.join(__dirname, "tmp"); // 临时目录, 上传大文件时，存放chunk文件
// 上传后资源的URL地址
const RESOURCE_URL = `http://localhost:${PORT}`;
const IGNORES = [".DS_Store"]; // 忽略的文件列表
// 存储上传文件的目录
const UPLOAD_IMAGE = path.join(__dirname, "/public/images");
const UPLOAD_DIR = path.join(__dirname, "/public/upload");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // 设置文件的存储目录
    // let relativePath = file.originalname.replace(/@/g, path.sep);
    // let index = relativePath.lastIndexOf(path.sep);
    // let fileDir = path.join(UPLOAD_DIR, relativePath.substr(0, index));
    // await fse.ensureDir(fileDir);
    // cb(null, fileDir);
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // 设置文件名, 并解决中文乱码
    cb(null, `${Buffer.from(file.originalname, "latin1").toString("utf8")}`);
  },
});

const multerUpload = multer({ storage });

router.get("/", async (ctx) => {
  ctx.body =
    "图片上传服务，把图片上传到 public/images 目录; 文件或目录上传到 public/upload 目录 ";
});

router.post(
  "/upload/single",
  async (ctx, next) => {
    try {
      await next();
      ctx.body = {
        code: 1,
        msg: "文件上传成功",
        url: `${RESOURCE_URL}/${ctx.file.originalname}`,
      };
    } catch (error) {
      ctx.body = {
        code: 0,
        msg: error,
      };
    }
  },
  // 中间件，这里和前端设置 FormData 的文件名称对应起来
  multerUpload.single("file")
);

// 多文件上传
router.post(
  "/upload/multiple",
  async (ctx, next) => {
    try {
      await next();
      urls = ctx.files.map((file) => `${RESOURCE_URL}/${file.originalname}`);
      ctx.body = {
        code: 1,
        msg: "文件上传成功",
        urls,
      };
    } catch (error) {
      ctx.body = {
        code: 0,
        msg: "文件上传失败",
      };
    }
  },
  multerUpload.fields([
    {
      name: "file",
    },
  ])
);
/* 上传的是目录 文件夹 */
// 上传目录文件夹时 存放的 地址
// const storageDir = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     let relativePath = file.originalname.replace(/@/g, path.sep);
//     let index = relativePath.lastIndexOf(path.sep);
//     let fileDir = path.join(UPLOAD_DIR, relativePath.substr(0, index));
//     await fse.ensureDir(fileDir);
//     cb(null, fileDir);
//   },
//   filename: function (req, file, cb) {
//     let parts = file.originalname.split("@");
//     cb(null, `${parts[parts.length - 1]}`);
//   },
// });
const storageDirectory = multer.diskStorage({
  destination: async function (req, file, cb) {
    // 转换中文
    const originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    let relativePath = originalname.replace(/@/g, path.sep);
    let index = relativePath.lastIndexOf(path.sep);
    let fileDir = path.join(UPLOAD_DIR, relativePath.substr(0, index));
    await fse.ensureDir(fileDir);
    cb(null, fileDir);
  },
  filename: function (req, file, cb) {
    // 转换中文
    const originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    let parts = originalname.split("@");
    cb(null, `${parts[parts.length - 1]}`);
  },
});

const multerUploadDir = multer({ storage: storageDirectory });

router.post(
  "/upload/dir/multiple",
  async (ctx, next) => {
    try {
      await next();
      urls = ctx.files.file.map(
        (file) => `${RESOURCE_URL}/${file.originalname.replace(/@/g, path.sep)}`
      );
      ctx.body = {
        code: 1,
        msg: "文件上传成功",
        urls,
      };
    } catch (error) {
      ctx.body = {
        code: 0,
        msg: "文件上传失败",
      };
    }
  },
  multerUploadDir.fields([
    {
      name: "file",
    },
  ])
);

/* 大文件上传需要的接口 */
const storageBig = multer.diskStorage({
  destination: async function (req, file, cb) {
    let fileMd5 = file.originalname.split("-")[0];
    const fileDir = path.join(TMP_DIR, fileMd5);
    await fse.ensureDir(fileDir);
    cb(null, fileDir);
  },
  filename: function (req, file, cb) {
    let chunkIndex = file.originalname.split("-")[1];
    cb(null, `${Buffer.from(chunkIndex, "latin1").toString("utf8")}`);
  },
});
const multerUploadBig = multer({ storage: storageBig });

router.get("/upload/exists", async (ctx) => {
  const { name: fileName, md5: fileMd5 } = ctx.query;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const isExists = await fse.pathExists(filePath);
  if (isExists) {
    ctx.body = {
      status: "success",
      data: {
        isExists: true,
        url: `${RESOURCE_URL}/${fileName}`,
      },
    };
  } else {
    let chunkIds = [];
    const chunksPath = path.join(TMP_DIR, fileMd5);
    const hasChunksPath = await fse.pathExists(chunksPath);
    if (hasChunksPath) {
      let files = await readdir(chunksPath);
      chunkIds = files.filter((file) => {
        return IGNORES.indexOf(file) === -1;
      });
    }
    ctx.body = {
      status: "success",
      data: {
        isExists: false,
        chunkIds,
      },
    };
  }
});

router.post(
  "/upload/big/single",
  multerUploadBig.single("file"),
  async (ctx, next) => {
    ctx.body = {
      code: 1,
      data: ctx.file,
    };
  }
);

router.get("/upload/concatFiles", async (ctx) => {
  const { name: fileName, md5: fileMd5 } = ctx.query;
  await concatFiles(
    path.join(TMP_DIR, fileMd5),
    path.join(UPLOAD_DIR, fileName)
  );
  ctx.body = {
    status: "success",
    data: {
      url: `${RESOURCE_URL}/${fileName}`,
    },
  };
});

async function concatFiles(sourceDir, targetPath) {
  const readFile = (file, ws) =>
    new Promise((resolve, reject) => {
      fs.createReadStream(file)
        .on("data", (data) => ws.write(data))
        .on("end", resolve)
        .on("error", reject);
    });
  const files = await readdir(sourceDir);
  const sortedFiles = files
    .filter((file) => {
      return IGNORES.indexOf(file) === -1;
    })
    .sort((a, b) => a - b);
  const writeStream = fs.createWriteStream(targetPath);
  for (const file of sortedFiles) {
    let filePath = path.join(sourceDir, file);
    await readFile(filePath, writeStream);
    await unlink(filePath); // 删除已合并的分块
  }
  writeStream.end();
}

// 注册中间件，允许跨区
app.use(cors());
// 设置静态服务器 目录
app.use(staticServe(path.join(__dirname, "/public")));
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`app starting at port ${PORT}`);
});
