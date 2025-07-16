import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// 显式从项目根目录加载 .env
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
if (!ROBOFLOW_API_KEY) {
  console.error('❌ Missing ROBOFLOW_API_KEY in .env');
  process.exit(1);
}
console.log('Loaded ROBOFLOW_API_KEY =', ROBOFLOW_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.post('/api/segment', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // 去掉 data URI 前缀，只保留纯 Base64
  const pureBase64 = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64;

  // Roboflow Serverless Hosted Endpoint
  const endpoint = 'https://serverless.roboflow.com/lego-plate-segmentation/1';

  try {
    const rfResp = await axios.post(
        endpoint,
        pureBase64,
        {
          params: { api_key: ROBOFLOW_API_KEY },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 60_000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
    );

    // 直接把 Roboflow 返回的 JSON 转给前端
    return res.json(rfResp.data);

  } catch (err) {
    // 打印并回传 Roboflow 端的错误
    if (axios.isAxiosError(err)) {
      console.error('▶ Roboflow status:', err.response?.status);
      console.error('▶ Roboflow body  :', err.response?.data);
      return res
          .status(err.response?.status || 500)
          .json(err.response?.data || { error: 'Roboflow error' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Segment service listening on port ${port}`);
});
