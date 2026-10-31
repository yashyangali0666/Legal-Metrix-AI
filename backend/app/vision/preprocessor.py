import cv2
import numpy as np
import os
from PIL import Image, ImageOps
from typing import Tuple, Dict, Any, List

class ImagePreprocessor:
    """
    OpenCV Image Preprocessor for Legal Metrology Product Packaging.
    Preserves original evidence while generating optimized image for OCR.
    """

    @staticmethod
    def read_image_safely(input_path: str) -> np.ndarray:
        """
        Robustly reads any packaging image (JPG, PNG, WEBP, CMYK) on all platforms,
        handling Windows unicode paths and EXIF rotation properly.
        """
        # Method 1: PIL Image (handles color spaces, WebP, EXIF orientation, and unicode paths)
        try:
            pil_img = Image.open(input_path)
            # Correct EXIF orientation if present (e.g., smartphone photos)
            pil_img = ImageOps.exif_transpose(pil_img)
            pil_img = pil_img.convert("RGB")
            np_arr = np.array(pil_img)
            return cv2.cvtColor(np_arr, cv2.COLOR_RGB2BGR)
        except Exception:
            pass

        # Method 2: numpy fromfile + cv2.imdecode (immune to Windows backslash/path issues)
        try:
            with open(input_path, "rb") as f:
                bytes_arr = np.frombuffer(f.read(), dtype=np.uint8)
                img = cv2.imdecode(bytes_arr, cv2.IMREAD_COLOR)
                if img is not None:
                    return img
        except Exception:
            pass

        # Method 3: Standard cv2.imread fallback
        img = cv2.imread(input_path)
        if img is not None:
            return img

        raise ValueError(f"Could not read or decode image file from {input_path}. Verify that the uploaded file is a valid image.")

    @staticmethod
    def preprocess_image(input_path: str, output_path: str) -> Dict[str, Any]:
        """
        Reads packaging image, calculates quality metrics, improves contrast,
        removes noise, corrects slight skew, and saves preprocessed version.
        """
        img = ImagePreprocessor.read_image_safely(input_path)

        height, width, channels = img.shape
        file_size = os.path.getsize(input_path)

        # 1. Image Quality Metrics
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blurry = laplacian_var < 80.0
        blur_score = min(100.0, round(laplacian_var / 5.0, 1))

        # 2. Resize if image is too small or too massive while maintaining aspect ratio
        target_w = width
        target_h = height
        max_dim = 2400
        min_dim = 800

        scale = 1.0
        if max(width, height) > max_dim:
            scale = max_dim / float(max(width, height))
        elif max(width, height) < min_dim:
            scale = min_dim / float(max(width, height))

        if scale != 1.0:
            target_w = int(width * scale)
            target_h = int(height * scale)
            resized = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4 if scale > 1.0 else cv2.INTER_AREA)
        else:
            resized = img.copy()

        # 3. Contrast Improvement via CLAHE on LAB color space (preserves packaging colors)
        lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 4. Subtle Denoising (bilateral filter preserves sharp text edges)
        denoised = cv2.bilateralFilter(enhanced, d=7, sigmaColor=50, sigmaSpace=50)

        # 5. Deskew / orientation detection
        angle = ImagePreprocessor.detect_skew_angle(gray)
        if abs(angle) > 1.0 and abs(angle) < 45.0:
            denoised = ImagePreprocessor.rotate_image(denoised, angle)

        # 6. Save preprocessed image
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, denoised, [cv2.IMWRITE_JPEG_QUALITY, 95])

        return {
            "original_width": width,
            "original_height": height,
            "processed_width": target_w,
            "processed_height": target_h,
            "file_size_bytes": file_size,
            "blur_score": blur_score,
            "is_blurry": is_blurry,
            "skew_angle": round(angle, 2),
            "preprocessed_path": output_path
        }

    @staticmethod
    def detect_skew_angle(gray_img: np.ndarray) -> float:
        """Estimates skew angle of packaging text using Hough Line Transform."""
        try:
            edges = cv2.Canny(gray_img, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=100, maxLineGap=10)
            if lines is None:
                return 0.0

            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 - x1 != 0:
                    deg = np.rad2deg(np.arctan2(y2 - y1, x2 - x1))
                    if -45 < deg < 45:
                        angles.append(deg)

            if len(angles) > 0:
                return float(np.median(angles))
            return 0.0
        except Exception:
            return 0.0

    @staticmethod
    def rotate_image(image: np.ndarray, angle: float) -> np.ndarray:
        """Rotates image by given angle."""
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        m = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(image, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    @staticmethod
    def detect_text_regions(img_path: str) -> List[Dict[str, float]]:
        """
        Detects candidate bounding box text regions using morphological operations.
        """
        try:
            img = ImagePreprocessor.read_image_safely(img_path)
        except Exception:
            return []

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
        _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        morph = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3)))
        contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        boxes = []
        for c in contours:
            x, y, bw_box, bh_box = cv2.boundingRect(c)
            # Filter non-text boxes
            if bw_box > 20 and bh_box > 8 and bw_box < w * 0.95 and bh_box < h * 0.5:
                boxes.append({
                    "x": round(float(x) / w, 4),
                    "y": round(float(y) / h, 4),
                    "width": round(float(bw_box) / w, 4),
                    "height": round(float(bh_box) / h, 4),
                    "char_height_px": float(bh_box)
                })

        return boxes

