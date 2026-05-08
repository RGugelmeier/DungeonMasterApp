import os
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required
from google import genai
from google.genai import types
from server.api.notes import fetch_campaign_notes
from server.api.characters import fetch_campaign_characters

# Available Tools
read_notes_function = types.FunctionDeclaration(
    name="read_notes",
    description="This is used to read all notes that the user has associated with their account.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={}
    )
)

read_characters_function = types.FunctionDeclaration(
    name="read_characters",
    description="This is used to read all player characters and NPCs associated with the campaign. Returns their stats (HP, AC, ability scores), inventory, abilities, and spells.",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={}
    )
)

tools = types.Tool(function_declarations=[read_notes_function, read_characters_function])

ai_bp = Blueprint("ai", __name__, url_prefix="/ai")

client = genai.Client(
    api_key=os.environ['GEMINI_API_KEY'],
    http_options={"base_url": "https://generativelanguage.googleapis.com"}
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
        contents = [types.Content(role="user", parts=[types.Part(text=user_prompt)])]

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="You are a helpful Dungeon Master assistant for tabletop RPG campaigns. You help the user manage and recall information about their campaign. When answering questions about the campaign, use the read_notes tool to retrieve the user's notes and always cite which notebook, chapter, and page the information came from.",
                tools=[tools]
            )
        )

        # Collect all tool calls from the response, then resolve them all before making a final request.
        tool_calls = [
            part for part in response.candidates[0].content.parts
            if part.function_call
        ]

        if tool_calls:
            contents.append(types.Content(role="model", parts=[types.Part(function_call=tc.function_call) for tc in tool_calls]))
            for tc in tool_calls:
                if tc.function_call.name == "read_notes":
                    result = fetch_campaign_notes(active_campaign)
                    contents.append(types.Content(role="user", parts=[types.Part(
                        function_response=types.FunctionResponse(
                            name="read_notes",
                            response={"notes": result}
                        )
                    )]))
                elif tc.function_call.name == "read_characters":
                    result = fetch_campaign_characters(active_campaign)
                    contents.append(types.Content(role="user", parts=[types.Part(
                        function_response=types.FunctionResponse(
                            name="read_characters",
                            response={"characters": result}
                        )
                    )]))
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction="You are a helpful Dungeon Master assistant for tabletop RPG campaigns. You help the user manage and recall information about their campaign. When answering questions about the campaign, use the read_notes tool to retrieve the user's notes and always cite which notebook, chapter, and page the information came from.",
                    tools=[tools]
                )
            )

        return jsonify({"response": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500