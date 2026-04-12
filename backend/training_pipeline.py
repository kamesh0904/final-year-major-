"""
NeuroNest Therapy Training Pipeline
=====================================
Three scripts in one:
  1. save_chat_message()  — called by main.py to persist messages
  2. export_training_data() — exports JSONL for fine-tuning
  3. submit_finetune_job() — submits to OpenAI (run when you have $20)

Run this directly to export + submit:
  python training_pipeline.py --export          → just exports
  python training_pipeline.py --finetune        → exports + submits job
"""

import os
import json
import datetime
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ─── Supabase client ───────────────────────────────────────────────────────────
def get_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── 1. Save a chat message pair ───────────────────────────────────────────────
def save_chat_message(user_id: str, role: str, content: str, session_id: str = None):
    """
    Call this after every message to persist the full conversation.
    role = 'user' | 'assistant'
    """
    try:
        sb = get_supabase()
        sb.table("chat_messages").insert({
            "user_id": user_id,
            "role": role,
            "content": content,
            "session_id": session_id or user_id,  # group by session
            "created_at": datetime.datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"⚠️ Could not save chat message: {e}")


# ─── 2. Save feedback on an AI message ────────────────────────────────────────
def save_feedback(message_id: str, user_id: str, rating: str, user_msg: str, ai_msg: str, profile: str):
    """
    rating = 'positive' | 'negative'
    Stores the full pair so we can export it for training.
    """
    try:
        sb = get_supabase()
        sb.table("chat_feedback").insert({
            "message_id": message_id,
            "user_id": user_id,
            "rating": rating,
            "user_message": user_msg,
            "ai_response": ai_msg,
            "profile": profile,
            "created_at": datetime.datetime.utcnow().isoformat()
        }).execute()
        print(f"✅ Feedback saved: {rating} for message {message_id}")
    except Exception as e:
        print(f"⚠️ Could not save feedback: {e}")


# ─── 3. Export training data as JSONL ─────────────────────────────────────────
THERAPY_SYSTEM_PROMPT = """You are NeuroNest, a warm, authentic AI therapeutic companion. You talk like a real therapist — empathetic, natural, and personalised to each user's neurotype. You support people with ADHD, Depression, Anxiety, OCD, and Autism Spectrum Disorder. You always validate feelings first before offering any suggestions. You use natural human language, not clinical or robotic phrases. You reference the user's diary and game progress when relevant. You detect crisis signals and respond with genuine care and helpline resources when needed."""

def export_training_data(output_path: str = "training_data.jsonl", min_positive: int = 1):
    """
    Reads positively-rated conversation pairs from Supabase
    and exports them in OpenAI fine-tuning JSONL format.
    
    Each line in the JSONL looks like:
    {"messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
    ]}
    """
    print("📊 Exporting training data...")
    
    try:
        sb = get_supabase()
        result = sb.table("chat_feedback")\
            .select("*")\
            .eq("rating", "positive")\
            .order("created_at", desc=True)\
            .execute()
        
        pairs = result.data or []
        print(f"✅ Found {len(pairs)} positive feedback pairs")
        
        if len(pairs) < min_positive:
            print(f"⚠️ Need at least {min_positive} positive pairs. Have {len(pairs)}. Keep chatting!")
            return None
        
        lines = []
        for pair in pairs:
            # Build profile-aware system prompt
            profile = pair.get("profile", "General")
            system = THERAPY_SYSTEM_PROMPT + f"\n\nThis user's primary profile is: {profile}. Adapt your therapeutic style accordingly."
            
            entry = {
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": pair["user_message"]},
                    {"role": "assistant", "content": pair["ai_response"]}
                ]
            }
            lines.append(json.dumps(entry, ensure_ascii=False))
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        
        print(f"✅ Exported {len(lines)} training examples → {output_path}")
        print(f"   File size: {Path(output_path).stat().st_size / 1024:.1f} KB")
        return output_path
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback; traceback.print_exc()
        return None


