const path = require("path");
const Koa = require("koa");
const cors = require("@koa/cors");
const serve = require("koa-static");
const multer = require("@koa/multer");
const Router = require("@koa/router");
const fse = require("fs-extra");

const app = new Koa();
const router = new Router();
const PORT = 3123;
const RESOURCE_URL = `http://localhost:${PORT}`;
const UPLOAD_DIR = path.join(__dirname, "/public/upload");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let relativePath = file.originalname.replace(/@/g, path.sep);
    let index = relativePath.lastIndexOf(path.sep);
    let fileDir = path.join(UPLOAD_DIR, relativePath.substr(0, index));
    await fse.ensureDir(fileDir);
    cb(null, fileDir);
  },
  filename: function (req, file, cb) {
    let parts = file.originalname.split("@");
    cb(null, `${parts[parts.length - 1]}`);
  },
});

const multerUpload = multer({ storage });

router.get("/", async (ctx) => {
  ctx.body = "文件目录上传示例";
});

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
  multerUpload.fields([
    {
      name: "file",
    },
  ])
);

// 注册中间件
app.use(cors());
app.use(serve(path.join(__dirname, "/public")));
app.use(router.routes()).use(router.allowedMethods());

app.listen(3123, () => {
  console.log(`应用已经启动：http://localhost:${PORT}/`);
});
