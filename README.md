# BadgeSys – Secure Badge Management System

BadgeSys is a containerized web application built with **Python Flask** (backend) and **React** (frontend). It provides badge generation, validation, and secure authentication using JWT tokens, deployed on **Azure Kubernetes Service (AKS)** with Azure SQL Database integration.

---

## 🔧 Tech Stack
- **Backend:** Python Flask, SQLAlchemy, pyodbc  
- **Frontend:** React, Context API  
- **Database:** Azure SQL Database  
- **Containerization:** Docker  
- **Registry:** Azure Container Registry (ACR)  
- **Orchestration:** Azure Kubernetes Service (AKS)  
- **Ingress:** NGINX Ingress Controller  

---

## 🚀 Features
- Secure user authentication with JWT tokens  
- Badge generation and validation functions  
- Web login and API communication endpoints  
- Integration with Azure SQL Database  
- Containerized deployment with Kubernetes manifests  
- Ingress routing for frontend and backend services  

---

## ⚙️ Deployment Overview
- Dockerfiles define backend and frontend builds  
- Images are pushed to a private Azure Container Registry  
- AKS cluster pulls images and runs workloads  
- Kubernetes manifests configure deployments, services, and ingress  
- Ingress IP provides external access to the app  
- Pod and service status can be visualized for monitoring  

---

## 📄 Documentation
For full details on architecture, setup, and deployment, please refer to [BadgeSysDoc.pdf](BadgeSysDoc.df).
