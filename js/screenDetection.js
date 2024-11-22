document.addEventListener("DOMContentLoaded", () => {
  const inputElement = document.getElementById("imageInput");
  const canvasOutput = document.getElementById("canvasOutput");

  inputElement.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          detectScreen(img);
        };
      };
      reader.readAsDataURL(file);
    }
  });

  function detectScreen(img) {
    const src = cv.imread(img); // Read image
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      // Step 1: Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Step 2: Apply Gaussian Blur to reduce noise
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Step 3: Use Canny edge detection (instead of just thresholding)
      cv.Canny(blurred, edges, 50, 150); // Adjust thresholds for Canny

      // Step 4: Find contours in the edge-detected image
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let screenContour = null;
      let maxArea = 0;

      // Step 5: Loop through contours to find the largest rectangle (screen)
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);

        // Approximate contour to a polygon
        const approx = new cv.Mat();
        const epsilon = 0.02 * cv.arcLength(contour, true); // Approximation accuracy
        cv.approxPolyDP(contour, approx, epsilon, true);

        // Check if the polygon has 4 points (rectangle)
        if (approx.rows === 4) {
          const area = cv.contourArea(approx);
          const rect = cv.boundingRect(approx);
          const aspectRatio = rect.width / rect.height;

          // Filter based on aspect ratio and area (ensure it's a large rectangle)
          const minArea = 1000; // Adjust this value based on your image size
          if (area > minArea && aspectRatio > 1.2 && aspectRatio < 1.8) { // Aspect ratio for a rectangular screen
            if (area > maxArea) {
              if (screenContour) {
                screenContour.delete();
              }
              maxArea = area;
              screenContour = approx;
            } else {
              approx.delete(); // Delete if not the largest contour
            }
          } else {
            approx.delete(); // Delete if not a suitable aspect ratio
          }
        } else {
          approx.delete(); // Delete if it doesn't have 4 points (not a rectangle)
        }
      }

      // Step 6: Draw the detected screen contour (if found)
      if (screenContour) {
        const matVector = new cv.MatVector();
        matVector.push_back(screenContour); // Add the contour
        const color = new cv.Scalar(255, 0, 0, 255); // Blue color for the rectangle
        cv.drawContours(src, matVector, -1, color, 3); // Draw the contour
        matVector.delete(); // Clean up
      }

      // Step 7: Display result on canvas
      cv.imshow(canvasOutput, src);
    } catch (err) {
      console.error("Error processing image:", err);
    } finally {
      // Free resources
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      if (screenContour) {
        screenContour.delete(); // Delete screenContour if it exists
      }
    }
  }

  // Load OpenCV.js
  cv['onRuntimeInitialized'] = () => {
    let src = cv.imread('canvasInput'); // Read the image from the canvas
    let dst = new cv.Mat();
    let gray = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    // Convert the image to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // Apply a threshold to detect dark areas (black regions)
    cv.threshold(gray, dst, 50, 255, cv.THRESH_BINARY_INV);

    // Find contours
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Filter contours to find the largest rectangle (screen) without limiting to a central region
    let maxArea = 0;
    let maxContour = null;
    for (let i = 0; i < contours.size(); i++) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        let rect = cv.boundingRect(contour);

        // Check if the contour is a rectangle-like shape
        let aspectRatio = rect.width / rect.height;
        if (aspectRatio > 1.2 && aspectRatio < 1.8) {
            if (area > maxArea) {
                maxArea = area;
                maxContour = contour;
            }
        }
    }

    // Draw the largest rectangle (screen)
    if (maxContour) {
        let rect = cv.boundingRect(maxContour);
        let color = new cv.Scalar(255, 0, 0, 255); // Blue color for the rectangle
        cv.rectangle(src, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), color, 2);
    }

    // Display the result
    cv.imshow('canvasOutput', src);

    // Clean up
    src.delete();
    dst.delete();
    gray.delete();
    contours.delete();
    hierarchy.delete();
  };
});
