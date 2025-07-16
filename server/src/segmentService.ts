// @ts-nocheck
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'D:\\PasageToRICH\\CP3407\\assignment\\project\\.env') });

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/segment', async (req, res) => {
  const { imageBase64 } = req.body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const url = `https://segment.roboflow.com/vetherblocks/lego-plate-segmentation/1?api_key=${ROBOFLOW_API_KEY}&format=masks`;

  try {
    // 1) 把 Base64 解成 Buffer
    const buffer = Buffer.from(imageBase64, 'base64');
// 2) 用二进制流方式发
    const response = await axios.post(url, buffer, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Roboflow request failed', err);
    res.status(500).json({ error: 'Roboflow request failed' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Segment service listening on port ${port}`);
});

export default app;
