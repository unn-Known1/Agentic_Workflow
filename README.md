# Personal Closed-Loop Agentic Workflow Environment

A comprehensive desktop/web application for personal autonomous workflow automation and intelligent task management using NVIDIA's moonshotai/kimi-k2-thinking model.

## 🚀 Features

### Core Agentic Architecture
- **Multi-Agent System**: Create unlimited specialized agents with custom roles and personalities
- **Workflow Engine**: Visual node-based workflow builder with drag-and-drop interface
- **Task Management**: Automatic task decomposition and dependency mapping
- **Execution Control**: Real-time workflow execution with pause/resume capabilities

### Closed-Loop Feedback System
- **Real-Time Monitoring**: Live dashboard with execution visualization
- **Quality Control**: Automated validation and self-correction mechanisms
- **Performance Metrics**: Token usage, execution time, and success rate tracking

### NVIDIA API Integration
- **Advanced AI**: Uses moonshotai/kimi-k2-thinking model for deep reasoning
- **Token Management**: Intelligent token usage tracking and optimization
- **Streaming Support**: Real-time response streaming for long-running tasks

### Knowledge Management
- **RAG System**: Vector-based document storage with semantic search
- **Document Processing**: Support for PDF, DOCX, TXT, MD files
- **Memory System**: Short-term and long-term memory with episodic recall

### Tool Integration
- **Built-in Tools**: File operations, web scraping, data processing
- **Custom Tools**: Framework for creating and registering custom functions
- **External APIs**: Integration with productivity tools and services

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router** for navigation
- **React Flow** for visual workflow builder
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **FastAPI** for high-performance API
- **SQLAlchemy** for database ORM
- **ChromaDB** for vector storage and RAG
- **Sentence Transformers** for embeddings
- **Redis** for caching and real-time updates

### AI/ML
- **NVIDIA AI Foundation Models** (moonshotai/kimi-k2-thinking)
- **RAG (Retrieval-Augmented Generation)**
- **Semantic Search**

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- NVIDIA API key (get one at [build.nvidia.com](https://build.nvidia.com/))

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your NVIDIA_API_KEY
   ```

4. **Run the backend server:**
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080`

## 🎯 Quick Start

1. **Create an Agent**: Go to the Agents page and create your first specialized agent
2. **Build a Workflow**: Use the visual workflow builder to connect agents in a pipeline
3. **Upload Knowledge**: Add documents to your knowledge base for RAG-powered workflows
4. **Execute**: Run your workflow and monitor execution in real-time

## 📖 Pages

- **Dashboard**: Overview of system metrics and recent activity
- **Agents**: Create and manage AI agents with custom personalities
- **Workflows**: Visual workflow builder with templates
- **Knowledge**: Document management and semantic search
- **Executions**: Real-time execution monitoring and control

## 🔧 Configuration

### Environment Variables

```env
# NVIDIA API Configuration (Required)
NVIDIA_API_KEY=your_api_key_here

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=sqlite:///./agentic_workflow.db

# Vector Store
VECTOR_STORE_PATH=./vector_store

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
```

## 🚀 Advanced Features

- **WebSocket Real-time Updates**: Live execution monitoring
- **Template System**: Pre-built workflows for common tasks
- **Agent Cloning**: Duplicate and modify existing agents
- **Execution History**: Complete audit trail of all operations
- **Token Analytics**: Detailed usage and cost tracking

## 📊 Monitoring

The system provides comprehensive monitoring:
- Real-time execution status
- Token usage and costs
- Agent performance metrics
- Workflow success rates
- Knowledge base statistics

## 🔒 Security

- API key encryption
- Secure file handling
- CORS protection
- Input validation

## 🎨 Customization

### Creating Custom Agents
Agents can be customized with:
- **Personality Traits**: Creativity, thoroughness, expertise
- **System Prompts**: Custom instructions and behavior
- **Specialized Roles**: Planner, Executor, Researcher, Critic, Optimizer

### Building Custom Workflows
The visual builder supports:
- **Drag-and-Drop**: Intuitive node placement
- **Multiple Node Types**: Input, Agent, Output nodes
- **Conditional Logic**: Branching and loops
- **Parallel Execution**: Concurrent task processing

## 📈 Performance

- **Efficient Token Usage**: Intelligent caching and batching
- **Async Processing**: Non-blocking workflow execution
- **Vector Search**: Fast semantic similarity matching
- **Optimized Storage**: Compressed embeddings and metadata

## 🛠 Development

### Project Structure
```
.
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── api/routes/            # API endpoints
│   ├── services/              # Business logic
│   └── core/                  # Configuration & utilities
├── src/
│   ├── pages/                 # React pages
│   ├── components/            # React components
│   ├── lib/api.ts            # API client
│   └── main.tsx              # React entry point
└── uploads/                   # Document storage
```

### Adding New Features

1. **New Agent Types**: Extend the agent personality system
2. **Custom Nodes**: Create new React Flow node components
3. **Integrations**: Add new tool integrations in the backend
4. **Workflow Templates**: Define new template configurations

## 🎯 Use Cases

- **Research Automation**: Literature review, data collection, analysis
- **Content Creation**: Writing, editing, SEO optimization
- **Code Development**: Generation, review, documentation
- **Data Analysis**: Processing, visualization, reporting
- **Personal Productivity**: Task automation, scheduling, reminders

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Note**: This is a powerful system that provides autonomous workflow capabilities. Always review and validate automated outputs, especially for critical tasks.