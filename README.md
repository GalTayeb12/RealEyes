```{=html}
<p align="center">
```
`<img src="assets/banner.png" alt="RealEyes Banner" width="100%">`{=html}
```{=html}
</p>
```
```{=html}
<h1 align="center">
```
👁️ RealEyes
```{=html}
</h1>
```
```{=html}
<p align="center">
```
`<b>`{=html}Explainable Deepfake Detection Platform`</b>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
Deep Learning • Computer Vision • Digital Forensics • Explainable AI
```{=html}
</p>
```
```{=html}
<p align="center">
```
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-red?style=for-the-badge&logo=pytorch)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![Django](https://img.shields.io/badge/Django-Backend-092E20?style=for-the-badge&logo=django)

```{=html}
</p>
```

------------------------------------------------------------------------

# Overview

**RealEyes** is an explainable AI platform for detecting AI-generated
and manipulated images.

Rather than acting as a simple image classifier, RealEyes combines deep
learning, digital image forensics, EXIF metadata analysis, VirusTotal
validation, and visual explanations into a single investigation
platform.

The project was developed as a Software Engineering capstone project at
Shamoon College of Engineering (SCE) with a strong focus on
**cross-dataset generalization**, **explainability**, and **real-world
deployment**.

------------------------------------------------------------------------

# Why RealEyes?

Modern GAN and diffusion models produce highly realistic synthetic
images that are becoming increasingly difficult to identify visually.

While many deepfake detectors achieve excellent accuracy on their
training dataset, they often fail when evaluated on unseen data.

RealEyes addresses this challenge by combining complementary analysis
techniques into one explainable pipeline designed for improved
robustness across multiple datasets.

------------------------------------------------------------------------

# Key Features

-   ✅ Real / Fake image prediction
-   🔥 Grad-CAM visual explanations
-   📄 EXIF metadata analysis
-   🛡️ VirusTotal file security validation
-   🌍 Cross-dataset evaluation
-   💻 Modern React + Django web application
-   📊 Confidence score for every prediction

------------------------------------------------------------------------

# System Architecture

> Replace with `assets/architecture.png`

``` text
User
   │
React Frontend
   │
Django Backend
   │
────────────────────────────────────
VirusTotal
EXIF Metadata
Image Preprocessing
────────────────────────────────────
   │
Deep Learning Models
   │
Prediction + Confidence + Grad-CAM
```

------------------------------------------------------------------------

# Detection Pipeline

> Replace with `assets/pipeline.png`

``` text
Upload Image
      │
Validation
      │
VirusTotal
      │
Metadata Extraction
      │
Preprocessing
      │
CNN-SRM
EfficientNetB0
ViT-Tiny
      │
Prediction Fusion
      │
Real / Fake
      │
Grad-CAM
```

------------------------------------------------------------------------

# Models

The project evaluates multiple complementary architectures:

  Model            Purpose
  ---------------- ------------------------------------
  CNN-SRM          Low-level forensic artifacts
  EfficientNetB0   Semantic and texture analysis
  ViT-Tiny         Vision Transformer baseline
  Ensemble         Combines complementary predictions

------------------------------------------------------------------------

# Datasets

The evaluation includes more than **400,000 images** collected from four
datasets.

  Dataset         Description
  --------------- -------------------------------
  OpenForensics   GAN-generated facial images
  CelebDF v2      Face-swap video frames
  CIFAKE          AI-generated diffusion images
  CustomWar       Custom war-scene dataset

------------------------------------------------------------------------

# Results

Highlights:

-   Cross-dataset evaluation
-   Model comparison
-   Explainable predictions using Grad-CAM
-   Hybrid forensic investigation workflow

Add your figures here:

-   `assets/results.png`
-   `assets/roc.png`
-   `assets/confusion_matrix.png`

------------------------------------------------------------------------

# Tech Stack

-   Python
-   PyTorch
-   Django
-   React
-   OpenCV
-   Grad-CAM
-   VirusTotal API

------------------------------------------------------------------------

# Installation

``` bash
git clone <repository-url>
cd final-website

python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

------------------------------------------------------------------------

# Usage

1.  Launch the backend.
2.  Launch the frontend.
3.  Open the web application.
4.  Upload an image.
5.  Review:
    -   Real/Fake prediction
    -   Confidence score
    -   Grad-CAM heatmap
    -   EXIF metadata
    -   VirusTotal validation

------------------------------------------------------------------------

# Project Structure

``` text
RealEyes
│
├── backend/
├── frontend/
├── models/
├── notebooks/
├── assets/
├── README.md
└── requirements.txt
```

------------------------------------------------------------------------

# Future Work

-   Support additional generative models
-   Improve cross-dataset robustness
-   Optimize ensemble weighting
-   Video deepfake detection
-   Cloud deployment
-   Docker support

------------------------------------------------------------------------

# Team

**Students**

-   Gal Tayeb
-   Eden Cohen
-   Noam Dahan

**Supervisors**

-   Dr. Irina Rabaev
-   Dr. Alona Kutsyy

Department of Software Engineering\
Shamoon College of Engineering (SCE)

------------------------------------------------------------------------

# Citation

If you use this project in your research, please cite the accompanying
paper or reference this repository.

------------------------------------------------------------------------

# License

This project is intended for research and educational purposes.

You may choose to release it under the MIT License.