# ─── 4. Submit fine-tune job to OpenAI ───────────────────────────────────────
def submit_finetune_job(jsonl_path: str):
    """
    Upload the JSONL and kick off a fine-tune on gpt-4o-mini.
    Cost: ~$3–6 for ~500 examples.
    Run this ONLY when you have enough credits ($20+).
    """
    if not OPENAI_API_KEY:
        print("❌ No OPENAI_API_KEY found. Add it to .env first.")
        return
    
    print("🚀 Submitting fine-tune job to OpenAI...")
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Step 1: Upload training file
        print("📤 Uploading training file...")
        with open(jsonl_path, "rb") as f:
            upload_response = client.files.create(file=f, purpose="fine-tune")
        
        file_id = upload_response.id
        print(f"✅ File uploaded: {file_id}")
        
        # Step 2: Create fine-tune job on gpt-4o-mini (cheapest option)
        print("🏋️ Starting fine-tune job...")
        job = client.fine_tuning.jobs.create(
            training_file=file_id,
            model="gpt-4o-mini-2024-07-18",
            hyperparameters={"n_epochs": 3},  # 3 epochs is standard
            suffix="neuronest-therapy"  # Model will be: gpt-4o-mini-...:neuronest-therapy
        )
        
        print(f"✅ Fine-tune job created!")
        print(f"   Job ID: {job.id}")
        print(f"   Status: {job.status}")
        print(f"\n📋 Monitor at: https://platform.openai.com/fine-tuning")
        print(f"\n💡 When complete, update FINETUNED_MODEL_ID in backend/.env:")
        print(f"   FINETUNED_MODEL_ID={job.id}")
        
        # Save job ID to file for tracking
        with open("finetune_job.json", "w") as f:
            json.dump({"job_id": job.id, "file_id": file_id, "created_at": datetime.datetime.utcnow().isoformat()}, f)
        
        return job.id
        
    except Exception as e:
        print(f"❌ Fine-tune submission failed: {e}")
        import traceback; traceback.print_exc()


# ─── 5. Check fine-tune job status ───────────────────────────────────────────
def check_finetune_status():
    """Poll the status of the most recent fine-tune job."""
    try:
        with open("finetune_job.json") as f:
            data = json.load(f)
        job_id = data["job_id"]
    except FileNotFoundError:
        print("❌ No finetune_job.json found. Run --finetune first.")
        return
    
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    job = client.fine_tuning.jobs.retrieve(job_id)
    
    print(f"📊 Fine-tune Job Status")
    print(f"   Job ID:  {job.id}")
    print(f"   Status:  {job.status}")
    print(f"   Model:   {job.fine_tuned_model or 'Not ready yet'}")
    
    if job.fine_tuned_model:
        print(f"\n🎉 Fine-tuning COMPLETE!")
        print(f"   Add to backend/.env:")
        print(f"   FINETUNED_MODEL_ID={job.fine_tuned_model}")


# ─── CLI ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NeuroNest Training Pipeline")
    parser.add_argument("--export", action="store_true", help="Export training JSONL file")
    parser.add_argument("--finetune", action="store_true", help="Export + submit fine-tune job (needs credits)")
    parser.add_argument("--status", action="store_true", help="Check fine-tune job status")
    parser.add_argument("--output", default="training_data.jsonl", help="Output JSONL path")
    parser.add_argument("--min-pairs", type=int, default=10, help="Minimum positive pairs required")
    args = parser.parse_args()
    
    if args.status:
        check_finetune_status()
    elif args.finetune:
        path = export_training_data(args.output, args.min_pairs)
        if path:
            submit_finetune_job(path)
    elif args.export:
        export_training_data(args.output, args.min_pairs)
    else:
        print("Usage:")
        print("  python training_pipeline.py --export")
        print("  python training_pipeline.py --finetune   (needs OpenAI credits)")
        print("  python training_pipeline.py --status")
