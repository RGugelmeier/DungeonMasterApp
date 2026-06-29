import os
import json
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required
from openai import OpenAI
from server.api.notes import fetch_campaign_notes
from server.api.characters import fetch_campaign_characters
from server.database import db

# ---------------------------------------------------------------------------
# Model — change this one string to swap models at any time.
# Examples:
#   "anthropic/claude-sonnet-4-5"
#   "anthropic/claude-opus-4"
#   "openai/gpt-4o"
#   "google/gemini-2.5-pro"
# ---------------------------------------------------------------------------
MODEL = "anthropic/claude-sonnet-4-5"

# ---------------------------------------------------------------------------
# Tool definitions (OpenAI function-calling format)
# ---------------------------------------------------------------------------
tools = [
    {
        "type": "function",
        "function": {
            "name": "read_notes",
            "description": "Read all campaign notes the DM has written. Use this when the user asks about anything documented in their notes.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_characters",
            "description": "Read all player characters and NPCs for the campaign, including stats (HP, AC, ability scores), inventory, abilities, and spells.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

SYSTEM_INSTRUCTION = """
You are a campaign assistant for a Dungeon Master. Your only purpose is to help the DM retrieve and summarise information from their campaign notes and look up character stats (HP, AC, ability scores, inventory, abilities, spells).

Your scope is strictly limited to:
- Searching and summarising the DM's written notes
- Looking up player character and NPC stats

You must NOT help with:
- Roleplaying, narrative, or storytelling
- Worldbuilding, lore creation, or creative suggestions
- Game rules, mechanics, or rulings
- Any request that requires generating original content

If a prompt contains both in-scope and out-of-scope parts, answer the in-scope parts fully and clearly decline the out-of-scope parts, explaining briefly why. Do not ignore either part.

If the user asks anything outside your scope entirely, politely decline and remind them that you are only able to search notes and look up character information.

Note structure: Notes are organised into Notebooks, which contain Chapters, which contain Pages. Use the read_notes tool to retrieve note content. Use the read_characters tool when the user asks about character stats, inventory, abilities, or spells — do not use read_notes for character information.

When citing a source from notes, use exactly this format: [NOTEBOOK -> CHAPTER -> PAGE]. If the information appears in multiple places, cite only the single most relevant source. If relevance is equal, cite the most recently updated page. Never list multiple sources for the same piece of information.

If a query is vague or could match multiple things in the notes, ask a clarifying question before retrieving and summarising. Do not guess at intent.

Be concise and factual. Do not embellish, infer, or add detail beyond what is explicitly written in the notes. If the information is not found in the notes or character data, say so clearly — do not invent or assume facts.
"""

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ['OPENROUTER_API_KEY'],
)

@ai_bp.post("/ask")
@jwt_required()
def ask():
    data = request.get_json()

    if not data or 'prompt' not in data or 'active_campaign' not in data:
        return jsonify({"error": "prompt and active_campaign are required"}), 400

    user_prompt = data['prompt']
    active_campaign = data['active_campaign']

    try:
        messages = [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_prompt}
        ]

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools
        )

        message = response.choices[0].message

        if message.tool_calls:
            # Explicitly serialize the assistant message as a dict so
            # OpenRouter/Claude receives properly structured tool_use blocks.
            messages.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in message.tool_calls
                ]
            })
            db.session.expire_all()

            for tool_call in message.tool_calls:
                if tool_call.function.name == "read_notes":
                    result = fetch_campaign_notes(active_campaign)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"notes": result})
                    })
                elif tool_call.function.name == "read_characters":
                    result = fetch_campaign_characters(active_campaign)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"characters": result})
                    })

            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools
            )
            message = response.choices[0].message

        return jsonify({"response": message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
