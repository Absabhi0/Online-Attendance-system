import face_recognition
import numpy as np
import cv2
from typing import Optional


def extract_encoding_from_image(image_bytes: bytes) -> Optional[list[float]]:
    """
    Takes raw image bytes, finds the first face, and returns its
    128-dimensional encoding as a plain Python list (JSON-serializable).

    Returns None if no face is detected in the image.
    """
    # Decode bytes into a numpy array, then convert BGR -> RGB
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode image. Ensure the file is a valid JPEG or PNG.")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Detect face locations first (faster with model="hog" for CPU demos)
    face_locations = face_recognition.face_locations(img_rgb, model="hog")

    if not face_locations:
        return None

    # Extract encoding for the first detected face only
    encodings = face_recognition.face_encodings(img_rgb, known_face_locations=face_locations)

    if not encodings:
        return None

    # Convert numpy array -> plain Python list for JSON storage
    return encodings[0].tolist()


def find_matching_student(
    frame_bytes: bytes,
    all_students: list[dict],
    tolerance: float = 0.5,
) -> Optional[dict]:
    """
    Takes a webcam frame (as bytes) and a list of student records from Supabase.
    Each record must have a 'face_encodings' key containing a list of encoding arrays.

    Returns the matching student dict, or None if no match is found.

    tolerance: lower = stricter matching. 0.5 is a good balance for demos.
    """
    # Decode the incoming frame
    np_arr = np.frombuffer(frame_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise ValueError("Could not decode the scanned frame.")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Find all faces in the frame
    face_locations = face_recognition.face_locations(img_rgb, model="hog")

    if not face_locations:
        return None

    frame_encodings = face_recognition.face_encodings(img_rgb, known_face_locations=face_locations)

    if not frame_encodings:
        return None

    # Use only the first detected face in the frame
    frame_encoding = frame_encodings[0]

    # Compare against every student's stored encodings
    for student in all_students:
        stored_encodings = student.get("face_encodings", [])

        if not stored_encodings:
            continue

        # Convert stored JSON lists back to numpy arrays
        known_encodings = [np.array(enc) for enc in stored_encodings]

        # compare_faces returns a list of True/False for each known encoding
        matches = face_recognition.compare_faces(
            known_encodings, frame_encoding, tolerance=tolerance
        )

        # Also compute distances for a confidence measure
        distances = face_recognition.face_distance(known_encodings, frame_encoding)

        if True in matches:
            best_match_idx = int(np.argmin(distances))
            confidence = round((1 - float(distances[best_match_idx])) * 100, 1)
            return {**student, "match_confidence": confidence}

    return None