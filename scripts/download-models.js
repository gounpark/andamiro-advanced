#!/usr/bin/env node
// face-api.js 모델 파일 다운로드 스크립트
// 실행: node scripts/download-models.js

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, "..", "public", "models");
const BASE = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_expression_model-weights_manifest.json",
  "face_expression_model-shard1",
];

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
  });
}

console.log("face-api.js 모델 다운로드 시작...\n");

for (const file of FILES) {
  const url = `${BASE}/${file}`;
  const dest = path.join(MODELS_DIR, file);
  process.stdout.write(`  다운로드: ${file} ... `);
  try {
    await download(url, dest);
    console.log("완료");
  } catch (err) {
    console.log(`실패: ${err.message}`);
  }
}

console.log("\n완료! public/models/ 폴더를 확인하세요.");
