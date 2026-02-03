# 🧠 Effort Estimation Agent

An AI-powered software project effort estimation tool that leverages **Retrieval-Augmented Generation (RAG)** with **LangChain**, **ChromaDB**, and **GPT-4o-mini** to provide intelligent effort estimates based on historical project data.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)

## 📋 Overview

The **Effort Estimation Agent** helps developers and project managers estimate software development effort by analyzing project requirements and comparing them against a knowledge base of 500+ historical software projects. The system uses semantic search with Nomic embeddings and AI-powered analysis to provide realistic estimates with confidence levels.

### ✨ Key Features

- 🔍 **RAG-based Retrieval**: Semantic search using Nomic embeddings for accurate historical data matching
- 🤖 **AI-Powered Analysis**: GPT-4o-mini provides intelligent effort estimates with work breakdown
- 📊 **Historical Data Context**: 500+ software projects with effort hours, tags, and confidence scores
- 🎯 **Smart Ranking**: Custom scoring algorithm combining semantic similarity, confidence, and effort matching
- 🚀 **Modern UI**: Beautiful, responsive React interface with Framer Motion animations
- 📈 **Source Attribution**: View which historical projects influenced the estimation
- 🛠️ **AI Tool Recommendations**: Suggests relevant AI tools to speed up development

## 🏗️ Architecture

```
Estimation_Agent/
├── backend/                           # Node.js + Express API
│   ├── Effort_Estimation_Agent.js    # Main RAG chain & API server
│   ├── chromaHelper.js               # ChromaDB integration & custom retrieval
│   ├── create_embeddings.py          # Python script to generate embeddings
│   ├── software_projects_500.json    # Historical project dataset (500 entries)
│   ├── chroma_db/                    # ChromaDB vector store (persistent)
│   └── package.json                  # Backend dependencies
│
└── frontend/                          # React + TailwindCSS UI
    ├── src/
    │   ├── App.js                    # Main application component
    │   ├── App.css                   # Styling
    │   └── index.js                  # React entry point
    └── package.json                  # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python 3.8+** (for embedding generation)
- **OpenRouter API Key** (for GPT-4o-mini access)
- **Nomic API Token** (for embeddings)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/estimation-agent.git
cd estimation-agent
```

### 2️⃣ Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Required API Keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
NOMIC_API_TOKEN=your_nomic_api_token_here

# Optional Configurations
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MODEL_NAME=openai/gpt-4o-mini
COLLECTION_NAME=effort_estimation
CHROMA_PERSIST_DIR=./chroma_db
PORT=5000
```

> **Get API Keys:**
> - OpenRouter: [https://openrouter.ai/keys](https://openrouter.ai/keys)
> - Nomic: [https://atlas.nomic.ai/](https://atlas.nomic.ai/)

#### Generate Vector Embeddings (One-Time Setup)

```bash
# Install Python dependencies
pip install tqdm nomic chromadb

# Generate embeddings for the 500 historical projects
python create_embeddings.py
```

This will:
- Load `software_projects_500.json`
- Generate Nomic embeddings for each project
- Store them in ChromaDB at `chroma_db/`
- Create a checkpoint file for resumable embedding generation

#### Start the Backend Server

```bash
npm start
```

The API will run at `http://localhost:5000`

### 3️⃣ Frontend Setup

#### Install Dependencies

```bash
cd ../frontend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

#### Start the React App

```bash
npm start
```

The frontend will open at `http://localhost:3000`

## 🎯 Usage

1. **Enter a Project Requirement**  
   Describe your software project in the text area (e.g., "Build a basic e-commerce site with user auth, product catalog, and cart")

2. **Get AI Estimation**  
   Click "Estimate Effort" to receive:
   - **Total Effort**: Estimated hours or days
   - **Work Breakdown**: Specific areas (frontend, backend, testing, etc.)
   - **AI Tool Recommendations**: Suggested tools to accelerate development
   - **Confidence Level**: Low/Medium/High with justification
   - **Referenced Projects**: Which historical projects influenced the estimate

3. **Review Sources**  
   See which past projects were retrieved and how they match your requirement

## 🔧 API Reference

### POST `/api/estimate`

**Request Body:**
```json
{
  "requirement": "Build a task management app with user authentication",
  "roughEffortHours": 120  // Optional: helps match similar-sized projects
}
```

**Response:**
```json
{
  "estimate": "Estimate: 80-100 hours\nWork Areas:\n- Frontend: 30 hours\n- Backend: 25 hours\n- Authentication: 15 hours\n- Testing: 20 hours\n- Documentation: 10 hours\n\nAI Tools:\n- Frontend: v0.dev, ChatGPT for React components\n- Backend: Cursor IDE, GitHub Copilot\n- Testing: Playwright AI, ChatGPT for test cases\n\nConfidence: High\nJustification: Multiple similar projects found with consistent effort estimates.",
  "sources": [
    {
      "id": "proj_123_0",
      "metadata": {
        "source": "Internal Database",
        "tags": "web, authentication, CRUD",
        "confidence": 0.95,
        "effort_hours": 90
      },
      "snippet": "Task management system with role-based authentication..."
    }
  ]
}
```

## 📊 Dataset Structure

The `software_projects_500.json` file contains historical projects with:

```json
{
  "id": "proj_001",
  "title": "E-commerce Platform",
  "requirements": "User authentication, product catalog, shopping cart, payment integration",
  "notes": "Implemented with React + Node.js + MongoDB",
  "tags": ["web", "fullstack", "payment"],
  "effort_hours": 240,
  "confidence": 0.9,
  "source": "Company Archive"
}
```

## 🧩 How It Works

1. **Semantic Retrieval**  
   - User requirement is embedded using Nomic `nomic-embed-text-v1.5`
   - ChromaDB retrieves top 20 semantically similar projects
   - Custom ranking combines semantic similarity (60%), confidence (30%), and effort match (10%)

2. **AI Analysis**  
   - Top 3 ranked projects are sent as context to GPT-4o-mini
   - LangChain RAG chain injects context into a structured prompt
   - LLM analyzes patterns and generates effort breakdown

3. **Response Generation**  
   - Estimates include work areas, AI tool suggestions, and confidence levels
   - Historical projects used are returned for transparency

## 🛠️ Customization

### Change LLM Model

Edit `backend/Effort_Estimation_Agent.js`:

```javascript
const MODEL_NAME = process.env.MODEL_NAME || "openai/gpt-4o"; // or any OpenRouter model
```

### Modify Retrieval Logic

Edit `backend/chromaHelper.js` to adjust:
- Number of retrieved documents (`nResults`)
- Scoring weights (semantic, confidence, effort match)
- Embedding model

### Switch Vector Database

LangChain supports multiple vector stores:
- **Pinecone**: Cloud-based, scalable
- **Milvus**: Self-hosted, high-performance
- **MongoDB Atlas**: Integrated with MongoDB

Replace the Chroma vectorstore initialization in `chromaHelper.js`

## 📦 Tech Stack

### Backend
- **Node.js + Express**: REST API server
- **LangChain**: RAG chain orchestration
- **ChromaDB**: Vector database for embeddings
- **Nomic Embeddings**: `nomic-embed-text-v1.5` for semantic search
- **OpenRouter**: GPT-4o-mini access

### Frontend
- **React 19**: UI framework
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Axios**: HTTP client

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **LangChain** for the RAG framework
- **Nomic AI** for powerful embeddings
- **OpenRouter** for LLM access
- **ChromaDB** for vector storage

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

**Built with ❤️ using AI-powered technologies**
