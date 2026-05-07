# face-api.js 모델 파일

이 폴더에 아래 파일들을 넣어야 영상 기록 기능이 작동합니다.

## 필요한 파일 목록

```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_expression_model-weights_manifest.json
└── face_expression_model-shard1
```

## 다운로드 방법

프로젝트 루트에서 아래 명령어를 실행하세요:

```bash
node scripts/download-models.js
```

또는 직접 다운로드:

```bash
BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

curl -o public/models/tiny_face_detector_model-weights_manifest.json "$BASE/tiny_face_detector_model-weights_manifest.json"
curl -o public/models/tiny_face_detector_model-shard1 "$BASE/tiny_face_detector_model-shard1"
curl -o public/models/face_expression_model-weights_manifest.json "$BASE/face_expression_model-weights_manifest.json"
curl -o public/models/face_expression_model-shard1 "$BASE/face_expression_model-shard1"
```
