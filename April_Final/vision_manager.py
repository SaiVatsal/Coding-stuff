import os
import cv2
import time
try:
    from fer import FER
    FER_AVAILABLE = True
except ImportError:
    FER_AVAILABLE = False

class VisionManager:
    def __init__(self, save_dir="snapshots"):
        self.save_dir = save_dir
        if not os.path.exists(self.save_dir):
            os.makedirs(self.save_dir)
        
        # Load the basic haar cascade for face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Emotion detector
        if FER_AVAILABLE:
            # Requires mtcnn by default which can be heavy. We use the default Haar backend for FER if possible, 
            # but initializing FER() without mtcnn=True usually uses OpenCV DNN which is lighter.
            self.emotion_detector = FER(mtcnn=False)
        else:
            self.emotion_detector = None

    def capture_snapshot(self) -> tuple[bool, str]:
        """Captures an image from the webcam and saves it."""
        print("[Vision] Accessing webcam...")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            return False, "Could not access the webcam."
        
        # Warm up the camera
        time.sleep(1)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return False, "Failed to capture image from webcam."
            
        filename = os.path.join(self.save_dir, f"snapshot_{int(time.time())}.jpg")
        cv2.imwrite(filename, frame)
        print(f"[Vision] Snapshot saved to {filename}")
        
        return True, filename

    def detect_emotion(self) -> str:
        """Captures an image and detects the dominant emotion of the first face found."""
        if not FER_AVAILABLE:
            return "Emotion detection Library (FER) is not installed."
            
        print("[Vision] Accessing webcam for emotion detection...")
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return "I cannot see anything. The webcam is unavailable."
            
        time.sleep(1)
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return "I tried to look, but the image capture failed."
            
        # Optional: convert to RGB as FER expects it
        # rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        emotions = self.emotion_detector.detect_emotions(frame)
        if not emotions:
            return "I don't see any faces clearly."
            
        # Get the first face's dominant emotion
        first_face = emotions[0]
        emotion_scores = first_face["emotions"]
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        
        # Translate to friendly text
        if dominant_emotion == "happy":
            return "You look quite happy right now."
        elif dominant_emotion == "sad":
            return "You look a bit sad. Is everything okay?"
        elif dominant_emotion == "angry":
            return "You look angry or frustrated."
        elif dominant_emotion == "surprise":
            return "You look surprised!"
        else:
            return "You look pretty neutral to me."

if __name__ == "__main__":
    vm = VisionManager()
    print("Testing snapshot...")
    # success, path = vm.capture_snapshot()
    # print(success, path)
    # print("Testing emotion...")
    # print(vm.detect_emotion())
