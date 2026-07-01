![RealEyes Banner](assets/banner.png)

# 👁️ RealEyes

> **An Explainable AI Platform for Deepfake Image Detection**

![Python](https://img.shields.io/badge/Python-3.11-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-red)
![Django](https://img.shields.io/badge/Django-Backend-darkgreen)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![License](https://img.shields.io/badge/License-MIT-success)

---

## Project Overview

**RealEyes** is an explainable AI-powered platform for detecting AI-generated and manipulated images.

Unlike conventional deepfake detectors that simply classify images as *Real* or *Fake*, RealEyes combines multiple complementary analysis techniques into a unified forensic investigation platform.

The system integrates deep learning, image forensics, metadata analysis, cybersecurity validation, and visual explanations to provide reliable and interpretable results.

The project was developed as part of a Software Engineering capstone project at **Shamoon College of Engineering (SCE)**.

---

## Motivation

Recent advances in **GAN** and **Diffusion** models have dramatically improved the realism of synthetic images.

Although many deep learning detectors achieve high accuracy on the datasets used during training, they often struggle to generalize to previously unseen datasets.

RealEyes addresses this challenge by focusing on:

- Cross-dataset generalization
- Explainable AI
- Digital image forensics
- Security-aware image validation
- Practical real-world deployment

---

## Key Features

- 🔍 Deepfake image detection
- 🔥 Grad-CAM visual explanations
- 📄 EXIF metadata extraction
- 🛡️ VirusTotal file security validation
- 📊 Prediction confidence score
- 🌍 Cross-dataset evaluation
- 💻 Modern React + Django web application

---


## Detection Pipeline

The following figure illustrates the complete RealEyes forensic pipeline, from image upload and preprocessing to multi-model analysis, prediction, and explainability.

![Detection Pipeline](assets/pipeline.png)

---

## Model Architectures

RealEyes evaluates and compares several complementary deep learning architectures.

| Model | Purpose |
|--------|---------|
| CNN-SRM | Low-level forensic artifact detection |
| EfficientNetB0 | Semantic and texture analysis |
| ViT-Tiny | Vision Transformer baseline |
| Ensemble | Combines multiple model predictions |

Each architecture was evaluated independently and compared using identical experimental settings.

---

## Datasets

The project evaluates model robustness using more than **400,000 images** collected from four different datasets.

| Dataset | Description |
|----------|-------------|
| OpenForensics | GAN-generated facial images |
| CelebDF v2 | Face-swap video frames |
| CIFAKE | AI-generated synthetic images |
| CustomWar | Custom war-scene image dataset |

The datasets were selected to evaluate **cross-dataset generalization**, one of the primary research goals of the project.

---

## Results

RealEyes was evaluated on more than **400,000 images** collected from four public datasets.

The evaluation focused on cross-dataset generalization by comparing four complementary deep learning architectures.

Key evaluation metrics included:

- Accuracy
- ROC-AUC
- Precision
- Recall
- F1-Score
- Cross-Dataset Performance

![Results](assets/results.png)

### Performance Summary

| Evaluation | Description |
|------------|-------------|
| Cross-Dataset Accuracy | Evaluates model robustness on unseen datasets |
| ROC Curves | Measures discrimination capability |
| Confusion Matrix | Visualizes prediction errors |
| Precision / Recall / F1 | Per-class performance analysis |

---

## Web Application

The RealEyes web application enables users to upload an image and receive an explainable deepfake analysis within seconds.

For every uploaded image, the system provides:

- Real / Fake prediction
- Confidence score
- Grad-CAM visualization
- EXIF metadata
- VirusTotal validation

---

## Demo

The following demonstration showcases the complete RealEyes workflow, including image upload, security validation, prediction, confidence score, and Grad-CAM visualization.

![RealEyes Demo](assets/demo.mp4)

---

## Installation

Clone the repository

```bash
git clone https://github.com/USERNAME/RealEyes.git
cd final-website
```

Create a virtual environment

```bash
python -m venv .venv
```

Activate the environment (Windows)

```bash
.venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the backend

```bash
python manage.py migrate
python manage.py runserver
```

Run the frontend

```bash
cd frontend
npm install
npm start
```

---

## Tech Stack

- Python
- PyTorch
- Django
- React
- OpenCV
- Grad-CAM
- VirusTotal API

---

## Future Work

Future improvements include:

- Support for additional generative AI models.
- Enhanced ensemble optimization.
- Video deepfake detection.
- Docker deployment.
- Cloud inference API.

---

## Team

### Students

- Gal Tayeb
- Eden Cohen
- Noam Dahan

### Supervisors

- Dr. Irina Rabaev
- Dr. Alona Kutsyy

Department of Software Engineering  
Shamoon College of Engineering (SCE)

---

## Citation

If you find this project useful, please consider giving this repository a ⭐.

For academic use, please cite the accompanying paper.

---

## License

This project is released under the MIT License.
See the `LICENSE` file for more information.
