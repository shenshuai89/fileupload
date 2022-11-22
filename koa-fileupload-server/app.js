const path = require("path");
const Koa = require("koa");
const staticServe = require("koa-static");
const cors = require("@koa/cors");
const multer = require("@koa/multer");
const Router = require("@koa/router");
const fse = require("fs-extra");

const app = new Koa();
const router = new Router();
const PORT = 3123;
// 上传后资源的URL地址
const RESOURCE_URL = `http://localhost:${PORT}`;
// 存储上传文件的目录
const UPLOAD_DIR = path.join(__dirname, "/public/images");

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
  ctx.body = "图片上传服务，把图片上传到 public/upload 目录";
});

router.post(
  "/upload/single",
  async (ctx, next) => {
    console.log(ctx, "upload");
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

// 注册中间件，允许跨区
app.use(cors());
// 设置静态服务器 目录
app.use(staticServe(path.join(__dirname, "/public")));
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`app starting at port ${PORT}`);
});
