from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from core.config import settings

def get_embeddings_model():
    if settings.GEMINI_API_KEY:
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    elif settings.OPENAI_API_KEY:
        return OpenAIEmbeddings()
    else:
        raise ValueError("No API key found for embeddings model")

def process_and_embed_document(text: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)
    
    embeddings_model = get_embeddings_model()
    embeddings = embeddings_model.embed_documents(chunks)
    
    return list(zip(chunks, embeddings))
