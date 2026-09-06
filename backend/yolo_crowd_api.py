import base64
import io
import os
from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title='YOLO-CROWD Detection API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


MODEL_PATH = os.getenv('YOLO_MODEL_PATH', 'yolov8n.pt')

try:
    from ultralytics import YOLO
    model = YOLO(MODEL_PATH)
except Exception as exc:  # pragma: no cover - runtime dependency failure is expected until installed.
    model = None
    MODEL_LOAD_ERROR = str(exc)
else:
    MODEL_LOAD_ERROR = None


class DetectRequest(BaseModel):
    image: str | None = None
    width: int | None = None
    height: int | None = None
    source: str | None = None


@app.get('/api/status')
def status() -> Dict[str, Any]:
    return {
        'ok': True,
        'model_loaded': model is not None,
        'model_path': MODEL_PATH,
        'error': MODEL_LOAD_ERROR,
    }


@app.post('/api/detect')
def detect(payload: DetectRequest) -> Dict[str, Any]:
    if model is None:
        return {
            'error': 'Model unavailable',
            'detail': MODEL_LOAD_ERROR,
            'count': 0,
            'density': 0,
            'detections': [],
        }

    if not payload.image:
        return {
            'error': 'No image provided',
            'count': 0,
            'density': 0,
            'detections': [],
        }

    try:
        image_bytes = base64.b64decode(payload.image)
        image = io.BytesIO(image_bytes)
        results = model(image, verbose=False)
        detections: List[Dict[str, Any]] = []
        person_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls.item())
                cls_name = result.names.get(cls_id, 'person')
                if cls_name.lower() != 'person':
                    continue
                x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())
                conf = float(box.conf.item())
                det = {
                    'class': cls_name,
                    'confidence': conf,
                    'x': x1,
                    'y': y1,
                    'width': max(0.0, x2 - x1),
                    'height': max(0.0, y2 - y1),
                    'bbox': [x1, y1, x2, y2],
                }
                detections.append(det)
                person_count += 1

        density = min(100, round((person_count / max(1, (payload.width or 1280) * (payload.height or 720) / 16000)) * 100))
        return {
            'count': person_count,
            'crowd_count': person_count,
            'people': person_count,
            'density': density,
            'detections': detections,
            'model': 'yolo-crowd',
            'source': payload.source or 'api',
        }
    except Exception as exc:  # pragma: no cover - API-level error reporting
        return {
            'error': str(exc),
            'count': 0,
            'density': 0,
            'detections': [],
        }


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='0.0.0.0', port=8000, reload=False)
