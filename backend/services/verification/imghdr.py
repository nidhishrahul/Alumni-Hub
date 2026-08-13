"""
imghdr compatibility polyfill for Python 3.13+.
PaddleOCR and legacy packages import `imghdr` which was removed in Python 3.13.
"""

from PIL import Image

def what(file, h=None):
    try:
        if isinstance(file, str):
            with Image.open(file) as img:
                return img.format.lower()
        elif hasattr(file, 'read'):
            pos = file.tell()
            with Image.open(file) as img:
                fmt = img.format.lower()
            file.seek(pos)
            return fmt
    except Exception:
        pass
    return None
